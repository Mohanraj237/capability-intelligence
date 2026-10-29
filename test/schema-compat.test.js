// Schema compatibility between schema versions: static classification of each change, the
// version-bump rule, and the empirical corpus check.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { generateFieldDictionary } from '../src/field-docs.js';
import { checkSchemaCompatibility, compareSchemas, loadSchemaInput } from '../src/schema-compat.js';
import { createAjv } from '../src/schema-registry.js';
import { expandPaths, getRegistry } from '../src/validator.js';
import { codes } from './helpers.js';

const registry = getRegistry();
const v01 = registry.get('0.1');
const corpus = expandPaths(['examples/valid']).map((file) => ({ file, text: readFileSync(file, 'utf8') }));

// A modified copy of schema 0.1, declared as `version`.
function variant(version, mutate) {
  const schema = structuredClone(v01.schema);
  schema.$id = schema.$id.replace('/0.1/', `/${version}/`);
  schema.properties.schemaVersion.const = version;
  mutate(schema);
  return { version, schema, validate: createAjv().compile(schema) };
}

const changesOf = (mutate) => compareSchemas(v01.schema, variant('0.2', mutate).schema);
const impactOf = (changes, code) => changes.find((change) => change.code === code)?.impact;

describe('a next MINOR version', () => {
  // Adds an optional field and a capability type, as a next MINOR version typically would.
  const additive = (schema) => {
    schema.properties.techStack = { type: 'array', items: { type: 'string' }, description: 'Technologies the capability is built with.' };
    schema.properties.capabilityType.enum.push('dataset');
  };

  it('is classified as additive, needing and having a MINOR bump, with no corpus regressions', () => {
    const result = checkSchemaCompatibility(v01, variant('0.2', additive), { corpus });
    assert.equal(result.ok, true);
    assert.equal(result.classification, 'additive');
    assert.equal(result.requiredBump, 'minor');
    assert.equal(result.actualBump, 'minor');
    assert.deepEqual(result.changes.filter((c) => c.code === 'FIELD_ADDED').map((c) => c.path), ['techStack']);
    assert.match(result.changes.find((c) => c.code === 'ENUM_VALUES_ADDED').message, /dataset/);
    assert.deepEqual(result.corpus, { checked: 8, stillValid: 8, regressions: [] });
  });

  it('is breaking in the reverse direction, and the decreasing version is rejected', () => {
    const result = checkSchemaCompatibility(variant('0.2', additive), v01);
    assert.equal(result.classification, 'breaking');
    assert.ok(codes(result.changes).includes('FIELD_REMOVED'));
    assert.ok(codes(result.changes).includes('ENUM_VALUES_REMOVED'));
    assert.deepEqual(codes(result.findings), ['VERSION_DECREASED']);
    assert.equal(result.ok, false);
  });

  it('lists its changes since the previous version in its field dictionary', () => {
    const markdown = generateFieldDictionary(variant('0.2', additive).schema, { sourcePath: 'schema/0.2/capability.schema.json', previous: v01 });
    assert.match(markdown, /## Changes since 0\.1/);
    assert.match(markdown, /\| additive \| `FIELD_ADDED` \| `techStack` \|/);
  });

  it('warns, below 1.0, when the contract changes but the version does not', () => {
    const result = checkSchemaCompatibility(v01, variant('0.1', additive));
    assert.equal(result.actualBump, 'none');
    assert.equal(result.findings[0].code, 'INSUFFICIENT_VERSION_BUMP');
    assert.match(result.findings[0].hint, /unpublished draft/);
  });
});

describe('the 2026-10-23 revision of 0.1 (Spikes 1-3 research)', () => {
  const draft = loadSchemaInput('research/spikes-1-3/reference/capability-0.1-2026-10-22.schema.json', registry);
  // The manifests that were valid under the 2026-10-22 draft, as they were on that day.
  const before = expandPaths(['research/spikes-1-3/reference/examples-2026-10-22']).map((file) => ({ file, text: readFileSync(file, 'utf8') }));

  it('relaxes the requirements and adds optional fields; only the widened id pattern is classified as breaking', () => {
    const result = checkSchemaCompatibility(draft, v01, { corpus: before });
    const byImpact = (impact) => result.changes.filter((change) => change.impact === impact);
    // The id pattern is reported wherever a capability id is used.
    assert.deepEqual(new Set(byImpact('breaking').map((change) => change.code)), new Set(['PATTERN_CHANGED']));
    assert.deepEqual(byImpact('breaking').map((change) => change.path).sort(), ['components[].id', 'dependencies[].id', 'deprecation.replacedBy', 'id', 'parent.id']);
    assert.deepEqual(byImpact('relaxation').filter((change) => change.code === 'REQUIREMENT_REMOVED').map((change) => change.path).sort(),
      ['description', 'lastUpdated', 'lifecycleStatus', 'owner', 'owner.affiliation', 'owner.contact']);
    assert.ok(byImpact('relaxation').some((change) => change.code === 'RULE_REMOVED' && /registry/.test(change.message)));
    assert.deepEqual(byImpact('additive').filter((change) => change.code === 'LEVEL_ADDED').map((change) => change.path),
      ['x-completenessLevels.discoverable', 'x-completenessLevels.assessable', 'x-completenessLevels.adoptable', 'x-completenessLevels.governed']);
    for (const field of ['publications', 'relations', 'license', 'runtime', 'setup', 'provenance', 'keywords', 'documentation', 'source.repositoryId', 'source.status', 'source.updatedAt', 'interfaces[].transport']) {
      assert.ok(result.changes.some((change) => change.code === 'FIELD_ADDED' && change.path === field), field);
    }
    // Every manifest that was valid under the 2026-10-22 draft is still valid: the corpus confirms
    // that the id pattern was widened, not changed.
    assert.deepEqual(result.corpus, { checked: 9, stillValid: 9, regressions: [] });
  });

  it('accepts every id the earlier pattern accepted', () => {
    const before = new RegExp(draft.schema.$defs.capabilityId.pattern);
    const after = new RegExp(v01.schema.$defs.capabilityId.pattern);
    for (const id of ['ai-platform/sql-review', 'acme.platform-ai/code-review-2', 'a/b', 'x1.y-2.z/n-3']) {
      assert.ok(before.test(id) && after.test(id), id);
    }
  });
});

describe('completeness level changes', () => {
  const levels = (mutate) => changesOf((schema) => mutate(schema['x-completenessLevels']));
  const assessable = (list) => list.find((entry) => entry.level === 'assessable');

  it('treats a new fact or a narrower fact as breaking, and a removed or wider fact as a relaxation', () => {
    assert.equal(impactOf(levels((list) => assessable(list).requires.push({ fact: 'keywords', anyOf: ['keywords'] })), 'LEVEL_REQUIREMENT_ADDED'), 'breaking');
    assert.equal(impactOf(levels((list) => { assessable(list).requires[0].anyOf = []; }), 'LEVEL_REQUIREMENT_NARROWED'), 'breaking');
    assert.equal(impactOf(levels((list) => assessable(list).requires.pop()), 'LEVEL_REQUIREMENT_REMOVED'), 'relaxation');
    assert.equal(impactOf(levels((list) => assessable(list).requires[0].anyOf.push('platformCompatibility')), 'LEVEL_REQUIREMENT_WIDENED'), 'relaxation');
    assert.equal(impactOf(levels((list) => list.pop()), 'LEVEL_REMOVED'), 'breaking');
  });
});

describe('change classification', () => {
  it('treats a new mandatory field and a newly required field as breaking', () => {
    const changes = changesOf((schema) => {
      schema.properties.region = { type: 'string', description: 'Hosting region.' };
      schema.required.push('region', 'capabilityVersion');
    });
    assert.equal(impactOf(changes, 'REQUIRED_FIELD_ADDED'), 'breaking');
    assert.equal(changes.find((c) => c.code === 'REQUIREMENT_ADDED').path, 'capabilityVersion');
  });

  it('treats removing a field, an enumeration value, or extension support as breaking', () => {
    assert.equal(impactOf(changesOf((schema) => delete schema.properties.limitations), 'FIELD_REMOVED'), 'breaking');
    assert.equal(impactOf(changesOf((schema) => schema.properties.riskTier.enum.pop()), 'ENUM_VALUES_REMOVED'), 'breaking');
    assert.equal(impactOf(changesOf((schema) => delete schema.patternProperties), 'EXTENSIONS_RESTRICTED'), 'breaking');
  });

  it('distinguishes tightened from relaxed constraints', () => {
    assert.equal(impactOf(changesOf((schema) => { schema.properties.description.maxLength = 500; }), 'CONSTRAINT_TIGHTENED'), 'breaking');
    assert.equal(impactOf(changesOf((schema) => { schema.properties.description.maxLength = 2000; }), 'CONSTRAINT_RELAXED'), 'relaxation');
    assert.equal(impactOf(changesOf((schema) => { schema.$defs.capabilityId.pattern = '^[a-z]+/[a-z]+$'; }), 'PATTERN_CHANGED'), 'breaking');
  });

  it('treats a new conditional rule on an existing object as breaking', () => {
    const changes = changesOf((schema) => {
      schema.allOf.push({
        description: 'Active capabilities must declare use cases.',
        'x-hint': 'Add supportedUseCases.',
        if: { properties: { lifecycleStatus: { const: 'active' } }, required: ['lifecycleStatus'] },
        then: { required: ['supportedUseCases'] },
      });
    });
    assert.equal(impactOf(changes, 'RULE_ADDED'), 'breaking');
  });

  it('treats a removed lifecycle transition as breaking', () => {
    const changes = changesOf((schema) => { schema.properties.lifecycleStatus['x-lifecycleTransitions'].deprecated = ['retired']; });
    assert.equal(impactOf(changes, 'TRANSITION_REMOVED'), 'breaking');
  });

  it('reports description-only changes as annotations that need no version bump', () => {
    const result = checkSchemaCompatibility(v01, variant('0.1', (schema) => { schema.properties.name.description = 'Display name.'; }));
    assert.equal(result.classification, 'annotation');
    assert.equal(result.requiredBump, 'none');
    assert.equal(result.ok, true);
  });
});

describe('version bump and corpus', () => {
  const breaking = (schema) => schema.required.push('capabilityVersion');

  it('rejects a breaking change released as a MINOR version from 1.0 onwards', () => {
    const result = checkSchemaCompatibility(variant('1.0', () => {}), variant('1.1', breaking));
    assert.equal(result.ok, false);
    assert.deepEqual(codes(result.findings), ['INSUFFICIENT_VERSION_BUMP']);
  });

  it('only warns about a breaking MINOR change below 1.0, where SemVer makes no promise', () => {
    const result = checkSchemaCompatibility(v01, variant('0.2', breaking));
    assert.equal(result.ok, true);
    assert.equal(result.findings[0].severity, 'warning');
  });

  it('turns corpus regressions into a breaking classification', () => {
    const result = checkSchemaCompatibility(v01, variant('0.2', (schema) => { schema.properties.description.maxLength = 120; }), { corpus });
    assert.equal(result.classification, 'breaking');
    assert.ok(result.corpus.regressions.length > 0);
    assert.ok(result.corpus.regressions.every((regression) => regression.codes.includes('CONSTRAINT_VIOLATION')));
  });
});
