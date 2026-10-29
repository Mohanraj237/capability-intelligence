// Stage 2 - consistency checks across the manifests validated together.
//
// Runs only on structurally valid manifests. Distinguishes errors, warnings, and unverified
// checks: anything that cannot be confirmed from the manifests at hand (references outside
// the validated set, source reachability, risk assessment, claimed relations, license terms in
// prose, heuristic values) is reported as unverified, never as passed.

import { getAt, toTokens } from './json-pointer.js';

const SOURCE_CHECK_TIMEOUT_MS = 5000;

// Publication statuses that contradict a declared 'experimental' or 'active' lifecycle.
const INACTIVE_STATUSES = new Set(['deprecated', 'deleted', 'archived', 'yanked']);
// Version schemes whose versions are worth comparing across publications.
const COMPARABLE_SCHEMES = new Set(['semver', 'pep440', 'calver']);

/**
 * @param {Array<{ manifest: object, findings: object[], locate: Function }>} entries
 * @param {{ checkSources?: boolean, fetch?: typeof fetch, today?: string }} [options]
 *   today: ISO date used for date checks (defaults to the current UTC date).
 */
export async function checkConsistency(entries, options = {}) {
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const byId = groupBy(entries, (entry) => entry.manifest.id);

  for (const entry of entries) {
    checkDuplicateId(entry, byId);
    checkReferences(entry, byId);
    checkRelations(entry);
    checkDates(entry, today);
    checkLifecycleSignals(entry);
    checkVersions(entry);
    checkLicense(entry);
    checkProvenance(entry);
    checkRisk(entry);
  }
  checkSharedLocations(entries, (entry) => sourceKeys(entry.manifest.source).map((key) => ({ key, path: '/source' })), (entry, others) =>
    add(entry, 'warning', 'identity', 'DUPLICATE_SOURCE', '/source',
      `The same source location is registered under several ids: ${[entry.manifest.id, ...others].join(', ')}.`,
      'Several capabilities in one repository need distinct source.path values; otherwise this may be a duplicate registration of one capability.',
      { related: others }));
  checkSharedLocations(entries, (entry) => (entry.manifest.publications ?? []).map((publication, i) => ({ key: locatorKey(publication.locator), path: `/publications/${i}` })), (entry, others, path, key) =>
    add(entry, 'warning', 'identity', 'DUPLICATE_PUBLICATION', path,
      `Publication '${key}' is also listed by: ${others.join(', ')}. One capability may be registered more than once.`,
      'If they are the same capability, keep one manifest and list every publication in it; if not, correct the locator.',
      { related: others }));

  await Promise.all(
    entries.map((entry) => (options.checkSources ? checkSourceReachability(entry, options.fetch ?? fetch) : markSourceUnchecked(entry))),
  );
}

function checkDuplicateId(entry, byId) {
  const owners = byId.get(entry.manifest.id);
  if (owners.length < 2) return;
  const others = owners.filter((other) => other !== entry).map((other) => other.file);
  add(entry, 'error', 'identity', 'DUPLICATE_ID', '/id',
    `Capability id '${entry.manifest.id}' is also declared by: ${others.join(', ')}.`,
    'Capability ids must be unique. If this is a different capability, assign it a new id; if it is the same capability, keep a single manifest.');
}

// Locations (source keys, publication locators) that manifests with different ids share. Calls
// warn(entry, otherIds, path, key) once per manifest and path, with the ids of every other
// manifest that shares any of that path's keys.
function checkSharedLocations(entries, locationsOf, warn) {
  const byKey = new Map();
  for (const entry of entries) {
    for (const { key, path } of locationsOf(entry)) {
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({ entry, path });
    }
  }
  const shared = new Map();
  for (const [key, uses] of byKey) {
    const ids = new Set(uses.map((use) => use.entry.manifest.id));
    if (ids.size < 2) continue;
    for (const { entry, path } of uses) {
      if (!shared.has(entry)) shared.set(entry, new Map());
      const byPath = shared.get(entry);
      if (!byPath.has(path)) byPath.set(path, { key, others: new Set() });
      for (const id of ids) if (id !== entry.manifest.id) byPath.get(path).others.add(id);
    }
  }
  for (const [entry, byPath] of shared) {
    for (const [path, { key, others }] of byPath) warn(entry, [...others].sort((a, b) => a.localeCompare(b)), path, key);
  }
}

function checkReferences(entry, byId) {
  const { manifest } = entry;
  const references = [
    ...(manifest.dependencies ?? []).map((ref, i) => ({ id: ref.id, path: `/dependencies/${i}/id`, relation: 'dependency', lifecycle: true })),
    ...(manifest.components ?? []).map((ref, i) => ({ id: ref.id, path: `/components/${i}/id`, relation: 'component', lifecycle: true })),
    ...(manifest.parent ? [{ id: manifest.parent.id, path: '/parent/id', relation: 'parent', lifecycle: true }] : []),
    ...(manifest.deprecation?.replacedBy ? [{ id: manifest.deprecation.replacedBy, path: '/deprecation/replacedBy', relation: 'replacement', lifecycle: true }] : []),
    // A wrapper stands or falls with what it wraps; forks, derivatives, and look-alikes do not.
    ...(manifest.relations ?? []).flatMap((relation, i) => (relation.id
      ? [{ id: relation.id, path: `/relations/${i}/id`, relation: `${relation.type} target`, lifecycle: relation.type === 'wraps' }]
      : [])),
  ];

  for (const reference of references) {
    if (reference.id === manifest.id) {
      add(entry, 'error', 'references', 'SELF_REFERENCE', reference.path,
        `The ${reference.relation} reference points to the capability itself ('${manifest.id}').`,
        'Reference a different capability or remove the reference.');
      continue;
    }

    const targets = byId.get(reference.id);
    if (!targets) {
      add(entry, 'unverified', 'references', 'UNRESOLVED_REFERENCE', reference.path,
        `Referenced ${reference.relation} '${reference.id}' is not among the manifests validated in this run, so its existence was not verified.`,
        'Validate it together with the manifest that declares this id, or confirm it exists in the capability inventory.');
      continue;
    }

    const target = targets[0].manifest;
    if (reference.lifecycle && (target.lifecycleStatus === 'retired' || target.lifecycleStatus === 'deprecated')) {
      add(entry, 'warning', 'references', target.lifecycleStatus === 'retired' ? 'REFERENCE_TO_RETIRED' : 'REFERENCE_TO_DEPRECATED', reference.path,
        `Referenced ${reference.relation} '${reference.id}' is ${target.lifecycleStatus}.`,
        target.deprecation?.replacedBy
          ? `Consider referencing its replacement '${target.deprecation.replacedBy}'.`
          : 'Plan to remove or replace this reference.');
    }

    if (reference.relation === 'parent' && !(target.components ?? []).some((ref) => ref.id === manifest.id)) {
      add(entry, 'warning', 'references', 'PARENT_CHILD_MISMATCH', reference.path,
        `Parent '${reference.id}' does not list '${manifest.id}' in its components.`,
        `Add '- id: ${manifest.id}' to the components of '${reference.id}', or remove the parent reference.`);
    }
    if (reference.relation === 'component' && target.parent?.id !== manifest.id) {
      add(entry, 'warning', 'references', 'PARENT_CHILD_MISMATCH', reference.path,
        `Component '${reference.id}' does not declare '${manifest.id}' as its parent.`,
        `Add 'parent: { id: ${manifest.id} }' to the manifest of '${reference.id}', or remove it from components.`);
    }
  }
}

// A relation that is only claimed ("fork of official Playwright MCP") is reported, not trusted.
function checkRelations(entry) {
  (entry.manifest.relations ?? []).forEach((relation, i) => {
    if (relation.verified === true) return;
    const evidence = relation.evidence ? ` (evidence: ${relation.evidence})` : '';
    add(entry, 'unverified', 'references', 'RELATION_UNVERIFIED', `/relations/${i}`,
      `The ${relation.type} relation to '${relation.id ?? relation.locator}' is claimed but not verified${evidence}.`,
      "Confirm it, for example from the forge's fork record or with the related capability's owner, then set verified: true.");
  });
}

function checkDates(entry, today) {
  const { manifest } = entry;
  const dates = [
    ...(manifest.lastUpdated ? [{ path: '/lastUpdated', date: manifest.lastUpdated, hint: 'Use the date on which the manifest metadata was actually last changed.' }] : []),
    ...(manifest.source.updatedAt ? [{ path: '/source/updatedAt', date: manifest.source.updatedAt, hint: 'Use the date of the latest change that the source reports.' }] : []),
    ...(manifest.publications ?? []).flatMap((publication, i) => (publication.updatedAt ? [{ path: `/publications/${i}/updatedAt`, date: publication.updatedAt, hint: 'Use the date the channel reports for its latest update.' }] : [])),
    ...(manifest.provenance ?? []).flatMap((item, i) => (item.observedAt ? [{ path: `/provenance/${i}/observedAt`, date: item.observedAt, hint: 'Use the date on which the value was read or declared.' }] : [])),
  ];
  for (const { path, date, hint } of dates) {
    if (date > today) add(entry, 'warning', 'metadata', 'DATE_IN_FUTURE', path, `${path.slice(1).replaceAll('/', '.')} (${date}) is later than today (${today}).`, hint);
  }
  if (manifest.deprecation && (manifest.lifecycleStatus === 'experimental' || manifest.lifecycleStatus === 'active')) {
    add(entry, 'warning', 'metadata', 'DEPRECATION_STATUS_MISMATCH', '/deprecation',
      `A deprecation block is present but lifecycleStatus is '${manifest.lifecycleStatus}'.`,
      "Set lifecycleStatus to 'deprecated', or remove the deprecation block.");
  }
}

// A source or channel reports the capability deprecated or archived, while the owner declares it
// active or another channel still lists it as active (an archived repository still offered by a
// catalog): the "conflicting" state that arises when several sources describe one capability.
function checkLifecycleSignals(entry) {
  const { manifest } = entry;
  const signals = [
    ...(manifest.source.status ? [{ path: '/source/status', where: 'the source', status: manifest.source.status }] : []),
    ...(manifest.publications ?? []).flatMap((publication, i) => (publication.status
      ? [{ path: `/publications/${i}/status`, where: `publication '${publication.locator}'`, status: publication.status, message: publication.statusMessage }]
      : [])),
  ];
  const declaredActive = manifest.lifecycleStatus === 'experimental' || manifest.lifecycleStatus === 'active';
  const listedActive = signals.find((signal) => signal.status === 'active');
  for (const signal of signals.filter((item) => INACTIVE_STATUSES.has(item.status))) {
    const message = signal.message ? ` ("${signal.message}")` : '';
    let claim;
    if (declaredActive) claim = `lifecycleStatus is '${manifest.lifecycleStatus}'`;
    else if (listedActive) claim = `${listedActive.where} reports 'active'`;
    else continue;
    add(entry, 'warning', 'metadata', 'LIFECYCLE_SIGNALS_CONFLICT', signal.path,
      `${claim}, but ${signal.where} reports '${signal.status}'${message}.`,
      'Confirm the status with the owner: update lifecycleStatus (with deprecation details), or remove what is no longer a channel for this capability.');
  }
}

// Publications of one capability may carry different versions at the same time; consumers then
// get a different version depending on the channel.
function checkVersions(entry) {
  const { manifest } = entry;
  const versions = (manifest.publications ?? [])
    .filter((publication) => publication.nativeVersion && COMPARABLE_SCHEMES.has(publication.versionScheme))
    .map((publication) => ({ version: publication.nativeVersion, where: publication.locator }));
  if (manifest.capabilityVersion) versions.push({ version: manifest.capabilityVersion, where: 'capabilityVersion' });
  if (new Set(versions.map((item) => item.version)).size < 2) return;
  add(entry, 'unverified', 'metadata', 'PUBLICATION_VERSIONS_DIFFER', manifest.publications ? '/publications' : '/capabilityVersion',
    `Publications state different versions: ${versions.map((item) => `${item.version} (${item.where})`).join(', ')}. Which one an adopter gets depends on the channel.`,
    'Expected while channels publish at different times. Confirm the current version with the owner before comparing or pinning versions.');
}

function checkLicense(entry) {
  const { license } = entry.manifest;
  if (!license) return;
  if (!license.expression) {
    add(entry, 'unverified', 'metadata', 'LICENSE_NEEDS_REVIEW', '/license',
      `The license is stated as text ('${license.text}'), not as an SPDX expression, so the terms must be read by a person before reuse.`,
      'Read the terms; if they are a standard license, record its SPDX expression in license.expression.');
  }
  if (license.scope === 'repository') {
    add(entry, 'unverified', 'metadata', 'LICENSE_NEEDS_REVIEW', '/license/scope',
      'The license was read from the repository as a whole; it may not cover this capability, for example in a monorepo.',
      "Confirm that the license applies to this capability, then set license.scope to 'capability'.");
  }
}

function checkProvenance(entry) {
  const { manifest } = entry;
  (manifest.provenance ?? []).forEach((item, i) => {
    if (getAt(manifest, toTokens(item.field)) === undefined) {
      add(entry, 'warning', 'metadata', 'PROVENANCE_FIELD_NOT_FOUND', `/provenance/${i}/field`,
        `provenance[${i}] describes '${item.field}', which has no value in this manifest.`,
        'Correct the JSON Pointer, or remove the entry.');
    } else if (item.method === 'derived' && item.basis === 'heuristic' && !item.confirmedBy) {
      add(entry, 'unverified', 'metadata', 'DERIVED_VALUE_UNCONFIRMED', `/provenance/${i}`,
        `The value at ${item.field} was inferred by a heuristic (${item.source}) and has not been confirmed.`,
        'Confirm the value with the owner or a curator and record confirmedBy, or correct it.');
    }
  });
}

function checkRisk(entry) {
  if (entry.manifest.riskTier !== 'unassessed') return;
  add(entry, 'unverified', 'risk', 'RISK_UNASSESSED', '/riskTier',
    "riskTier is 'unassessed': no risk assessment is recorded. It must not be treated as low risk or as approved.",
    'Request a risk assessment from the governance owners, then record the tier and assessmentReference.');
}

function markSourceUnchecked(entry) {
  add(entry, 'unverified', 'source', 'SOURCE_NOT_CHECKED', '/source',
    'Source reachability was not checked (offline by default).',
    'Run with --check-sources to attempt an HTTPS reachability check.');
}

// Opt-in network check. Only https URLs are contacted (HEAD, falling back to GET when HEAD is
// not allowed). Failures are warnings or unverified, never errors: reachability depends on
// the network and on credentials, not on the manifest.
async function checkSourceReachability(entry, fetchImpl) {
  const url = entry.manifest.source.url;
  if (!url?.startsWith('https://')) {
    add(entry, 'unverified', 'source', 'SOURCE_NOT_CHECKABLE', '/source',
      `Source type '${entry.manifest.source.type}' has no https URL that can be checked automatically.`,
      'Confirm the registry entry or source description manually.');
    return;
  }

  try {
    let response = await fetchImpl(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(SOURCE_CHECK_TIMEOUT_MS) });
    if (response.status === 405 || response.status === 501) {
      response = await fetchImpl(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(SOURCE_CHECK_TIMEOUT_MS) });
    }
    if (response.status < 400) return; // reachable: the check passed
    if ([401, 403, 404].includes(response.status)) {
      add(entry, 'unverified', 'source', 'SOURCE_NOT_ACCESSIBLE', '/source/url',
        `${url} returned HTTP ${response.status}. A private source and a missing source look the same without credentials.`,
        'Confirm that the source exists, using credentials if it is private.');
      return;
    }
    add(entry, 'warning', 'source', 'SOURCE_UNREACHABLE', '/source/url',
      `${url} returned HTTP ${response.status}.`, 'Check that the URL is correct and the host is available.');
  } catch (error) {
    add(entry, 'warning', 'source', 'SOURCE_UNREACHABLE', '/source/url',
      `${url} could not be reached (${error.cause?.code ?? error.name}).`, 'Check the URL and your network connection, then retry.');
  }
}

// A source is matched by its location and, for repositories, by the forge's repository id,
// which survives renames: two records that cite the old and the new URL still match.
function sourceKeys(source) {
  if (source.type === 'registry') return [`registry:${source.registry}:${source.identifier}`.toLowerCase()];
  const path = source.path ?? '';
  const keys = [];
  if (source.url) keys.push(`${source.type}:${source.url.toLowerCase().replace(/\.git$/, '').replace(/\/+$/, '')}:${path}`);
  if (source.repositoryId) keys.push(`repository-id:${source.repositoryId}:${path}`);
  return keys;
}

function locatorKey(locator) {
  return locator.toLowerCase().replace(/\/+$/, '');
}

function add(entry, severity, check, code, path, message, hint, extra = {}) {
  const location = entry.locate?.(path) ?? {};
  entry.findings.push({ severity, stage: 'consistency', check, code, path, line: location.line, column: location.column, message, hint, ...extra });
}

function groupBy(items, keyOf) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}
