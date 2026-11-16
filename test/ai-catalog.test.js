// AI Catalog interoperability (U7): the hybrid projection is a valid AI Catalog and carries every
// manifest unchanged; the validator enforces the specification's structural rules.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { parse } from 'yaml';
import { SCHEMA_ID, fromEntry, toCatalog, validateCatalog } from '../research/phase-1/ai-catalog/ai-catalog.js';
import { expandPaths, getRegistry } from '../src/validator.js';

const manifests = expandPaths(['case-studies/production-set/manifests']).sort().map((file) => parse(readFileSync(file, 'utf8')));

describe('AI Catalog projection of the 22 production manifests', () => {
  it('produces a valid Level 2 catalog in every projection', () => {
    for (const projection of ['reference', 'manifest', 'hybrid']) {
      const { findings, level } = validateCatalog(toCatalog(manifests, projection));
      assert.deepEqual(findings.filter((finding) => finding.severity === 'error'), [], projection);
      assert.equal(level, 2, projection);
    }
  });

  it('carries every manifest unchanged in the hybrid projection, keyed by the schema $id', () => {
    assert.equal(SCHEMA_ID, getRegistry().get('0.1').schema.$id);
    const catalog = toCatalog(manifests, 'hybrid');
    catalog.entries.forEach((entry, i) => assert.deepEqual(fromEntry(entry), manifests[i]));
  });

  it('cannot rebuild a valid manifest from the reference projection alone', () => {
    const rebuilt = toCatalog(manifests, 'reference').entries.map(fromEntry);
    assert.ok(rebuilt.every((manifest) => manifest.riskTier === undefined), 'riskTier unassessed has no AI Catalog equivalent');
  });

  it('never assigns urn:air identifiers as a catalog operator that is not the publisher', () => {
    const catalog = toCatalog(manifests, 'hybrid');
    assert.ok(catalog.entries.every((entry) => !entry.identifier.startsWith('urn:air:')));
  });
});

describe('AI Catalog validator', () => {
  it('rejects the structural errors the specification defines', () => {
    const bad = {
      specVersion: '2.0',
      entries: [
        { identifier: 'x', type: 'application/agent-skills+md', url: 'https://a', data: {} },
        { identifier: 'urn:air:example.com:skill:y', type: 'application/agent-skills+md', url: 'https://b', updatedAt: '2026-11-16', extensions: { 'not a key': 1 } },
        { identifier: 'z', type: 'application/ai-catalog+json', url: 'https://c', trustManifests: [{ contributor: 'me' }] },
      ],
    };
    const messages = validateCatalog(bad).findings.filter((finding) => finding.severity === 'error').map((finding) => finding.message);
    for (const expected of [/Unknown major version/, /exactly one of url or data/, /must not assign urn:air/, /RFC 3339/, /URL or a reverse-DNS/, /absolute URI/, /needs a signature, trust schema/]) {
      assert.ok(messages.some((message) => expected.test(message)), String(expected));
    }
  });
});
