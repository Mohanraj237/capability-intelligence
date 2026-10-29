// Compatibility between two revisions of one capability: identity, lifecycle, and versioning.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { compareManifestFiles, compareManifests } from '../src/compatibility.js';
import { baseManifest, codes } from './helpers.js';

const v1 = baseManifest({
  capabilityVersion: '1.3.0',
  supportedUseCases: [{ title: 'Review SQL' }, { title: 'Check data-access policy' }],
  interfaces: [{ type: 'agent_skill' }, { type: 'cli' }],
});
const revise = (changes) => ({ ...structuredClone(v1), ...changes });

describe('example revisions', () => {
  it('accepts the compatible revision: additive changes with a MINOR bump, source relocated, id stable', () => {
    const result = compareManifestFiles('examples/valid/sql-review.capability.yaml', 'examples/compatibility/sql-review.1.4.0-compatible.capability.yaml');
    assert.equal(result.ok, true);
    assert.equal(result.backwardCompatible, true);
    assert.equal(result.requiredBump, 'minor');
    assert.equal(result.actualBump, 'minor');
    assert.equal(result.identity, 'stable');
    assert.ok(codes(result.changes).includes('SOURCE_RELOCATED'));
    assert.deepEqual(result.findings, []);
  });

  it('rejects the breaking revision: MAJOR bump missing and lifecycle transition not allowed', () => {
    const result = compareManifestFiles('examples/valid/sql-review.capability.yaml', 'examples/compatibility/sql-review.1.4.0-breaking.capability.yaml');
    assert.equal(result.ok, false);
    assert.equal(result.backwardCompatible, false);
    assert.equal(result.requiredBump, 'major');
    assert.deepEqual(codes(result.findings).sort(), ['INSUFFICIENT_VERSION_BUMP', 'LIFECYCLE_TRANSITION_NOT_ALLOWED']);
    assert.match(result.findings.find((f) => f.code === 'INSUFFICIENT_VERSION_BUMP').hint, /2\.0\.0/);
  });

  it('does not compare revisions that fail structural validation', () => {
    const result = compareManifestFiles('examples/valid/sql-review.capability.yaml', 'examples/invalid/missing-mandatory-field.capability.yaml');
    assert.equal(result.ok, false);
    assert.equal(result.comparable, false);
    assert.ok(result.findings.every((finding) => finding.stage === 'structural'));
  });
});

describe('change classification and version bumps', () => {
  it('accepts a breaking change released as a new MAJOR version', () => {
    const result = compareManifests(v1, revise({ capabilityVersion: '2.0.0', interfaces: [{ type: 'agent_skill' }] }));
    assert.equal(result.ok, true);
    assert.equal(result.backwardCompatible, false);
    assert.equal(result.versioning, 'consistent');
  });

  it('accepts a pre-release of the next MAJOR version for a breaking change', () => {
    const result = compareManifests(v1, revise({ capabilityVersion: '2.0.0-rc.1', capabilityType: 'tool' }));
    assert.equal(result.ok, true);
    assert.equal(result.actualBump, 'major');
  });

  it('requires a MINOR bump for additive changes', () => {
    const added = { supportedUseCases: [...v1.supportedUseCases, { title: 'Explain query plans' }] };
    assert.equal(compareManifests(v1, revise({ ...added, capabilityVersion: '1.3.1' })).ok, false);
    assert.equal(compareManifests(v1, revise({ ...added, capabilityVersion: '1.4.0' })).ok, true);
  });

  it('requires no bump for metadata-only changes', () => {
    const result = compareManifests(v1, revise({ description: 'A clearer description of the same capability.', owner: { ...v1.owner, name: 'New Team' } }));
    assert.equal(result.ok, true);
    assert.equal(result.requiredBump, 'none');
    assert.deepEqual(codes(result.changes).sort(), ['METADATA_UPDATED', 'OWNER_CHANGED']);
  });

  it('reports changes to fields without an explicit rule, such as maturity and extensions, as metadata', () => {
    const previous = revise({ maturity: 'pilot', 'x-costCenter': 'CC-1' });
    const result = compareManifests(previous, { ...structuredClone(previous), maturity: 'production', 'x-costCenter': 'CC-2' });
    assert.deepEqual(result.changes.map((change) => change.path).sort(), ['/maturity', '/x-costCenter']);
    assert.equal(result.requiredBump, 'none');
  });

  it('treats reordered keys as no change', () => {
    const reordered = Object.fromEntries(Object.entries(structuredClone(v1)).reverse());
    reordered.owner = { affiliation: v1.owner.affiliation, contact: v1.owner.contact, name: v1.owner.name };
    assert.deepEqual(compareManifests(v1, reordered).changes, []);
  });

  it('downgrades an insufficient bump to a warning below 1.0.0, as SemVer makes no promise for 0.y.z', () => {
    const v0 = revise({ capabilityVersion: '0.4.0' });
    const result = compareManifests(v0, { ...structuredClone(v0), capabilityVersion: '0.4.1', interfaces: [{ type: 'cli' }] });
    assert.equal(result.ok, true);
    assert.equal(result.findings[0].severity, 'warning');
  });

  it('rejects a decreasing capabilityVersion', () => {
    assert.deepEqual(codes(compareManifests(v1, revise({ capabilityVersion: '1.2.9' })).findings), ['VERSION_DECREASED']);
  });

  it('reports the version check as unverified when capabilityVersion is not declared', () => {
    const previous = baseManifest();
    const result = compareManifests(previous, { ...previous, interfaces: [{ type: 'cli' }] });
    assert.equal(result.versioning, 'unverified');
    assert.equal(result.findings[0].severity, 'unverified');
  });
});

describe('identity and lifecycle', () => {
  it('rejects a changed id', () => {
    const result = compareManifests(v1, revise({ id: 'test-team/renamed-skill' }));
    assert.equal(result.identity, 'changed');
    assert.deepEqual(codes(result.findings), ['IDENTITY_CHANGED']);
  });

  it('enforces the proposed lifecycle transitions for every pair of states', () => {
    const allowed = new Set([
      'experimental>active', 'experimental>deprecated', 'experimental>retired',
      'active>deprecated',
      'deprecated>active', 'deprecated>retired',
    ]);
    const states = ['experimental', 'active', 'deprecated', 'retired'];
    const withState = (lifecycleStatus) => revise({
      lifecycleStatus,
      ...(['deprecated', 'retired'].includes(lifecycleStatus) ? { deprecation: { reason: 'Superseded by another capability.' } } : {}),
    });

    for (const from of states) {
      for (const to of states.filter((state) => state !== from)) {
        const result = compareManifests(withState(from), withState(to));
        assert.equal(result.lifecycle === 'allowed', allowed.has(`${from}>${to}`), `${from} -> ${to}`);
      }
    }
  });
});
