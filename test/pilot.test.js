// Journey pilot: the journeys are well formed, the crosswalk invents nothing, risk is never
// asserted, and the generated results and drafts match the snapshot they were computed from.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { parse } from 'yaml';
import { matchedTerms, renderResults, runPilot } from '../pilot/analyze.js';
import { CONCEPTS } from '../pilot/crosswalk.js';
import { schemaAt } from '../src/schema-registry.js';
import { getRegistry } from '../src/validator.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const conceptKeys = new Set(CONCEPTS.map((concept) => concept.key));

describe('journey pilot', () => {
  let pilot;
  before(async () => {
    pilot = await runPilot();
  });

  it('defines journeys whose questions use only known concepts and fields', () => {
    const { journeys, useCases } = parse(read('pilot/journeys.yaml'));
    for (const question of journeys.flatMap((journey) => journey.questions)) {
      assert.deepEqual(Object.keys(question).filter((key) => !['id', 'ask', 'concepts', 'need', 'governance'].includes(key)), [], question.id);
      assert.ok(['required', 'helpful'].includes(question.need), question.id);
      for (const key of question.concepts) assert.ok(conceptKeys.has(key) || key === 'draftValid', `${question.id}: ${key}`);
    }
    for (const useCase of useCases) {
      assert.deepEqual(Object.keys(useCase).sort(), ['id', 'need', 'terms'], useCase.id);
      assert.ok(useCase.terms.length > 0);
    }
  });

  it('maps every in-schema concept onto a field that exists in the schema', () => {
    const schema = getRegistry().get(getRegistry().latest).schema;
    for (const concept of CONCEPTS.filter((c) => c.field)) {
      assert.ok(schemaAt(schema, concept.field.split('.')), concept.field);
    }
    for (const concept of CONCEPTS.filter((c) => !c.field)) {
      assert.equal(schemaAt(schema, [concept.key]), undefined, `${concept.key} is in the schema now: set its field`);
    }
  });

  it('takes every native value from the downloaded snapshot, inventing nothing', () => {
    const leaves = (value) => (Array.isArray(value) ? value.flatMap(leaves) : value && typeof value === 'object' ? Object.values(value).flatMap(leaves) : [value]);
    for (const item of pilot.items) {
      const snapshot = JSON.stringify(item.sample.native).toLowerCase();
      for (const [key, entry] of Object.entries(item.concepts)) {
        if (entry.provenance !== 'native' || key === 'interfaces' || key === 'source') continue;
        for (const leaf of leaves(entry.value).filter((value) => typeof value === 'string')) {
          assert.ok(snapshot.includes(JSON.stringify(leaf).slice(1, -1).toLowerCase()), `${item.sample.name}: ${key} = ${leaf}`);
        }
      }
    }
  });

  it('never asserts a risk tier: every draft records unassessed as an explicit default', () => {
    for (const item of pilot.items) {
      assert.deepEqual(item.concepts.riskTier, { value: 'unassessed', provenance: 'default', from: 'no assessment is recorded' });
      assert.equal(item.manifest.assessmentReference, undefined);
    }
  });

  it('stores no email addresses in the snapshot', () => {
    for (const { file } of JSON.parse(read('pilot/samples/sources.json')).capabilities) {
      assert.doesNotMatch(read(`pilot/samples/${file}`), /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, file);
    }
  });

  it('matches use-case terms as whole words only', () => {
    const useCase = { terms: ['web', 'pull request'] };
    assert.deepEqual(matchedTerms(useCase, { name: 'cdp', description: 'one direct WebSocket per call' }), []);
    assert.deepEqual(matchedTerms(useCase, { name: 'Web runner', description: 'Opens a pull request.' }), ['web', 'pull request']);
  });

  it('keeps pilot/results.md and pilot/drafts in sync with the snapshot (run `npm run pilot` to update)', () => {
    assert.equal(read('pilot/results.md'), renderResults(pilot));
    for (const item of pilot.items) assert.equal(read(item.draft), item.text, item.draft);
  });
});
