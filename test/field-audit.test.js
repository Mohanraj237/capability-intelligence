// Phase 1 field audit: the pre-registered protocol stays consistent with the schema and the
// production corpus. The audit itself (research/phase-1/field-audit/audit.js) takes about a minute
// and is run on demand; this test keeps its inputs from drifting.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { parse } from 'yaml';
import { resolveRef } from '../src/schema-registry.js';
import { expandPaths, getRegistry } from '../src/validator.js';

const schema = getRegistry().get('0.1').schema;
const protocol = parse(readFileSync(new URL('../research/phase-1/field-audit/protocol.yaml', import.meta.url), 'utf8'));
const corpusIds = new Set(expandPaths(['case-studies/production-set/manifests']).map((file) => parse(readFileSync(file, 'utf8')).id));

// Resolves a field path such as "publications[].locator" in the schema.
function fieldAt(path) {
  let node = schema;
  for (const part of path.split('.')) {
    const key = part.replace(/\[\]$/, '');
    node = resolveRef(schema, node?.properties?.[key]);
    if (!node) return undefined;
    if (part.endsWith('[]')) node = resolveRef(schema, node.items);
  }
  return node;
}

describe('field audit protocol', () => {
  it('asks journey questions only about fields the schema defines', () => {
    for (const journey of protocol.journeys) {
      for (const question of journey.questions) {
        for (const path of question.anyOf) assert.ok(fieldAt(path), `${journey.id}.${question.id}: ${path}`);
      }
    }
  });

  it('searches only fields the schema defines', () => {
    for (const [name, paths] of Object.entries(protocol.searchFields)) {
      for (const path of paths) assert.ok(fieldAt(path), `${name}: ${path}`);
    }
  });

  it('judges only capabilities in the production corpus, each at most once per need', () => {
    for (const need of protocol.needs) {
      const judged = [...need.relevant, ...need.partial];
      assert.equal(new Set(judged).size, judged.length, need.id);
      for (const id of judged) assert.ok(corpusIds.has(id), `${need.id}: ${id}`);
      assert.ok(need.relevant.length > 0, `${need.id} has no relevant capability`);
    }
  });

  it('records any deviation from the pre-registered protocol', () => {
    assert.ok(Array.isArray(protocol.deviations));
  });
});
