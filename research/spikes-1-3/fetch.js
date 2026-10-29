#!/usr/bin/env node
// Snapshots the native metadata of the Spikes 1-3 research sample into research/spikes-1-3/samples,
// following the sampling rule in needs.yaml. It uses the network; analyze.js reads only the snapshot.
// Snapshots are data: nothing in them is executed. Email addresses are redacted.
//
//   GITHUB_TOKEN=<read-only token> node research/spikes-1-3/fetch.js
//
// GITHUB_TOKEN is optional for most calls but needed for GitHub code search (the A2A sample) and
// to stay inside the anonymous API rate limit. It is sent only to api.github.com and never written.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SAMPLES = join(ROOT, 'samples');
const SEED = 20261022;
const MCP_REGISTRY = 'https://registry.modelcontextprotocol.io/v0.1/servers';
const SKILL_REPOS = ['anthropics/skills', 'openai/skills', 'github/awesome-copilot'];
const MARKETPLACE = { repo: 'anthropics/claude-plugins-official', ref: 'main', file: '.claude-plugin/marketplace.json' };
const DOCKER_CATALOG = { repo: 'docker/mcp-registry', ref: 'main' };
const NPM_FIELDS = ['name', 'version', 'description', 'keywords', 'license', 'homepage', 'repository', 'bugs', 'author',
  'maintainers', 'engines', 'bin', 'deprecated', 'dependencies', 'peerDependencies', 'mcpName'];

// Vendor publications of the technology a need names (needs.yaml, sampling rule step 2).
const VENDOR = {
  N1: { label: "Microsoft's Playwright MCP server", registry: /^(com\.microsoft|io\.github\.microsoft)\//i, npm: /^@playwright\//, project: 'github.com/microsoft/playwright-mcp', plugin: 'playwright' },
  N2: { label: "GitHub's MCP server", registry: /^io\.github\.github\//i, npm: /^@github\//, project: 'github.com/github/github-mcp-server', plugin: 'github' },
};
// Purposive additions named in needs.yaml, sampling rule step 3.
const PURPOSIVE = [
  { need: 'N1', kind: 'pypi', name: 'browser-use' },
  { need: 'N3', kind: 'pypi', name: 'langchain-tavily' },
  { need: 'N4', kind: 'pypi', name: 'docling' },
  { need: 'N2', kind: 'action', repo: 'anthropics/claude-code-action', ref: 'main' },
];

const token = process.env.GITHUB_TOKEN;
const failures = [];

// ---------------------------------------------------------------------------------------------
// HTTP helpers

async function request(url, { json = true, github = false, allow404 = false } = {}) {
  const headers = { 'user-agent': 'mission4-spikes-research' };
  if (json) headers.accept = github ? 'application/vnd.github+json' : 'application/json';
  if (github && token) headers.authorization = `Bearer ${token}`;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(60000) });
      if (response.status === 404 && allow404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { body: json ? await response.json() : await response.text(), url: response.url, redirected: response.redirected };
    } catch (error) {
      if (attempt === 3) throw new Error(`${url}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}
const getJson = async (url, options) => (await request(url, options))?.body ?? null;
const getText = async (url, options) => (await request(url, { ...options, json: false }))?.body ?? null;
const gh = (path, options) => getJson(`https://api.github.com/${path}`, { ...options, github: true });
const raw = (repo, ref, file) => getText(`https://raw.githubusercontent.com/${repo}/${ref}/${file.split('/').map(encodeURIComponent).join('/')}`, { allow404: true });

async function pool(items, size, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      try { results[i] = await worker(items[i], i); } catch (error) { results[i] = { error: error.message }; }
    }
  }));
  return results;
}

async function attempt(label, fn) {
  try { return await fn(); } catch (error) { failures.push({ label, error: error.message }); return null; }
}

// ---------------------------------------------------------------------------------------------
// Seeded selection, independent of the order in which sources are processed

function seeded(...parts) {
  let hash = 2166136261;
  for (const char of `${SEED}:${parts.join(':')}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function choose(items, k, random) {
  const copy = [...items];
  const chosen = [];
  while (chosen.length < k && copy.length > 0) chosen.push(copy.splice(Math.floor(random() * copy.length), 1)[0]);
  return chosen;
}

// At most two entries per need from one source: the vendor's publication first, then random draws.
function select(need, source, candidates, isVendor) {
  const vendor = isVendor ? candidates.find(isVendor) : undefined;
  const rest = candidates.filter((candidate) => candidate !== vendor);
  const random = choose(rest, vendor ? 1 : 2, seeded(need.id, source));
  return [
    ...(vendor ? [{ item: vendor, selection: 'purposive', note: `vendor publication: ${VENDOR[need.id].label}` }] : []),
    ...random.map((item) => ({ item, selection: 'random', note: `drawn with seed ${SEED} from ${candidates.length} result(s)` })),
  ];
}

// Whole-word, case-insensitive match of the primary query or any term (multi-word terms as phrases).
function matches(need, text) {
  const terms = [need.primaryQuery, ...need.terms];
  return terms.filter((term) => new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s_-]+')}([^a-z0-9]|$)`, 'i').test(text ?? ''));
}

// ---------------------------------------------------------------------------------------------
// Native formats

// git@host is an SSH remote, not a person, and is kept so that repository URLs still resolve.
function redact(value) {
  if (typeof value === 'string') return value.replace(/[^\s<>()"'`,;:/@]{1,64}@[^\s<>()"'`,;:/@]{1,253}\.[a-z]{2,24}/gi, (match) => (/^git@/i.test(match) ? match : '<redacted-email>'));
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redact(item)]));
  return value;
}

function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text ?? '');
  if (!match) return { frontmatter: null, parseError: 'no front matter' };
  try { return { frontmatter: parseYaml(match[1]) }; } catch (error) { return { frontmatter: null, parseError: error.message.split('\n')[0] }; }
}

function githubRepo(url) {
  const match = /github\.com[/:]([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[/#?].*)?$/i.exec(String(url ?? ''));
  return match ? `${match[1]}/${match[2]}` : null;
}

// Forge metadata for a repository a record declares. The API follows renames and transfers, so
// a changed full_name shows that the declared URL is out of date.
const repoCache = new Map();
async function repository(fullName) {
  if (!fullName) return null;
  const key = fullName.toLowerCase();
  if (!repoCache.has(key)) {
    repoCache.set(key, attempt(`repository ${fullName}`, async () => {
      const repo = await gh(`repos/${fullName}`, { allow404: true });
      if (!repo) return { requested: fullName, found: false };
      return {
        requested: fullName, found: true, id: repo.id, fullName: repo.full_name, renamedOrMoved: repo.full_name.toLowerCase() !== key,
        description: repo.description, license: repo.license?.spdx_id ?? null, archived: repo.archived, fork: repo.fork,
        parent: repo.parent?.full_name ?? null, topics: repo.topics ?? [], defaultBranch: repo.default_branch,
        createdAt: repo.created_at, pushedAt: repo.pushed_at, homepage: repo.homepage || null,
      };
    }));
  }
  return repoCache.get(key);
}

async function npmPackage(name) {
  const latest = await getJson(`https://registry.npmjs.org/${name.replace('/', '%2F')}/latest`, { allow404: true });
  if (!latest) return null;
  const packument = await getJson(`https://registry.npmjs.org/${name.replace('/', '%2F')}`, { allow404: true });
  return redact({
    packageJson: Object.fromEntries(NPM_FIELDS.filter((field) => field in latest).map((field) => [field, latest[field]])),
    registry: {
      modified: packument?.time?.modified ?? null,
      latestPublished: packument?.time?.[latest.version] ?? null,
      created: packument?.time?.created ?? null,
      versionCount: packument ? Object.keys(packument.versions ?? {}).length : null,
      distTags: packument?.['dist-tags'] ?? null,
    },
  });
}

async function pypiPackage(name) {
  const doc = await getJson(`https://pypi.org/pypi/${name}/json`, { allow404: true });
  if (!doc) return null;
  const { info } = doc;
  const files = doc.urls ?? [];
  return redact({
    info: {
      name: info.name, version: info.version, summary: info.summary, keywords: info.keywords, license: info.license,
      license_expression: info.license_expression ?? null, classifiers: info.classifiers, project_urls: info.project_urls,
      home_page: info.home_page, author: info.author, author_email: info.author_email, maintainer: info.maintainer,
      requires_python: info.requires_python, requires_dist: info.requires_dist, yanked: info.yanked,
      descriptionCharacters: info.description?.length ?? 0, description: (info.description ?? '').slice(0, 6000),
    },
    registry: { releaseCount: Object.keys(doc.releases ?? {}).length, latestUploadedAt: files[0]?.upload_time_iso_8601 ?? null },
  });
}

async function mcpEntryByName(name) {
  const page = await getJson(`${MCP_REGISTRY}?search=${encodeURIComponent(name)}&version=latest&limit=100`);
  const entry = page?.servers?.find((candidate) => candidate.server.name === name);
  return entry ? { server: entry.server, registry: entry._meta?.['io.modelcontextprotocol.registry/official'] ?? null } : null;
}

// ---------------------------------------------------------------------------------------------
// Sources

// Random draws come from the first result page, as a searcher sees it. The vendor's publication is
// purposive, so it is looked up on later pages when the first page does not hold it, and the
// rank at which it appears is recorded: it shows how far the registry's own search buries it.
async function mcpRegistry(need) {
  const url = (cursor) => `${MCP_REGISTRY}?search=${encodeURIComponent(need.primaryQuery)}&version=latest&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
  const status = (entry) => entry._meta?.['io.modelcontextprotocol.registry/official']?.status;
  const first = await getJson(url());
  const active = first.servers.filter((entry) => status(entry) === 'active');
  const vendorPattern = VENDOR[need.id]?.registry;
  let vendor = vendorPattern ? first.servers.find((entry) => vendorPattern.test(entry.server.name) && status(entry) === 'active') : undefined;
  let vendorRank = vendor ? first.servers.indexOf(vendor) + 1 : null;
  let seen = first.servers.length;
  let cursor = first.metadata?.nextCursor;
  for (let pages = 1; vendorPattern && !vendor && cursor && pages < 30; pages += 1) {
    const page = await getJson(url(cursor));
    const found = page.servers.find((entry) => vendorPattern.test(entry.server.name) && status(entry) === 'active');
    if (found) { vendor = found; vendorRank = seen + page.servers.indexOf(found) + 1; }
    seen += page.servers.length;
    cursor = page.metadata?.nextCursor;
  }
  const candidates = vendor && !active.includes(vendor) ? [vendor, ...active] : active;
  const picks = select(need, 'mcp-registry', candidates, vendor ? (entry) => entry === vendor : null);
  return {
    results: {
      query: `search=${need.primaryQuery}`, returned: first.servers.length, active: active.length, hasMorePages: Boolean(first.metadata?.nextCursor),
      vendor: vendorPattern ? { found: Boolean(vendor), name: vendor?.server.name ?? null, rankInResults: vendorRank, onFirstPage: Boolean(vendorRank && vendorRank <= first.servers.length) } : null,
      names: first.servers.map((entry) => entry.server.name),
    },
    picks: await Promise.all(picks.map(async ({ item, selection, note }) => ({
      format: 'mcp-server-json', name: item.server.name, selection, note,
      sourceUrl: `${MCP_REGISTRY}?search=${encodeURIComponent(item.server.name)}&version=latest`,
      native: redact({ server: item.server, registry: item._meta?.['io.modelcontextprotocol.registry/official'] ?? null }),
      linked: { repository: await repository(githubRepo(item.server.repository?.url)) },
    }))),
  };
}

async function npm(need) {
  const text = `${need.primaryQuery} mcp`;
  const page = await getJson(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(text)}&size=20`);
  const results = page.objects.map((object) => object.package);
  const vendorPattern = VENDOR[need.id]?.npm;
  let vendor = vendorPattern ? results.find((pkg) => vendorPattern.test(pkg.name)) : undefined;
  let vendorRank = vendor ? results.indexOf(vendor) + 1 : null;
  if (vendorPattern && !vendor) {
    const deeper = (await getJson(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(text)}&size=250`)).objects.map((object) => object.package);
    vendor = deeper.find((pkg) => vendorPattern.test(pkg.name));
    vendorRank = vendor ? deeper.indexOf(vendor) + 1 : null;
  }
  const candidates = vendor && !results.includes(vendor) ? [vendor, ...results] : results;
  const picks = select(need, 'npm', candidates, vendor ? (pkg) => pkg === vendor : null);
  return {
    results: {
      query: text, total: page.total,
      vendor: vendorPattern ? { found: Boolean(vendor), name: vendor?.name ?? null, rankInResults: vendorRank } : null,
      names: results.map((pkg) => `${pkg.name}@${pkg.version}`),
    },
    picks: await Promise.all(picks.map(async ({ item, selection, note }) => {
      const native = await npmPackage(item.name);
      const declared = native?.packageJson?.repository;
      return {
        format: 'npm-package', name: item.name, selection, note, sourceUrl: `https://www.npmjs.com/package/${item.name}`,
        native, linked: { repository: await repository(githubRepo(declared?.url ?? declared)) },
      };
    })),
  };
}

let skillListing;
async function loadSkills() {
  if (skillListing) return skillListing;
  const entries = [];
  for (const repo of SKILL_REPOS) {
    const meta = await gh(`repos/${repo}`);
    const tree = await gh(`repos/${repo}/git/trees/${meta.default_branch}?recursive=1`);
    const blobs = tree.tree.filter((item) => item.type === 'blob').map((item) => item.path);
    const skillFiles = blobs.filter((file) => /(^|\/)SKILL\.md$/.test(file));
    const texts = await pool(skillFiles, 12, (file) => raw(repo, meta.default_branch, file));
    skillFiles.forEach((file, i) => {
      const dir = file.replace(/\/?SKILL\.md$/, '');
      const parsed = frontmatter(typeof texts[i] === 'string' ? texts[i] : '');
      entries.push({
        repo, ref: meta.default_branch, file, dir, text: texts[i], ...parsed,
        name: parsed.frontmatter?.name ?? dir.split('/').pop(),
        licenseFiles: blobs.filter((other) => other.startsWith(`${dir}/`) && /^LICENSE/i.test(other.slice(dir.length + 1))),
      });
    });
  }
  skillListing = entries;
  return entries;
}

async function skills(need) {
  const all = await loadSkills();
  const matching = all.filter((entry) => matches(need, `${entry.name} ${entry.frontmatter?.description ?? ''}`).length > 0);
  const picks = select(need, 'agent-skills', matching, null);
  return {
    results: { query: 'name or description contains a term', listed: all.length, matched: matching.length, names: matching.map((entry) => `${entry.repo}:${entry.dir}`) },
    picks: await Promise.all(picks.map(async ({ item, selection, note }) => {
      const [commit] = (await attempt(`commits ${item.repo}/${item.file}`, () => gh(`repos/${item.repo}/commits?path=${encodeURIComponent(item.file)}&per_page=1`))) ?? [];
      return {
        format: 'agent-skill', name: item.name, selection, note,
        sourceUrl: `https://github.com/${item.repo}/blob/${item.ref}/${item.file}`,
        native: redact({
          frontmatter: item.frontmatter, parseError: item.parseError ?? null,
          bodyCharacters: (item.text?.length ?? 0), repository: `https://github.com/${item.repo}`, path: item.dir,
          licenseFiles: item.licenseFiles, lastCommitDate: commit?.commit?.committer?.date ?? null,
        }),
        linked: { repository: await repository(item.repo) },
      };
    })),
  };
}

let marketplace;
async function plugins(need) {
  marketplace ??= JSON.parse(await raw(MARKETPLACE.repo, MARKETPLACE.ref, MARKETPLACE.file));
  const matching = marketplace.plugins.filter((plugin) => matches(need, `${plugin.name} ${plugin.displayName ?? ''} ${plugin.description ?? ''}`).length > 0);
  const vendorName = VENDOR[need.id]?.plugin;
  const picks = select(need, 'claude-plugins', matching, vendorName ? (plugin) => plugin.name === vendorName : null);
  return {
    results: { query: 'name, displayName, or description contains a term', listed: marketplace.plugins.length, matched: matching.length, names: matching.map((plugin) => plugin.name) },
    picks: await Promise.all(picks.map(async ({ item, selection, note }) => {
      const files = await pluginFiles(item.source);
      return {
        format: 'claude-plugin', name: item.name, selection, note,
        sourceUrl: `https://github.com/${MARKETPLACE.repo}/blob/${MARKETPLACE.ref}/${MARKETPLACE.file}`,
        native: redact({ marketplaceEntry: item, marketplace: { name: marketplace.name, owner: marketplace.owner }, ...files }),
        linked: { repository: await repository(files.repo) },
      };
    })),
  };
}

// The plugin's own manifest and MCP configuration, wherever its source points.
async function pluginFiles(source) {
  let repo = MARKETPLACE.repo;
  let ref = MARKETPLACE.ref;
  let base = '';
  if (typeof source === 'string') base = source.replace(/^\.\//, '');
  else if (source.source === 'url' || source.source === 'git-subdir' || source.source === 'github') {
    repo = githubRepo(source.url ?? `github.com/${source.repo}`);
    ref = source.sha ?? source.ref ?? 'HEAD';
    base = source.path ?? '';
  }
  const at = (file) => (base ? `${base}/${file}` : file);
  const manifest = await attempt(`plugin.json ${repo}/${at('.claude-plugin/plugin.json')}`, () => raw(repo, ref, at('.claude-plugin/plugin.json')));
  const mcp = await attempt(`.mcp.json ${repo}/${at('.mcp.json')}`, () => raw(repo, ref, at('.mcp.json')));
  const parse = (text) => { try { return text ? JSON.parse(text) : null; } catch { return { unparsable: true }; } };
  return { repo, ref, base, pluginJson: parse(manifest), mcpJson: parse(mcp) };
}

let dockerCatalog;
async function loadDocker() {
  if (dockerCatalog) return dockerCatalog;
  const tree = await gh(`repos/${DOCKER_CATALOG.repo}/git/trees/${DOCKER_CATALOG.ref}?recursive=1`);
  const blobs = new Set(tree.tree.filter((item) => item.type === 'blob').map((item) => item.path));
  const files = [...blobs].filter((file) => /^servers\/[^/]+\/server\.yaml$/.test(file)).sort();
  const texts = await pool(files, 12, (file) => raw(DOCKER_CATALOG.repo, DOCKER_CATALOG.ref, file));
  dockerCatalog = files.map((file, i) => {
    let entry = null;
    try { entry = parseYaml(texts[i]); } catch { entry = null; }
    const dir = file.replace(/\/server\.yaml$/, '');
    return { file, dir, entry, hasTools: blobs.has(`${dir}/tools.json`), hasReadme: blobs.has(`${dir}/readme.md`) };
  }).filter((item) => item.entry);
  return dockerCatalog;
}

async function docker(need) {
  const all = await loadDocker();
  const text = ({ entry }) => `${entry.name} ${entry.about?.title ?? ''} ${entry.about?.description ?? ''}`;
  const matching = all.filter((item) => matches(need, text(item)).length > 0);
  const project = VENDOR[need.id]?.project;
  const picks = select(need, 'docker-catalog', matching, project ? (item) => String(item.entry.source?.project ?? '').toLowerCase().includes(project) : null);
  return {
    results: { query: 'name, title, or description contains a term', listed: all.length, matched: matching.length, names: matching.map((item) => item.entry.name) },
    picks: await Promise.all(picks.map(async ({ item, selection, note }) => {
      const tools = item.hasTools ? await attempt(`tools.json ${item.dir}`, () => raw(DOCKER_CATALOG.repo, DOCKER_CATALOG.ref, `${item.dir}/tools.json`)) : null;
      let toolList = null;
      try { toolList = tools ? JSON.parse(tools) : null; } catch { toolList = null; }
      return {
        format: 'docker-mcp-catalog', name: item.entry.name, selection, note,
        sourceUrl: `https://github.com/${DOCKER_CATALOG.repo}/blob/${DOCKER_CATALOG.ref}/${item.file}`,
        native: redact({ serverYaml: item.entry, tools: toolList }),
        linked: { repository: await repository(githubRepo(item.entry.source?.project)) },
      };
    })),
  };
}

async function purposive(entry) {
  if (entry.kind === 'pypi') {
    const native = await pypiPackage(entry.name);
    const urls = Object.values(native?.info?.project_urls ?? {});
    return {
      format: 'pypi-package', name: entry.name, selection: 'purposive', note: 'framework integration named in needs.yaml',
      sourceUrl: `https://pypi.org/project/${entry.name}/`, native,
      linked: { repository: await repository(urls.map(githubRepo).find(Boolean)) },
    };
  }
  const meta = await gh(`repos/${entry.repo}`);
  const actionYml = (await raw(entry.repo, entry.ref, 'action.yml')) ?? (await raw(entry.repo, entry.ref, 'action.yaml'));
  const releases = await attempt(`releases ${entry.repo}`, () => gh(`repos/${entry.repo}/releases?per_page=3`));
  return {
    format: 'github-action', name: entry.repo, selection: 'purposive', note: 'GitHub Actions workflow named in needs.yaml',
    sourceUrl: `https://github.com/${entry.repo}/blob/${entry.ref}/action.yml`,
    native: redact({ actionYml: parseYaml(actionYml), releases: (releases ?? []).map((release) => ({ tag: release.tag_name, publishedAt: release.published_at })) }),
    linked: { repository: await repository(meta.full_name) },
  };
}

// Publications that a selected record declares of itself (needs.yaml, sampling rule step 4).
async function crossListings(record) {
  const found = [];
  const add = (format, name, native, note, sourceUrl) => native && found.push({ format, name, selection: 'cross-listing', note, sourceUrl, native });
  if (record.format === 'mcp-server-json') {
    for (const pkg of record.native.server.packages ?? []) {
      if (pkg.registryType === 'npm') add('npm-package', pkg.identifier, await attempt(`npm ${pkg.identifier}`, () => npmPackage(pkg.identifier)), `package declared by ${record.name}`, `https://www.npmjs.com/package/${pkg.identifier}`);
      if (pkg.registryType === 'pypi') add('pypi-package', pkg.identifier, await attempt(`pypi ${pkg.identifier}`, () => pypiPackage(pkg.identifier)), `package declared by ${record.name}`, `https://pypi.org/project/${pkg.identifier}/`);
    }
  }
  if (record.format === 'npm-package' && record.native?.packageJson?.mcpName) {
    const name = record.native.packageJson.mcpName;
    add('mcp-server-json', name, await attempt(`mcp ${name}`, () => mcpEntryByName(name)), `mcpName declared by ${record.name}`, `${MCP_REGISTRY}?search=${encodeURIComponent(name)}&version=latest`);
  }
  if (record.format === 'claude-plugin') {
    for (const server of Object.values(record.native.mcpJson?.mcpServers ?? record.native.mcpJson ?? {})) {
      const args = Array.isArray(server?.args) ? server.args : [];
      const spec = server?.command === 'npx' ? args.find((arg) => !arg.startsWith('-')) : null;
      const name = spec?.replace(/@[^@/]+$/, '');
      if (name) add('npm-package', name, await attempt(`npm ${name}`, () => npmPackage(name)), `npm package run by plugin ${record.name}`, `https://www.npmjs.com/package/${name}`);
    }
  }
  if (record.format === 'pypi-package') {
    const marker = /mcp-name:\s*([A-Za-z0-9.-]+\/[A-Za-z0-9._-]+)/.exec(record.native?.info?.description ?? '');
    if (marker) add('mcp-server-json', marker[1], await attempt(`mcp ${marker[1]}`, () => mcpEntryByName(marker[1])), `mcp-name marker in ${record.name}`, `${MCP_REGISTRY}?search=${encodeURIComponent(marker[1])}&version=latest`);
  }
  for (const item of found) {
    const repo = item.format === 'npm-package' ? githubRepo(item.native.packageJson?.repository?.url ?? item.native.packageJson?.repository)
      : item.format === 'mcp-server-json' ? githubRepo(item.native.server?.repository?.url)
        : githubRepo(Object.values(item.native.info?.project_urls ?? {}).find((url) => githubRepo(url)));
    item.linked = { repository: await repository(repo) };
  }
  return found;
}

async function a2aSample() {
  const search = await gh('search/code?q=filename%3Aagent-card.json&per_page=50');
  const files = search.items.filter((item) => item.path.split('/').pop() === 'agent-card.json');
  const cards = await pool(files, 6, async (item) => {
    // html_url pins the commit the search indexed: https://github.com/<repo>/blob/<sha>/<path>
    const text = await getText(item.html_url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/'), { allow404: true });
    let card = null;
    let parseError = null;
    try { card = JSON.parse(text); } catch (error) { parseError = error.message; }
    return { repo: item.repository.full_name, path: item.path, htmlUrl: item.html_url, card: redact(card), parseError };
  });
  return { query: 'filename:agent-card.json', totalCount: search.total_count, resultCount: search.items.length, jsonFiles: files.length, cards };
}

// ---------------------------------------------------------------------------------------------

const { needs } = parseYaml(readFileSync(join(ROOT, 'needs.yaml'), 'utf8'));
const retrievedAt = new Date().toISOString();
const index = { retrievedAt, seed: SEED, rule: 'needs.yaml, sampling rule', sources: {}, records: [], failures };
const records = [];

for (const need of needs) {
  index.sources[need.id] = {};
  for (const [source, run] of Object.entries({ 'mcp-registry': mcpRegistry, npm, 'agent-skills': skills, 'claude-plugins': plugins, 'docker-catalog': docker })) {
    const result = await attempt(`${need.id} ${source}`, () => run(need));
    if (!result) continue;
    index.sources[need.id][source] = result.results;
    for (const pick of result.picks) records.push({ need: need.id, source, ...pick });
  }
}
for (const entry of PURPOSIVE) {
  const record = await attempt(`purposive ${entry.name ?? entry.repo}`, () => purposive(entry));
  if (record) records.push({ need: entry.need, source: entry.kind === 'pypi' ? 'pypi' : 'github-actions', ...record });
}
for (const record of [...records]) {
  for (const listing of (await attempt(`cross-listings ${record.name}`, () => crossListings(record))) ?? []) {
    const duplicate = records.some((other) => other.format === listing.format && other.name.toLowerCase() === listing.name.toLowerCase());
    if (!duplicate) records.push({ need: record.need, source: listing.format, crossListingOf: record.name, ...listing });
  }
}
const a2a = await attempt('a2a code search', a2aSample);

rmSync(SAMPLES, { recursive: true, force: true });
mkdirSync(join(SAMPLES, 'records'), { recursive: true });
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
records.forEach((record, i) => {
  const ref = `${record.need}-${String(i + 1).padStart(2, '0')}`;
  const file = `records/${ref}-${slug(record.name)}.json`;
  writeFileSync(join(SAMPLES, file), `${JSON.stringify({ ref, retrievedAt, ...record }, null, 2)}\n`);
  index.records.push({ ref, file, need: record.need, source: record.source, format: record.format, name: record.name, selection: record.selection, note: record.note, crossListingOf: record.crossListingOf ?? null });
});
if (a2a) writeFileSync(join(SAMPLES, 'a2a-cards.json'), `${JSON.stringify({ retrievedAt, ...a2a }, null, 2)}\n`);
writeFileSync(join(SAMPLES, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);

console.log(`Snapshotted ${records.length} records (${retrievedAt}); A2A cards: ${a2a?.cards?.length ?? 'not retrieved'}; failures: ${failures.length}`);
for (const failure of failures) console.log(`  FAILED ${failure.label}: ${failure.error}`);
for (const record of index.records) console.log(`  ${record.ref.padEnd(6)} ${record.source.padEnd(15)} ${record.selection.padEnd(13)} ${record.name}`);
