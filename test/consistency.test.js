// Stage 2: consistency checks across manifests, and the error / warning / unverified distinction.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateFiles } from '../src/validator.js';
import { baseManifest, codes, validateAll, without } from './helpers.js';

const findingsOf = (report, index) => report.results[index].findings;
const consistencyCodes = (report, index) => codes(findingsOf(report, index).filter((f) => f.stage === 'consistency'));

describe('the representative example set', () => {
  it('is valid, and separates warnings and unverified checks from errors', async () => {
    const report = await validateFiles(['examples/valid'], { today: '2026-10-23' });
    assert.deepEqual(report.summary, { manifests: 8, valid: 8, invalid: 0, errors: 0, warnings: 1, unverified: 20 });

    const all = report.results.flatMap((result) => result.findings);
    const count = (code) => all.filter((finding) => finding.code === code).length;
    assert.equal(count('REFERENCE_TO_DEPRECATED'), 1); // runbook-search -> deprecated sre-toolkit
    assert.equal(count('UNRESOLVED_REFERENCE'), 1); // sre/on-call-roster is catalogued elsewhere
    assert.equal(count('RISK_UNASSESSED'), 6);
    assert.equal(count('SOURCE_NOT_CHECKED'), 8);
    assert.equal(count('PUBLICATION_VERSIONS_DIFFER'), 1); // playwright-mcp: 0.0.82 and 0.0.83
    assert.equal(count('RELATION_UNVERIFIED'), 1); // the fork's claim
    assert.equal(count('DERIVED_VALUE_UNCONFIRMED'), 2); // the fork's heuristic values
    assert.equal(count('LICENSE_NEEDS_REVIEW'), 1); // the vendor's terms of service
  });

  it('covers at least four capability types, internal and external owners', async () => {
    const report = await validateFiles(['examples/valid']);
    const manifests = report.results.map((result) => result.manifest);
    assert.ok(new Set(manifests.map((m) => m.capabilityType)).size >= 4);
    assert.deepEqual(new Set(manifests.map((m) => m.owner?.affiliation).filter(Boolean)), new Set(['internal', 'external']));
  });

  it('resolves the fork relation between the two real examples', async () => {
    const report = await validateFiles(['examples/valid']);
    const fork = report.results.find((result) => result.id === 'techyaditya/agentic-playwright-mcp');
    assert.ok(!codes(fork.findings).includes('UNRESOLVED_REFERENCE'));
    assert.equal(fork.findings.find((finding) => finding.code === 'RELATION_UNVERIFIED').path, '/relations/0');
  });

  it('reports a duplicate id across files as an error on both files', async () => {
    const report = await validateFiles(['examples/valid', 'examples/consistency']);
    const duplicates = report.results.filter((result) => codes(result.findings).includes('DUPLICATE_ID'));
    assert.deepEqual(duplicates.map((result) => result.file).sort(), [
      'examples/consistency/duplicate-id.capability.yaml',
      'examples/valid/sql-review.capability.yaml',
    ]);
    assert.ok(duplicates.every((result) => !result.valid && result.checks.identity === 'failed'));
  });
});

describe('identifiers and sources', () => {
  it('flags one source location registered under several ids', async () => {
    const source = { type: 'repository', url: 'https://github.com/example-org/mono', path: 'skills/shared' };
    const report = await validateAll([baseManifest({ id: 'team/a', source }), baseManifest({ id: 'team/b', source })]);
    assert.deepEqual(consistencyCodes(report, 0).filter((code) => code === 'DUPLICATE_SOURCE'), ['DUPLICATE_SOURCE']);
    assert.equal(report.summary.errors, 0);
  });

  it('allows several capabilities in one repository when their paths differ', async () => {
    const repository = (path) => ({ type: 'repository', url: 'https://github.com/example-org/mono', path });
    const report = await validateAll([
      baseManifest({ id: 'team/a', source: repository('skills/a') }),
      baseManifest({ id: 'team/b', source: repository('skills/b') }),
    ]);
    assert.ok(!consistencyCodes(report, 0).includes('DUPLICATE_SOURCE'));
  });

  it('matches a renamed repository by its forge id, not only by its URL', async () => {
    // One record still cites the old name; the repository id did not change (as in the research).
    const report = await validateAll([
      baseManifest({ id: 'team/a', source: { type: 'repository', url: 'https://github.com/example-org/plugins-public', repositoryId: '1100776768' } }),
      baseManifest({ id: 'team/b', source: { type: 'repository', url: 'https://github.com/example-org/plugins-official', repositoryId: '1100776768' } }),
    ]);
    const finding = findingsOf(report, 0).find((f) => f.code === 'DUPLICATE_SOURCE');
    assert.deepEqual(finding.related, ['team/b']);
  });

  it('flags one publication listed by several ids, naming the other ids', async () => {
    const npm = { kind: 'package', locator: 'pkg:npm/%40example-org/browser-mcp' };
    const report = await validateAll([
      baseManifest({ id: 'registry/browser-mcp', publications: [{ kind: 'registry_entry', locator: 'io.github.example-org/browser-mcp' }, npm] }),
      baseManifest({ id: 'npm/browser-mcp', publications: [{ ...npm, locator: npm.locator.toUpperCase() }] }),
      baseManifest({ id: 'other/unrelated', publications: [{ kind: 'package', locator: 'pkg:npm/unrelated' }] }),
    ]);
    const finding = findingsOf(report, 0).find((f) => f.code === 'DUPLICATE_PUBLICATION');
    assert.equal(finding.severity, 'warning');
    assert.equal(finding.path, '/publications/1');
    assert.deepEqual(finding.related, ['npm/browser-mcp']);
    assert.deepEqual(findingsOf(report, 1).find((f) => f.code === 'DUPLICATE_PUBLICATION').related, ['registry/browser-mcp']);
    assert.ok(!consistencyCodes(report, 2).includes('DUPLICATE_PUBLICATION'));
  });
});

describe('relations', () => {
  it('resolves relation targets like other references, and rejects a relation to itself', async () => {
    const report = await validateAll([
      baseManifest({ id: 'team/fork', relations: [{ type: 'fork_of', id: 'team/original', verified: true }, { type: 'same_as', id: 'team/fork', verified: true }] }),
      baseManifest({ id: 'team/original' }),
    ]);
    const fork = consistencyCodes(report, 0);
    assert.ok(!fork.includes('UNRESOLVED_REFERENCE'));
    assert.ok(fork.includes('SELF_REFERENCE'));
  });

  it('reports a claimed relation as unverified, and a verified one not at all', async () => {
    const report = await validateAll([baseManifest({ relations: [
      { type: 'fork_of', locator: 'pkg:npm/%40playwright/mcp', evidence: "npm description: 'Fork of official Playwright MCP'" },
      { type: 'distinct_from', locator: 'https://github.com/example-org/skills/tree/main/webapp-testing', verified: true },
    ] })]);
    const unverified = findingsOf(report, 0).filter((f) => f.code === 'RELATION_UNVERIFIED');
    assert.deepEqual(unverified.map((f) => [f.severity, f.path]), [['unverified', '/relations/0']]);
    assert.match(unverified[0].message, /Fork of official Playwright MCP/);
  });

  it('warns when a wrapped capability is deprecated, but not when a fork\'s upstream is', async () => {
    const deprecated = baseManifest({ id: 'team/upstream', lifecycleStatus: 'deprecated', deprecation: { reason: 'No longer maintained upstream.' } });
    const report = await validateAll([
      baseManifest({ id: 'team/wrapper', relations: [{ type: 'wraps', id: 'team/upstream', verified: true }] }),
      baseManifest({ id: 'team/fork', relations: [{ type: 'fork_of', id: 'team/upstream', verified: true }] }),
      deprecated,
    ]);
    assert.ok(consistencyCodes(report, 0).includes('REFERENCE_TO_DEPRECATED'));
    assert.ok(!consistencyCodes(report, 1).includes('REFERENCE_TO_DEPRECATED'));
  });
});

describe('references', () => {
  it('rejects a capability that depends on itself', async () => {
    const report = await validateAll([baseManifest({ dependencies: [{ id: 'test-team/sample-skill' }] })]);
    assert.ok(consistencyCodes(report, 0).includes('SELF_REFERENCE'));
    assert.equal(report.results[0].valid, false);
  });

  it('marks references outside the validated set as unverified, not as errors', async () => {
    const report = await validateAll([baseManifest({ dependencies: [{ id: 'other-team/elsewhere' }] })]);
    const finding = findingsOf(report, 0).find((f) => f.code === 'UNRESOLVED_REFERENCE');
    assert.equal(finding.severity, 'unverified');
    assert.equal(finding.path, '/dependencies/0/id');
    assert.equal(report.results[0].valid, true);
  });

  it('warns about references to retired capabilities and suggests the replacement', async () => {
    const retired = baseManifest({
      id: 'team/old',
      lifecycleStatus: 'retired',
      deprecation: { reason: 'Replaced by team/new.', replacedBy: 'team/new' },
    });
    const report = await validateAll([baseManifest({ dependencies: [{ id: 'team/old' }] }), retired]);
    const finding = findingsOf(report, 0).find((f) => f.code === 'REFERENCE_TO_RETIRED');
    assert.equal(finding.severity, 'warning');
    assert.match(finding.hint, /team\/new/);
  });

  it('warns when parent and component links are not reciprocal', async () => {
    const report = await validateAll([
      baseManifest({ id: 'team/child', parent: { id: 'team/bundle' } }),
      baseManifest({ id: 'team/bundle', capabilityType: 'plugin', components: [{ id: 'team/other-child' }] }),
      baseManifest({ id: 'team/other-child' }),
    ]);
    assert.ok(consistencyCodes(report, 0).includes('PARENT_CHILD_MISMATCH'));
    assert.ok(consistencyCodes(report, 1).includes('PARENT_CHILD_MISMATCH'));
  });

  it('accepts reciprocal parent and component links', async () => {
    const report = await validateAll([
      baseManifest({ id: 'team/child', parent: { id: 'team/bundle' } }),
      baseManifest({ id: 'team/bundle', capabilityType: 'plugin', components: [{ id: 'team/child' }] }),
    ]);
    assert.equal(report.summary.warnings, 0);
  });
});

describe('metadata and risk', () => {
  it('warns about a lastUpdated date in the future', async () => {
    const report = await validateAll([baseManifest({ lastUpdated: '2026-12-01' })]);
    assert.ok(consistencyCodes(report, 0).includes('DATE_IN_FUTURE'));
  });

  it('checks the dates of publications and provenance too, and accepts a manifest without lastUpdated', async () => {
    const report = await validateAll([
      without(baseManifest({
        publications: [{ kind: 'package', locator: 'pkg:npm/x', updatedAt: '2027-01-01' }],
        provenance: [{ field: '/name', method: 'curated', source: 'catalog team', observedAt: '2026-11-30' }],
      }), 'lastUpdated'),
    ]);
    const future = findingsOf(report, 0).filter((f) => f.code === 'DATE_IN_FUTURE').map((f) => f.path);
    assert.deepEqual(future, ['/publications/0/updatedAt', '/provenance/0/observedAt']);
  });

  it('warns when the declared lifecycle or another channel conflicts with a status a channel reports', async () => {
    const deprecated = { kind: 'package', locator: 'pkg:npm/x', status: 'deprecated', statusMessage: 'Package no longer supported.' };
    const report = await validateAll([
      baseManifest({ id: 'team/declared', publications: [deprecated] }),
      without(baseManifest({ id: 'team/channels', publications: [{ kind: 'registry_entry', locator: 'io.github.example-org/x', status: 'active' }, deprecated] }), 'lifecycleStatus'),
      without(baseManifest({ id: 'team/agree', publications: [deprecated] }), 'lifecycleStatus'),
    ]);
    const conflict = (index) => findingsOf(report, index).find((f) => f.code === 'LIFECYCLE_SIGNALS_CONFLICT');
    assert.equal(conflict(0).path, '/publications/0/status');
    assert.match(conflict(0).message, /^lifecycleStatus is 'active', but publication 'pkg:npm\/x' reports 'deprecated' \("Package no longer supported\."\)/);
    assert.match(conflict(1).message, /^publication 'io\.github\.example-org\/x' reports 'active', but publication 'pkg:npm\/x' reports 'deprecated'/);
    assert.equal(conflict(2), undefined);
  });

  it('warns when a catalog still lists as active a capability whose source repository is archived', async () => {
    // As in the research: a Docker catalog entry for a server whose repository is archived.
    const report = await validateAll([without(baseManifest({
      source: { type: 'repository', url: 'https://github.com/example-org/archived-server', status: 'archived', updatedAt: '2026-07-20' },
      publications: [{ kind: 'registry_entry', locator: 'https://github.com/example-org/catalog/blob/main/servers/x/server.yaml', status: 'active' }],
    }), 'lifecycleStatus')]);
    const conflict = findingsOf(report, 0).find((f) => f.code === 'LIFECYCLE_SIGNALS_CONFLICT');
    assert.equal(conflict.path, '/source/status');
    assert.match(conflict.message, /reports 'active', but the source reports 'archived'/);
  });

  it('reports publications that state different comparable versions as unverified', async () => {
    const report = await validateAll([baseManifest({ publications: [
      { kind: 'registry_entry', locator: 'io.github.example-org/x', nativeVersion: '0.0.82', versionScheme: 'semver' },
      { kind: 'package', locator: 'pkg:npm/x', nativeVersion: '0.0.83', versionScheme: 'semver' },
      { kind: 'container_image', locator: 'docker.io/mcp/x', nativeVersion: '2d446f9e1b79', versionScheme: 'commit' },
    ] })]);
    const finding = findingsOf(report, 0).find((f) => f.code === 'PUBLICATION_VERSIONS_DIFFER');
    assert.equal(finding.severity, 'unverified');
    assert.match(finding.message, /0\.0\.82 \(io\.github\.example-org\/x\), 0\.0\.83 \(pkg:npm\/x\)/);
    assert.doesNotMatch(finding.message, /2d446f9e1b79/);
  });

  it('reports license terms in prose, and repository-wide licenses, as needing review', async () => {
    const report = await validateAll([
      baseManifest({ id: 'team/prose', license: { text: 'Proprietary. Complete terms in LICENSE.txt' } }),
      baseManifest({ id: 'team/repository', license: { expression: 'MIT', scope: 'repository' } }),
      baseManifest({ id: 'team/stated', license: { expression: 'Apache-2.0', scope: 'capability' } }),
    ]);
    const paths = (index) => findingsOf(report, index).filter((f) => f.code === 'LICENSE_NEEDS_REVIEW').map((f) => [f.severity, f.path]);
    assert.deepEqual(paths(0), [['unverified', '/license']]);
    assert.deepEqual(paths(1), [['unverified', '/license/scope']]);
    assert.deepEqual(paths(2), []);
  });

  it('reports heuristic values that nobody confirmed, and provenance for fields that have no value', async () => {
    const report = await validateAll([baseManifest({
      capabilityType: 'tool',
      provenance: [
        { field: '/capabilityType', method: 'derived', basis: 'heuristic', source: 'keywords mention MCP' },
        { field: '/name', method: 'derived', basis: 'heuristic', source: 'title case', confirmedBy: 'catalog team' },
        { field: '/source', method: 'derived', basis: 'convention', source: 'location of SKILL.md' },
        { field: '/license', method: 'native', source: 'package.json license' },
      ],
    })]);
    const found = findingsOf(report, 0).filter((f) => ['DERIVED_VALUE_UNCONFIRMED', 'PROVENANCE_FIELD_NOT_FOUND'].includes(f.code));
    assert.deepEqual(found.map((f) => [f.code, f.severity, f.path]), [
      ['PROVENANCE_FIELD_NOT_FOUND', 'warning', '/provenance/3/field'],
      ['DERIVED_VALUE_UNCONFIRMED', 'unverified', '/provenance/0'],
    ]);
  });

  it('warns about deprecation details on an active capability', async () => {
    const report = await validateAll([baseManifest({ deprecation: { reason: 'Planned replacement next quarter.' } })]);
    assert.ok(consistencyCodes(report, 0).includes('DEPRECATION_STATUS_MISMATCH'));
  });

  it('reports unassessed risk as unverified, and an assessed tier as a passed risk check', async () => {
    const report = await validateAll([
      baseManifest({ id: 'team/unassessed' }),
      baseManifest({ id: 'team/assessed', riskTier: 'low', assessmentReference: { id: 'RA-7' }, source: { type: 'provider', url: 'https://vendor.example/x' } }),
    ]);
    assert.equal(findingsOf(report, 0).find((f) => f.code === 'RISK_UNASSESSED').severity, 'unverified');
    assert.equal(report.results[0].checks.risk, 'unverified');
    assert.equal(report.results[1].checks.risk, 'passed');
  });

  it('skips consistency checks for manifests that fail structural validation', async () => {
    const report = await validateAll([baseManifest({ riskTier: 'low' })]);
    assert.equal(report.results[0].checks.structure, 'failed');
    assert.equal(report.results[0].checks.references, 'skipped');
    assert.deepEqual(consistencyCodes(report, 0), []);
  });
});

describe('source reachability', () => {
  const fakeFetch = (responses, calls = []) => async (url, init) => {
    calls.push([init.method, url]);
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return { status: response };
  };
  const sourceFindings = (report) => findingsOf(report, 0).filter((f) => f.check === 'source');

  it('does not use the network unless asked to', async () => {
    const calls = [];
    const report = await validateAll([baseManifest()], { fetch: fakeFetch([200], calls) });
    assert.deepEqual(calls, []);
    assert.deepEqual(codes(sourceFindings(report)), ['SOURCE_NOT_CHECKED']);
  });

  it('passes the source check for a reachable https URL', async () => {
    const report = await validateAll([baseManifest()], { checkSources: true, fetch: fakeFetch([200]) });
    assert.deepEqual(sourceFindings(report), []);
    assert.equal(report.results[0].checks.source, 'passed');
  });

  it('falls back to GET when HEAD is not allowed', async () => {
    const calls = [];
    await validateAll([baseManifest()], { checkSources: true, fetch: fakeFetch([405, 200], calls) });
    assert.deepEqual(calls.map(([method]) => method), ['HEAD', 'GET']);
  });

  it('treats 404 as unverified, because private and missing sources look the same', async () => {
    const report = await validateAll([baseManifest()], { checkSources: true, fetch: fakeFetch([404]) });
    const [finding] = sourceFindings(report);
    assert.equal(finding.code, 'SOURCE_NOT_ACCESSIBLE');
    assert.equal(finding.severity, 'unverified');
  });

  it('treats server and network failures as warnings, never as errors', async () => {
    for (const response of [503, new TypeError('fetch failed')]) {
      const report = await validateAll([baseManifest()], { checkSources: true, fetch: fakeFetch([response]) });
      const [finding] = sourceFindings(report);
      assert.equal(finding.code, 'SOURCE_UNREACHABLE');
      assert.equal(finding.severity, 'warning');
      assert.equal(report.results[0].valid, true);
    }
  });

  it('reports registry sources without a URL as not checkable', async () => {
    const manifest = baseManifest({ capabilityVersion: '1.0.0', source: { type: 'registry', registry: 'npm', identifier: '@example-org/x' } });
    const report = await validateAll([manifest], { checkSources: true, fetch: fakeFetch([]) });
    assert.deepEqual(codes(sourceFindings(report)), ['SOURCE_NOT_CHECKABLE']);
  });
});
