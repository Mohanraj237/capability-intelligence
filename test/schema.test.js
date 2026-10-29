// Contract tests for the schemas themselves: every registered manifest schema version must be a
// valid Draft 2020-12 schema, complete (documented), internally consistent, and in sync with its
// generated field dictionary. The inter-team contract schemas must compile too.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { generateFieldDictionary } from '../src/field-docs.js';
import { createAjv, loadSchemaRegistry, schemaAt } from '../src/schema-registry.js';

const registry = loadSchemaRegistry();
const CHARTER_TYPES = ['skill', 'agent', 'mcp_server', 'plugin', 'tool', 'application', 'service', 'workflow'];
// The charter's ten mandatory-field candidates (Mission 4 section 4). The Spikes 1-3 research found
// that not every source states a description (58 of 60), and few state owner contact, lifecycle, or
// a record date, so the schema mandates the other six and reports the rest through completeness
// levels (revision of 2026-10-23).
const MANDATORY = ['schemaVersion', 'id', 'name', 'capabilityType', 'source', 'riskTier'];
const CHARTER_CANDIDATES = [...MANDATORY, 'description', 'owner', 'lifecycleStatus', 'lastUpdated'];
const LEVELS = ['discoverable', 'assessable', 'adoptable', 'governed'];
const toTokens = (path) => path.split('.').flatMap((part) => (part.endsWith('[]') ? [part.slice(0, -2), '0'] : [part]));

describe('schema registry', () => {
  it('discovers the manifest schema versions and routes to the latest', () => {
    assert.deepEqual(registry.versions, ['0.1']);
    assert.equal(registry.latest, '0.1');
  });
});

registry.versions.forEach((version, index) => {
  const { schema } = registry.get(version);

  describe(`manifest schema ${version}`, () => {
    it('is a valid Draft 2020-12 schema in Ajv strict mode', () => {
      assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
      assert.equal(createAjv().validateSchema(schema), true);
      assert.match(schema.$id, new RegExp(`/${version.replace('.', '\\.')}/capability\\.schema\\.json$`));
    });

    it('mandates only the facts every sampled source supplies, and keeps every charter candidate', () => {
      assert.deepEqual(new Set(schema.required), new Set(MANDATORY));
      for (const field of CHARTER_CANDIDATES) assert.ok(schema.properties[field], `${field} is not defined`);
      assert.deepEqual(schema.$defs.owner.required, ['name']);
    });

    it('defines cumulative completeness levels whose facts are stated by defined fields', () => {
      const levels = schema['x-completenessLevels'];
      assert.deepEqual(levels.map((entry) => entry.level), LEVELS);
      for (const { level, description, requires } of levels) {
        assert.ok(description && requires.length > 0, level);
        assert.equal(new Set(requires.map((requirement) => requirement.fact)).size, requires.length, `${level}: duplicate facts`);
        for (const { fact, anyOf } of requires) {
          for (const path of anyOf) assert.ok(schemaAt(schema, toTokens(path)), `${level} / ${fact}: ${path} is not defined`);
        }
      }
      // The charter candidates that are no longer mandatory are level requirements, except the
      // record date, which says nothing about the capability.
      const levelFields = levels.flatMap((entry) => entry.requires.flatMap((requirement) => requirement.anyOf));
      for (const field of ['description', 'owner.name', 'owner.contact', 'lifecycleStatus']) assert.ok(levelFields.includes(field), field);
    });

    it('counts only an assessed risk tier towards the governed level, never the unassessed default', () => {
      const governed = schema['x-completenessLevels'].find((entry) => entry.level === 'governed');
      assert.deepEqual(governed.requires, [{ fact: 'risk assessment', anyOf: ['riskTier'], excluding: ['unassessed'] }]);
    });

    it('lists native-format synonyms that are not field names, each for one field only', () => {
      const seen = new Map();
      for (const [name, property] of Object.entries(schema.properties)) {
        for (const synonym of property['x-synonyms'] ?? []) {
          assert.ok(!schema.properties[synonym], `'${synonym}' is a field name`);
          assert.ok(!seen.has(synonym.toLowerCase()), `'${synonym}' is listed for ${seen.get(synonym.toLowerCase())} and ${name}`);
          seen.set(synonym.toLowerCase(), name);
        }
      }
      assert.ok(seen.size > 0);
    });

    it('offers at least the capability types listed in Mission 4 section 2', () => {
      for (const type of CHARTER_TYPES) assert.ok(schema.properties.capabilityType.enum.includes(type), type);
    });

    it('defines lifecycle transitions for exactly the lifecycle states, using only known states', () => {
      const states = schema.properties.lifecycleStatus.enum;
      const transitions = schema.properties.lifecycleStatus['x-lifecycleTransitions'];
      assert.deepEqual(Object.keys(transitions).sort(), [...states].sort());
      for (const targets of Object.values(transitions)) {
        for (const target of targets) assert.ok(states.includes(target), `unknown target state ${target}`);
      }
    });

    it('requires an assessment reference for exactly the assessed risk tiers, and has no default tier', () => {
      const riskRule = schema.allOf.find((rule) => rule.if.properties.riskTier);
      const assessedTiers = schema.properties.riskTier.enum.filter((tier) => tier !== 'unassessed');
      assert.deepEqual(riskRule.if.properties.riskTier.enum, assessedTiers);
      assert.ok(!('default' in schema.properties.riskTier), 'riskTier must not have a default value');
    });

    it('documents every field and every conditional rule', () => {
      const undocumented = [];
      const visit = (node, path) => {
        for (const [name, property] of Object.entries(node.properties ?? {})) {
          if (!property.description) undocumented.push(`${path}${name}`);
        }
        for (const rule of node.allOf ?? []) {
          if (!rule.description || !rule['x-hint']) undocumented.push(`${path}allOf rule`);
        }
      };
      visit(schema, '');
      for (const [name, definition] of Object.entries(schema.$defs)) visit(definition, `$defs/${name}/`);
      assert.deepEqual(undocumented, []);
    });

    it('has examples that satisfy their own field definitions', () => {
      const ajv = createAjv();
      ajv.addSchema(schema);
      const locations = [
        ...Object.keys(schema.properties).map((name) => `#/properties/${name}`),
        ...Object.entries(schema.$defs).flatMap(([def, node]) => Object.keys(node.properties ?? {}).map((name) => `#/$defs/${def}/properties/${name}`)),
      ];
      let checked = 0;
      for (const location of locations) {
        const node = location.slice(2).split('/').reduce((current, token) => current[token], schema);
        for (const example of node.examples ?? []) {
          checked += 1;
          assert.equal(ajv.validate({ $ref: `${schema.$id}${location}` }, example), true, `${location}: ${JSON.stringify(example)}`);
        }
      }
      assert.ok(checked > 0);
    });

    it(`keeps docs/field-dictionary/${version}.md in sync (run \`npm run docs\` to update)`, () => {
      const committed = readFileSync(new URL(`../docs/field-dictionary/${version}.md`, import.meta.url), 'utf8');
      const previous = index > 0 ? registry.get(registry.versions[index - 1]) : undefined;
      assert.equal(committed, generateFieldDictionary(schema, { sourcePath: `schema/${version}/capability.schema.json`, previous }));
    });
  });
});

describe('inter-team contract schemas', () => {
  for (const file of ['validation-report-0.1.schema.json', 'exchange-document-0.1.schema.json']) {
    it(`compiles ${file} in Ajv strict mode`, () => {
      const schema = JSON.parse(readFileSync(new URL(`../schema/contracts/${file}`, import.meta.url), 'utf8'));
      assert.doesNotThrow(() => createAjv().compile(schema));
    });
  }
});
