#!/usr/bin/env node
// Supplementary evidence for the Spikes 1-3 research, gathered after fetch.js without changing its
// sample. It writes samples/supplementary.json and one added record (see README "Deviations"):
//   1. documentation text for every sampled record (repository README, npm or PyPI long
//      description, SKILL.md body): used to judge relevance and to test README-derived metadata;
//   2. GitHub's own MCP Registry entry, which fetch.js did not reach within 30 result pages;
//   3. identity and lifecycle cases for Spike 3, collected purposively and labelled as such.
// It uses the network. Email addresses are redacted; nothing fetched is executed.
//
//   GITHUB_TOKEN=<read-only token> node research/spikes-1-3/fetch-supplementary.js

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SAMPLES = join(ROOT, 'samples');
const MCP_REGISTRY = 'https://registry.modelcontextprotocol.io/v0.1/servers';
const token = process.env.GITHUB_TOKEN;
const failures = [];
const TEXT_LIMIT = 12000;

async function request(url, { json = true, github = false } = {}) {
  const headers = { 'user-agent': 'mission4-spikes-research' };
  if (json) headers.accept = github ? 'application/vnd.github+json' : 'application/json';
  if (github && token) headers.authorization = `Bearer ${token}`;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(60000) });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return json ? response.json() : response.text();
    } catch (error) {
      if (attempt === 3) throw new Error(`${url}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}
const gh = (path) => request(`https://api.github.com/${path}`, { github: true });
const raw = (repo, ref, file) => request(`https://raw.githubusercontent.com/${repo}/${ref}/${file}`, { json: false });
const sha256 = (text) => createHash('sha256').update(text ?? '').digest('hex');
const redact = (text) => (text ?? '').replace(/[^\s<>()"'`,;:/@]{1,64}@[^\s<>()"'`,;:/@]{1,253}\.[a-z]{2,24}/gi, (match) => (/^git@/i.test(match) ? match : '<redacted-email>'));
async function attempt(label, fn) {
  try { return await fn(); } catch (error) { failures.push({ label, error: error.message }); return null; }
}
const githubRepo = (url) => {
  const match = /github\.com[/:]([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[/#?].*)?$/i.exec(String(url ?? ''));
  return match ? `${match[1]}/${match[2]}` : null;
};
const excerpt = (text, source) => (text ? { source, characters: text.length, sha256: sha256(text), text: redact(text.slice(0, TEXT_LIMIT)) } : null);

async function repoReadme(fullName) {
  if (!fullName) return null;
  const readme = await gh(`repos/${fullName}/readme`);
  return readme ? excerpt(Buffer.from(readme.content, 'base64').toString('utf8'), `https://github.com/${fullName}/blob/HEAD/${readme.path}`) : null;
}

// Documentation for one record: the most specific text available for that publication.
async function documentation(record) {
  const { format, native } = record;
  if (format === 'agent-skill') {
    const repo = githubRepo(native.repository);
    const text = await raw(repo, 'HEAD', `${native.path}/SKILL.md`);
    const body = text?.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
    const licenses = await Promise.all((native.licenseFiles ?? []).map(async (file) => excerpt(await raw(repo, 'HEAD', file), `https://github.com/${repo}/blob/HEAD/${file}`)));
    return { doc: excerpt(body, record.sourceUrl), skillFileSha256: sha256(text), skillBodySha256: sha256(body?.trim()), licenseTexts: licenses.filter(Boolean) };
  }
  if (format === 'npm-package') {
    const packument = await request(`https://registry.npmjs.org/${record.name.replace('/', '%2F')}`);
    const fromRegistry = packument?.readme && packument.readme !== 'ERROR: No README data found!' ? excerpt(packument.readme, `https://www.npmjs.com/package/${record.name}`) : null;
    return { doc: fromRegistry ?? (await repoReadme(record.linked?.repository?.fullName)) };
  }
  if (format === 'pypi-package') {
    const doc = await request(`https://pypi.org/pypi/${record.name}/json`);
    return { doc: excerpt(doc?.info?.description, `https://pypi.org/project/${record.name}/`) };
  }
  if (format === 'claude-plugin') {
    const repo = record.native.repo;
    const base = record.native.base ? `${record.native.base}/` : '';
    const text = await raw(repo, record.native.ref, `${base}README.md`);
    return { doc: excerpt(text, `https://github.com/${repo}/blob/${record.native.ref}/${base}README.md`) ?? (await repoReadme(record.linked?.repository?.fullName)) };
  }
  if (format === 'docker-mcp-catalog') {
    const dir = record.sourceUrl.split('/blob/main/')[1].replace(/\/server\.yaml$/, '');
    const local = await raw('docker/mcp-registry', 'main', `${dir}/readme.md`);
    return { doc: excerpt(local, `https://github.com/docker/mcp-registry/blob/main/${dir}/readme.md`) ?? (await repoReadme(record.linked?.repository?.fullName)) };
  }
  return { doc: await repoReadme(record.linked?.repository?.fullName) };
}

// GitHub's MCP Registry entry, and where it ranks in the registry's own search for "github".
async function githubVendorEntry() {
  let rank = 0;
  let pages = 0;
  let cursor = null;
  let found = null;
  do {
    const page = await request(`${MCP_REGISTRY}?search=github&version=latest&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    pages += 1;
    for (const entry of page.servers) {
      rank += 1;
      if (/^io\.github\.github\//i.test(entry.server.name) && !found) found = { entry, rank, page: pages };
    }
    cursor = page.metadata?.nextCursor;
  } while (cursor && pages < 1000);
  return { found, totalResults: rank, pagesScanned: pages };
}

async function npmLatest(name) {
  const latest = await request(`https://registry.npmjs.org/${name.replace('/', '%2F')}/latest`);
  return latest ? { name: latest.name, version: latest.version, description: latest.description, deprecated: latest.deprecated ?? null, repository: latest.repository ?? null, mcpName: latest.mcpName ?? null } : null;
}

async function repoMeta(fullName) {
  const repo = await gh(`repos/${fullName}`);
  return repo ? { requested: fullName, id: repo.id, fullName: repo.full_name, archived: repo.archived, description: repo.description, license: repo.license?.spdx_id ?? null, pushedAt: repo.pushed_at } : { requested: fullName, found: false };
}

// Every registry entry a search returns, reduced to the links that can tie entries together.
async function registryFamily(query) {
  const page = await request(`${MCP_REGISTRY}?search=${encodeURIComponent(query)}&version=latest&limit=100`);
  return page.servers.map(({ server, _meta: meta }) => ({
    name: server.name, title: server.title ?? null, description: server.description, version: server.version,
    status: meta?.['io.modelcontextprotocol.registry/official']?.status ?? null,
    repository: server.repository?.url ?? null,
    packages: (server.packages ?? []).map((pkg) => `${pkg.registryType}:${pkg.identifier}`),
    remotes: (server.remotes ?? []).map((remote) => remote.url),
  }));
}

async function identityCases() {
  const cases = {};
  cases.skillNameCollision = {
    label: "Two publishers' skills with the same native name 'pdf'",
    entries: await Promise.all([['anthropics/skills', 'skills/pdf'], ['openai/skills', 'skills/.curated/pdf']].map(async ([repo, dir]) => {
      const text = await raw(repo, 'HEAD', `${dir}/SKILL.md`);
      const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text ?? '');
      const license = (await raw(repo, 'HEAD', `${dir}/LICENSE.txt`)) ?? (await raw(repo, 'HEAD', `${dir}/LICENSE.TXT`));
      return { repo, dir, frontmatter: match ? parseYaml(match[1]) : null, skillFileSha256: sha256(text), licenseFirstLine: license?.split('\n').find((line) => line.trim()) ?? null, licenseCharacters: license?.length ?? 0 };
    })),
  };
  cases.skillCopy = {
    label: "The same skill text in two repositories (anthropics/skills and github/awesome-copilot 'webapp-testing')",
    entries: await Promise.all([['anthropics/skills', 'skills/webapp-testing'], ['github/awesome-copilot', 'skills/webapp-testing']].map(async ([repo, dir]) => {
      const tree = await gh(`repos/${repo}/contents/${dir}`);
      const text = await raw(repo, 'HEAD', `${dir}/SKILL.md`);
      const body = text?.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
      const license = await raw(repo, 'HEAD', `${dir}/LICENSE.txt`);
      return { repo, dir, files: (tree ?? []).map((item) => item.name), skillFileSha256: sha256(text), skillBodySha256: sha256(body), bodyCharacters: body?.length ?? 0, licenseFirstLine: license?.split('\n').find((line) => line.trim()) ?? null };
    })),
  };
  cases.referenceServersArchived = {
    label: 'MCP reference servers moved to an archive repository and deprecated on npm',
    npm: await Promise.all(['@modelcontextprotocol/server-github', '@modelcontextprotocol/server-brave-search', '@modelcontextprotocol/server-puppeteer', '@modelcontextprotocol/server-pdf', '@brave/brave-search-mcp-server'].map((name) => attempt(`npm ${name}`, () => npmLatest(name)))),
    repositories: await Promise.all(['modelcontextprotocol/servers', 'modelcontextprotocol/servers-archived', 'github/github-mcp-server', 'brave/brave-search-mcp-server'].map((name) => attempt(`repo ${name}`, () => repoMeta(name)))),
    dockerEntries: await Promise.all(['github', 'puppeteer', 'brave'].map(async (name) => ({ name, serverYaml: parseYaml((await raw('docker/mcp-registry', 'main', `servers/${name}/server.yaml`)) ?? 'null') }))),
  };
  const marketplace = JSON.parse(await raw('anthropics/claude-plugins-official', 'main', '.claude-plugin/marketplace.json'));
  cases.marketplaceRenames = { label: 'Plugin renames recorded by the official Claude Code marketplace', renames: marketplace.renames ?? null, pluginCount: marketplace.plugins.length, withVersion: marketplace.plugins.filter((plugin) => plugin.version).length };
  const readme = await raw('openai/skills', 'HEAD', 'README.md');
  cases.repositoryDeprecatedInProse = { label: 'A skills repository deprecated by a README notice only', repository: await repoMeta('openai/skills'), readmeNotice: readme?.split('\n').slice(0, 3).join('\n') ?? null, successor: await repoMeta('openai/plugins') };
  cases.registryFamilies = {
    label: 'All official MCP Registry entries returned for a technology name, with their declared links',
    playwright: await registryFamily('playwright'),
    tavily: await registryFamily('tavily'),
    'brave-search': await registryFamily('brave'),
  };
  return cases;
}

// -----------------------------------------------------------------------------------------------

const recordsDir = join(SAMPLES, 'records');
const files = readdirSync(recordsDir).filter((file) => file.endsWith('.json')).sort();
const records = files.map((file) => ({ file, ...JSON.parse(readFileSync(join(recordsDir, file), 'utf8')) }));
const supplementary = { retrievedAt: new Date().toISOString(), documentation: {}, deviations: [], identityCases: null, failures };

const vendor = await attempt('github vendor entry', githubVendorEntry);
if (vendor?.found) {
  const { entry, rank, page } = vendor.found;
  const repo = githubRepo(entry.server.repository?.url);
  const repoInfo = repo ? await attempt(`repo ${repo}`, () => gh(`repos/${repo}`)) : null;
  const ref = 'N2-50';
  const record = {
    ref, retrievedAt: supplementary.retrievedAt, need: 'N2', source: 'mcp-registry', format: 'mcp-server-json', name: entry.server.name,
    selection: 'purposive', note: `vendor publication: GitHub's MCP server; rank ${rank} of ${vendor.totalResults} results for search=github (page ${page} of ${vendor.pagesScanned})`,
    sourceUrl: `${MCP_REGISTRY}?search=${encodeURIComponent(entry.server.name)}&version=latest`,
    native: JSON.parse(redact(JSON.stringify({ server: entry.server, registry: entry._meta?.['io.modelcontextprotocol.registry/official'] ?? null }))),
    linked: { repository: repoInfo ? { requested: repo, found: true, id: repoInfo.id, fullName: repoInfo.full_name, renamedOrMoved: repoInfo.full_name.toLowerCase() !== repo.toLowerCase(), description: repoInfo.description, license: repoInfo.license?.spdx_id ?? null, archived: repoInfo.archived, fork: repoInfo.fork, parent: repoInfo.parent?.full_name ?? null, topics: repoInfo.topics ?? [], defaultBranch: repoInfo.default_branch, createdAt: repoInfo.created_at, pushedAt: repoInfo.pushed_at, homepage: repoInfo.homepage || null } : null },
  };
  writeFileSync(join(recordsDir, `${ref}-${entry.server.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`), `${JSON.stringify(record, null, 2)}\n`);
  records.push(record);
  supplementary.deviations.push({ id: 'D-registry-page-cap', record: ref, detail: `fetch.js stopped after 30 result pages; GitHub's entry is at rank ${rank} of ${vendor.totalResults}, so it was added here as the purposive N2 registry entry that the sampling rule calls for.` });
}
supplementary.githubVendorSearch = vendor ? { name: vendor.found?.entry.server.name ?? null, rank: vendor.found?.rank ?? null, totalResults: vendor.totalResults, pagesScanned: vendor.pagesScanned } : null;

for (const record of records) {
  supplementary.documentation[record.ref] = await attempt(`documentation ${record.ref}`, () => documentation(record));
}
supplementary.identityCases = await attempt('identity cases', identityCases);

writeFileSync(join(SAMPLES, 'supplementary.json'), `${JSON.stringify(supplementary, null, 2)}\n`);
const documented = Object.values(supplementary.documentation).filter((entry) => entry?.doc).length;
console.log(`Documentation for ${documented} of ${records.length} records; GitHub vendor entry: ${JSON.stringify(supplementary.githubVendorSearch)}; failures: ${failures.length}`);
for (const failure of failures) console.log(`  FAILED ${failure.label}: ${failure.error}`);
