// Stage 1: structural validation and actionable error reporting.

import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { describe, it } from 'node:test';
import { createAjv } from '../src/schema-registry.js';
import { validateStructure } from '../src/structural.js';
import { getRegistry, validateManifestText } from '../src/validator.js';
import { adoptableManifest, baseManifest, codes, minimalManifest, readExample, structuralFindings, toYaml, without } from './helpers.js';

const MANDATORY = ['schemaVersion', 'id', 'name', 'capabilityType', 'source', 'riskTier'];

function only(findings, code) {
  const matching = findings.filter((finding) => finding.code === code);
  assert.equal(matching.length, 1, `expected exactly one ${code}, got: ${JSON.stringify(codes(findings))}`);
  return matching[0];
}

describe('valid manifests', () => {
  it('accepts the base manifest used by the tests', () => {
    assert.deepEqual(structuralFindings(baseManifest()), []);
  });

  for (const file of readdirSync(new URL('../examples/valid', import.meta.url))) {
    it(`accepts examples/valid/${file}`, () => {
      assert.deepEqual(structuralFindings(readExample(`examples/valid/${file}`)), []);
    });
  }

  it('accepts the same manifest written as JSON', () => {
    assert.deepEqual(structuralFindings(JSON.stringify(baseManifest(), null, 2)), []);
  });

  it('accepts a full SemVer capabilityVersion with pre-release and build metadata', () => {
    assert.deepEqual(structuralFindings(baseManifest({ capabilityVersion: '1.2.3-rc.1+build.5' })), []);
  });

  it('accepts namespaced ids with dotted namespaces', () => {
    assert.deepEqual(structuralFindings(baseManifest({ id: 'acme.platform-ai/code-review-2' })), []);
  });

  it('accepts registry-verified namespaces and names that start with a digit', () => {
    for (const id of ['io.github.0xmortuex/osdev-wiki-mcp', '0xsl1m/cerebrus-pulse-mcp', 'acme/3d-viewer']) {
      assert.deepEqual(structuralFindings(baseManifest({ id })), [], id);
    }
  });

  it('accepts a manifest with only the mandatory fields', () => {
    assert.deepEqual(structuralFindings(minimalManifest()), []);
  });

  it('accepts the starter-model fields: publications, relations, license, runtime, setup, provenance', () => {
    const manifest = adoptableManifest({
      capabilityType: 'mcp_server',
      source: { type: 'repository', url: 'https://github.com/example-org/browser-mcp', repositoryId: '952688112' },
      publications: [
        { kind: 'registry_entry', locator: 'io.github.example-org/browser-mcp', nativeVersion: '0.0.82', versionScheme: 'semver', status: 'active', updatedAt: '2026-09-18' },
        { kind: 'package', locator: 'pkg:npm/%40example-org/browser-mcp', nativeName: '@example-org/browser-mcp', verifiedBy: 'mcpName back-link' },
        { kind: 'marketplace_entry', locator: 'browser@example-marketplace', nativeVersion: 'latest', versionScheme: 'floating' },
      ],
      interfaces: [{ type: 'mcp', transport: 'stdio' }],
      runtime: [{ kind: 'local_process', detail: 'Node.js >=18' }, { kind: 'container' }],
      setup: [{ name: 'BROWSER_PROFILE', description: 'Path to a browser profile.', secret: false, required: false }],
      license: { expression: 'MIT OR Apache-2.0', scope: 'capability', url: 'https://example.com/license' },
      documentation: 'https://example.com/docs',
      keywords: ['browser', 'testing'],
      relations: [{ type: 'fork_of', locator: 'pkg:npm/%40playwright/mcp', evidence: 'README claim.', verified: false }],
      provenance: [
        { field: '/license', method: 'native', source: 'npm package.json license', observedAt: '2026-10-22' },
        { field: '/capabilityType', method: 'derived', basis: 'convention', source: 'server.json format' },
      ],
    });
    assert.deepEqual(structuralFindings(manifest), []);
  });
});

describe('mandatory fields', () => {
  for (const field of MANDATORY) {
    it(`rejects a manifest without '${field}'`, () => {
      const finding = only(structuralFindings(without(baseManifest(), field)), 'MISSING_REQUIRED_FIELD');
      assert.equal(finding.path, `/${field}`);
      assert.equal(finding.severity, 'error');
      assert.ok(finding.hint.length > 0);
      assert.ok(finding.line >= 1, 'points to a line in the source');
    });
  }

  it('tells the author to use unassessed when riskTier is missing, never defaulting to low', () => {
    const finding = only(structuralFindings(without(baseManifest(), 'riskTier')), 'MISSING_REQUIRED_FIELD');
    assert.match(finding.hint, /'unassessed'/);
  });

  it('lists the allowed values when a missing field is an enumeration', () => {
    const finding = only(structuralFindings(without(baseManifest(), 'capabilityType')), 'MISSING_REQUIRED_FIELD');
    assert.match(finding.hint, /Allowed values: skill, agent, mcp_server/);
  });

  it('does not require the charter candidates that not every source states: description, owner, lifecycleStatus, lastUpdated', () => {
    assert.deepEqual(structuralFindings(without(baseManifest(), 'description', 'owner', 'lifecycleStatus', 'lastUpdated')), []);
    only(structuralFindings(baseManifest({ description: 'GitHub MCP server' })), 'CONSTRAINT_VIOLATION'); // constraints apply when present
    assert.deepEqual(structuralFindings(baseManifest({ owner: { name: 'Test Team' } })), []);
  });

  it('reports a missing field inside a nested object with its full path', () => {
    const manifest = baseManifest({ owner: { contact: 'test-team@example.com', affiliation: 'internal' } });
    const finding = only(structuralFindings(manifest), 'MISSING_REQUIRED_FIELD');
    assert.equal(finding.path, '/owner/name');
    assert.match(finding.message, /'name' in 'owner'/);
  });
});

describe('conditional fields', () => {
  it('requires assessmentReference when riskTier is an assessed tier, and explains why', () => {
    for (const riskTier of ['low', 'medium', 'high']) {
      const finding = only(structuralFindings(baseManifest({ riskTier })), 'CONDITIONAL_FIELD_REQUIRED');
      assert.equal(finding.path, '/assessmentReference');
      assert.match(finding.message, new RegExp(`because riskTier is '${riskTier}'`));
      assert.match(finding.hint, /set riskTier to 'unassessed'/);
    }
  });

  it('does not require assessmentReference when riskTier is unassessed', () => {
    assert.deepEqual(structuralFindings(baseManifest({ riskTier: 'unassessed' })), []);
  });

  it('accepts an assessed tier that cites its assessment', () => {
    assert.deepEqual(structuralFindings(baseManifest({ riskTier: 'high', assessmentReference: { id: 'RA-1' } })), []);
  });

  it('requires deprecation details for deprecated and retired capabilities', () => {
    for (const lifecycleStatus of ['deprecated', 'retired']) {
      const finding = only(structuralFindings(baseManifest({ lifecycleStatus })), 'CONDITIONAL_FIELD_REQUIRED');
      assert.equal(finding.path, '/deprecation');
    }
    const deprecated = baseManifest({ lifecycleStatus: 'deprecated', deprecation: { reason: 'Superseded by a newer skill.' } });
    assert.deepEqual(structuralFindings(deprecated), []);
  });

  it('requires an mcp interface for an mcp_server', () => {
    const missing = only(structuralFindings(baseManifest({ capabilityType: 'mcp_server' })), 'CONDITIONAL_FIELD_REQUIRED');
    assert.equal(missing.path, '/interfaces');

    const wrongKind = baseManifest({ capabilityType: 'mcp_server', interfaces: [{ type: 'cli' }] });
    const violation = only(structuralFindings(wrongKind), 'CONDITIONAL_RULE_VIOLATION');
    assert.equal(violation.path, '/interfaces');
    assert.match(violation.message, /capabilityType is 'mcp_server'/);

    assert.deepEqual(structuralFindings(baseManifest({ capabilityType: 'mcp_server', interfaces: [{ type: 'cli' }, { type: 'mcp' }] })), []);
  });

  it('requires the package identifier for registry sources, but not a SemVer capabilityVersion', () => {
    const finding = only(structuralFindings(baseManifest({ source: { type: 'registry', registry: 'npm' } })), 'CONDITIONAL_FIELD_REQUIRED');
    assert.equal(finding.path, '/source/identifier');
    assert.match(finding.message, /because source\.type is 'registry'/);
    assert.deepEqual(structuralFindings(baseManifest({ source: { type: 'registry', registry: 'npm', identifier: '@example-org/x' } })), []);
  });

  it('requires license terms as text when no SPDX expression is given, and explains the condition', () => {
    const finding = only(structuralFindings(baseManifest({ license: { scope: 'repository' } })), 'CONDITIONAL_FIELD_REQUIRED');
    assert.equal(finding.path, '/license/text');
    assert.match(finding.message, /because license\.expression is absent/);
    assert.deepEqual(structuralFindings(baseManifest({ license: { text: 'Proprietary; see LICENSE.txt' } })), []);
    only(structuralFindings(baseManifest({ license: { expression: 'see LICENSE file' } })), 'INVALID_FORMAT');
  });

  it('requires a relation to name its target by id or locator', () => {
    const finding = only(structuralFindings(baseManifest({ relations: [{ type: 'fork_of' }] })), 'CONDITIONAL_FIELD_REQUIRED');
    assert.equal(finding.path, '/relations/0/locator');
    assert.match(finding.message, /because relations\[0\]\.id is absent/);
  });

  it('requires the basis of a derived value, so that heuristics can be told apart', () => {
    const finding = only(structuralFindings(baseManifest({ provenance: [{ field: '/name', method: 'derived', source: 'title case of the package name' }] })), 'CONDITIONAL_FIELD_REQUIRED');
    assert.equal(finding.path, '/provenance/0/basis');
    assert.match(finding.message, /because provenance\[0\]\.method is 'derived'/);
  });


  it('requires the url for repository and provider sources', () => {
    for (const type of ['repository', 'provider']) {
      const finding = only(structuralFindings(baseManifest({ source: { type } })), 'CONDITIONAL_FIELD_REQUIRED');
      assert.equal(finding.path, '/source/url');
    }
  });

  it('requires a contractRef for A2A and OpenAPI interfaces', () => {
    const finding = only(structuralFindings(baseManifest({ interfaces: [{ type: 'a2a' }] })), 'CONDITIONAL_FIELD_REQUIRED');
    assert.equal(finding.path, '/interfaces/0/contractRef');
    assert.match(finding.message, /interfaces\[0\]\.type is 'a2a'/);
  });
});

describe('types, values, and formats', () => {
  it('explains that an unquoted schemaVersion is a number, without duplicate findings', () => {
    const findings = structuralFindings('schemaVersion: 0.1\n' + readExample('examples/valid/sql-review.capability.yaml').replace(/^schemaVersion: "0.1"\n/m, ''));
    const finding = only(findings, 'INVALID_TYPE');
    assert.equal(finding.path, '/schemaVersion');
    assert.match(finding.hint, /quoted/);
    assert.equal(findings.length, 1);
  });

  it('rejects null and explains that fields are omitted instead', () => {
    const manifest = baseManifest({ owner: { name: 'Test Team', contact: null, affiliation: 'internal' } });
    const finding = only(structuralFindings(manifest), 'INVALID_TYPE');
    assert.equal(finding.path, '/owner/contact');
    assert.match(finding.hint, /never use null/);
  });

  it('suggests the closest allowed value for a mistyped enumeration value', () => {
    const finding = only(structuralFindings(baseManifest({ capabilityType: 'mcp-server' })), 'INVALID_VALUE');
    assert.match(finding.hint, /Did you mean 'mcp_server'\?/);
    assert.match(finding.hint, /Allowed values: skill, agent/);
  });

  it('explains that a repository URL is not a capability id', () => {
    const finding = only(structuralFindings(baseManifest({ id: 'https://github.com/example-org/samples' })), 'INVALID_FORMAT');
    assert.equal(finding.path, '/id');
    assert.match(finding.hint, /source reference, not a capability identifier/);
  });

  it('enforces the namespaced, lowercase id convention', () => {
    for (const id of ['Sample-Skill', 'sample-skill', 'team/Sample', 'team/sample_skill', 'team//sample', '-team/sample', 'team/sample-', 'team./sample', 'team/sample.x']) {
      only(structuralFindings(baseManifest({ id })), 'INVALID_FORMAT');
    }
  });

  it('validates calendar dates, not only their shape', () => {
    for (const lastUpdated of ['2026-02-30', '19/10/2026', '2026-1-5']) {
      const finding = only(structuralFindings(baseManifest({ lastUpdated })), 'INVALID_FORMAT');
      assert.equal(finding.path, '/lastUpdated');
    }
  });

  it('requires Semantic Versioning for capabilityVersion', () => {
    for (const capabilityVersion of ['1.2', 'v1.2.3', '01.2.3']) {
      only(structuralFindings(baseManifest({ capabilityVersion })), 'INVALID_FORMAT');
    }
  });

  it('requires https URLs for sources and contracts', () => {
    const finding = only(structuralFindings(baseManifest({ source: { type: 'provider', url: 'http://vendor.example/docs' } })), 'INVALID_FORMAT');
    assert.equal(finding.path, '/source/url');
  });

  it('requires provenance to point at a field with a JSON Pointer', () => {
    const finding = only(structuralFindings(baseManifest({ provenance: [{ field: 'license', method: 'native', source: 'npm license' }] })), 'INVALID_FORMAT');
    assert.equal(finding.path, '/provenance/0/field');
  });

  it('lists the publication kinds for an unknown kind', () => {
    const finding = only(structuralFindings(baseManifest({ publications: [{ kind: 'npm', locator: 'pkg:npm/x' }] })), 'INVALID_VALUE');
    assert.match(finding.hint, /Allowed values: registry_entry, package, container_image/);
  });

  it('asks for a quoted repository id, so that YAML does not read it as a number', () => {
    const finding = only(structuralFindings(baseManifest({ source: { type: 'repository', url: 'https://github.com/example-org/samples', repositoryId: 952688112 } })), 'INVALID_TYPE');
    assert.equal(finding.path, '/source/repositoryId');
    assert.match(finding.hint, /quoted string/);
  });

  it('distinguishes an empty list that declares none from an empty list that is meaningless', () => {
    assert.deepEqual(structuralFindings(baseManifest({ dependencies: [], limitations: [] })), []);
    const finding = only(structuralFindings(baseManifest({ supportedUseCases: [] })), 'CONSTRAINT_VIOLATION');
    assert.match(finding.message, /at least 1 item/);
  });

  it('reports the line and column of the offending value', () => {
    const text = [
      'schemaVersion: "0.1"',
      'id: test-team/sample-skill',
      'name: Sample Skill',
      'description: A sample capability used by the automated tests.',
      'capabilityType: skill',
      'source: { type: repository, url: "https://github.com/example-org/samples" }',
      'owner: { name: Test Team, contact: test-team@example.com, affiliation: internal }',
      'lifecycleStatus: production',
      'riskTier: unassessed',
      'lastUpdated: "2026-10-01"',
    ].join('\n');
    const finding = only(structuralFindings(text), 'INVALID_VALUE');
    assert.deepEqual([finding.line, finding.column], [8, 18]);
  });
});

describe('extensibility policy', () => {
  it('accepts top-level x- extension fields', () => {
    assert.deepEqual(structuralFindings(baseManifest({ 'x-costCenter': 'CC-1', 'x-catalog.labels': ['a'] })), []);
  });

  it('rejects unknown fields and suggests the intended field for a misspelling', () => {
    const findings = structuralFindings(without(baseManifest({ lifecyleStatus: 'active' }), 'lifecycleStatus'));
    assert.deepEqual(codes(findings), ['UNKNOWN_FIELD']);
    assert.equal(findings[0].path, '/lifecyleStatus');
    assert.equal(findings[0].hint, "Did you mean 'lifecycleStatus'?");
  });

  it('points from a misspelled mandatory field to the missing one', () => {
    const findings = structuralFindings(without(baseManifest({ riskTeir: 'unassessed' }), 'riskTier'));
    assert.equal(only(findings, 'UNKNOWN_FIELD').hint, "Did you mean 'riskTier'?");
    assert.match(only(findings, 'MISSING_REQUIRED_FIELD').hint, /'riskTeir' looks like a misspelling/);
  });

  it('answers the names native formats use with the manifest field to use', () => {
    for (const [field, expected] of [['tags', 'keywords'], ['homepage', 'documentation'], ['version', 'capabilityVersion'], ['author', 'owner'], ['repository', 'source']]) {
      const finding = only(structuralFindings(baseManifest({ [field]: 'x' })), 'UNKNOWN_FIELD');
      assert.equal(finding.hint, `Use '${expected}': it holds what native formats call '${field}'.`);
    }
  });

  it('suggests an x- extension for unknown top-level fields that are neither misspellings nor native names', () => {
    const finding = only(structuralFindings(baseManifest({ region: 'eu-west' })), 'UNKNOWN_FIELD');
    assert.match(finding.hint, /'x-region'/);
  });

  it('keeps nested objects closed, without extension fields', () => {
    const manifest = baseManifest({ owner: { name: 'Test Team', contact: 'a@example.com', affiliation: 'internal', 'x-slack': '#team' } });
    const finding = only(structuralFindings(manifest), 'UNKNOWN_FIELD');
    assert.equal(finding.path, '/owner/x-slack');
    assert.match(finding.hint, /Fields allowed in 'owner': name, contact, affiliation/);
  });
});

describe('schema versions', () => {
  it('rejects a well-formed but unsupported schemaVersion explicitly and stops', () => {
    for (const schemaVersion of ['0.2', '2.0']) {
      const result = validateManifestText(`schemaVersion: "${schemaVersion}"\nunknownField: true\n`);
      assert.deepEqual(codes(result.findings), ['SCHEMA_VERSION_UNSUPPORTED']);
      assert.equal(result.validatedAgainst, null);
      assert.match(result.findings[0].message, /supported: 0\.1\)/);
    }
  });

  it('routes a manifest to the schema of its declared version', () => {
    assert.equal(validateManifestText(toYaml(baseManifest())).validatedAgainst, '0.1');
  });

  it('validates a malformed schemaVersion against the latest schema and reports it', () => {
    const result = validateManifestText('schemaVersion: "0.1.0"\nid: test-team/sample-skill\n');
    assert.equal(result.validatedAgainst, '0.1');
    const finding = result.findings.find((f) => f.path === '/schemaVersion');
    assert.equal(finding.code, 'INVALID_VALUE');
    assert.match(finding.hint, /patch versions/);
  });

  it('still reports other problems when schemaVersion is missing', () => {
    const findings = structuralFindings(without(baseManifest({ capabilityType: 'robot' }), 'schemaVersion'));
    assert.deepEqual(codes(findings).sort(), ['INVALID_VALUE', 'MISSING_REQUIRED_FIELD']);
  });
});

describe('manifest syntax', () => {
  it('reports YAML syntax errors with their position', () => {
    const finding = only(structuralFindings('id: [unclosed\nname: x\n'), 'YAML_SYNTAX_ERROR');
    assert.ok(finding.line >= 1);
  });

  it('rejects duplicate keys instead of silently keeping the last one', () => {
    const finding = only(structuralFindings('riskTier: low\nriskTier: unassessed\n'), 'DUPLICATE_KEY');
    assert.equal(finding.line, 2);
  });

  it('accepts one manifest per file only', () => {
    only(structuralFindings('id: a/b\n---\nid: c/d\n'), 'YAML_SYNTAX_ERROR');
  });

  it('rejects documents that are not a mapping', () => {
    for (const text of ['- id: a/b\n', 'just text\n', '']) {
      only(structuralFindings(text), 'NOT_A_MAPPING');
    }
  });
});

describe('maturity, audience, platform, and cost metadata', () => {
  it('accepts the optional fields and the framework and platform types', () => {
    const manifest = baseManifest({
      capabilityType: 'platform',
      maturity: 'production',
      intendedAudience: ['data analysts'],
      platformCompatibility: ['linux', 'github-actions'],
      costInformation: { model: 'usage_based', url: 'https://pricing.example.com/llm-gateway' },
    });
    assert.deepEqual(structuralFindings(manifest), []);
  });

  it('lists the maturity levels for an unknown value', () => {
    const finding = only(structuralFindings(baseManifest({ maturity: 'ga' })), 'INVALID_VALUE');
    assert.match(finding.hint, /Allowed values: prototype, pilot, production/);
  });

  it("requires details for an 'other' cost model", () => {
    const finding = only(structuralFindings(baseManifest({ costInformation: { model: 'other' } })), 'CONDITIONAL_FIELD_REQUIRED');
    assert.equal(finding.path, '/costInformation/details');
  });

  it('requires lowercase kebab-case platform tokens without duplicates', () => {
    only(structuralFindings(baseManifest({ platformCompatibility: ['VS Code'] })), 'INVALID_FORMAT');
    const duplicate = only(structuralFindings(baseManifest({ platformCompatibility: ['linux', 'linux'] })), 'CONSTRAINT_VIOLATION');
    assert.match(duplicate.message, /duplicate items/);
  });
});

describe('newer schema versions', () => {
  // A hypothetical next version that adds a field and a capability type, registered next to 0.1.
  const v01 = getRegistry().get('0.1');
  const next = structuredClone(v01.schema);
  next.$id = next.$id.replace('/0.1/', '/0.2/');
  next.properties.schemaVersion.const = '0.2';
  next.properties.techStack = { type: 'array', items: { type: 'string' }, description: 'Technologies the capability is built with.' };
  next.properties.capabilityType.enum.push('dataset');
  const entries = { '0.1': v01, '0.2': { version: '0.2', schema: next, validate: createAjv().compile(next) } };
  const twoVersions = { versions: ['0.1', '0.2'], latest: '0.2', get: (version) => entries[version] };

  it('tells the author which schema version defines a field or value from a newer version', () => {
    const field = only(validateStructure(baseManifest({ techStack: ['python'] }), twoVersions).findings, 'UNKNOWN_FIELD');
    assert.equal(field.hint, "'techStack' is defined from schema 0.2; declare schemaVersion: \"0.2\" to use it.");
    const value = only(validateStructure(baseManifest({ capabilityType: 'dataset' }), twoVersions).findings, 'INVALID_VALUE');
    assert.match(value.hint, /^'dataset' is defined from schema 0\.2/);
  });

  it('routes each manifest to the schema of its own declared version', () => {
    assert.equal(validateStructure(baseManifest(), twoVersions).validatedAgainst, '0.1');
    assert.equal(validateStructure(baseManifest({ schemaVersion: '0.2', techStack: ['python'] }), twoVersions).validatedAgainst, '0.2');
  });
});

describe('YAML portability', () => {
  const sqlReview = readExample('examples/valid/sql-review.capability.yaml');

  it('warns about unquoted dates that YAML 1.1 parsers read as dates, without invalidating the manifest', () => {
    const result = validateManifestText(sqlReview.replace('lastUpdated: "2026-10-12"', 'lastUpdated: 2026-10-12'));
    assert.deepEqual(codes(result.findings), ['YAML_PORTABILITY']);
    const [warning] = result.findings;
    assert.equal(warning.severity, 'warning');
    assert.equal(warning.path, '/lastUpdated');
    assert.match(warning.message, /a date in YAML 1\.1/);
    assert.equal(warning.hint, 'Quote the value: "2026-10-12".');
  });

  it('warns about unquoted yes/no/on/off values, including inside lists', () => {
    const result = validateManifestText(`${sqlReview}x-review:\n  flags: [on, "off"]\n`);
    const [warning] = result.findings;
    assert.equal(result.findings.length, 1);
    assert.equal(warning.path, '/x-review/flags/0');
    assert.match(warning.message, /a boolean in YAML 1\.1/);
  });

  it('does not warn about quoted values', () => {
    assert.deepEqual(validateManifestText(sqlReview).findings, []);
  });
});
