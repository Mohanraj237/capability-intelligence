// Crosswalk from eight native metadata formats onto common concepts, for the Spikes 1-3 research.
// Every value carries its provenance:
//   native  - stated by the record's own metadata document
//   linked  - read from another source that the record itself declares (its source repository
//             on the forge: license as detected by GitHub, archived flag, repository id)
//   derived - inferred by a stated rule from the format, location, namespace, or wording
// A concept with no value is absent. Nothing is guessed, and risk is never filled in.
// Derived values also carry a basis: "convention" when a rule the source itself documents and
// enforces yields the value (a SKILL.md is a skill; the MCP Registry verifies the namespace of a
// name; npm enforces scope ownership; the forge owns repository ownership), "heuristic" when the
// value is read from wording or context (keywords that mention MCP, a title containing
// "Archived"). Heuristic values need confirmation; convention values need interpretation only.
//
// Each concept answers one of the journey questions in needs.yaml. CONCEPTS lists them in the
// order used by the comparison matrix.

export const CONCEPTS = [
  { key: 'nativeName', label: 'Native name or identifier', question: 'same-as' },
  { key: 'displayName', label: 'Display name', question: 'what' },
  { key: 'description', label: 'Description', question: 'what' },
  { key: 'useCases', label: 'Structured abilities or use cases', question: 'what' },
  { key: 'keywords', label: 'Keywords, tags, or category', question: 'what' },
  { key: 'capabilityType', label: 'Capability type', question: 'kind' },
  { key: 'interfaces', label: 'Interface or protocol', question: 'interface' },
  { key: 'runtime', label: 'Where and on what it runs', question: 'runs-where' },
  { key: 'setup', label: 'Required credentials or configuration', question: 'setup' },
  { key: 'dependsOn', label: 'Declared dependencies', question: 'depends' },
  { key: 'limitations', label: 'Known limitations', question: 'limits' },
  { key: 'license', label: 'License or terms', question: 'terms' },
  { key: 'version', label: 'Version', question: 'version' },
  { key: 'lifecycle', label: 'Lifecycle or status', question: 'maintained' },
  { key: 'updated', label: 'Last updated', question: 'maintained' },
  { key: 'publisher', label: 'Publisher of this entry', question: 'who' },
  { key: 'maintainer', label: 'Declared author or maintainer', question: 'who' },
  { key: 'sourceRepository', label: 'Source repository', question: 'same-as' },
  { key: 'publications', label: 'Other publications it declares', question: 'same-as' },
  { key: 'documentation', label: 'Documentation link', question: 'what' },
  { key: 'riskTier', label: 'Risk assessment', question: 'risk' },
];

export const FORMAT_LABELS = {
  'mcp-server-json': 'MCP Registry entry (server.json)',
  'npm-package': 'npm package (package.json)',
  'agent-skill': 'Agent Skill (SKILL.md)',
  'claude-plugin': 'Claude Code plugin (marketplace entry, plugin.json, .mcp.json)',
  'docker-mcp-catalog': 'Docker MCP catalog entry (server.yaml)',
  'pypi-package': 'PyPI package (core metadata)',
  'github-action': 'GitHub Action (action.yml)',
  'a2a-agent-card': 'A2A Agent Card (agent-card.json)',
};

const native = (value, from) => (isEmpty(value) ? undefined : { value, prov: 'native', from });
const linked = (value, from) => (isEmpty(value) ? undefined : { value, prov: 'linked', from });
const derived = (value, from) => (isEmpty(value) ? undefined : { value, prov: 'derived', from, basis: 'heuristic' });
const convention = (value, from) => (isEmpty(value) ? undefined : { value, prov: 'derived', from, basis: 'convention' });
const first = (...entries) => entries.find(Boolean);
function isEmpty(value) {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// SemVer 2.0.0 (semver.org), PEP 440 (packaging.python.org, simplified public-version form).
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const PEP440 = /^([1-9]\d*!)?(0|[1-9]\d*)(\.(0|[1-9]\d*))*((a|b|rc)(0|[1-9]\d*))?(\.post(0|[1-9]\d*))?(\.dev(0|[1-9]\d*))?$/;
export function versionScheme(version) {
  if (!version) return 'none';
  if (SEMVER.test(version)) return 'semver';
  if (PEP440.test(version)) return 'pep440';
  if (/^v?\d+(\.\d+)*$/.test(version)) return 'numeric';
  return 'other';
}

// License values as they appear: an SPDX expression, a pointer to a file, free text, or GitHub's
// NOASSERTION (a license file exists but was not recognised).
export function licenseKind(value) {
  if (!value) return 'none';
  if (value === 'NOASSERTION') return 'noassertion';
  if (/proprietary/i.test(value)) return 'proprietary';
  if (/license\.(txt|md)|complete terms/i.test(value)) return 'file-reference';
  if (/^\(?[A-Za-z0-9.+-]+\)?( +(AND|OR|WITH) +\(?[A-Za-z0-9.+-]+\)?)*$/.test(value) && !/^proprietary$/i.test(value)) return 'spdx';
  return 'text';
}

const githubRepo = (url) => {
  const match = /github\.com[/:]([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[/#?].*)?$/i.exec(String(url ?? ''));
  return match ? `${match[1]}/${match[2]}` : null;
};

// Forge facts about the repository a record declares (fetch.js "linked.repository"). When the
// capability sits at a path inside a shared repository (a monorepo or a marketplace), facts about
// the whole repository are scoped as such, and the repository's last push is not used as the
// capability's update date.
function forge(record, concepts) {
  const repo = record.linked?.repository;
  if (!repo?.found) return;
  const path = concepts.sourceRepository?.value?.path;
  const scope = path ? `; it covers the whole repository, and the capability is at ${path}` : '';
  if (!concepts.license && repo.license) concepts.license = { ...linked({ text: repo.license, kind: licenseKind(repo.license) }, `repository license detected by GitHub (${repo.fullName})${scope}`), repositoryWide: Boolean(path) };
  if (repo.archived) concepts.lifecycle = { ...linked({ state: 'archived' }, `repository ${repo.fullName} is archived`), conflictsWith: concepts.lifecycle?.value?.state ?? null };
  if (!concepts.updated && repo.pushedAt && !path) concepts.updated = linked(repo.pushedAt.slice(0, 10), 'last push to the repository');
  concepts.forgeRepository = linked({ fullName: repo.fullName, id: repo.id, fork: repo.fork, parent: repo.parent, renamedOrMoved: repo.renamedOrMoved, requested: repo.requested }, 'GitHub repository API');
}

// Reverse-DNS registry names: the namespace is the publisher the registry verified, the rest is
// the server's own name. Matching on the full name lets "io.github" match every GitHub user.
export function splitRegistryName(name) {
  const slash = name.indexOf('/');
  return slash < 0 ? { namespace: null, local: name } : { namespace: name.slice(0, slash), local: name.slice(slash + 1) };
}

const RUNTIME_OF = { npm: 'local process (Node.js, npx)', pypi: 'local process (Python, uvx or pip)', oci: 'container image', nuget: 'local process (.NET)', mcpb: 'MCP bundle', cargo: 'local process (Rust)' };

const MAPPINGS = {
  'mcp-server-json'({ native: { server, registry } }) {
    const packages = server.packages ?? [];
    const remotes = server.remotes ?? [];
    const { namespace } = splitRegistryName(server.name);
    const secrets = [
      ...packages.flatMap((pkg) => (pkg.environmentVariables ?? []).map((v) => ({ name: v.name, secret: Boolean(v.isSecret), required: Boolean(v.isRequired) }))),
      ...remotes.flatMap((remote) => (remote.headers ?? []).map((h) => ({ name: h.name, secret: Boolean(h.isSecret), required: Boolean(h.isRequired) }))),
    ];
    return {
      nativeName: native(server.name, 'name'),
      displayName: native(server.title, 'title'),
      description: native(server.description, 'description'),
      capabilityType: convention('mcp_server', 'format'),
      interfaces: native([...new Set([...packages.map((pkg) => `mcp/${pkg.transport?.type ?? 'stdio'}`), ...remotes.map((remote) => `mcp/${remote.type}`)])], 'packages[].transport, remotes[].type'),
      runtime: native([...new Set([...packages.map((pkg) => RUNTIME_OF[pkg.registryType] ?? pkg.registryType), ...remotes.map(() => 'hosted service')])], 'packages[].registryType, remotes[]'),
      setup: native(secrets, 'environmentVariables, remotes[].headers'),
      version: native({ text: server.version, scheme: versionScheme(server.version) }, 'version'),
      lifecycle: registry?.status ? native({ state: registry.status }, 'registry status') : undefined,
      updated: native(registry?.updatedAt?.slice(0, 10), 'registry updatedAt'),
      publisher: convention({ name: namespace, verified: 'namespace verified by the registry (GitHub account or domain)' }, 'namespace of name'),
      sourceRepository: native(server.repository?.url ? { url: server.repository.url, path: server.repository.subfolder ?? null, forgeId: server.repository.id ?? null } : null, 'repository'),
      publications: native([...packages.map((pkg) => `${pkg.registryType}:${pkg.identifier}`), ...remotes.map((remote) => `remote:${remote.url}`)], 'packages[], remotes[]'),
      documentation: first(native(server.websiteUrl, 'websiteUrl'), derived(server.repository?.url, 'repository')),
    };
  },

  'npm-package'({ name, native: snapshot }) {
    const pkg = snapshot.packageJson ?? {};
    const keywords = pkg.keywords ?? [];
    const isMcp = Boolean(pkg.mcpName) || keywords.some((k) => /^(mcp|mcp-server|model-context-protocol|modelcontextprotocol)$/i.test(k)) || /\bmcp\b|model context protocol/i.test(pkg.description ?? '');
    const repository = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
    const scope = pkg.name?.startsWith('@') ? pkg.name.slice(1).split('/')[0] : null;
    const authorName = typeof pkg.author === 'string' ? pkg.author : pkg.author?.name;
    const deps = Object.keys({ ...(pkg.dependencies ?? {}), ...(pkg.peerDependencies ?? {}) });
    return {
      nativeName: native(pkg.name ?? name, 'name'),
      description: native(pkg.description, 'description'),
      keywords: native(keywords, 'keywords'),
      capabilityType: pkg.mcpName ? convention('mcp_server', 'mcpName (verified by the MCP Registry)') : derived(isMcp ? 'mcp_server' : 'tool', isMcp ? 'MCP named in keywords or description' : 'format (library)'),
      interfaces: derived([...(isMcp ? ['mcp/stdio'] : []), ...(pkg.bin ? ['cli'] : []), ...(isMcp ? [] : ['library'])], 'mcpName, keywords, description, bin'),
      runtime: first(native(pkg.engines ? Object.entries(pkg.engines).map(([engine, range]) => `${engine} ${range}`) : null, 'engines'), convention(['local process (Node.js)'], 'format')),
      dependsOn: native(deps, 'dependencies, peerDependencies (packages)'),
      license: native(pkg.license ? { text: typeof pkg.license === 'string' ? pkg.license : pkg.license.type, kind: licenseKind(typeof pkg.license === 'string' ? pkg.license : pkg.license.type) } : null, 'license'),
      version: native({ text: pkg.version, scheme: versionScheme(pkg.version) }, 'version'),
      lifecycle: pkg.deprecated ? native({ state: 'deprecated', message: pkg.deprecated }, 'deprecated (on the latest version)') : undefined,
      updated: native((snapshot.registry?.latestPublished ?? snapshot.registry?.lastPublished)?.slice(0, 10), 'publish date of the latest version'),
      publisher: scope ? convention({ name: `@${scope}`, verified: 'npm scope owned by an npm user or organization' }, 'scope of name') : convention({ name: pkg.maintainers?.[0]?.name ?? null, verified: 'npm account' }, 'maintainers[0]'),
      maintainer: native(authorName ?? pkg.maintainers?.map((m) => m.name).join(', '), authorName ? 'author' : 'maintainers'),
      sourceRepository: native(repository ? { url: repository.replace(/^git\+/, ''), path: pkg.repository?.directory ?? null } : null, 'repository'),
      publications: native(pkg.mcpName ? [`mcp-registry:${pkg.mcpName}`] : [], 'mcpName'),
      documentation: native(pkg.homepage, 'homepage'),
    };
  },

  'agent-skill'({ sourceUrl, native: snapshot }) {
    const fm = snapshot.frontmatter ?? {};
    const repo = githubRepo(snapshot.repository);
    const tier = /\/\.(curated|system|experimental)\//.exec(`${snapshot.path}/`)?.[1];
    return {
      nativeName: native(fm.name, 'frontmatter name'),
      description: native(fm.description, 'frontmatter description'),
      capabilityType: convention('skill', 'format'),
      interfaces: convention(['agent_skill'], 'format'),
      runtime: first(native(fm.compatibility ? [fm.compatibility] : null, 'frontmatter compatibility'), convention(['agent host that loads Agent Skills'], 'format')),
      license: first(
        native(fm.license ? { text: fm.license, kind: licenseKind(fm.license) } : null, 'frontmatter license'),
        native((snapshot.licenseFiles ?? []).length > 0 ? { text: `file ${snapshot.licenseFiles.join(', ')}`, kind: 'file-reference' } : null, 'license file in the skill folder'),
      ),
      version: native(fm.metadata?.version ? { text: String(fm.metadata.version), scheme: versionScheme(String(fm.metadata.version)) } : null, 'frontmatter metadata.version'),
      lifecycle: tier ? derived({ state: { curated: 'listed', system: 'listed', experimental: 'experimental' }[tier], tier }, `folder .${tier} in the repository`) : undefined,
      updated: linked(snapshot.lastCommitDate?.slice(0, 10), 'last commit to SKILL.md'),
      publisher: convention({ name: repo?.split('/')[0], verified: 'owner of the repository on the forge' }, 'repository owner'),
      maintainer: native(fm.metadata?.author, 'frontmatter metadata.author'),
      sourceRepository: convention({ url: snapshot.repository, path: snapshot.path }, 'location of SKILL.md'),
      documentation: convention(sourceUrl, 'SKILL.md'),
    };
  },

  'claude-plugin'({ native: snapshot }) {
    const entry = snapshot.marketplaceEntry ?? {};
    const manifest = snapshot.pluginJson ?? {};
    const servers = Object.entries(snapshot.mcpJson?.mcpServers ?? snapshot.mcpJson ?? {}).concat(Object.entries(typeof manifest.mcpServers === 'object' && !Array.isArray(manifest.mcpServers) ? manifest.mcpServers : {}));
    const serverTargets = servers.map(([key, server]) => {
      if (server?.url !== undefined) return { key, kind: 'remote', target: server.url || '(empty url)' };
      const args = Array.isArray(server?.args) ? server.args : [];
      const spec = args.find((arg) => !String(arg).startsWith('-'));
      return { key, kind: `local:${server?.command}`, target: spec ?? server?.command };
    });
    const placeholders = JSON.stringify([snapshot.mcpJson, manifest.mcpServers]).match(/\$\{[A-Za-z0-9_.]+\}/g) ?? [];
    const components = ['skills', 'commands', 'agents', 'hooks', 'lspServers', 'outputStyles'].filter((key) => manifest[key] || entry[key]);
    const author = manifest.author?.name ?? entry.author?.name;
    const version = manifest.version ?? entry.version;
    const license = manifest.license ?? entry.license;
    return {
      nativeName: native(entry.name, 'marketplace entry name (scoped to the marketplace)'),
      displayName: native(entry.displayName ?? manifest.displayName, 'displayName'),
      description: native(entry.description ?? manifest.description, 'description'),
      keywords: native([...(entry.category ? [entry.category] : []), ...(entry.tags ?? []), ...(entry.keywords ?? manifest.keywords ?? [])], 'category, tags, keywords'),
      capabilityType: convention('plugin', 'format'),
      interfaces: convention(['claude_code_plugin', ...(serverTargets.length > 0 ? [`bundles MCP server(s): ${serverTargets.map((s) => s.kind).join(', ')}`] : []), ...components.map((c) => `component: ${c}`)], 'format, .mcp.json, plugin.json component fields'),
      runtime: convention([...new Set(serverTargets.map((s) => (s.kind === 'remote' ? 'hosted service' : `local process (${s.kind.slice(6)})`)))].concat(['Claude Code host']), '.mcp.json commands and urls'),
      setup: native([...new Set(placeholders)].map((name) => ({ name, secret: /token|key|secret/i.test(name), required: true })).concat(Object.keys(manifest.userConfig ?? {}).map((name) => ({ name, secret: Boolean(manifest.userConfig[name].sensitive), required: Boolean(manifest.userConfig[name].required) }))), 'placeholders in MCP configuration, userConfig'),
      dependsOn: native([...serverTargets.map((s) => `${s.kind === 'remote' ? 'remote MCP server' : 'MCP server package'} ${s.target}`), ...(manifest.dependencies ?? []).map((d) => `plugin ${typeof d === 'string' ? d : d.name}`)], 'MCP servers it starts or connects to; plugin dependencies'),
      license: native(license ? { text: license, kind: licenseKind(license) } : null, 'plugin.json license'),
      version: native(version ? { text: version, scheme: versionScheme(version) } : null, 'version'),
      publisher: native({ name: snapshot.marketplace?.owner?.name, verified: `listed in the marketplace ${snapshot.marketplace?.name}` }, 'marketplace owner'),
      maintainer: native(author, 'author.name'),
      sourceRepository: native({ url: `https://github.com/${snapshot.repo}`, path: snapshot.base || null, pin: snapshot.ref }, 'source'),
      documentation: native(entry.homepage ?? manifest.homepage, 'homepage'),
    };
  },

  'docker-mcp-catalog'({ native: snapshot }) {
    const y = snapshot.serverYaml ?? {};
    const config = y.config ?? {};
    const tools = Array.isArray(snapshot.tools) ? snapshot.tools : null;
    const archivedTitle = /archived/i.test(y.about?.title ?? '');
    return {
      nativeName: native(y.name, 'name'),
      displayName: native(y.about?.title, 'about.title'),
      description: native(y.about?.description, 'about.description'),
      useCases: native(tools?.map((tool) => `${tool.name}: ${tool.description ?? ''}`.trim()), 'tools.json (generated by the catalog by running the server)'),
      keywords: native([...new Set([...(y.meta?.category ? [y.meta.category] : []), ...(y.meta?.tags ?? [])])], 'meta.category, meta.tags'),
      capabilityType: convention('mcp_server', 'format'),
      interfaces: convention([y.type === 'remote' ? 'mcp/remote' : 'mcp/stdio'], 'type'),
      runtime: native([y.type === 'remote' ? 'hosted service' : `container image ${y.image}`, ...(y.run?.allowHosts ? [`network egress limited to ${y.run.allowHosts.join(', ')}`] : [])], 'image, run.allowHosts'),
      setup: native([...(config.secrets ?? []).map((s) => ({ name: s.env ?? s.name, secret: true, required: true })), ...(config.env ?? []).filter((e) => !e.value).map((e) => ({ name: e.name, secret: false, required: true })), ...(y.oauth ?? []).map((o) => ({ name: `OAuth ${o.provider}`, secret: true, required: false }))], 'config.secrets, config.env, oauth'),
      version: convention(y.source?.commit ? { text: `commit ${y.source.commit.slice(0, 12)}`, scheme: 'commit-pin' } : null, 'source.commit'),
      lifecycle: archivedTitle ? derived({ state: 'archived', evidence: y.about.title }, 'about.title contains "Archived"') : undefined,
      publisher: convention({ name: 'Docker (catalog operator)', verified: y.image?.startsWith('mcp/') ? 'image built and signed by Docker' : 'image provided by the publisher' }, 'catalog, image namespace'),
      maintainer: derived(githubRepo(y.source?.project)?.split('/')[0], 'owner of source.project'),
      sourceRepository: native(y.source?.project ? { url: y.source.project, path: y.source.directory ?? null, pin: y.source.commit ?? null } : null, 'source.project, source.commit'),
      publications: native(y.image ? [`oci:${y.image}`] : [], 'image'),
      documentation: derived(y.source?.project, 'source.project'),
    };
  },

  'pypi-package'({ native: snapshot }) {
    const info = snapshot.info ?? {};
    const urls = info.project_urls ?? {};
    const repoUrl = Object.values(urls).find((url) => githubRepo(url));
    const statusClassifier = (info.classifiers ?? []).find((c) => c.startsWith('Development Status'));
    const keywords = (info.keywords ?? '').split(/[,\s]+/).map((k) => k.trim()).filter(Boolean);
    const license = info.license_expression ?? info.license;
    const marker = /mcp-name:\s*([A-Za-z0-9.-]+\/[A-Za-z0-9._-]+)/.exec(info.description ?? '');
    return {
      nativeName: native(info.name, 'name'),
      description: native(info.summary, 'summary'),
      keywords: native(keywords, 'keywords'),
      capabilityType: marker ? convention('mcp_server', 'mcp-name marker (verified by the MCP Registry)') : derived('tool', 'format (library)'),
      interfaces: derived(marker ? ['library', 'mcp/stdio'] : ['library'], 'format, mcp-name marker'),
      runtime: native(info.requires_python ? [`Python ${info.requires_python}`] : null, 'requires_python'),
      dependsOn: native((info.requires_dist ?? []).filter((d) => !/extra ==/.test(d)).map((d) => d.split(/[ ;<>=!~[(]/)[0]), 'requires_dist (packages, excluding extras)'),
      license: native(license ? { text: license, kind: licenseKind(license) } : null, info.license_expression ? 'license_expression' : 'license'),
      version: native({ text: info.version, scheme: versionScheme(info.version) }, 'version'),
      lifecycle: statusClassifier ? native({ state: statusClassifier.replace('Development Status :: ', '') }, 'classifier Development Status') : undefined,
      updated: native(snapshot.registry?.latestUploadedAt?.slice(0, 10), 'upload time of the latest release'),
      maintainer: native(info.author || info.maintainer || (info.author_email ? 'authors listed by email only' : null), 'author, maintainer'),
      sourceRepository: native(repoUrl ? { url: repoUrl } : null, 'project_urls'),
      publications: native(marker ? [`mcp-registry:${marker[1]}`] : [], 'mcp-name marker'),
      documentation: native(urls.Documentation ?? urls.documentation ?? urls.Homepage ?? urls.homepage ?? info.home_page, 'project_urls'),
    };
  },

  'github-action'({ name, native: snapshot }) {
    const action = snapshot.actionYml ?? {};
    const required = Object.entries(action.inputs ?? {}).filter(([, input]) => input.required === true || input.required === 'true').map(([key]) => ({ name: key, secret: /key|token|secret/i.test(key), required: true }));
    const secretsOptional = Object.keys(action.inputs ?? {}).filter((key) => /api_key|token|oauth|secret/i.test(key)).map((key) => ({ name: key, secret: true, required: false }));
    const releases = snapshot.releases ?? [];
    return {
      nativeName: native(name, 'repository (actions are referenced as owner/repo@ref)'),
      displayName: native(action.name, 'name'),
      description: native(action.description, 'description'),
      capabilityType: convention('workflow', 'format'),
      interfaces: convention(['github_actions_step'], 'format'),
      runtime: native([`GitHub Actions runner (${action.runs?.using})`], 'runs.using'),
      setup: native([...required, ...secretsOptional.filter((s) => !required.some((r) => r.name === s.name))], 'inputs'),
      version: linked(releases.length > 0 ? { text: releases.map((release) => release.tag).join(', '), scheme: 'git-tag' } : null, 'release tags'),
      updated: linked(releases[0]?.publishedAt?.slice(0, 10), 'latest release'),
      publisher: convention({ name: name.split('/')[0], verified: 'owner of the repository on the forge' }, 'repository owner'),
      maintainer: native(action.author, 'author'),
      sourceRepository: convention({ url: `https://github.com/${name}` }, 'repository'),
      documentation: derived(`https://github.com/${name}`, 'repository'),
    };
  },

  'a2a-agent-card'({ native: card }) {
    const skills = Array.isArray(card.skills) ? card.skills : [];
    const interfaces = Array.isArray(card.supportedInterfaces)
      ? card.supportedInterfaces.map((i) => `a2a/${i.protocolBinding ?? '?'}@${i.protocolVersion ?? '?'}`)
      : card.url ? [`a2a/${card.preferredTransport ?? 'JSONRPC'}@${card.protocolVersion ?? '?'}`] : [];
    return {
      displayName: native(card.name, 'name'),
      description: native(card.description, 'description'),
      useCases: native(skills.map((s) => `${s.name ?? s.id ?? '?'}: ${s.description ?? ''}`.trim()), 'skills[]'),
      keywords: native([...new Set(skills.flatMap((s) => (Array.isArray(s.tags) ? s.tags : [])))], 'skills[].tags'),
      capabilityType: convention('agent', 'format'),
      interfaces: native(interfaces, 'supportedInterfaces, or url and protocolVersion (v0.3)'),
      runtime: convention(interfaces.length > 0 ? ['hosted service'] : null, 'interfaces'),
      setup: native(Object.keys(card.securitySchemes ?? {}).map((name) => ({ name, secret: true, required: true })), 'securitySchemes'),
      version: native(card.version ? { text: String(card.version), scheme: versionScheme(String(card.version)) } : null, 'version'),
      publisher: native(card.provider?.organization ? { name: card.provider.organization, verified: 'self-declared' } : null, 'provider.organization'),
      documentation: native(card.documentationUrl, 'documentationUrl'),
    };
  },
};

export const FORMATS = Object.keys(MAPPINGS);

// Applies the crosswalk to one snapshot record. The result keeps the record's identity fields and
// adds `concepts`: concept key -> { value, prov, from }.
export function extract(record) {
  const map = MAPPINGS[record.format];
  if (!map) throw new Error(`No crosswalk for format '${record.format}'`);
  const concepts = Object.fromEntries(Object.entries(map(record)).filter(([, entry]) => entry !== undefined));
  forge(record, concepts);
  return { ...record, concepts };
}

export { githubRepo };
