// Spikes 1-3 research harness: the generated results match the snapshot they were computed from,
// the schema the report evaluated still gives the report's numbers, and the revised schema 0.1
// gives the outcomes that the revision is meant to produce on the same real records.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { runResearch } from '../research/spikes-1-3/analyze.js';

const read = (path) => readFileSync(new URL(`../research/spikes-1-3/${path}`, import.meta.url), 'utf8');

describe('Spikes 1-3 research harness', () => {
  let research;
  before(async () => {
    research = await runResearch();
  });

  it('keeps results.md and results.json in sync with the snapshot (run `npm run research` to update)', () => {
    assert.equal(read('results.md'), research.markdown);
    assert.equal(read('results.json'), `${JSON.stringify(research.results, null, 2)}\n`);
  });

  it('reproduces the report\'s schema 0.1 result against the draft of 2026-10-22', () => {
    const { schema } = research.results;
    assert.equal(schema.length, 60);
    assert.equal(schema.filter((row) => row.valid).length, 12);
    assert.equal(schema.filter((row) => row.errors.includes('MISSING_REQUIRED_FIELD /lifecycleStatus')).length, 45);
  });

  it('accepts most of the same drafts under the revised schema; the rest state descriptions it cannot hold', () => {
    const { revised, starter } = research.results;
    assert.equal(revised.filter((row) => row.valid).length, 57);
    // N1-08 states 1,221 characters (maximum 1,024), N2-14 states 17 (minimum 20); drafts never shorten a value.
    assert.deepEqual(starter.rows.filter((row) => !row.valid).map((row) => [row.ref, row.errors]), [
      ['N1-08', ['CONSTRAINT_VIOLATION /description']],
      ['N2-14', ['CONSTRAINT_VIOLATION /description']],
    ]);
    assert.ok(revised.every((row) => !row.errors.includes('INVALID_FORMAT /id')), 'registry-verified namespaces are accepted');
  });

  it('links the same capabilities as the declared-link rule of J2 through the validator alone', () => {
    const viaValidator = research.results.starter.identity['DUPLICATE_PUBLICATION + DUPLICATE_SOURCE'];
    const j2 = research.results.j2.rules['declared links + same repository and path'];
    assert.deepEqual([viaValidator.truePairs, viaValidator.falsePairs, viaValidator.missedPairs], [j2.truePairs, [], []]);
    assert.equal(viaValidator.truePairs, 14);
  });

  it('reports the completeness levels that section 8 measured, apart from four records it explains', () => {
    const disagreements = research.results.starter.rows.filter((row) => row.level !== row.researchLevel).map((row) => row.ref);
    assert.deepEqual(disagreements, ['N1-08', 'N2-14', 'N2-47', 'N4-43']);
    assert.equal(research.results.starter.rows.filter((row) => row.level === 'adoptable' || row.level === 'governed').length, 0);
  });

  it('shows what keeping description mandatory would cost', () => {
    const { descriptionMandatory } = research.results.sensitivity;
    assert.equal(descriptionMandatory.valid, 56);
    assert.equal(descriptionMandatory.identity.missedPairs.length, 3);
  });
});
