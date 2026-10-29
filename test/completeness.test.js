// Completeness levels: the level each structurally valid manifest reaches, the facts each higher
// level still needs, and the optional --require-level gate.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assessCompleteness, valuesAt } from '../src/completeness.js';
import { getRegistry, validateFiles } from '../src/validator.js';
import { adoptableManifest, baseManifest, codes, minimalManifest, validateAll, without } from './helpers.js';

const schema = getRegistry().get('0.1').schema;
const levelOf = (manifest) => assessCompleteness(manifest, schema).level;

describe('completeness levels', () => {
  it('reaches no level without a description and an interface, even when the manifest is valid', () => {
    const result = assessCompleteness(minimalManifest(), schema);
    assert.equal(result.level, 'none');
    assert.deepEqual(result.unmet.discoverable, ['description', 'interface']);
  });

  it('climbs one level at a time as the facts of each level are stated', () => {
    const discoverable = baseManifest({ interfaces: [{ type: 'cli' }] });
    assert.equal(levelOf(discoverable), 'discoverable');
    assert.deepEqual(assessCompleteness(discoverable, schema).unmet.assessable, ['runtime', 'license', 'version']);

    const assessable = { ...discoverable, runtime: [{ kind: 'local_process' }], license: { expression: 'MIT' }, capabilityVersion: '1.0.0' };
    assert.equal(levelOf(assessable), 'assessable');
    assert.equal(levelOf(adoptableManifest()), 'adoptable');
    assert.equal(levelOf(adoptableManifest({ riskTier: 'low', assessmentReference: { id: 'RA-1' } })), 'governed');
  });

  it('is cumulative: higher facts do not count while a lower level is missing a fact', () => {
    const result = assessCompleteness(without(adoptableManifest({ riskTier: 'high', assessmentReference: { id: 'RA-2' } }), 'runtime'), schema);
    assert.equal(result.level, 'discoverable');
    assert.deepEqual(result.unmet, { discoverable: [], assessable: ['runtime'], adoptable: [], governed: [] });
  });

  it('counts an explicit empty list as stated: it declares that there is none', () => {
    assert.equal(levelOf(adoptableManifest({ setup: [], limitations: [] })), 'adoptable');
    assert.deepEqual(assessCompleteness(without(adoptableManifest(), 'setup'), schema).unmet.adoptable, ['setup']);
  });

  it('accepts any of the fields that state a fact, such as a version or a status per publication', () => {
    const fromPublications = without(adoptableManifest({ publications: [{ kind: 'hosted_endpoint', locator: 'https://mcp.example.com/mcp', versionScheme: 'unversioned', status: 'active' }] }), 'capabilityVersion', 'lifecycleStatus');
    assert.equal(levelOf(fromPublications), 'adoptable');
    const noSignal = without(adoptableManifest({ publications: [{ kind: 'package', locator: 'pkg:npm/x' }] }), 'capabilityVersion', 'lifecycleStatus');
    assert.deepEqual(assessCompleteness(noSignal, schema).unmet.assessable, ['version', 'lifecycle signal']);
  });

  it("never counts riskTier 'unassessed' as a recorded assessment", () => {
    assert.deepEqual(assessCompleteness(adoptableManifest(), schema).unmet.governed, ['risk assessment']);
  });

  it('reads list items and nested fields', () => {
    const manifest = { publications: [{ nativeVersion: '1.0.0' }, {}, { nativeVersion: '2.0.0' }], owner: { name: 'x' } };
    assert.deepEqual(valuesAt(manifest, 'publications[].nativeVersion'), ['1.0.0', '2.0.0']);
    assert.deepEqual(valuesAt(manifest, 'owner.contact'), []);
  });
});

describe('completeness in validation reports', () => {
  it('reports the level of each example, from none to governed', async () => {
    const report = await validateFiles(['examples/valid']);
    const levels = Object.fromEntries(report.results.map((result) => [result.id, result.completeness.level]));
    assert.deepEqual(levels, {
      'ai-platform/agent-eval-framework': 'adoptable',
      'techyaditya/agentic-playwright-mcp': 'assessable',
      'ai-platform/incident-triage-agent': 'discoverable',
      'acme/observability-mcp-server': 'adoptable',
      'microsoft/playwright-mcp': 'assessable',
      'sre/runbook-search': 'governed',
      'ai-platform/sql-review': 'governed',
      'sre/sre-toolkit': 'none',
    });
    assert.ok(report.results.every((result) => result.valid), 'levels are reported, not enforced');
  });

  it('reports no level for manifests that fail structural validation', async () => {
    const report = await validateAll([without(baseManifest(), 'riskTier')]);
    assert.equal(report.results[0].completeness, null);
  });

  it('turns a level below the required one into an error that lists the missing facts', async () => {
    const report = await validateAll([baseManifest({ interfaces: [{ type: 'cli' }] }), adoptableManifest({ id: 'team/adoptable' })], { requireLevel: 'adoptable' });
    const [below, met] = report.results;
    const finding = below.findings.find((f) => f.code === 'COMPLETENESS_BELOW_REQUIRED');
    assert.equal(finding.severity, 'error');
    assert.equal(finding.stage, 'completeness');
    assert.match(finding.message, /reaches completeness level 'discoverable'; this validation requires 'adoptable'/);
    assert.match(finding.hint, /assessable: runtime, license, version; adoptable: setup, limitations/);
    assert.equal(below.valid, false);
    assert.equal(below.checks.metadata, 'failed');
    assert.ok(met.valid && !codes(met.findings).includes('COMPLETENESS_BELOW_REQUIRED'));
  });

  it('rejects an unknown level before validating anything', async () => {
    await assert.rejects(validateAll([baseManifest()], { requireLevel: 'complete' }), /Unknown completeness level 'complete'/);
  });
});
