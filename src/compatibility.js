// Compatibility check between two revisions of the same capability's manifest.
//
// Classifies each change by its impact on consumers (POC proposal, see docs/manifest-spec.md):
//   breaking - something consumers may rely on was removed or reclassified -> MAJOR bump
//   additive - something new was added                                      -> MINOR bump
//   metadata - descriptive, ownership, source, risk, or lifecycle metadata  -> no bump required
// Then verifies identity stability, the lifecycle transition, and the capabilityVersion bump.

import { readFileSync } from 'node:fs';
import semver from 'semver';
import { getRegistry, hasErrors, validateManifestText } from './validator.js';

const BUMP_RANK = { none: 0, prerelease: 1, patch: 1, minor: 2, major: 3 };

// Collections compared by key; the impact of removing, adding, or updating an element.
const COLLECTIONS = [
  { field: 'interfaces', noun: 'interface', keyOf: (item) => item.type, impacts: { removed: 'breaking', added: 'additive', updated: 'metadata' } },
  { field: 'supportedUseCases', noun: 'use case', keyOf: (item) => item.title.trim().toLowerCase(), impacts: { removed: 'breaking', added: 'additive' } },
  { field: 'components', noun: 'component', keyOf: (item) => item.id, impacts: { removed: 'breaking', added: 'additive' } },
  { field: 'embeddedComponents', noun: 'embedded component', keyOf: (item) => `${item.type}:${item.name}`, impacts: { removed: 'breaking', added: 'additive', updated: 'metadata' } },
  { field: 'dependencies', noun: 'dependency', keyOf: (item) => item.id, impacts: { removed: 'metadata', added: 'additive' } },
];

const DESCRIPTIVE_FIELDS = ['name', 'description', 'limitations', 'parent', 'deprecation', 'assessmentReference'];

// Fields classified explicitly above or checked separately. Any other top-level field (fields
// added by newer schema versions, x- extensions) is compared generically as metadata.
const HANDLED_FIELDS = new Set([
  'schemaVersion', 'id', 'capabilityType', 'capabilityVersion', 'source', 'owner', 'riskTier', 'lifecycleStatus', 'lastUpdated',
  ...DESCRIPTIVE_FIELDS,
  ...COLLECTIONS.map((collection) => collection.field),
]);

export function compareManifestFiles(previousFile, nextFile, options = {}) {
  const registry = options.registry ?? getRegistry();
  const revisions = [previousFile, nextFile].map((file) =>
    validateManifestText(readFileSync(file, 'utf8'), { file, registry }),
  );
  const structuralFindings = revisions.flatMap((revision) =>
    revision.findings.map((finding) => ({ ...finding, file: revision.file })),
  );
  if (hasErrors(structuralFindings)) {
    // Comparing manifests that do not satisfy the contract would be meaningless.
    return { ok: false, previousFile, nextFile, comparable: false, changes: [], findings: structuralFindings };
  }
  return { previousFile, nextFile, ...compareManifests(revisions[0].manifest, revisions[1].manifest, { registry }) };
}

export function compareManifests(previous, next, { registry = getRegistry() } = {}) {
  const findings = [];
  const problem = (severity, check, code, path, message, hint) =>
    findings.push({ severity, stage: 'compatibility', check, code, path, message, hint });

  const changes = detectChanges(previous, next);
  if (previous.id !== next.id) {
    problem('error', 'identity', 'IDENTITY_CHANGED', '/id',
      `id changed from '${previous.id}' to '${next.id}'. A capability's id must never change, even when it is renamed or moved.`,
      'Restore the original id. If this is a different capability, give it its own manifest and deprecate the old one with deprecation.replacedBy.');
  }
  const lifecycle = checkLifecycle(previous, next, registry, changes, problem);
  const requiredBump = requiredBumpFor(changes);
  const versioning = checkVersionBump(previous.capabilityVersion, next.capabilityVersion, requiredBump, changes, problem);

  return {
    ok: !findings.some((f) => f.severity === 'error'),
    comparable: true,
    previousVersion: previous.capabilityVersion ?? null,
    nextVersion: next.capabilityVersion ?? null,
    backwardCompatible: !changes.some((c) => c.impact === 'breaking'),
    requiredBump,
    actualBump: versioning.actualBump,
    versioning: versioning.status,
    lifecycle,
    identity: previous.id === next.id ? 'stable' : 'changed',
    changes,
    findings,
  };
}

function detectChanges(previous, next) {
  const changes = [];
  const change = (impact, code, path, message) => changes.push({ impact, code, path, message });

  if (previous.capabilityType !== next.capabilityType) {
    change('breaking', 'CAPABILITY_TYPE_CHANGED', '/capabilityType',
      `capabilityType changed from '${previous.capabilityType}' to '${next.capabilityType}'.`);
  }
  for (const collection of COLLECTIONS) compareCollection(change, collection, previous[collection.field], next[collection.field]);

  if (!sameJson(previous.source, next.source)) {
    change('metadata', 'SOURCE_RELOCATED', '/source', 'source changed; the id is unchanged, so references to this capability remain valid.');
  }
  if (!sameJson(previous.owner, next.owner)) {
    const ownerName = (manifest) => (manifest.owner ? `'${manifest.owner.name}'` : 'not provided');
    change('metadata', 'OWNER_CHANGED', '/owner', `owner changed from ${ownerName(previous)} to ${ownerName(next)}.`);
  }
  if (previous.riskTier !== next.riskTier) {
    change('metadata', 'RISK_TIER_CHANGED', '/riskTier', `riskTier changed from '${previous.riskTier}' to '${next.riskTier}'.`);
  }
  for (const field of DESCRIPTIVE_FIELDS) {
    if (!sameJson(previous[field], next[field])) change('metadata', 'METADATA_UPDATED', `/${field}`, `${field} changed.`);
  }
  for (const field of new Set([...Object.keys(previous), ...Object.keys(next)])) {
    if (!HANDLED_FIELDS.has(field) && !sameJson(previous[field], next[field])) {
      change('metadata', 'METADATA_UPDATED', `/${field}`, `${field} changed.`);
    }
  }
  if (previous.schemaVersion !== next.schemaVersion) {
    change('metadata', 'SCHEMA_VERSION_CHANGED', '/schemaVersion', `schemaVersion changed from ${previous.schemaVersion} to ${next.schemaVersion}.`);
  }
  return changes;
}

function compareCollection(change, { field, noun, keyOf, impacts }, previousItems, nextItems) {
  const previousByKey = new Map((previousItems ?? []).map((item) => [keyOf(item), item]));
  const nextByKey = new Map((nextItems ?? []).map((item) => [keyOf(item), item]));
  const label = (item) => item.id ?? item.title ?? item.name ?? item.type;
  const code = (verb) => `${noun.toUpperCase().replaceAll(' ', '_')}_${verb}`;
  const path = `/${field}`;

  for (const [key, item] of previousByKey) {
    if (!nextByKey.has(key)) change(impacts.removed, code('REMOVED'), path, `${noun} '${label(item)}' was removed.`);
    else if (impacts.updated && !sameJson(item, nextByKey.get(key))) change(impacts.updated, code('UPDATED'), path, `${noun} '${label(item)}' was updated.`);
  }
  for (const [key, item] of nextByKey) {
    if (!previousByKey.has(key)) change(impacts.added, code('ADDED'), path, `${noun} '${label(item)}' was added.`);
  }
}

// Allowed transitions come from the schema's x-lifecycleTransitions annotation. They govern the
// owner's declared lifecycleStatus only. A first declaration is always allowed; withdrawing a
// declaration is a warning, because consumers lose the status they relied on.
function checkLifecycle(previous, next, registry, changes, problem) {
  if (previous.lifecycleStatus === next.lifecycleStatus) return 'unchanged';
  if (previous.lifecycleStatus === undefined) {
    changes.push({ impact: 'metadata', code: 'LIFECYCLE_CHANGED', path: '/lifecycleStatus', message: `lifecycleStatus declared as '${next.lifecycleStatus}'.` });
    return 'allowed';
  }
  if (next.lifecycleStatus === undefined) {
    problem('warning', 'lifecycle', 'LIFECYCLE_STATUS_REMOVED', '/lifecycleStatus',
      `lifecycleStatus '${previous.lifecycleStatus}' was removed; consumers can no longer see the declared status.`,
      'Keep lifecycleStatus and change it through an allowed transition instead.');
    return 'removed';
  }

  const transitions = registry.get(next.schemaVersion).schema.properties.lifecycleStatus['x-lifecycleTransitions'];
  const allowed = transitions[previous.lifecycleStatus] ?? [];
  if (allowed.includes(next.lifecycleStatus)) {
    changes.push({
      impact: 'metadata',
      code: 'LIFECYCLE_CHANGED',
      path: '/lifecycleStatus',
      message: `lifecycleStatus changed from '${previous.lifecycleStatus}' to '${next.lifecycleStatus}'.`,
    });
    return 'allowed';
  }
  problem('error', 'lifecycle', 'LIFECYCLE_TRANSITION_NOT_ALLOWED', '/lifecycleStatus',
    `lifecycleStatus cannot change from '${previous.lifecycleStatus}' to '${next.lifecycleStatus}'.`,
    `Allowed transitions from '${previous.lifecycleStatus}': ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}.`);
  return 'not_allowed';
}

function requiredBumpFor(changes) {
  if (changes.some((c) => c.impact === 'breaking')) return 'major';
  if (changes.some((c) => c.impact === 'additive')) return 'minor';
  return 'none';
}

function checkVersionBump(previousVersion, nextVersion, requiredBump, changes, problem) {
  if (!previousVersion || !nextVersion) {
    if (requiredBump === 'none') return { status: 'consistent', actualBump: null };
    problem('unverified', 'versioning', 'VERSION_NOT_COMPARABLE', '/capabilityVersion',
      `capabilityVersion is not declared in both revisions, so the required ${requiredBump.toUpperCase()} bump cannot be verified.`,
      'Declare capabilityVersion in both revisions to enable version checks.');
    return { status: 'unverified', actualBump: null };
  }

  if (semver.lt(nextVersion, previousVersion)) {
    problem('error', 'versioning', 'VERSION_DECREASED', '/capabilityVersion',
      `capabilityVersion decreased from ${previousVersion} to ${nextVersion}.`,
      'Versions must increase; publish the change under a higher version.');
    return { status: 'inconsistent', actualBump: 'decrease' };
  }

  const actualBump = bumpLevel(previousVersion, nextVersion);
  if (BUMP_RANK[actualBump] >= BUMP_RANK[requiredBump]) return { status: 'consistent', actualBump };

  const drivingImpact = requiredBump === 'major' ? 'breaking' : 'additive';
  const reasons = [...new Set(changes.filter((c) => c.impact === drivingImpact).map((c) => c.code))];
  const expected = semver.inc(previousVersion, requiredBump);
  const message = `${reasons.join(', ')} require a ${requiredBump.toUpperCase()} version bump, ` +
    `but capabilityVersion changed from ${previousVersion} to ${nextVersion} (${actualBump}).`;

  if (semver.major(previousVersion) === 0) {
    problem('warning', 'versioning', 'INSUFFICIENT_VERSION_BUMP', '/capabilityVersion',
      `${message} SemVer makes no compatibility promise for 0.y.z versions, so this is a warning until 1.0.0.`,
      `Prefer capabilityVersion ${expected} or later.`);
    return { status: 'consistent', actualBump };
  }
  problem('error', 'versioning', 'INSUFFICIENT_VERSION_BUMP', '/capabilityVersion', message,
    `Set capabilityVersion to ${expected} or later, or restore what was removed.`);
  return { status: 'inconsistent', actualBump };
}

function bumpLevel(previousVersion, nextVersion) {
  const a = semver.parse(previousVersion);
  const b = semver.parse(nextVersion);
  if (b.major !== a.major) return 'major';
  if (b.minor !== a.minor) return 'minor';
  if (b.patch !== a.patch) return 'patch';
  return semver.eq(a, b) ? 'none' : 'prerelease';
}

// Structural equality that ignores object key order (YAML authors reorder keys freely).
function sameJson(a, b) {
  return JSON.stringify(canonical(a ?? null)) === JSON.stringify(canonical(b ?? null));
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort((a, b) => a.localeCompare(b)).map((key) => [key, canonical(value[key])]));
}
