#!/usr/bin/env node
// Resolves every GitHub repository reference found anywhere in the snapshot's native metadata
// (repository fields, homepages, documentation links, sources) through the GitHub API, and
// records which references now resolve to another name: evidence for Spike 3 that a stored URL
// goes stale while the forge's numeric repository id does not. Writes samples/renames.json.
//
//   GITHUB_TOKEN=<read-only token> node research/spikes-1-3/fetch-renames.js

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const recordsDir = join(ROOT, 'samples', 'records');
const token = process.env.GITHUB_TOKEN;
const IGNORE = new Set(['settings', 'orgs', 'users', 'sponsors', 'marketplace', 'features', 'apps', 'login', 'topics', 'collections', 'about']);

// Only fields that hold references are scanned; prose (descriptions, examples) is skipped.
const REFERENCE_FIELD = /(url|homepage|repository|repo|source|project|website|documentation|links|bugs)$/i;

const references = new Map();
function collect(value, ref, field) {
  if (typeof value === 'string') {
    if (!REFERENCE_FIELD.test(field.split('.').pop().replace(/\[\d+\]$/, ''))) return;
    for (const match of value.matchAll(/github\.com[/:]([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/g)) {
      const owner = match[1];
      const repo = match[2].replace(/\.git$/, '');
      if (IGNORE.has(owner.toLowerCase()) || !repo) continue;
      const key = `${owner}/${repo}`;
      if (!references.has(key)) references.set(key, []);
      references.get(key).push({ ref, field });
    }
  } else if (Array.isArray(value)) value.forEach((item, i) => collect(item, ref, `${field}[${i}]`));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) collect(item, ref, field ? `${field}.${key}` : key);
}

for (const file of readdirSync(recordsDir).filter((name) => name.endsWith('.json'))) {
  const record = JSON.parse(readFileSync(join(recordsDir, file), 'utf8'));
  collect(record.native, record.ref, '');
}
// The registry families in supplementary.json (every entry the registry returns for a technology
// name): their declared repositories show forks and hosted republications of the vendor's server.
const families = JSON.parse(readFileSync(join(ROOT, 'samples', 'supplementary.json'), 'utf8')).identityCases?.registryFamilies ?? {};
for (const [family, entries] of Object.entries(families)) {
  if (!Array.isArray(entries)) continue;
  for (const entry of entries) if (entry.repository) collect({ repository: entry.repository }, `family:${family}:${entry.name}`, '');
}

const results = [];
for (const [requested, uses] of references) {
  const response = await fetch(`https://api.github.com/repos/${requested}`, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'mission4-spikes-research', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) { results.push({ requested, status: response.status, uses }); continue; }
  const repo = await response.json();
  results.push({ requested, status: 200, id: repo.id, fullName: repo.full_name, renamedOrMoved: repo.full_name.toLowerCase() !== requested.toLowerCase(), archived: repo.archived, fork: repo.fork, parent: repo.parent?.full_name ?? null, uses });
}

const moved = results.filter((result) => result.renamedOrMoved);
writeFileSync(join(ROOT, 'samples', 'renames.json'), `${JSON.stringify({ retrievedAt: new Date().toISOString(), references: results.length, moved: moved.length, results }, null, 2)}\n`);
console.log(`Resolved ${results.length} distinct GitHub repository references; ${moved.length} now resolve to another name; ${results.filter((r) => r.status !== 200).length} not found.`);
for (const result of moved) console.log(`  ${result.requested} -> ${result.fullName} (id ${result.id}) used by ${[...new Set(result.uses.map((use) => `${use.ref}:${use.field}`))].join(', ')}`);
for (const result of results.filter((r) => r.status !== 200)) console.log(`  NOT FOUND ${result.requested} (HTTP ${result.status}) used by ${[...new Set(result.uses.map((use) => use.ref))].join(', ')}`);
