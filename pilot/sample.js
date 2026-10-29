#!/usr/bin/env node
// Draws a reproducible random sample of public AI capabilities and snapshots their native
// metadata into pilot/samples/, for the journey pilot (docs/journey-pilot.md).
//
// It uses the network, so it is run only to refresh the sample; the analysis reads the snapshot.
// Snapshots are data: nothing in them is executed. Email addresses are redacted.
//
//   node pilot/sample.js [--seed <n>] [--per-source <n>]

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parse as parseYaml } from 'yaml';

const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), 'samples');
const MCP_REGISTRY = 'https://registry.modelcontextprotocol.io/v0.1/servers?limit=100&version=latest';
const SKILLS_REPO = 'anthropics/skills';
const NPM_SEARCH = 'https://registry.npmjs.org/-/v1/search?text=keywords:ai-agent';
const NPM_MAX_OFFSET = 5000; // npm search does not page further
const NPM_FIELDS = ['name', 'version', 'description', 'keywords', 'license', 'homepage', 'repository', 'bugs', 'author', 'maintainers', 'engines', 'bin', 'deprecated', 'dependencies', 'peerDependencies'];

const { values } = parseArgs({ options: { seed: { type: 'string', default: '20261022' }, 'per-source': { type: 'string', default: '4' } } });
const seed = Number(values.seed);
const perSource = Number(values['per-source']);
const random = mulberry32(seed);

async function getJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

async function getText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
}

// Uniform sample of `k` items from a stream of unknown length (reservoir sampling).
async function sampleMcpServers(k) {
  const reservoir = [];
  let seen = 0;
  let cursor = null;
  do {
    const page = await getJson(MCP_REGISTRY + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''));
    for (const entry of page.servers) {
      const registry = entry._meta?.['io.modelcontextprotocol.registry/official'];
      if (registry?.status !== 'active') continue;
      const slot = seen < k ? seen : Math.floor(random() * (seen + 1));
      if (slot < k) reservoir[slot] = { server: entry.server, registry };
      seen += 1;
    }
    cursor = page.metadata?.nextCursor;
    await new Promise((resolve) => setTimeout(resolve, 50)); // be polite to the public registry
  } while (cursor);
  return {
    pool: { description: 'Official MCP Registry, latest version of every active server', endpoint: MCP_REGISTRY, size: seen },
    picks: reservoir.map((entry) => ({
      format: 'mcp-server-json',
      name: entry.server.name,
      sourceUrl: `https://registry.modelcontextprotocol.io/v0.1/servers?search=${encodeURIComponent(entry.server.name)}&version=latest`,
      snapshot: entry,
    })),
  };
}

async function sampleSkills(k) {
  const listing = await getJson(`https://api.github.com/repos/${SKILLS_REPO}/contents/skills`);
  const names = listing.filter((item) => item.type === 'dir').map((item) => item.name).sort();
  const picks = [];
  for (const name of choose(names, k)) {
    const path = `skills/${name}/SKILL.md`;
    const text = await getText(`https://raw.githubusercontent.com/${SKILLS_REPO}/main/${path}`);
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
    const [commit] = await getJson(`https://api.github.com/repos/${SKILLS_REPO}/commits?path=${encodeURIComponent(path)}&per_page=1`);
    picks.push({
      format: 'agent-skill',
      name,
      sourceUrl: `https://github.com/${SKILLS_REPO}/blob/main/${path}`,
      snapshot: {
        frontmatter: match ? parseYaml(match[1]) : null,
        bodyCharacters: text.length - (match?.[0].length ?? 0),
        repository: `https://github.com/${SKILLS_REPO}`,
        path: `skills/${name}`,
        lastCommitDate: commit?.commit?.committer?.date ?? null,
      },
    });
  }
  return { pool: { description: `Skills in github.com/${SKILLS_REPO}`, endpoint: `https://github.com/${SKILLS_REPO}/tree/main/skills`, size: names.length }, picks };
}

async function sampleNpm(k) {
  const { total } = await getJson(`${NPM_SEARCH}&size=1`);
  const size = Math.min(total, NPM_MAX_OFFSET);
  const offsets = choose(Array.from({ length: size }, (_, i) => i), k);
  const picks = [];
  for (const offset of offsets) {
    const { objects } = await getJson(`${NPM_SEARCH}&size=1&from=${offset}`);
    const result = objects[0].package;
    const latest = await getJson(`https://registry.npmjs.org/${result.name.replace('/', '%2F')}/latest`);
    picks.push({
      format: 'npm-package',
      name: result.name,
      sourceUrl: `https://www.npmjs.com/package/${result.name}`,
      snapshot: redact({
        packageJson: Object.fromEntries(NPM_FIELDS.filter((field) => field in latest).map((field) => [field, latest[field]])),
        registry: { lastPublished: result.date, links: result.links, searchOffset: offset },
      }),
    });
  }
  return { pool: { description: 'npm packages with the keyword ai-agent, in npm search order (first 5,000)', endpoint: NPM_SEARCH, size, total }, picks };
}

function choose(items, k) {
  const copy = [...items];
  const chosen = [];
  while (chosen.length < k && copy.length > 0) chosen.push(copy.splice(Math.floor(random() * copy.length), 1)[0]);
  return chosen;
}

// Removes email addresses from a snapshot: they are personal data and not needed for the
// analysis, which only records that a contact was present.
function redact(value) {
  if (typeof value === 'string') return value.replace(/[^\s<>()"']+@[^\s<>()"']+\.[a-z]{2,}/gi, '<redacted-email>');
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redact(item)]));
  return value;
}

function mulberry32(state) {
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const results = { skills: await sampleSkills(perSource), npm: await sampleNpm(perSource), mcp: await sampleMcpServers(perSource) };

rmSync(SAMPLES, { recursive: true, force: true });
const index = { retrievedAt: new Date().toISOString(), seed, perSource, pools: {}, capabilities: [] };
for (const [source, { pool, picks }] of Object.entries(results)) {
  index.pools[source] = pool;
  mkdirSync(join(SAMPLES, source), { recursive: true });
  for (const pick of picks) {
    const file = `${source}/${slug(pick.name)}.json`;
    writeFileSync(join(SAMPLES, file), `${JSON.stringify({ format: pick.format, name: pick.name, sourceUrl: pick.sourceUrl, native: pick.snapshot }, null, 2)}\n`);
    index.capabilities.push({ format: pick.format, name: pick.name, sourceUrl: pick.sourceUrl, file });
  }
}
writeFileSync(join(SAMPLES, 'sources.json'), `${JSON.stringify(index, null, 2)}\n`);
console.log(`Sampled ${index.capabilities.length} capabilities (seed ${seed}):`);
for (const [source, pool] of Object.entries(index.pools)) console.log(`  ${source}: ${perSource} of ${pool.size} - ${pool.description}`);
for (const capability of index.capabilities) console.log(`  ${capability.format.padEnd(16)} ${capability.name}`);
