// Capability Exchange Document: manifests are exchanged unchanged, with their validation
// caveats, in a document that conforms to its contract schema.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { parse } from 'yaml';
import { buildExchangeDocument } from '../src/exchange.js';
import { formatExchange } from '../src/format.js';
import { createAjv } from '../src/schema-registry.js';
import { getRegistry, validateFiles, validateManifestText } from '../src/validator.js';
import { baseManifest, without } from './helpers.js';

const contract = JSON.parse(readFileSync(new URL('../schema/contracts/exchange-document-0.1.schema.json', import.meta.url), 'utf8'));

describe('exchange document', () => {
  let document;
  before(async () => {
    document = buildExchangeDocument(await validateFiles(['examples/valid', 'examples/invalid']));
  });

  it('conforms to the exchange-document contract schema', () => {
    const validate = createAjv().compile(contract);
    assert.equal(validate(document), true, JSON.stringify(validate.errors));
  });

  it('carries every valid manifest exactly as authored, and lists the rejected inputs', () => {
    assert.equal(document.capabilities.length, 8);
    const sqlReview = document.capabilities.find(({ manifest }) => manifest.id === 'ai-platform/sql-review');
    assert.deepEqual(sqlReview.manifest, parse(readFileSync('examples/valid/sql-review.capability.yaml', 'utf8')));
    assert.equal(document.rejected.length, 5);
    const missing = document.rejected.find((entry) => entry.file.endsWith('missing-mandatory-field.capability.yaml'));
    assert.deepEqual([missing.errorCount, missing.errorCodes], [2, ['MISSING_REQUIRED_FIELD']]);
  });

  it('lists the schema versions used, and each manifest still validates against its own version', () => {
    assert.deepEqual(document.schemaVersions, ['0.1']);
    for (const { manifest } of document.capabilities) {
      const result = validateManifestText(JSON.stringify(manifest));
      assert.equal(result.validatedAgainst, manifest.schemaVersion);
      assert.deepEqual(result.findings, [], manifest.id);
    }
  });

  it('keeps the validation caveats and the completeness level of each manifest', () => {
    const agent = document.capabilities.find(({ manifest }) => manifest.id === 'ai-platform/incident-triage-agent');
    assert.deepEqual(agent.validation.unverified.sort(), ['RISK_UNASSESSED', 'SOURCE_NOT_CHECKED', 'UNRESOLVED_REFERENCE']);
    assert.equal(agent.validation.completeness, 'discoverable');
    const levels = new Set(document.capabilities.map(({ validation }) => validation.completeness));
    assert.deepEqual(levels, new Set(['none', 'discoverable', 'assessable', 'adoptable', 'governed']));
    assert.match(document.notice, /not establish/);
  });

  it('shows a manifest without owner or lifecycle status in the summary view', () => {
    const view = formatExchange({
      ...document,
      capabilities: [{ manifest: without(baseManifest(), 'owner', 'lifecycleStatus'), validation: { warnings: [], unverified: [] } }],
    });
    assert.match(view.split('\n')[1], /^test-team\/sample-skill +skill +schema 0\.1 +- +- +- +- +UNASSESSED +-$/);
  });

  it('contains no capability-type-specific logic in the exchange code or its summary view', () => {
    const types = getRegistry().get(getRegistry().latest).schema.properties.capabilityType.enum;
    for (const file of ['../src/exchange.js', '../src/format.js']) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      for (const type of types) assert.ok(!source.includes(`'${type}'`) && !source.includes(`"${type}"`), `${file} mentions '${type}'`);
    }
  });

  it('shows unassessed and missing risk as UNASSESSED in the summary view, never as low', () => {
    const view = formatExchange({
      ...document,
      capabilities: [{ manifest: without(baseManifest(), 'riskTier'), validation: { warnings: [], unverified: [] } }],
    });
    assert.match(view, /test-team\/sample-skill .*UNASSESSED/);
    assert.doesNotMatch(view.split('\n')[1], /\blow\b/);
  });
});
