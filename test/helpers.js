import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { validateManifests, validateManifestText } from '../src/validator.js';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));

// A manifest that satisfies every mandatory field and no conditional rule, with the optional
// owner, lifecycle status, and date that most manifests carry. Each id gets its own path in a
// shared monorepo, so different ids never share a source location by accident.
export function baseManifest(overrides = {}) {
  const id = overrides.id ?? 'test-team/sample-skill';
  const pathSegment = (id.split('/').at(-1) || 'sample').replace(/[^A-Za-z0-9._-]/g, '-');
  return {
    schemaVersion: '0.1',
    id,
    name: 'Sample Skill',
    description: 'A sample capability used by the automated tests.',
    capabilityType: 'skill',
    source: { type: 'repository', url: 'https://github.com/example-org/samples', path: `skills/${pathSegment}` },
    owner: { name: 'Test Team', contact: 'test-team@example.com', affiliation: 'internal' },
    lifecycleStatus: 'active',
    riskTier: 'unassessed',
    lastUpdated: '2026-10-01',
    ...overrides,
  };
}

// Only the mandatory fields.
export function minimalManifest(overrides = {}) {
  const { description, owner, lifecycleStatus, lastUpdated, ...mandatory } = baseManifest();
  return { ...mandatory, ...overrides };
}

// States every fact of every completeness level below 'governed' (the base manifest's riskTier
// is 'unassessed'), so it reaches 'adoptable'.
export function adoptableManifest(overrides = {}) {
  return baseManifest({
    interfaces: [{ type: 'agent_skill' }],
    runtime: [{ kind: 'agent_host' }],
    license: { expression: 'Apache-2.0' },
    capabilityVersion: '1.0.0',
    setup: [],
    limitations: [],
    ...overrides,
  });
}

export function without(manifest, ...fields) {
  const copy = structuredClone(manifest);
  for (const field of fields) delete copy[field];
  return copy;
}

// Quotes string values, as the authoring guideline recommends, so that values such as dates are
// read identically by YAML 1.1 and YAML 1.2 parsers.
export function toYaml(manifest) {
  return stringify(manifest, { defaultStringType: 'QUOTE_DOUBLE', defaultKeyType: 'PLAIN' });
}

// Stage 1 only.
export function structuralFindings(manifestOrText) {
  const text = typeof manifestOrText === 'string' ? manifestOrText : toYaml(manifestOrText);
  return validateManifestText(text).findings;
}

// Stage 1 + Stage 2 over several manifests, with a fixed "today" for deterministic date checks.
export function validateAll(manifests, options = {}) {
  return validateManifests(
    manifests.map((manifest, i) => ({ file: `manifest-${i}.yaml`, text: toYaml(manifest) })),
    { today: '2026-10-19', ...options },
  );
}

export function codes(findings) {
  return findings.map((finding) => finding.code);
}

export function readExample(relativePath) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}
