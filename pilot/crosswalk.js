// Crosswalk: how each native metadata format maps onto the manifest's concepts, and the draft
// manifest built from it. Every value is tagged with its provenance:
//   native  - read from a field of the native metadata (possibly normalized, e.g. lowercased)
//   derived - inferred from the metadata's context: where it was found, its format, its namespace
//   default - an explicit value that asserts nothing (riskTier: unassessed)
// A concept with no value is missing. Nothing is guessed: what no field states stays unknown.

// Concepts in manifest order. `field` is where a concept lives in a schema 0.1 manifest. License,
// keywords, documentation, and configuration (setup) were x- extension fields of the drafts until
// the 2026-10-23 revision of 0.1 added them, following the Spikes 1-3 research.
// Iteration 1 maps a capability's last change into lastUpdated and a registry status into
// lifecycleStatus. The revision defines lastUpdated as the record's date and lifecycleStatus as
// the owner's declaration, and records both observations per publication (publications[].updatedAt
// and .status), as research/spikes-1-3 does. The pilot keeps its mapping so that its results stay
// comparable with iteration 1 (docs/journey-pilot.md).
export const CONCEPTS = [
  { key: 'id', label: 'Stable identifier', field: 'id' },
  { key: 'name', label: 'Display name', field: 'name' },
  { key: 'description', label: 'Description', field: 'description' },
  { key: 'capabilityType', label: 'Capability type', field: 'capabilityType' },
  { key: 'capabilityVersion', label: 'Version', field: 'capabilityVersion' },
  { key: 'source', label: 'Source location', field: 'source' },
  { key: 'owner', label: 'Owner or maintainer', field: 'owner.name' },
  { key: 'ownerContact', label: 'Support contact', field: 'owner.contact' },
  { key: 'affiliation', label: 'Internal or external', field: 'owner.affiliation' },
  { key: 'lifecycleStatus', label: 'Lifecycle status', field: 'lifecycleStatus' },
  { key: 'maturity', label: 'Maturity', field: 'maturity' },
  { key: 'riskTier', label: 'Risk tier', field: 'riskTier' },
  { key: 'assessmentReference', label: 'Risk assessment record', field: 'assessmentReference' },
  { key: 'lastUpdated', label: 'Last updated', field: 'lastUpdated' },
  { key: 'supportedUseCases', label: 'Supported use cases', field: 'supportedUseCases' },
  { key: 'intendedAudience', label: 'Intended audience', field: 'intendedAudience' },
  { key: 'interfaces', label: 'Interfaces and protocols', field: 'interfaces' },
  { key: 'platformCompatibility', label: 'Platform compatibility', field: 'platformCompatibility' },
  { key: 'dependencies', label: 'Capability dependencies', field: 'dependencies' },
  { key: 'limitations', label: 'Known limitations', field: 'limitations' },
  { key: 'costInformation', label: 'Cost', field: 'costInformation' },
  { key: 'license', label: 'License', field: 'license' },
  { key: 'keywords', label: 'Keywords or tags', field: 'keywords' },
  { key: 'documentation', label: 'Documentation link', field: 'documentation' },
  { key: 'configuration', label: 'Required configuration', field: 'setup' },
];

const native = (value, from) => ({ value, provenance: 'native', from });
const derived = (value, from) => ({ value, provenance: 'derived', from });
const byDefault = (value, from) => ({ value, provenance: 'default', from });

export const FORMATS = {
  'agent-skill': {
    label: 'Agent Skill (SKILL.md front matter)',
    extract({ name, sourceUrl, native: snapshot }) {
      const frontmatter = snapshot.frontmatter ?? {};
      const repositoryOwner = new URL(snapshot.repository).pathname.split('/')[1];
      return {
        id: derived(`${repositoryOwner}/${slug(frontmatter.name ?? name)}`, 'repository owner + name'),
        name: frontmatter.name ? native(frontmatter.name, 'frontmatter.name') : undefined,
        description: frontmatter.description ? native(frontmatter.description, 'frontmatter.description') : undefined,
        capabilityType: derived('skill', 'format'),
        source: derived({ type: 'repository', url: snapshot.repository, path: snapshot.path }, 'location of SKILL.md'),
        owner: derived(repositoryOwner, 'repository owner'),
        ownerContact: derived(`${snapshot.repository}/issues`, 'repository issue tracker'),
        affiliation: derived('external', 'public source'),
        riskTier: byDefault('unassessed', 'no assessment is recorded'),
        lastUpdated: snapshot.lastCommitDate ? derived(snapshot.lastCommitDate.slice(0, 10), 'last commit to SKILL.md') : undefined,
        interfaces: derived([{ type: 'agent_skill', contractRef: sourceUrl }], 'format'),
        license: frontmatter.license ? native(frontmatter.license, 'frontmatter.license') : undefined,
        documentation: derived(sourceUrl, 'SKILL.md'),
      };
    },
  },

  'mcp-server-json': {
    label: 'MCP Registry entry (server.json)',
    extract({ native: { server, registry } }) {
      const repository = server.repository?.url;
      const packages = server.packages ?? [];
      const transports = [
        ...packages.map((pkg) => `${pkg.transport?.type ?? 'stdio'} via ${pkg.registryType} package ${pkg.identifier}`),
        ...(server.remotes ?? []).map((remote) => `${remote.type} at ${remote.url}`),
      ];
      const variables = packages.flatMap((pkg) => (pkg.environmentVariables ?? []).map((variable) => variable.name));
      const platforms = [...new Set(packages.map((pkg) => ({ npm: 'node', pypi: 'python', oci: 'docker' })[pkg.registryType]).filter(Boolean))];
      const id = server.name.toLowerCase();
      let ownerContact;
      if (repository?.startsWith('https://github.com/')) ownerContact = derived(`${repository}/issues`, 'repository issue tracker');
      else if (server.websiteUrl) ownerContact = derived(server.websiteUrl, 'websiteUrl (no support contact declared)');
      return {
        id: id === server.name ? native(id, 'name') : derived(id, 'name, lowercased'),
        name: server.title ? native(server.title, 'title') : native(server.name, 'name'),
        description: native(server.description, 'description'),
        capabilityType: derived('mcp_server', 'format'),
        capabilityVersion: native(server.version, 'version'),
        source: native({ type: 'registry', registry: 'mcp-registry', identifier: server.name, ...((repository ?? server.websiteUrl) && { url: repository ?? server.websiteUrl }) }, 'name, repository.url'),
        owner: derived(ownerFromNamespace(server.name.split('/')[0]), 'namespace'),
        ownerContact,
        affiliation: derived('external', 'public source'),
        lifecycleStatus: native(registry.status, 'registry status'),
        riskTier: byDefault('unassessed', 'no assessment is recorded'),
        lastUpdated: native(registry.updatedAt.slice(0, 10), 'registry updatedAt'),
        interfaces: native([{ type: 'mcp', description: `Transports: ${transports.join('; ')}.`.slice(0, 300) }], 'packages[].transport, remotes[]'),
        platformCompatibility: platforms.length > 0 ? derived(platforms, 'package registry type') : undefined,
        documentation: server.websiteUrl ? native(server.websiteUrl, 'websiteUrl') : undefined,
        configuration: variables.length > 0 ? native(variables, 'packages[].environmentVariables') : undefined,
      };
    },
  },

  'npm-package': {
    label: 'npm package (package.json)',
    extract({ sourceUrl, native: { packageJson, registry } }) {
      const scoped = packageJson.name.startsWith('@');
      const [scope, packageName] = scoped ? packageJson.name.slice(1).split('/') : [null, packageJson.name];
      const keywords = packageJson.keywords ?? [];
      const mcp = keywords.some((keyword) => /^(mcp|mcp-server|model-context-protocol)$/i.test(keyword));
      const repository = repositoryUrl(packageJson.repository);
      const bugs = typeof packageJson.bugs === 'string' ? packageJson.bugs : packageJson.bugs?.url;
      const maintainer = packageJson.author?.name ?? packageJson.maintainers?.[0]?.name;
      let ownerContact;
      if (bugs?.startsWith('https://')) ownerContact = native(bugs, 'bugs.url');
      else if (repository) ownerContact = derived(`${repository}/issues`, 'repository issue tracker');
      return {
        id: scoped ? native(`${scope}/${packageName}`.toLowerCase(), 'scoped name') : derived(`npm/${packageName}`, 'registry as namespace (unscoped name)'),
        name: native(packageJson.name, 'name'),
        description: packageJson.description ? native(packageJson.description, 'description') : undefined,
        capabilityType: mcp ? derived('mcp_server', 'keywords mention MCP') : derived('tool', 'format'),
        capabilityVersion: native(packageJson.version, 'version'),
        source: native({ type: 'registry', registry: 'npm', identifier: packageJson.name, url: sourceUrl }, 'name'),
        owner: maintainer ? native(maintainer, packageJson.author?.name ? 'author.name' : 'maintainers[0].name') : undefined,
        ownerContact,
        affiliation: derived('external', 'public source'),
        lifecycleStatus: packageJson.deprecated ? native('deprecated', 'deprecated') : undefined,
        riskTier: byDefault('unassessed', 'no assessment is recorded'),
        lastUpdated: native(registry.lastPublished.slice(0, 10), 'registry publish date'),
        interfaces: derived(
          [{ type: 'library' }, ...(packageJson.bin ? [{ type: 'cli' }] : []), ...(mcp ? [{ type: 'mcp' }] : [])],
          'format, bin, keywords',
        ),
        platformCompatibility: packageJson.engines ? native(Object.keys(packageJson.engines).map(slug), 'engines') : undefined,
        license: packageJson.license ? native(packageJson.license, 'license') : undefined,
        keywords: keywords.length > 0 ? native(keywords, 'keywords') : undefined,
        documentation: packageJson.homepage ? native(packageJson.homepage, 'homepage') : undefined,
      };
    },
  },
};

// Applies the crosswalk to one sampled capability: its concepts (with provenance) and a draft
// manifest.
export function extract(sample) {
  const format = FORMATS[sample.format];
  if (!format) throw new Error(`No crosswalk for format '${sample.format}'.`);
  const concepts = Object.fromEntries(Object.entries(format.extract(sample)).filter(([, entry]) => entry !== undefined));
  return { sample, concepts, manifest: toManifest(sample, concepts) };
}

function toManifest(sample, concepts) {
  const value = (key) => concepts[key]?.value;
  const optional = (field, key) => (concepts[key] ? { [field]: value(key) } : {});
  const keysBy = (provenance) => Object.keys(concepts).filter((key) => concepts[key].provenance === provenance);
  return {
    schemaVersion: '0.1',
    ...optional('id', 'id'),
    ...optional('name', 'name'),
    ...optional('description', 'description'),
    ...optional('capabilityType', 'capabilityType'),
    ...optional('capabilityVersion', 'capabilityVersion'),
    ...optional('source', 'source'),
    owner: { ...optional('name', 'owner'), ...optional('contact', 'ownerContact'), ...optional('affiliation', 'affiliation') },
    ...optional('lifecycleStatus', 'lifecycleStatus'),
    ...optional('riskTier', 'riskTier'),
    ...optional('lastUpdated', 'lastUpdated'),
    ...optional('interfaces', 'interfaces'),
    ...optional('platformCompatibility', 'platformCompatibility'),
    ...(concepts.license ? { license: licenseOf(value('license')) } : {}),
    ...optional('documentation', 'documentation'),
    ...(concepts.keywords ? { keywords: [...new Set(value('keywords'))].slice(0, 30) } : {}),
    ...(concepts.configuration ? { setup: value('configuration').map((name) => ({ name })) } : {}),
    'x-provenance': { extractedFrom: sample.sourceUrl, format: sample.format, native: keysBy('native'), derived: keysBy('derived'), default: keysBy('default') },
  };
}

// An SPDX expression where the native value is one; otherwise the terms as text, to be read by a person.
function licenseOf(text) {
  return /^\(?[A-Za-z0-9.+:-]+\)?(?: +(?:AND|OR|WITH) +\(?[A-Za-z0-9.+:-]+\)?)*$/.test(text) ? { expression: text } : { text };
}

// io.github.<user> -> <user>; reverse-DNS namespaces otherwise read as a domain (today.theclarity -> theclarity.today).
function ownerFromNamespace(namespace) {
  const parts = namespace.split('.');
  if (parts[0] === 'io' && parts[1] === 'github' && parts[2]) return parts.slice(2).join('.');
  return parts.reverse().join('.');
}

// git+https://github.com/org/repo.git -> https://github.com/org/repo
function repositoryUrl(repository) {
  const url = typeof repository === 'string' ? repository : repository?.url;
  if (!url) return undefined;
  const https = url.replace(/^git\+/, '').replace(/^git:\/\//, 'https://').replace(/\.git$/, '');
  return https.startsWith('https://') ? https : undefined;
}

function slug(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
