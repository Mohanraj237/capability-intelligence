// AI Catalog interoperability (decision register U7): converts capability manifests into AI
// Catalog documents, converts them back, and validates AI Catalog documents against the
// structural rules of the AI Catalog editor's draft (github.com/Agent-Card/ai-catalog,
// specification/ai-catalog.md, last changed 2026-11-08, commit ecade3e).
//
// Three projections are produced, so they can be compared:
//   reference: each capability becomes a Catalog Entry that references its native artifacts
//              (SKILL.md, MCP Server Card, plugin.json, package metadata); only the AI Catalog's
//              core members carry manifest facts.
//   manifest:  each capability becomes an entry whose content (data) is the manifest itself,
//              under a vendor media type.
//   hybrid:    the reference projection, plus the complete manifest in entry.extensions under the
//              schema's $id, which AI Catalog consumers that do not know it must ignore.

export const SCHEMA_ID = 'https://raw.githubusercontent.com/Mohanraj237/capability-intelligence/main/schema/0.1/capability.schema.json';
export const MANIFEST_TYPE = 'application/vnd.capability-intelligence.manifest+json';
// The catalog operator: Mission 4's catalog of public capabilities. It is not the publisher of
// any of them, so it must not assign urn:air identifiers (Catalog Projection, rule 3).
export const OPERATOR = 'https://github.com/Mohanraj237/capability-intelligence';
const ID_PREFIX = `${OPERATOR}/capabilities/`;
const MAX_DEPTH = 4;

// Known types of the specification; anything else is a vendor type.
export const KNOWN_TYPES = new Set([
  'application/ai-catalog+json', 'application/agent-card+json', 'application/a2a-agent-card+json',
  'application/mcp-server-card+json', 'application/agent-skills+json', 'application/agent-skills+md',
  'application/agent-skills+zip', 'application/agent-skills+gzip', 'application/agent-plugins+zip',
  'application/agent-plugins+gzip',
]);
// Types whose artifact carries its own name, description, and version: entry copies of those
// SHOULD be omitted (authoritative-source rule).
const SELF_DESCRIBING = new Set(['application/a2a-agent-card+json', 'application/mcp-server-card+json']);

const CONTRACT_TYPES = {
  agent_skill: 'application/agent-skills+md',
  mcp: 'application/mcp-server-card+json',
  a2a: 'application/a2a-agent-card+json',
  openapi: 'application/vnd.oai.openapi+json',
  ci_action: 'application/vnd.github.action+yaml',
  other: 'application/vnd.claude-code.plugin+json',
};
const CAPABILITY_TYPE_OF = {
  'application/agent-skills+md': 'skill',
  'application/mcp-server-card+json': 'mcp_server',
  'application/a2a-agent-card+json': 'agent',
  'application/vnd.claude-code.plugin+json': 'plugin',
};

// A GitHub blob URL is a web page; the artifact document is the raw file.
const rawUrl = (url) => url.replace(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\//, 'https://raw.githubusercontent.com/$1/$2/');
const fromRaw = (url) => url.replace(/^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\//, 'https://github.com/$1/$2/blob/');

// A publication as an artifact document, or null when the channel serves no retrievable document.
function publicationArtifact(publication) {
  const npm = /^pkg:npm\/(.+)$/.exec(publication.locator);
  const pypi = /^pkg:pypi\/(.+)$/.exec(publication.locator);
  if (publication.kind === 'package' && npm) return { type: 'application/vnd.npm.package+json', url: `https://registry.npmjs.org/${npm[1]}` };
  if (publication.kind === 'package' && pypi) return { type: 'application/vnd.pypi.project+json', url: `https://pypi.org/pypi/${pypi[1]}/json` };
  if (publication.kind === 'registry_entry' && /^[a-z0-9.-]+\/[A-Za-z0-9._-]+$/.test(publication.locator)) {
    return { type: 'application/vnd.mcp-registry.server+json', url: `https://registry.modelcontextprotocol.io/v0.1/servers/${encodeURIComponent(publication.locator)}/versions/latest` };
  }
  return null; // container images, marketplace entries, hosted endpoints, repositories: no document URL
}

function publisherOf(manifest) {
  const owner = /^https:\/\/github\.com\/([^/]+)/i.exec(manifest.source.url ?? '');
  if (!manifest.owner?.name || !owner) return undefined;
  // An unsigned claim: the forge account that hosts the source. Not a verified publisher identity.
  return { identifier: `https://github.com/${owner[1]}`, displayName: manifest.owner.name, identityType: 'url' };
}

// The artifacts of one capability: its native contracts and its retrievable publications.
function artifactsOf(manifest, outerId) {
  const artifacts = [];
  (manifest.interfaces ?? []).forEach((item) => {
    if (!item.contractRef) return;
    artifacts.push({ identifier: `${outerId}#contract-${item.type}`, type: CONTRACT_TYPES[item.type] ?? 'application/octet-stream', url: rawUrl(item.contractRef) });
  });
  (manifest.publications ?? []).forEach((publication, i) => {
    const artifact = publicationArtifact(publication);
    if (!artifact) return;
    const versioned = publication.nativeVersion && !['floating', 'unversioned'].includes(publication.versionScheme);
    artifacts.push({ identifier: `${outerId}#publication-${i}`, ...artifact, ...(versioned ? { version: publication.nativeVersion } : {}) });
  });
  return artifacts;
}

function trustManifestsOf(manifest) {
  const provenance = manifest.source.url ? [{ relation: 'source', sourceId: manifest.source.url }] : [];
  const attestations = manifest.riskTier !== 'unassessed' && manifest.assessmentReference
    ? [{ type: `risk-assessment:${manifest.riskTier}`, uri: manifest.assessmentReference.url ?? `urn:assessment:${manifest.assessmentReference.id}`, description: `Assessed on ${manifest.assessmentReference.assessedOn}` }]
    : [];
  if (provenance.length === 0 && attestations.length === 0) return undefined;
  return [{ contributor: OPERATOR, ...(provenance.length ? { provenance } : {}), ...(attestations.length ? { attestations } : {}) }];
}

export function toEntry(manifest, projection) {
  const identifier = `${ID_PREFIX}${manifest.id}`;
  const common = {
    identifier,
    ...(manifest.capabilityVersion ? { version: manifest.capabilityVersion } : {}),
    ...(manifest.keywords ? { tags: [...manifest.keywords] } : {}),
    ...(publisherOf(manifest) ? { publisher: publisherOf(manifest) } : {}),
    ...(manifest.lastUpdated ? { updatedAt: `${manifest.lastUpdated}T00:00:00Z` } : {}),
    ...(trustManifestsOf(manifest) ? { trustManifests: trustManifestsOf(manifest) } : {}),
  };
  if (projection === 'manifest') {
    return { ...common, displayName: manifest.name, ...(manifest.description ? { description: manifest.description } : {}), type: MANIFEST_TYPE, data: structuredClone(manifest) };
  }
  const artifacts = artifactsOf(manifest, identifier);
  let content;
  if (artifacts.length === 1) {
    const [only] = artifacts;
    content = { type: only.type, url: only.url };
    if (only.version && !common.version) content.version = only.version;
  } else {
    // Several artifacts: one logical entry whose content is a nested catalog (as the
    // specification's multi-protocol example does).
    content = { type: 'application/ai-catalog+json', data: { specVersion: '1.0', entries: artifacts } };
  }
  const selfDescribing = SELF_DESCRIBING.has(content.type);
  const entry = {
    ...common,
    ...(selfDescribing ? {} : { displayName: manifest.name, ...(manifest.description ? { description: manifest.description } : {}) }),
    ...content,
  };
  if (selfDescribing) delete entry.version; // the Server Card or Agent Card states it
  if (projection === 'hybrid') entry.extensions = { [SCHEMA_ID]: structuredClone(manifest) };
  return entry;
}

export function toCatalog(manifests, projection) {
  return {
    specVersion: '1.0',
    host: { displayName: 'Mission 4 capability catalog (public capabilities)', identifier: OPERATOR, documentationUrl: `${OPERATOR}/blob/main/docs/capability-manifest-standard-v0.1.md` },
    entries: manifests.map((manifest) => toEntry(manifest, projection)),
  };
}

// Converts an entry back into a manifest. The hybrid and manifest projections carry the manifest
// itself; from a reference entry only what the AI Catalog's core members hold can be rebuilt.
export function fromEntry(entry) {
  if (entry.extensions?.[SCHEMA_ID]) return structuredClone(entry.extensions[SCHEMA_ID]);
  if (entry.type === MANIFEST_TYPE && entry.data) return structuredClone(entry.data);
  const artifacts = entry.type === 'application/ai-catalog+json' ? entry.data?.entries ?? [] : [{ type: entry.type, url: entry.url, version: entry.version }];
  const manifest = { schemaVersion: '0.1' };
  if (entry.identifier.startsWith(ID_PREFIX)) manifest.id = entry.identifier.slice(ID_PREFIX.length);
  if (entry.displayName) manifest.name = entry.displayName;
  if (entry.description) manifest.description = entry.description;
  const kinds = artifacts.map((artifact) => CAPABILITY_TYPE_OF[artifact.type]).filter(Boolean);
  if (kinds.length) manifest.capabilityType = kinds[0];
  if (entry.version) manifest.capabilityVersion = entry.version;
  const source = entry.trustManifests?.flatMap((item) => item.provenance ?? []).find((link) => link.relation === 'source');
  if (source) manifest.source = { type: 'repository', url: source.sourceId };
  const attestation = entry.trustManifests?.flatMap((item) => item.attestations ?? []).find((item) => item.type.startsWith('risk-assessment:'));
  if (attestation) manifest.riskTier = attestation.type.split(':')[1];
  if (entry.publisher) manifest.owner = { name: entry.publisher.displayName };
  if (entry.tags) manifest.keywords = [...entry.tags];
  if (entry.updatedAt) manifest.lastUpdated = entry.updatedAt.slice(0, 10);
  const interfaces = artifacts.filter((artifact) => Object.values(CONTRACT_TYPES).includes(artifact.type)).map((artifact) => ({
    type: Object.keys(CONTRACT_TYPES).find((key) => CONTRACT_TYPES[key] === artifact.type), contractRef: fromRaw(artifact.url),
  }));
  if (interfaces.length) manifest.interfaces = interfaces;
  const publications = artifacts.filter((artifact) => artifact.type?.startsWith('application/vnd.') && !Object.values(CONTRACT_TYPES).includes(artifact.type)).map((artifact) => {
    const npm = /^https:\/\/registry\.npmjs\.org\/(.+)$/.exec(artifact.url);
    const pypi = /^https:\/\/pypi\.org\/pypi\/(.+)\/json$/.exec(artifact.url);
    const registry = /^https:\/\/registry\.modelcontextprotocol\.io\/v0\.1\/servers\/(.+)\/versions\/latest$/.exec(artifact.url);
    if (npm) return { kind: 'package', locator: `pkg:npm/${npm[1]}`, ...(artifact.version ? { nativeVersion: artifact.version } : {}) };
    if (pypi) return { kind: 'package', locator: `pkg:pypi/${pypi[1]}`, ...(artifact.version ? { nativeVersion: artifact.version } : {}) };
    if (registry) return { kind: 'registry_entry', locator: decodeURIComponent(registry[1]), ...(artifact.version ? { nativeVersion: artifact.version } : {}) };
    return null;
  }).filter(Boolean);
  if (publications.length) manifest.publications = publications;
  return manifest;
}

// ---------------------------------------------------------------------------------------------
// Validator: the structural rules of the specification (CDDL, conformance levels, identifiers,
// extensions, trust manifest validity, nesting depth). Returns findings with severity.

const isAbsoluteUri = (value) => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9+.-]*:\S+$/.test(value);
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const extensionKeyOk = (key) => /^https?:\/\/\S+$/.test(key) || /^[a-z][a-z0-9-]*(\.[a-z0-9-]+)+(\.[A-Za-z0-9-]+)*$/i.test(key);

export function validateCatalog(catalog, { operatorIsPublisher = false } = {}) {
  const findings = [];
  const add = (severity, path, message) => findings.push({ severity, path, message });
  const visit = (doc, path, depth) => {
    if (depth > MAX_DEPTH) return add('error', path, `Nested catalogs deeper than ${MAX_DEPTH} levels.`);
    if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) return add('error', path, 'A catalog must be a JSON object.');
    if (typeof doc.specVersion !== 'string' || !/^\d+\.\d+$/.test(doc.specVersion)) add('error', `${path}/specVersion`, 'specVersion must be a "Major.Minor" string.');
    else if (doc.specVersion.split('.')[0] !== '1') add('error', `${path}/specVersion`, 'Unknown major version.');
    if (!Array.isArray(doc.entries)) return add('error', `${path}/entries`, 'entries must be an array.');
    if (doc.host !== undefined && (typeof doc.host?.displayName !== 'string')) add('error', `${path}/host`, 'host.displayName is required.');
    checkExtensions(doc.extensions, `${path}/extensions`);
    const keys = new Set();
    doc.entries.forEach((entry, i) => {
      const at = `${path}/entries/${i}`;
      if (typeof entry.identifier !== 'string' || entry.identifier.length === 0) add('error', `${at}/identifier`, 'identifier is required.');
      if (typeof entry.type !== 'string' || entry.type.length === 0) add('error', `${at}/type`, 'type is required.');
      const hasUrl = entry.url !== undefined;
      const hasData = entry.data !== undefined;
      if (hasUrl === hasData) add('error', at, 'An entry must contain exactly one of url or data.');
      if (hasUrl && !isAbsoluteUri(entry.url)) add('error', `${at}/url`, 'url must be an absolute URL.');
      if (hasUrl && !entry.url.startsWith('https://')) add('warning', `${at}/url`, 'url is not https.');
      if (entry.tags !== undefined && (!Array.isArray(entry.tags) || entry.tags.some((tag) => typeof tag !== 'string'))) add('error', `${at}/tags`, 'tags must be an array of strings.');
      for (const member of ['displayName', 'description', 'version', 'digest']) {
        if (entry[member] !== undefined && typeof entry[member] !== 'string') add('error', `${at}/${member}`, `${member} must be a string.`);
      }
      if (entry.updatedAt !== undefined && !RFC3339.test(entry.updatedAt)) add('error', `${at}/updatedAt`, 'updatedAt must be an RFC 3339 timestamp.');
      if (entry.publisher !== undefined && (typeof entry.publisher.identifier !== 'string' || typeof entry.publisher.displayName !== 'string')) add('error', `${at}/publisher`, 'publisher needs identifier and displayName.');
      if (typeof entry.identifier === 'string' && entry.identifier.startsWith('urn:air:') && !operatorIsPublisher) add('error', `${at}/identifier`, 'A catalog operator that is not the publisher must not assign urn:air identifiers.');
      if (SELF_DESCRIBING.has(entry.type)) {
        for (const member of ['displayName', 'description', 'version']) if (entry[member] !== undefined) add('warning', `${at}/${member}`, `${member} duplicates a value the referenced artifact carries (authoritative-source rule).`);
      }
      const key = `${entry.identifier}\u0000${entry.version ?? ''}`;
      if (keys.has(key)) add('error', `${at}/identifier`, 'identifier (with version) must be unique in the catalog.');
      keys.add(key);
      checkExtensions(entry.extensions, `${at}/extensions`);
      (entry.trustManifests ?? []).forEach((manifest, j) => {
        const mat = `${at}/trustManifests/${j}`;
        if (!isAbsoluteUri(manifest.contributor)) add('error', `${mat}/contributor`, 'contributor must be an absolute URI.');
        const substance = manifest.signature || manifest.trustSchema || manifest.attestations?.length || manifest.provenance?.length || (manifest.extensions && Object.keys(manifest.extensions).length);
        if (!substance) add('error', mat, 'A trust manifest needs a signature, trust schema, attestations, provenance, or extensions.');
        if (manifest.signature && !manifest.subject) add('error', mat, 'A signed trust manifest needs a subject.');
        (manifest.provenance ?? []).forEach((link, k) => {
          if (typeof link.relation !== 'string' || typeof link.sourceId !== 'string') add('error', `${mat}/provenance/${k}`, 'A provenance link needs relation and sourceId.');
        });
        (manifest.attestations ?? []).forEach((item, k) => {
          if (typeof item.type !== 'string' || typeof item.uri !== 'string') add('error', `${mat}/attestations/${k}`, 'An attestation needs type and uri.');
        });
      });
      if (entry.type === 'application/ai-catalog+json' && hasData) visit(entry.data, `${at}/data`, depth + 1);
      if (!KNOWN_TYPES.has(entry.type) && !String(entry.type).startsWith('application/vnd.')) add('warning', `${at}/type`, `type '${entry.type}' is neither a known type nor a vendor (vnd.) type.`);
    });
  };
  const checkExtensions = (extensions, path) => {
    if (extensions === undefined) return;
    if (typeof extensions !== 'object' || extensions === null || Array.isArray(extensions)) return add('error', path, 'extensions must be an object.');
    for (const key of Object.keys(extensions)) if (!extensionKeyOk(key)) add('error', `${path}/${key}`, 'An extension key must be a URL or a reverse-DNS name.');
  };
  visit(catalog, '', 1);
  const level = findings.some((finding) => finding.severity === 'error') ? 0 : catalog.host ? 2 : 1;
  return { findings, level };
}

// Every artifact entry in a catalog, nested ones included.
export function artifactEntries(catalog) {
  return catalog.entries.flatMap((entry) => (entry.type === 'application/ai-catalog+json' && entry.data ? artifactEntries(entry.data) : [entry]));
}
