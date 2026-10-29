#!/usr/bin/env node
// Offline analysis for the Spikes 1-3 research (MISSION4_SPIKES_1_TO_3_RESEARCH.md). It reads only
// the snapshot in samples/ (and iteration 1's snapshot in pilot/samples), applies the crosswalk,
// runs the four journeys of needs.yaml against the judgments in judgments.yaml, checks A2A Agent
// Card conformance, and drafts manifests that it validates with the POC validator: against the
// schema 0.1 draft of 2026-10-22 (reference/, the schema the report evaluated), and against the
// revised 0.1 of 2026-10-23, which applies the report's proposals. It returns results.md and
// results.json, and writes them when run as a script; it changes nothing outside research/spikes-1-3.
//
//   node research/spikes-1-3/analyze.js        (npm run research)

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { getAt, toTokens } from '../../src/json-pointer.js';
import { createAjv } from '../../src/schema-registry.js';
import { getRegistry, validateManifests } from '../../src/validator.js';
import { CONCEPTS, extract, FORMAT_LABELS, githubRepo, splitRegistryName } from './crosswalk.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(ROOT, '..', '..');
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const { journeys, questions, needs } = parseYaml(readFileSync(join(ROOT, 'needs.yaml'), 'utf8'));
const judgments = parseYaml(readFileSync(join(ROOT, 'judgments.yaml'), 'utf8'));
const index = read(join(ROOT, 'samples', 'index.json'));
const supplementary = read(join(ROOT, 'samples', 'supplementary.json'));
const a2aSample = read(join(ROOT, 'samples', 'a2a-cards.json'));
let renames = null;
try { renames = read(join(ROOT, 'samples', 'renames.json')); } catch { renames = null; }

// ---------------------------------------------------------------------------------------------
// 1. Records: the targeted sample, iteration 1's random sample as background, and the A2A sample

function loadRecords() {
  const dir = join(ROOT, 'samples', 'records');
  const sampled = readdirSync(dir).filter((file) => file.endsWith('.json')).sort().map((file) => read(join(dir, file)));
  const pilotIndex = read(join(PROJECT, 'pilot', 'samples', 'sources.json'));
  const background = pilotIndex.capabilities.map((entry, i) => ({
    ...read(join(PROJECT, 'pilot', 'samples', entry.file)), ref: `B${String(i + 1).padStart(2, '0')}`, need: null,
    source: entry.format, selection: 'background', note: `iteration-1 random sample (${entry.file})`, retrievedAt: pilotIndex.retrievedAt,
  }));
  const cards = a2aSample.cards.map((card, i) => ({
    ref: `A${String(i + 1).padStart(2, '0')}`, need: null, source: 'github-code-search', format: 'a2a-agent-card',
    name: card.card?.name ?? card.path, selection: 'a2a-sample', note: `${card.repo}/${card.path}`,
    sourceUrl: card.htmlUrl, native: card.card, parseError: card.parseError, retrievedAt: a2aSample.retrievedAt, repo: card.repo,
  }));
  return { sampled, background, cards };
}

const { sampled, background, cards } = loadRecords();
const usableCards = cards.filter((card) => card.native && typeof card.native === 'object' && !Array.isArray(card.native));
const all = [...sampled, ...background, ...usableCards].map((record) => {
  const item = extract(record);
  item.doc = supplementary.documentation?.[record.ref]?.doc?.text ?? null;
  return item;
});
const byRef = Object.fromEntries(all.map((record) => [record.ref, record]));

// The same publication can be drawn twice (for two needs, or by both sample rounds). Discovery
// is evaluated over distinct publications; aliases point to the first ref drawn.
const aliases = {};
const publicationKey = (record) => `${record.format}|${record.sourceUrl}|${String(record.name).toLowerCase()}`;
{
  const seen = new Map();
  for (const record of all) {
    const key = publicationKey(record);
    if (seen.has(key)) aliases[record.ref] = seen.get(key);
    else seen.set(key, record.ref);
  }
}
const canonical = (ref) => aliases[ref] ?? ref;
const collection = all.filter((record) => !aliases[record.ref]);

// ---------------------------------------------------------------------------------------------
// 2. Metadata availability: which concepts each format states, measured on the sample

const PROV_ORDER = ['native', 'linked', 'derived'];
function availability(records) {
  const formats = [...new Set(records.map((record) => record.format))];
  return CONCEPTS.map((concept) => {
    const perFormat = Object.fromEntries(formats.map((format) => {
      const ofFormat = records.filter((record) => record.format === format);
      const counts = Object.fromEntries(PROV_ORDER.map((prov) => [prov, ofFormat.filter((record) => record.concepts[concept.key]?.prov === prov).length]));
      const fields = [...new Set(ofFormat.map((record) => record.concepts[concept.key]).filter(Boolean).map((entry) => `${entry.prov}: ${entry.from}`))];
      return [format, { total: ofFormat.length, ...counts, fields }];
    }));
    const present = records.filter((record) => record.concepts[concept.key]).length;
    const nativeCount = records.filter((record) => record.concepts[concept.key]?.prov === 'native').length;
    return { concept, perFormat, present, native: nativeCount, total: records.length };
  });
}

// ---------------------------------------------------------------------------------------------
// 3. A2A Agent Card conformance: A2A v0.3.0 JSON Schema, and the REQUIRED fields of v1.0.1

const A2A_V1_REQUIRED = ['name', 'description', 'supportedInterfaces', 'version', 'capabilities', 'defaultInputModes', 'defaultOutputModes', 'skills'];
function a2aConformance() {
  const schema = read(join(ROOT, 'reference', 'a2a-v0.3.0.schema.json'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validateV03 = ajv.compile({ $ref: '#/definitions/AgentCard', definitions: schema.definitions });
  const rows = cards.map((card) => {
    const value = card.native;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ref: card.ref, repo: card.repo, json: false };
    const v03 = validateV03(value);
    const missingV1 = A2A_V1_REQUIRED.filter((field) => value[field] === undefined || (Array.isArray(value[field]) && value[field].length === 0 && field === 'supportedInterfaces'));
    const interfacesOk = Array.isArray(value.supportedInterfaces) && value.supportedInterfaces.length > 0 && value.supportedInterfaces.every((i) => i.url && i.protocolBinding && i.protocolVersion);
    const skillsOk = Array.isArray(value.skills) && value.skills.every((s) => s.id && s.name && s.description && Array.isArray(s.tags));
    const v1 = missingV1.length === 0 && interfacesOk && skillsOk;
    const declared = value.protocolVersion ?? value.supportedInterfaces?.[0]?.protocolVersion ?? null;
    const urls = [value.url, ...(Array.isArray(value.supportedInterfaces) ? value.supportedInterfaces.map((i) => i.url) : [])].filter(Boolean);
    return {
      ref: card.ref, repo: card.repo, path: card.note, json: true, declared, v03, v1, missingV1,
      hasProvider: Boolean(value.provider), hasSkills: Array.isArray(value.skills) && value.skills.length > 0,
      skillsWithTags: Array.isArray(value.skills) ? value.skills.filter((s) => Array.isArray(s.tags) && s.tags.length > 0).length : 0,
      localOrHttp: urls.some((url) => /^http:\/\//.test(url) || /localhost|127\.0\.0\.1/.test(url)),
      declaredMismatch: Boolean(declared && /^1/.test(String(declared)) && !Array.isArray(value.supportedInterfaces)),
    };
  });
  return rows;
}

// ---------------------------------------------------------------------------------------------
// 4. J1: find a capability for a need. A transparent term matcher, three index variants:
//    V0 native fields; V1 native fields plus documentation text; V2 native fields with registry
//    namespaces and npm scopes treated as publisher, not as name.

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const termPattern = (term) => new RegExp(`(^|[^a-z0-9])${escape(term).replace(/\s+/g, '[\\s_-]+')}([^a-z0-9]|$)`, 'i');
const asText = (value) => {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.map(asText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(asText).join(' ');
  return String(value);
};

function fieldsFor(record, variant) {
  const c = record.concepts;
  let name = asText(c.nativeName?.value);
  if (variant === 'V2') {
    if (record.format === 'mcp-server-json') name = splitRegistryName(name).local;
    if (record.format === 'npm-package' && name.startsWith('@')) name = name.split('/')[1] ?? name;
  }
  return {
    name: `${name} ${asText(c.displayName?.value)}`,
    tags: `${asText(c.keywords?.value)} ${asText(c.useCases?.value)}`,
    description: asText(c.description?.value),
    docs: variant === 'V1' ? (record.doc ?? '') : '',
  };
}

const WEIGHTS = { name: 3, tags: 2, description: 1, docs: 0.5 };
function score(record, need, variant) {
  const fields = fieldsFor(record, variant);
  const matched = [];
  let total = 0;
  for (const term of [need.primaryQuery, ...need.terms].filter((t, i, list) => list.indexOf(t) === i)) {
    const best = Object.keys(WEIGHTS).find((field) => termPattern(term).test(fields[field]));
    if (best) { total += WEIGHTS[best]; matched.push(`${term}@${best}`); }
  }
  return { total, matched };
}

function relevanceOf(needId, ref) {
  const r = judgments.relevance[needId];
  const id = canonical(ref);
  if ((r.relevant ?? []).map(canonical).includes(id)) return 'relevant';
  if ((r.partial ?? []).map(canonical).includes(id)) return 'partial';
  if ((r.undetermined ?? []).map(canonical).includes(id)) return 'undetermined';
  return 'not';
}
const isUseful = (level) => level === 'relevant' || level === 'partial';

function groupOf(ref) {
  const id = canonical(ref);
  return judgments.identity.groups.find((group) => group.members.map(canonical).includes(id))?.id ?? id;
}

function discovery() {
  return needs.map((need) => {
    const variants = Object.fromEntries(['V0', 'V1', 'V2'].map((variant) => {
      const ranked = collection
        .map((record) => ({ record, ...score(record, need, variant) }))
        .filter((hit) => hit.total > 0)
        .sort((a, b) => b.total - a.total || a.record.ref.localeCompare(b.record.ref));
      const label = (hit) => relevanceOf(need.id, hit.record.ref);
      const relevant = collection.filter((record) => relevanceOf(need.id, record.ref) === 'relevant');
      const useful = collection.filter((record) => isUseful(relevanceOf(need.id, record.ref)));
      const found = new Set(ranked.map((hit) => hit.record.ref));
      const top = (k) => ranked.slice(0, k);
      const groupsRelevant = new Set(relevant.map((record) => groupOf(record.ref)));
      const groupsFound = new Set(ranked.filter((hit) => label(hit) === 'relevant').map((hit) => groupOf(hit.record.ref)));
      return [variant, {
        retrieved: ranked.length,
        relevantTotal: relevant.length,
        usefulTotal: useful.length,
        recall: relevant.length ? relevant.filter((record) => found.has(record.ref)).length / relevant.length : null,
        usefulRecall: useful.length ? useful.filter((record) => found.has(record.ref)).length / useful.length : null,
        precision: ranked.length ? ranked.filter((hit) => isUseful(label(hit))).length / ranked.length : null,
        precisionAt5: top(5).length ? top(5).filter((hit) => isUseful(label(hit))).length / top(5).length : null,
        precisionAt10: top(10).length ? top(10).filter((hit) => isUseful(label(hit))).length / top(10).length : null,
        undeterminedRetrieved: ranked.filter((hit) => label(hit) === 'undetermined').map((hit) => hit.record.ref),
        capabilitiesRelevant: groupsRelevant.size,
        capabilitiesFound: groupsFound.size,
        entriesForRelevantCapabilities: ranked.filter((hit) => label(hit) === 'relevant').length,
        misses: useful.filter((record) => !found.has(record.ref)).map((record) => ({ ref: record.ref, name: record.name, level: relevanceOf(need.id, record.ref), format: record.format })),
        top: top(10).map((hit) => ({ ref: hit.record.ref, name: hit.record.name, format: hit.record.format, score: hit.total, matched: hit.matched, judged: label(hit) })),
        falsePositives: ranked.filter((hit) => label(hit) === 'not').map((hit) => ({ ref: hit.record.ref, name: hit.record.name, matched: hit.matched })),
      }];
    }));
    return { need, variants };
  });
}

// ---------------------------------------------------------------------------------------------
// 5. J2: recognise the same capability across sources, from metadata alone

function publicationKeys(record) {
  const c = record.concepts;
  const own = [];
  const declared = [];
  const lower = (text) => String(text).toLowerCase();
  const stripTag = (image) => lower(image).replace(/[:@][^/:@]+$/, '');
  switch (record.format) {
    case 'mcp-server-json':
      own.push(`mcp-registry:${lower(record.native.server.name)}`);
      for (const pkg of record.native.server.packages ?? []) declared.push(pkg.registryType === 'oci' ? `oci:${stripTag(pkg.identifier)}` : `${pkg.registryType}:${lower(pkg.identifier)}`);
      for (const remote of record.native.server.remotes ?? []) declared.push(`remote:${lower(remote.url).replace(/\/$/, '')}`);
      break;
    case 'npm-package':
      own.push(`npm:${lower(c.nativeName.value)}`);
      if (record.native.packageJson?.mcpName) declared.push(`mcp-registry:${lower(record.native.packageJson.mcpName)}`);
      break;
    case 'pypi-package':
      own.push(`pypi:${lower(c.nativeName.value).replace(/[-_.]+/g, '-')}`);
      for (const publication of c.publications?.value ?? []) declared.push(lower(publication));
      break;
    case 'docker-mcp-catalog':
      own.push(`docker-catalog:${lower(c.nativeName.value)}`);
      for (const publication of c.publications?.value ?? []) own.push(`oci:${stripTag(publication.slice(4))}`);
      break;
    case 'claude-plugin':
      own.push(`plugin:${lower(record.native.marketplace?.name)}/${lower(c.nativeName.value)}`);
      for (const server of Object.values(record.native.mcpJson?.mcpServers ?? record.native.mcpJson ?? {})) {
        if (server?.url) declared.push(`remote:${lower(server.url).replace(/\/$/, '')}`);
        const spec = server?.command === 'npx' ? (server.args ?? []).find((arg) => !String(arg).startsWith('-')) : null;
        if (spec) declared.push(`npm:${lower(spec).replace(/(.)@[^@/]+$/, '$1')}`);
      }
      break;
    default:
      own.push(`${record.format}:${lower(record.sourceUrl)}`);
  }
  return { own, declared };
}

function repositoryKey(record) {
  const forgeRepo = record.concepts.forgeRepository?.value;
  const repo = forgeRepo?.fullName ?? githubRepo(record.concepts.sourceRepository?.value?.url);
  if (!repo) return null;
  return { repo: repo.toLowerCase(), id: forgeRepo?.id ?? null, path: record.concepts.sourceRepository?.value?.path ?? null };
}

// Union-find over the links each rule produces; returns the predicted groups.
function cluster(records, edges) {
  const parent = Object.fromEntries(records.map((record) => [record.ref, record.ref]));
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const [a, b] of edges) parent[find(a)] = find(b);
  const groups = {};
  for (const record of records) (groups[find(record.ref)] ??= []).push(record.ref);
  return Object.values(groups);
}

function pairs(groups) {
  const set = new Set();
  for (const group of groups) for (let i = 0; i < group.length; i += 1) for (let j = i + 1; j < group.length; j += 1) set.add([group[i], group[j]].sort().join('~'));
  return set;
}

function identity() {
  const records = collection.filter((record) => record.selection !== 'a2a-sample');
  const keys = Object.fromEntries(records.map((record) => [record.ref, publicationKeys(record)]));
  const edges = { declared: [], repository: [], repositoryAmbiguous: [], sameName: [] };
  for (const a of records) {
    for (const b of records) {
      if (a.ref >= b.ref) continue;
      const ka = keys[a.ref];
      const kb = keys[b.ref];
      if (ka.declared.some((key) => kb.own.includes(key)) || kb.declared.some((key) => ka.own.includes(key)) || ka.own.some((key) => key.startsWith('oci:') && kb.declared.includes(key)) || ka.declared.some((key) => key.startsWith('remote:') && kb.declared.includes(key))) edges.declared.push([a.ref, b.ref]);
      const ra = repositoryKey(a);
      const rb = repositoryKey(b);
      if (ra && rb && (ra.repo === rb.repo || (ra.id && ra.id === rb.id))) {
        if (ra.path === rb.path) edges.repository.push([a.ref, b.ref]);
        else if (!ra.path || !rb.path) edges.repositoryAmbiguous.push([a.ref, b.ref]);
      }
      const localName = (record) => (record.format === 'mcp-server-json' ? splitRegistryName(String(record.concepts.nativeName?.value)).local : String(record.concepts.nativeName?.value ?? '').replace(/^@[^/]+\//, '')).toLowerCase();
      if (localName(a) && localName(a) === localName(b)) edges.sameName.push([a.ref, b.ref]);
    }
  }
  const truthGroups = judgments.identity.groups.map((group) => group.members.map(canonical).filter((ref) => records.some((record) => record.ref === ref)));
  const truthPairs = pairs(truthGroups);
  const evaluate = (edgeList) => {
    const predicted = cluster(records, edgeList);
    const predictedPairs = pairs(predicted);
    const tp = [...predictedPairs].filter((pair) => truthPairs.has(pair));
    const fp = [...predictedPairs].filter((pair) => !truthPairs.has(pair));
    const fn = [...truthPairs].filter((pair) => !predictedPairs.has(pair));
    return { links: edgeList.length, truePairs: tp.length, falsePairs: fp, missedPairs: fn, predictedGroups: predicted.filter((group) => group.length > 1) };
  };
  return {
    truthGroups: judgments.identity.groups,
    derivatives: judgments.identity.derivatives ?? [],
    rules: {
      'declared links only': evaluate(edges.declared),
      'same repository and path only': evaluate(edges.repository),
      'declared links + same repository and path': evaluate([...edges.declared, ...edges.repository]),
      'same native name only (negative control)': evaluate(edges.sameName),
    },
    ambiguousRepositoryLinks: edges.repositoryAmbiguous,
    renamedOrMoved: records.filter((record) => record.concepts.forgeRepository?.value?.renamedOrMoved).map((record) => ({ ref: record.ref, requested: record.concepts.forgeRepository.value.requested, now: record.concepts.forgeRepository.value.fullName })),
    forks: records.filter((record) => record.concepts.forgeRepository?.value?.fork).map((record) => ({ ref: record.ref, parent: record.concepts.forgeRepository.value.parent })),
    contentCopies: contentCopies(records),
  };
}

function contentCopies(records) {
  const byHash = {};
  for (const record of records.filter((r) => r.format === 'agent-skill')) {
    const hash = supplementary.documentation?.[record.ref]?.skillBodySha256;
    if (hash) (byHash[hash] ??= []).push(record.ref);
  }
  return Object.values(byHash).filter((group) => group.length > 1);
}

// ---------------------------------------------------------------------------------------------
// 6. J3 and J4: answer the decision questions per capability, with provenance

const QUESTION_CONCEPTS = {
  what: ['description', 'useCases'], kind: ['capabilityType'], interface: ['interfaces'], 'runs-where': ['runtime'],
  setup: ['setup'], depends: ['dependsOn'], limits: ['limitations'], terms: ['license'], version: ['version'],
  maintained: ['lifecycle', 'updated'], who: ['publisher', 'maintainer'], 'same-as': ['nativeName', 'sourceRepository', 'publications'], risk: ['riskTier'],
};
const RANK = { native: 3, linked: 2, derived: 1 };

function answer(records, questionId) {
  const facts = [];
  for (const record of records) {
    for (const key of QUESTION_CONCEPTS[questionId]) {
      const entry = record.concepts[key];
      if (entry) facts.push({ ref: record.ref, key, prov: entry.prov, basis: entry.basis ?? null, from: entry.from, value: entry.value, repositoryWide: entry.repositoryWide ?? false });
    }
  }
  if (questionId === 'risk') return { status: 'governance', facts: [] };
  if (facts.length === 0) return { status: 'unknown', facts };
  const best = facts.reduce((a, b) => (RANK[b.prov] > RANK[a.prov] ? b : a));
  return { status: best.prov, facts };
}

const DECISION_QUESTIONS = ['what', 'kind', 'interface', 'runs-where', 'setup', 'depends', 'limits', 'terms', 'version', 'maintained', 'who', 'risk'];

// Blockers stop a team from justifying reuse from the metadata alone; gaps are facts the team
// must still ask for or confirm, but which do not by themselves rule reuse out.
function assess(answers) {
  const blockers = [];
  const gaps = [];
  const terms = answers.terms;
  const licenses = terms.facts.filter((fact) => fact.key === 'license');
  if (terms.status === 'unknown') blockers.push('terms of use unknown');
  else if (licenses.some((fact) => ['proprietary', 'text', 'file-reference', 'noassertion'].includes(fact.value.kind))) blockers.push(`terms need reading: ${[...new Set(licenses.map((fact) => fact.value.text))].join(' | ')}`);
  else if (licenses.every((fact) => fact.repositoryWide)) gaps.push('license known only for the whole repository');
  const lifecycle = answers.maintained.facts.filter((fact) => fact.key === 'lifecycle').map((fact) => fact.value.state);
  if (lifecycle.some((state) => ['archived', 'deprecated', 'deleted'].includes(state))) blockers.push(`not maintained: ${[...new Set(lifecycle)].join(', ')}`);
  if (answers.maintained.status === 'unknown') blockers.push('maintenance status unknown');
  if (answers.setup.status === 'unknown') gaps.push('setup and credentials not stated');
  // A listing operator (a catalog or marketplace) is not the maintainer, and a heuristic is not a statement.
  const operator = (fact) => /catalog operator|listed in the marketplace/.test(JSON.stringify(fact.value));
  const maintainerStated = answers.who.facts.some((fact) => fact.key === 'maintainer' && fact.prov === 'native');
  const publisherStated = answers.who.facts.some((fact) => fact.key === 'publisher' && (fact.prov === 'native' || fact.basis === 'convention') && !operator(fact));
  if (!maintainerStated && !publisherStated) gaps.push('maintainer not stated (only a listing operator or an inference)');
  const versions = [...new Set(answers.version.facts.map((fact) => fact.value.text))];
  if (versions.length > 1 && answers.version.facts.every((fact) => fact.value.scheme !== 'git-tag')) gaps.push(`versions differ across publications: ${versions.join(' vs ')}`);
  gaps.push('limitations not stated');
  return { blockers, gaps };
}

function comparisons() {
  return needs.map((need) => {
    const relevant = collection.filter((record) => relevanceOf(need.id, record.ref) === 'relevant');
    const groups = {};
    for (const record of relevant) (groups[groupOf(record.ref)] ??= []).push(record);
    // A capability's publications outside the relevant set (for example a package declared by a
    // relevant registry entry) contribute facts too.
    for (const group of judgments.identity.groups) {
      if (!groups[group.id]) continue;
      for (const ref of group.members.map(canonical)) if (byRef[ref] && !groups[group.id].includes(byRef[ref])) groups[group.id].push(byRef[ref]);
    }
    const capabilities = Object.entries(groups).map(([id, records]) => {
      const merged = Object.fromEntries(DECISION_QUESTIONS.map((q) => [q, answer(records, q)]));
      const single = records.map((record) => ({ ref: record.ref, answers: Object.fromEntries(DECISION_QUESTIONS.map((q) => [q, answer([record], q).status])) }));
      const answered = (statuses) => DECISION_QUESTIONS.filter((q) => q !== 'risk' && statuses[q] !== 'unknown').length;
      return {
        id, refs: records.map((record) => record.ref), formats: [...new Set(records.map((record) => record.format))], merged, single,
        answeredMerged: answered(Object.fromEntries(DECISION_QUESTIONS.map((q) => [q, merged[q].status]))),
        answeredBestSingle: Math.max(...single.map((s) => answered(s.answers))),
        ...assess(merged),
      };
    });
    return { need, capabilities };
  });
}

// Levels a record reaches from its own metadata. "Assessable" means every fact needed to start a
// reuse assessment is stated or inferred; "assessable, no inference" admits native and linked
// facts only. Setup is reported on its own: no format can state "no credentials needed", so its
// absence does not show that the fact is missing.
const LEVELS = {
  discoverable: ['what', 'kind', 'interface'],
  assessable: ['what', 'kind', 'interface', 'runs-where', 'terms', 'version', 'maintained', 'who'],
};
// A fact derived by a rule the source documents and enforces (crosswalk basis "convention": a
// SKILL.md is a skill, the registry verifies a namespace) is stated in effect; a heuristic one is not.
const stated = (fact) => fact.prov === 'native' || fact.prov === 'linked' || fact.basis === 'convention';
function sufficiency(records) {
  return records.map((record) => {
    const full = Object.fromEntries(DECISION_QUESTIONS.map((q) => [q, answer([record], q)]));
    const answers = Object.fromEntries(DECISION_QUESTIONS.map((q) => [q, full[q].status]));
    const reached = {
      discoverable: LEVELS.discoverable.every((q) => answers[q] !== 'unknown'),
      assessable: LEVELS.assessable.every((q) => answers[q] !== 'unknown'),
      assessableNoInference: LEVELS.assessable.every((q) => full[q].facts.some(stated)),
      setupStated: answers.setup !== 'unknown',
    };
    // A derived answer counts as convention-based when any fact behind it is.
    const kinds = Object.fromEntries(DECISION_QUESTIONS.map((q) => {
      if (answers[q] !== 'derived') return [q, answers[q]];
      return [q, full[q].facts.some((fact) => fact.basis === 'convention') ? 'convention' : 'heuristic'];
    }));
    const confirm = Object.entries(kinds).filter(([, kind]) => kind === 'heuristic').map(([q]) => q);
    const ask = Object.entries(answers).filter(([q, status]) => status === 'unknown' && q !== 'risk').map(([q]) => q);
    return { ref: record.ref, format: record.format, selection: record.selection, answers, kinds, reached, confirm, ask };
  });
}

// ---------------------------------------------------------------------------------------------
// 7. Schema 0.1: draft a manifest from each record's concepts and validate it with the POC

const kebab = (text) => String(text ?? '').toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').replace(/\.{2,}/g, '.');
const INTERFACE_TYPES = { agent_skill: 'agent_skill', cli: 'cli', library: 'library' };
function draftManifest(record) {
  const c = record.concepts;
  const publisher = kebab(c.publisher?.value?.name ?? c.maintainer?.value ?? 'unknown').replace(/^@/, '') || 'unknown';
  const local = kebab(record.format === 'mcp-server-json' ? splitRegistryName(c.nativeName?.value ?? '').local : String(c.nativeName?.value ?? c.displayName?.value ?? record.name).replace(/^@[^/]+\//, '').split('/').pop());
  const repo = c.sourceRepository?.value?.url;
  const contact = repo?.startsWith('https://github.com/') ? `${repo.replace(/\.git$/, '').replace(/\/$/, '')}/issues` : (c.documentation?.value?.startsWith?.('https://') ? c.documentation.value : undefined);
  const registry = { 'mcp-server-json': 'mcp-registry', 'npm-package': 'npm', 'pypi-package': 'pypi', 'docker-mcp-catalog': 'docker-mcp-catalog', 'claude-plugin': 'claude-plugins-official' }[record.format];
  const lifecycleMap = { active: 'active', deprecated: 'deprecated', deleted: 'retired', archived: 'retired' };
  const state = c.lifecycle?.value?.state;
  const interfaces = (c.interfaces?.value ?? []).map((value) => {
    if (String(value).startsWith('mcp/')) return { type: 'mcp', description: `Transport: ${value.slice(4)}` };
    if (String(value).startsWith('a2a/')) return c.documentation?.value?.startsWith?.('https://') ? { type: 'a2a', contractRef: c.documentation.value } : { type: 'other', description: value };
    if (INTERFACE_TYPES[value]) return { type: INTERFACE_TYPES[value], ...(value === 'agent_skill' ? { contractRef: record.sourceUrl } : {}) };
    return { type: 'other', description: String(value).slice(0, 300) };
  }).filter((entry, i, list) => list.findIndex((other) => JSON.stringify(other) === JSON.stringify(entry)) === i);
  const version = c.version?.value?.scheme === 'semver' ? c.version.value.text : undefined;
  const manifest = {
    schemaVersion: '0.1',
    id: `${publisher}/${local || 'unnamed'}`.slice(0, 128),
    name: String(c.displayName?.value ?? c.nativeName?.value ?? record.name).slice(0, 80),
    description: c.description?.value,
    capabilityType: c.capabilityType?.value,
    ...(version ? { capabilityVersion: version } : {}),
    source: registry ? { type: 'registry', registry, identifier: String(c.nativeName?.value ?? record.name), ...(repo?.startsWith('https://') ? { url: repo } : {}) } : { type: 'repository', url: repo, ...(c.sourceRepository?.value?.path ? { path: c.sourceRepository.value.path } : {}) },
    owner: { name: String(c.maintainer?.value ?? c.publisher?.value?.name ?? 'unknown').slice(0, 120), ...(contact ? { contact } : {}), affiliation: 'external' },
    ...(state && lifecycleMap[state] ? { lifecycleStatus: lifecycleMap[state] } : {}),
    ...(state === 'deprecated' && c.lifecycle?.value?.message ? { deprecation: { reason: String(c.lifecycle.value.message).slice(0, 500) } } : {}),
    riskTier: 'unassessed',
    ...(c.updated?.value ? { lastUpdated: c.updated.value } : {}),
    ...(interfaces.length > 0 ? { interfaces } : {}),
  };
  return JSON.parse(JSON.stringify(manifest));
}

// The schema the report evaluated: schema 0.1 as it stood on 2026-10-22, before the revision.
const FROZEN_SCHEMA = join(ROOT, 'reference', 'capability-0.1-2026-10-22.schema.json');
function frozenRegistry() {
  const schema = read(FROZEN_SCHEMA);
  const entry = { version: '0.1', file: FROZEN_SCHEMA, schema, validate: createAjv().compile(schema) };
  return { versions: ['0.1'], latest: '0.1', get: (version) => (version === '0.1' ? entry : undefined) };
}

const toYamlText = (manifest) => stringifyYaml(manifest, { defaultStringType: 'QUOTE_DOUBLE', defaultKeyType: 'PLAIN', lineWidth: 0 });

// The revised schema with one change, for sensitivity runs.
function variantRegistry(mutate) {
  const schema = structuredClone(getRegistry().get('0.1').schema);
  mutate(schema);
  const entry = { version: '0.1', file: '(variant)', schema, validate: createAjv().compile(schema) };
  return { versions: ['0.1'], latest: '0.1', get: (version) => (version === '0.1' ? entry : undefined) };
}

async function schemaCheck(records, registry) {
  const drafts = records.map((record) => ({ record, manifest: draftManifest(record) }));
  const report = await validateManifests(drafts.map(({ record, manifest }) => ({ file: `drafts/${record.ref}.capability.yaml`, text: toYamlText(manifest) })), { today: '2026-10-22', registry });
  return drafts.map(({ record, manifest }, i) => {
    const result = report.results[i];
    const errors = result.findings.filter((finding) => finding.severity === 'error');
    return { ref: record.ref, format: record.format, id: manifest.id, valid: result.valid, errors: errors.map((finding) => `${finding.code} ${finding.path}`) };
  });
}

// ---------------------------------------------------------------------------------------------
// 8. The revised schema 0.1 (2026-10-23): the same records drafted into the starter model of the
//    report (section 11), with publications, provenance per value, and observed lifecycle signals,
//    then validated by the POC validator, which reports completeness levels and identity links.

// Native values are used as they are. One that the schema cannot hold (too long) is left out, not
// shortened, so that no draft alters what a source states; names are cut at 80 characters, as in
// draftManifest, so that runs B and C draft names identically.
const fits = (text, max) => (text !== undefined && text !== null && String(text).length <= max ? String(text) : undefined);
const clip = (text, max) => String(text).slice(0, max);
const slug = (text) => String(text ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const VERSION_SCHEME = { semver: 'semver', pep440: 'pep440', 'commit-pin': 'commit', 'git-tag': 'tag' };
const OBSERVED_STATUS = { active: 'active', deprecated: 'deprecated', deleted: 'deleted', archived: 'archived' };
// Dates the crosswalk reads from the source repository rather than from the record's channel.
const SOURCE_DATE = /last push to the repository|last commit to SKILL\.md/;
const SPDX = /^\(?[A-Za-z0-9.+:-]+\)?(?: +(?:AND|OR|WITH) +\(?[A-Za-z0-9.+:-]+\)?)*$/;
const isHttps = (url) => typeof url === 'string' && /^https:\/\/\S+$/.test(url) && url.length <= 2048;

// Package URLs (ECMA-427): an npm scope is percent-encoded; a PyPI name is normalized (PEP 503).
const purl = (type, name) => (type === 'npm'
  ? `pkg:npm/${String(name).toLowerCase().replace(/^@/, '%40')}`
  : `pkg:pypi/${String(name).toLowerCase().replace(/[-_.]+/g, '-')}`);
// An image reference without tag or digest; a Docker Hub name gets its registry host.
function imageRef(image) {
  const ref = String(image).toLowerCase().replace(/@sha256:[0-9a-f]+$/, '').replace(/:[^/:]+$/, '');
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?\//.test(ref)) return ref;
  return `docker.io/${ref.includes('/') ? ref : `library/${ref}`}`;
}

function runtimeEntry(text, format) {
  const value = String(text);
  if (/^network egress/i.test(value)) return null; // a sandbox constraint, not a runtime
  let kind = 'other';
  if (/^local process|^(node|bun|deno)\b|^python\b/i.test(value)) kind = 'local_process';
  else if (/^container image/i.test(value)) kind = 'container';
  else if (/^hosted service/i.test(value)) kind = 'hosted_service';
  else if (/agent host|claude code host/i.test(value) || format === 'agent-skill') kind = 'agent_host';
  else if (/^github actions runner/i.test(value)) kind = 'ci_runner';
  return { kind, ...(fits(value, 300) && value.length >= 3 ? { detail: value } : {}) };
}

function interfaceEntry(value, record) {
  const text = String(value);
  if (text.startsWith('mcp/')) {
    const transport = text.slice(4);
    return { type: 'mcp', ...(transport !== 'remote' ? { transport } : {}) };
  }
  if (text === 'cli' || text === 'library') return { type: text };
  if (text === 'agent_skill') return { type: 'agent_skill', ...(isHttps(record.sourceUrl) ? { contractRef: record.sourceUrl } : {}) };
  const labels = { claude_code_plugin: 'Claude Code plugin', github_actions_step: 'GitHub Actions step' };
  const description = fits(labels[text] ?? text, 300);
  return { type: 'other', ...(description ? { description } : {}) };
}

// The record's own publication, then the publications it declares (mirroring the keys that J2's
// declared-link rule uses), with the observed version, status, and date of the record's channel.
function publicationsOf(record) {
  const c = record.concepts;
  const n = record.native;
  const version = c.version?.value;
  const lifecycle = c.lifecycle;
  // The forge's archived flag replaces the channel's own status in the crosswalk; keep both.
  const channelState = lifecycle?.prov === 'linked' ? lifecycle.conflictsWith : lifecycle?.value?.state;
  const own = {
    ...(fits(version?.text, 128) ? { nativeVersion: version.text, versionScheme: VERSION_SCHEME[version.scheme] ?? 'other' } : {}),
    ...(OBSERVED_STATUS[channelState] ? { status: OBSERVED_STATUS[channelState] } : {}),
    ...(lifecycle?.prov !== 'linked' && fits(lifecycle?.value?.message, 500) ? { statusMessage: lifecycle.value.message } : {}),
    ...(c.updated && !SOURCE_DATE.test(c.updated.from) ? { updatedAt: c.updated.value } : {}),
  };
  const declared = [];
  let ownPublication;
  switch (record.format) {
    case 'mcp-server-json':
      ownPublication = { kind: 'registry_entry', locator: n.server.name };
      for (const pkg of n.server.packages ?? []) {
        if (pkg.registryType === 'npm' || pkg.registryType === 'pypi') declared.push({ kind: 'package', locator: purl(pkg.registryType, pkg.identifier), ...(fits(pkg.identifier, 214) ? { nativeName: pkg.identifier } : {}) });
        else if (pkg.registryType === 'oci') declared.push({ kind: 'container_image', locator: imageRef(pkg.identifier) });
        else declared.push({ kind: 'other', locator: String(pkg.identifier) });
      }
      for (const remote of n.server.remotes ?? []) declared.push({ kind: 'hosted_endpoint', locator: String(remote.url).replace(/\/+$/, '') });
      break;
    case 'npm-package':
      ownPublication = { kind: 'package', locator: purl('npm', c.nativeName.value), ...(fits(c.nativeName.value, 214) ? { nativeName: c.nativeName.value } : {}) };
      if (n.packageJson?.mcpName) declared.push({ kind: 'registry_entry', locator: n.packageJson.mcpName, verifiedBy: 'mcpName in package.json, which the MCP Registry checks.' });
      break;
    case 'pypi-package':
      ownPublication = { kind: 'package', locator: purl('pypi', c.nativeName.value), ...(fits(c.nativeName.value, 214) ? { nativeName: c.nativeName.value } : {}) };
      for (const publication of c.publications?.value ?? []) declared.push({ kind: 'registry_entry', locator: publication.replace(/^mcp-registry:/, ''), verifiedBy: 'mcp-name marker in the package description, which the MCP Registry checks.' });
      break;
    case 'docker-mcp-catalog':
      ownPublication = { kind: 'registry_entry', locator: record.sourceUrl, ...(fits(c.nativeName.value, 214) ? { nativeName: c.nativeName.value } : {}) };
      for (const publication of c.publications?.value ?? []) declared.push({ kind: 'container_image', locator: imageRef(publication.slice(4)) });
      break;
    case 'claude-plugin':
      ownPublication = { kind: 'marketplace_entry', locator: `${c.nativeName.value}@${n.marketplace?.name}` };
      for (const server of Object.values(n.mcpJson?.mcpServers ?? n.mcpJson ?? {})) {
        if (server?.url) declared.push({ kind: 'hosted_endpoint', locator: String(server.url).replace(/\/+$/, '') });
        const spec = server?.command === 'npx' ? (server.args ?? []).find((arg) => !String(arg).startsWith('-')) : null;
        if (spec) declared.push({ kind: 'package', locator: purl('npm', String(spec).replace(/(.)@[^@/]+$/, '$1')) });
      }
      break;
    default: // Agent Skills and GitHub Actions are used straight from their repository
      ownPublication = { kind: 'repository', locator: record.format === 'github-action' ? `https://github.com/${record.name}` : record.sourceUrl };
  }
  return [{ ...ownPublication, ...own }, ...declared].filter((publication, i, list) =>
    publication.locator && list.findIndex((other) => other.locator.toLowerCase() === publication.locator.toLowerCase()) === i);
}

function sourceOf(record) {
  const c = record.concepts;
  const repository = c.sourceRepository?.value;
  const forgeRepository = c.forgeRepository?.value;
  const github = githubRepo(repository?.url);
  const url = github ? `https://github.com/${github}` : (isHttps(repository?.url) ? repository.url.replace(/\.git$/, '') : null);
  if (!url) {
    const registry = { 'mcp-server-json': 'mcp-registry', 'npm-package': 'npm', 'pypi-package': 'pypi', 'docker-mcp-catalog': 'docker-mcp-catalog', 'claude-plugin': 'claude-plugins' }[record.format] ?? 'other';
    return { source: { type: 'registry', registry, identifier: String(c.nativeName?.value ?? record.name) }, from: { prov: 'native', from: 'name' } };
  }
  const path = String(repository.path ?? '').replace(/^\.\//, '').replace(/\/+$/, '');
  const id = forgeRepository?.id ?? (/^\d+$/.test(String(repository.forgeId ?? '')) ? repository.forgeId : null);
  const archived = c.lifecycle?.prov === 'linked' && c.lifecycle.value.state === 'archived';
  return {
    source: {
      type: 'repository',
      url,
      ...(path && /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/.test(path) ? { path } : {}),
      ...(id ? { repositoryId: String(id) } : {}),
      ...(archived ? { status: 'archived' } : {}),
      ...(c.updated && SOURCE_DATE.test(c.updated.from) ? { updatedAt: c.updated.value } : {}),
    },
    from: c.sourceRepository,
  };
}

// Who maintains it: the declared maintainer, else the publisher, but never a listing operator
// (a catalog or marketplace) and never a placeholder.
function ownerOf(record) {
  const c = record.concepts;
  const maintainer = c.maintainer?.value;
  const publisher = c.publisher?.value;
  const operator = /catalog operator/.test(publisher?.name ?? '') || /listed in the marketplace/.test(publisher?.verified ?? '');
  if (fits(maintainer, 120) && !/listed by email only/.test(maintainer)) return { name: maintainer, entry: c.maintainer };
  if (fits(publisher?.name, 120) && !operator) return { name: publisher.name, entry: c.publisher };
  return null;
}

function draftStarterManifest(record) {
  const c = record.concepts;
  const observedAt = record.retrievedAt.slice(0, 10);
  const format = FORMAT_LABELS[record.format].split(' (')[0];
  const provenance = [];
  const attribute = (field, entry) => {
    if (!entry) return;
    provenance.push({ field, method: entry.prov, ...(entry.prov === 'derived' ? { basis: entry.basis ?? 'heuristic' } : {}), source: clip(`${format}: ${entry.from}`, 300), observedAt }); // the harness's own text
  };

  const nameEntry = c.displayName ?? c.nativeName;
  const localName = record.format === 'mcp-server-json' ? splitRegistryName(String(c.nativeName?.value ?? '')).local : String(c.nativeName?.value ?? c.displayName?.value ?? record.name).replace(/^@[^/]+\//, '');
  const { source, from: sourceEntry } = sourceOf(record);
  const owner = ownerOf(record);
  const license = c.license?.value;
  const keywords = [...new Set((c.keywords?.value ?? []).filter((keyword) => fits(keyword, 50) && /^\S(?:.*\S)?$/.test(keyword)))].slice(0, 30);
  const runtime = (c.runtime?.value ?? []).map((value) => runtimeEntry(value, record.format)).filter(Boolean);
  const interfaces = (c.interfaces?.value ?? []).map((value) => interfaceEntry(value, record))
    .filter((entry, i, list) => list.findIndex((other) => JSON.stringify(other) === JSON.stringify(entry)) === i);
  const setup = [...new Map((c.setup?.value ?? []).filter((item) => fits(item.name, 120)).map((item) => [item.name, { name: item.name, secret: item.secret, required: item.required }])).values()];
  const publications = publicationsOf(record);

  const manifest = {
    schemaVersion: '0.1',
    // Assigned by the harness, which plays the catalog: never derived from a name or a URL, so that
    // identity has to come from publications and sources, as the report proposes.
    id: `research.${slug(record.ref)}/${slug(localName).slice(0, 100) || 'unnamed'}`,
    name: clip(nameEntry?.value ?? record.name, 80),
    ...(c.description ? { description: c.description.value } : {}),
    capabilityType: c.capabilityType?.value,
    source,
    publications,
    ...(owner ? { owner: { name: owner.name } } : {}),
    ...(fits(license?.text, 500) ? { license: { ...(SPDX.test(license.text) ? { expression: license.text } : { text: license.text }), scope: c.license.repositoryWide ? 'repository' : 'capability' } } : {}),
    ...(isHttps(c.documentation?.value) ? { documentation: c.documentation.value } : {}),
    ...(keywords.length > 0 ? { keywords } : {}),
    riskTier: 'unassessed',
    ...(interfaces.length > 0 ? { interfaces } : {}),
    ...(runtime.length > 0 ? { runtime } : {}),
    ...(setup.length > 0 ? { setup } : {}),
  };

  provenance.push({ field: '/id', method: 'curated', source: 'Assigned by the research harness from the record reference.', observedAt });
  attribute('/name', nameEntry);
  attribute('/description', c.description);
  attribute('/capabilityType', c.capabilityType);
  attribute('/source', sourceEntry);
  if (source.repositoryId) attribute('/source/repositoryId', c.forgeRepository);
  if (source.status) attribute('/source/status', c.lifecycle);
  if (source.updatedAt) attribute('/source/updatedAt', c.updated);
  provenance.push({ field: '/publications/0', method: 'native', source: `${format}: the record itself (${record.sourceUrl})`.slice(0, 300), observedAt });
  if (publications.length > 1) attribute('/publications/1', c.publications ?? { prov: 'native', from: '.mcp.json (MCP servers the plugin starts or connects to)' });
  if (owner) attribute('/owner/name', owner.entry);
  if (manifest.license) attribute('/license', c.license);
  if (manifest.documentation) attribute('/documentation', c.documentation);
  if (manifest.keywords) attribute('/keywords', c.keywords);
  if (manifest.interfaces) attribute('/interfaces', c.interfaces);
  if (manifest.runtime) attribute('/runtime', c.runtime);
  if (manifest.setup) attribute('/setup', c.setup);
  const draft = { ...manifest, provenance: provenance.filter((item) => getAt(manifest, toTokens(item.field)) !== undefined) };
  return JSON.parse(JSON.stringify(draft));
}

async function starterCheck(records, j4, registry = getRegistry()) {
  const drafts = records.map((record) => ({ record, manifest: draftStarterManifest(record) }));
  const report = await validateManifests(drafts.map(({ record, manifest }) => ({ file: `starter/${record.ref}.capability.yaml`, text: toYamlText(manifest) })), { today: '2026-10-22', registry });
  const refOf = Object.fromEntries(drafts.map(({ record, manifest }) => [manifest.id, record.ref]));
  const researchLevel = Object.fromEntries(j4.map((r) => [r.ref, (r.reached.assessable && 'assessable') || (r.reached.discoverable && 'discoverable') || 'none']));

  const rows = drafts.map(({ record, manifest }, i) => {
    const result = report.results[i];
    const codesOf = (severity) => result.findings.filter((finding) => finding.severity === severity).map((finding) => finding.code);
    return {
      ref: record.ref, format: record.format, valid: result.valid,
      level: result.completeness?.level ?? null,
      researchLevel: researchLevel[record.ref],
      next: result.completeness ? Object.entries(result.completeness.unmet).find(([, facts]) => facts.length > 0) ?? null : null,
      errors: result.findings.filter((finding) => finding.severity === 'error').map((finding) => `${finding.code} ${finding.path}`),
      warnings: codesOf('warning'),
      unverified: codesOf('unverified'),
      unconfirmed: result.findings.filter((finding) => finding.code === 'DERIVED_VALUE_UNCONFIRMED').map((finding) => manifest.provenance[Number(finding.path.split('/')[2])].field),
    };
  });

  // J2 through the validator: the manifests that its shared-location warnings link.
  const links = { DUPLICATE_PUBLICATION: [], DUPLICATE_SOURCE: [] };
  report.results.forEach((result, i) => {
    for (const finding of result.findings.filter((f) => links[f.code])) {
      for (const other of finding.related ?? []) links[finding.code].push([drafts[i].record.ref, refOf[other]].sort());
    }
  });
  const truthPairs = pairs(judgments.identity.groups.map((group) => group.members.map(canonical).filter((ref) => records.some((record) => record.ref === ref))));
  const evaluate = (edgeList) => {
    const predicted = pairs(cluster(records, edgeList));
    return {
      links: new Set(edgeList.map((pair) => pair.join('~'))).size,
      truePairs: [...predicted].filter((pair) => truthPairs.has(pair)).length,
      falsePairs: [...predicted].filter((pair) => !truthPairs.has(pair)),
      missedPairs: [...truthPairs].filter((pair) => !predicted.has(pair)),
    };
  };
  const invalidRefs = new Set(rows.filter((row) => !row.valid).map((row) => row.ref));
  return {
    rows,
    identity: {
      'DUPLICATE_PUBLICATION only': evaluate(links.DUPLICATE_PUBLICATION),
      'DUPLICATE_SOURCE only': evaluate(links.DUPLICATE_SOURCE),
      'DUPLICATE_PUBLICATION + DUPLICATE_SOURCE': evaluate([...links.DUPLICATE_PUBLICATION, ...links.DUPLICATE_SOURCE]),
    },
    missedBecauseInvalid: [...truthPairs].filter((pair) => pair.split('~').some((ref) => invalidRefs.has(ref))),
    example: drafts.find(({ record }) => record.ref === 'N1-09')?.manifest ?? null,
  };
}

// ---------------------------------------------------------------------------------------------
// 9. Report

const pct = (value) => (value === null || value === undefined ? 'n/a' : `${Math.round(value * 100)}%`);
const cellCounts = (entry) => {
  if (!entry || entry.total === 0) return '';
  const parts = PROV_ORDER.filter((prov) => entry[prov] > 0).map((prov) => `${entry[prov]}${prov[0].toUpperCase()}`);
  return parts.length ? `${parts.join(' ')} /${entry.total}` : `- /${entry.total}`;
};
const md = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** Runs the analysis on the snapshot. Returns results.json (as an object), results.md, and a summary. */
export async function runResearch() {
  const records = collection;
  const nonCards = records.filter((record) => record.selection !== 'a2a-sample');
  const targeted = records.filter((record) => record.selection !== 'background' && record.selection !== 'a2a-sample');
  const matrix = availability(nonCards);
  const matrixCards = availability(records.filter((record) => record.selection === 'a2a-sample'));
  const conformance = a2aConformance();
  const j1 = discovery();
  const j2 = identity();
  const j3 = comparisons();
  const j4 = sufficiency(nonCards);
  const schema = await schemaCheck(nonCards, frozenRegistry());
  const revised = await schemaCheck(nonCards, getRegistry());
  const starter = await starterCheck(nonCards, j4);
  // Sensitivity: the same run with description kept mandatory, as it was before the revision.
  const descriptionMandatory = await starterCheck(nonCards, j4, variantRegistry((s) => s.required.push('description')));
  const sensitivity = { descriptionMandatory: { valid: descriptionMandatory.rows.filter((row) => row.valid).length, invalid: descriptionMandatory.rows.filter((row) => !row.valid).map((row) => `${row.ref} ${row.errors.join(', ')}`), identity: descriptionMandatory.identity['DUPLICATE_PUBLICATION + DUPLICATE_SOURCE'], missedBecauseInvalid: descriptionMandatory.missedBecauseInvalid } };
  const results = { generatedFrom: { sample: index.retrievedAt, supplementary: supplementary.retrievedAt, a2a: a2aSample.retrievedAt }, aliases, matrix, conformance, j1, j2, j3, j4, schema, revised, starter, sensitivity };

  const L = [];
  L.push('# Spikes 1-3 research: results', '');
  L.push(`> Generated by \`node research/spikes-1-3/analyze.js\` from the snapshot retrieved ${index.retrievedAt} (supplementary ${supplementary.retrievedAt}). Do not edit by hand. Interpretation: [MISSION4_SPIKES_1_TO_3_RESEARCH.md](../../MISSION4_SPIKES_1_TO_3_RESEARCH.md).`, '');

  // Sample
  L.push('## 1. Sample', '');
  const formats = [...new Set(nonCards.map((record) => record.format))];
  L.push(`${targeted.length} targeted publications (${sampled.length} records drawn, ${sampled.length - targeted.length} drawn twice), ${background.length} background records from iteration 1 (${background.length - nonCards.filter((r) => r.selection === 'background').length} duplicate a targeted record), and ${usableCards.length} usable A2A Agent Cards (of ${cards.length} files retrieved).`, '');
  L.push('| Format | Targeted | Background | By selection step |', '|---|---|---|---|');
  for (const format of formats) {
    const ofFormat = targeted.filter((record) => record.format === format);
    const steps = ['purposive', 'random', 'cross-listing'].map((step) => `${step} ${ofFormat.filter((record) => record.selection === step).length}`).join(', ');
    L.push(`| ${FORMAT_LABELS[format]} | ${ofFormat.length} | ${nonCards.filter((record) => record.format === format && record.selection === 'background').length} | ${steps} |`);
  }
  L.push('', `Aliases (the same publication drawn twice): ${Object.entries(aliases).map(([a, b]) => `${a} = ${b}`).join('; ') || 'none'}.`, '');
  L.push('| Ref | Need | Source | Selection | Name | Note |', '|---|---|---|---|---|---|');
  for (const record of [...sampled, ...background]) L.push(`| ${record.ref} | ${record.need ?? '-'} | ${record.source} | ${record.selection} | ${md(record.name)} | ${md(record.note)} |`);
  L.push('');

  // Native discovery
  L.push('## 2. How the sources\' own search behaves', '');
  L.push('| Need | Source | Query | Result size | Vendor publication |', '|---|---|---|---|---|');
  for (const need of needs) {
    for (const [source, result] of Object.entries(index.sources[need.id] ?? {})) {
      const size = result.total !== undefined ? `${result.total.toLocaleString('en-US')} total, first ${result.names.length} recorded` : result.returned !== undefined ? `${result.returned} on the first page${result.hasMorePages ? ' (more pages)' : ''}` : `${result.matched} of ${result.listed} matched`;
      let vendor = result.vendor ? (result.vendor.found ? `${result.vendor.name}, rank ${result.vendor.rankInResults}` : 'not on the pages searched') : '-';
      if (need.id === 'N2' && source === 'mcp-registry' && supplementary.githubVendorSearch?.rank) vendor = `${supplementary.githubVendorSearch.name}, rank ${supplementary.githubVendorSearch.rank} of ${supplementary.githubVendorSearch.totalResults} (page ${Math.ceil(supplementary.githubVendorSearch.rank / 100)})`;
      L.push(`| ${need.id} | ${source} | ${md(result.query)} | ${size} | ${md(vendor)} |`);
    }
  }
  L.push('');

  // Matrix
  L.push('## 3. Metadata availability by format', '');
  L.push('Counts of records whose metadata states each concept: N native, L linked (from the declared source repository), D derived by a stated rule; "/n" is the number of records of that format. Background and targeted records are combined; A2A cards are in section 4.', '');
  L.push(`| Concept | ${formats.map((format) => FORMAT_LABELS[format].split(' (')[0]).join(' | ')} | All (of ${nonCards.length}) | Native only |`, `|---|${formats.map(() => '---').join('|')}|---|---|`);
  for (const row of matrix) L.push(`| ${row.concept.label} | ${formats.map((format) => cellCounts(row.perFormat[format])).join(' | ')} | ${row.present} | ${row.native} |`);
  L.push('', 'Native fields behind each concept (as observed in the sample):', '');
  L.push('| Concept | Format | Fields |', '|---|---|---|');
  for (const row of matrix) for (const format of formats) if (row.perFormat[format]?.fields.length) L.push(`| ${row.concept.label} | ${FORMAT_LABELS[format].split(' (')[0]} | ${md(row.perFormat[format].fields.join('; '))} |`);
  L.push('');

  // A2A
  const json = conformance.filter((row) => row.json);
  L.push('## 4. A2A Agent Cards in practice', '');
  L.push(`${cards.length} files named agent-card.json from the first 50 GitHub code-search results (${a2aSample.totalCount.toLocaleString('en-US')} files indexed); ${json.length} parse as JSON objects.`, '');
  L.push('| Check | Cards |', '|---|---|');
  L.push(`| Valid against the A2A v0.3.0 JSON Schema (AgentCard) | ${json.filter((row) => row.v03).length} |`);
  L.push(`| Has every field that A2A v1.0.1 marks REQUIRED (a2a.proto) | ${json.filter((row) => row.v1).length} |`);
  L.push(`| Declares a protocol version | ${json.filter((row) => row.declared).length} |`);
  L.push(`| Declares 1.x but uses the pre-1.0 shape (no supportedInterfaces) | ${json.filter((row) => row.declaredMismatch).length} |`);
  L.push(`| Names a provider | ${json.filter((row) => row.hasProvider).length} |`);
  L.push(`| Lists skills | ${json.filter((row) => row.hasSkills).length} |`);
  L.push(`| Points at http:// or localhost | ${json.filter((row) => row.localOrHttp).length} |`);
  L.push('', '| Ref | Repository | Declared version | v0.3.0 valid | v1.0.1 required fields | Missing for v1.0.1 |', '|---|---|---|---|---|---|');
  for (const row of conformance) L.push(row.json ? `| ${row.ref} | ${row.repo} | ${row.declared ?? '-'} | ${row.v03 ? 'yes' : 'no'} | ${row.v1 ? 'yes' : 'no'} | ${row.missingV1.join(', ') || '-'} |` : `| ${row.ref} | ${row.repo} | not a JSON object | | | |`);
  L.push('', `Concept availability in the usable cards (of ${matrixCards[0]?.total ?? 0}):`, '');
  L.push('| Concept | Cards stating it |', '|---|---|');
  for (const row of matrixCards) if (row.present > 0) L.push(`| ${row.concept.label} | ${row.present} (${row.native} native) |`);
  L.push('');

  // J1
  L.push('## 5. J1: find a capability for a need', '');
  L.push('Terms from needs.yaml matched as whole words. Score: name or title 3, keywords, tags, tools or skills 2, description 1, documentation 0.5 (V1 only). "Useful" counts relevant plus partial. The collection holds every distinct record, A2A cards included.', '');
  L.push('| Need | Variant | Retrieved | Recall (relevant) | Recall (useful) | Precision | P@5 | P@10 | Relevant capabilities found | Entries returned for them |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const { need, variants } of j1) for (const [variant, v] of Object.entries(variants)) L.push(`| ${need.id} | ${variant} | ${v.retrieved} | ${pct(v.recall)} (of ${v.relevantTotal}) | ${pct(v.usefulRecall)} (of ${v.usefulTotal}) | ${pct(v.precision)} | ${pct(v.precisionAt5)} | ${pct(v.precisionAt10)} | ${v.capabilitiesFound} of ${v.capabilitiesRelevant} | ${v.entriesForRelevantCapabilities} |`);
  for (const { need, variants } of j1) {
    L.push('', `### ${need.id}: ${md(need.statement)}`, '');
    L.push('Top 10 with native fields (V0):', '', '| Rank | Ref | Name | Format | Score | Matched | Judged |', '|---|---|---|---|---|---|---|');
    variants.V0.top.forEach((hit, i) => L.push(`| ${i + 1} | ${hit.ref} | ${md(hit.name)} | ${hit.format} | ${hit.score} | ${hit.matched.join(', ')} | ${hit.judged} |`));
    for (const variant of ['V0', 'V1', 'V2']) {
      const v = variants[variant];
      L.push('', `${variant} misses (useful but not retrieved): ${v.misses.map((miss) => `${miss.ref} ${md(miss.name)} (${miss.level})`).join('; ') || 'none'}.`);
      L.push(`${variant} false positives: ${v.falsePositives.length} (${v.falsePositives.slice(0, 12).map((fp) => `${fp.ref} ${md(fp.name)} [${fp.matched.join(', ')}]`).join('; ')}${v.falsePositives.length > 12 ? '; ...' : ''}).`);
    }
  }
  L.push('');

  // J2
  L.push('## 6. J2: the same capability across sources', '');
  L.push('Judged identity groups (judgments.yaml):', '', '| Group | Members | Basis |', '|---|---|---|');
  for (const group of j2.truthGroups) L.push(`| ${group.id} | ${group.members.join(', ')} | ${md(group.basis)} |`);
  L.push('', '| Rule (metadata only) | Links | Correct pairs | False pairs | Missed pairs |', '|---|---|---|---|---|');
  for (const [rule, r] of Object.entries(j2.rules)) L.push(`| ${rule} | ${r.links} | ${r.truePairs} | ${r.falsePairs.length} | ${r.missedPairs.length} |`);
  for (const [rule, r] of Object.entries(j2.rules)) {
    L.push('', `${rule}: false pairs ${r.falsePairs.join(', ') || 'none'}; missed pairs ${r.missedPairs.join(', ') || 'none'}.`);
  }
  L.push('', `Same repository but only one side names a path (cannot be decided from metadata): ${j2.ambiguousRepositoryLinks.map((pair) => pair.join('~')).join(', ') || 'none'}.`);
  L.push(`Skill bodies with identical content (sha256): ${j2.contentCopies.map((group) => group.join(' = ')).join('; ') || 'none'}.`);
  L.push(`Repositories the forge reports as forks: ${j2.forks.map((fork) => `${fork.ref} (parent ${fork.parent})`).join('; ') || 'none'}.`);
  L.push(`Declared repository URLs that now resolve to another name: ${j2.renamedOrMoved.map((item) => `${item.ref}: ${item.requested} -> ${item.now}`).join('; ') || 'none'}.`);
  if (renames) {
    const inSample = renames.results.filter((r) => r.uses.some((use) => !use.ref.startsWith('family:')));
    L.push(`GitHub repository references in the sample's reference fields (samples/renames.json, ${inSample.length} distinct): ${inSample.filter((r) => r.renamedOrMoved).length} resolve to another name (${inSample.filter((r) => r.renamedOrMoved).map((r) => `${r.requested} -> ${r.fullName}, repository id ${r.id} unchanged, used by ${[...new Set(r.uses.map((use) => `${use.ref} ${use.field}`))].join(' and ')}`).join('; ') || 'none'}); ${inSample.filter((r) => r.status !== 200).length} return HTTP 404, which cannot tell a private repository from a missing one (${inSample.filter((r) => r.status !== 200).map((r) => `${r.requested} from ${[...new Set(r.uses.map((use) => use.ref))].join(', ')}`).join('; ')}).`);
    const familyUses = renames.results.flatMap((r) => r.uses.filter((use) => use.ref.startsWith('family:')).map((use) => ({ ...r, entry: use.ref.split(':').slice(2).join(':'), family: use.ref.split(':')[1] })));
    const byRepo = {};
    for (const use of familyUses) (byRepo[use.requested.toLowerCase()] ??= new Set()).add(use.entry);
    L.push('', `Registry families (every official MCP Registry entry returned for "playwright", "tavily", and "brave"; ${familyUses.length} entries with a declared repository):`, '');
    L.push('| Family | Entry | Declared repository | Forge says |', '|---|---|---|---|');
    for (const use of familyUses.sort((a, b) => a.family.localeCompare(b.family) || a.entry.localeCompare(b.entry))) {
      let says = use.status !== 200 ? `HTTP ${use.status} (private or missing)` : use.fork ? `fork of ${use.parent}` : 'not a fork';
      if (byRepo[use.requested.toLowerCase()].size > 1) says += `; the same repository is declared by ${[...byRepo[use.requested.toLowerCase()]].filter((name) => name !== use.entry).join(', ')}`;
      L.push(`| ${use.family} | ${use.entry} | ${use.requested} | ${says} |`);
    }
  }
  L.push('', 'Judged derivatives (linked, not merged):', '', '| From | Relation | To | Evidence |', '|---|---|---|---|');
  for (const d of j2.derivatives) L.push(`| ${d.from} | ${d.relation} | ${d.to} | ${md(d.evidence)} |`);
  L.push('');

  // J3
  L.push('## 7. J3: compare candidates and decide', '');
  L.push('One column per relevant capability (identity groups merged). Each cell: the provenance of the best answer across its publications (N native, L linked, D derived, ? unknown, G governance), then the publications that answered.', '');
  const letter = { native: 'N', linked: 'L', derived: 'D', unknown: '?', governance: 'G' };
  for (const { need, capabilities } of j3) {
    L.push(`### ${need.id}`, '');
    if (capabilities.length === 0) { L.push('No relevant capability in the sample.', ''); continue; }
    L.push(`| Question | ${capabilities.map((cap) => md(cap.id)).join(' | ')} |`, `|---|${capabilities.map(() => '---').join('|')}|`);
    for (const q of DECISION_QUESTIONS) L.push(`| ${q} | ${capabilities.map((cap) => `${letter[cap.merged[q].status]} ${[...new Set(cap.merged[q].facts.map((fact) => fact.ref))].join(',')}`).join(' | ')} |`);
    L.push(`| questions answered (of 11), all publications / best single | ${capabilities.map((cap) => `${cap.answeredMerged} / ${cap.answeredBestSingle}`).join(' | ')} |`);
    L.push(`| **blockers** | ${capabilities.map((cap) => md(cap.blockers.join('; ') || 'none from metadata')).join(' | ')} |`);
    L.push(`| gaps to ask or confirm | ${capabilities.map((cap) => md(cap.gaps.join('; '))).join(' | ')} |`, '');
  }
  const multi = j3.flatMap(({ capabilities }) => capabilities).filter((cap) => cap.refs.length > 1);
  L.push(`Capabilities with more than one publication: ${multi.length}. Merging their publications answers more questions than the best single publication for ${multi.filter((cap) => cap.answeredMerged > cap.answeredBestSingle).length} of the ${multi.length} (questions answered, all publications versus best single: ${multi.map((cap) => `${cap.id} ${cap.answeredMerged} vs ${cap.answeredBestSingle}`).join('; ')}).`, '');

  // J4
  L.push('## 8. J4: is there enough information, and what must be asked', '');
  const count = (predicate) => j4.filter(predicate).length;
  L.push(`Levels reached from each record's own metadata (of ${j4.length} records): discoverable (what, kind, interface) ${count((r) => r.reached.discoverable)}; assessable (also where it runs, terms, version, maintenance, publisher) ${count((r) => r.reached.assessable)}; assessable without heuristics (every fact stated natively, by a linked source, or derived by a convention the source documents) ${count((r) => r.reached.assessableNoInference)}; setup stated ${count((r) => r.reached.setupStated)}; governed 0 (no record carries a risk assessment).`, '');
  L.push('| Question | Native | Linked | Derived by convention | Derived by heuristic (confirm) | Unknown (ask) |', '|---|---|---|---|---|---|');
  for (const q of DECISION_QUESTIONS) L.push(`| ${q} | ${count((r) => r.kinds[q] === 'native')} | ${count((r) => r.kinds[q] === 'linked')} | ${count((r) => r.kinds[q] === 'convention')} | ${count((r) => r.kinds[q] === 'heuristic')} | ${q === 'risk' ? `${j4.length} (governance)` : count((r) => r.kinds[q] === 'unknown')} |`);
  L.push('', '| Ref | Format | Assessable | Without inference | To confirm (inferred) | To ask (not stated) |', '|---|---|---|---|---|---|');
  for (const r of j4) L.push(`| ${r.ref} | ${r.format} | ${r.reached.assessable ? 'yes' : 'no'} | ${r.reached.assessableNoInference ? 'yes' : 'no'} | ${r.confirm.join(', ')} | ${r.ask.join(', ')} |`);
  L.push('');

  // Schema
  L.push('## 9. Schema 0.1 validity versus journey outcomes (the draft of 2026-10-22)', '');
  const valid = schema.filter((row) => row.valid);
  L.push(`${valid.length} of ${schema.length} drafted manifests are valid against schema 0.1 as it stood on 2026-10-22 (reference/capability-0.1-2026-10-22.schema.json), the schema the report evaluated.`, '');
  const errorCounts = {};
  for (const row of schema) for (const error of row.errors) errorCounts[error] = (errorCounts[error] ?? 0) + 1;
  L.push('| Error (code and path) | Drafts |', '|---|---|');
  for (const [error, n] of Object.entries(errorCounts).sort((a, b) => b[1] - a[1])) L.push(`| ${error} | ${n} |`);
  const relevantAnywhere = (ref) => needs.some((need) => relevanceOf(need.id, ref) === 'relevant');
  const assessable = Object.fromEntries(j4.map((r) => [r.ref, r.reached.assessable]));
  const cross = { validAssessable: 0, validNotAssessable: 0, invalidAssessable: 0, invalidNotAssessable: 0 };
  for (const row of schema) cross[`${row.valid ? 'valid' : 'invalid'}${assessable[row.ref] ? 'Assessable' : 'NotAssessable'}`] += 1;
  L.push('', '| | Assessable from metadata | Not assessable |', '|---|---|---|');
  L.push(`| Valid against schema 0.1 | ${cross.validAssessable} | ${cross.validNotAssessable} |`);
  L.push(`| Invalid | ${cross.invalidAssessable} | ${cross.invalidNotAssessable} |`);
  L.push('', '| Ref | Valid | Relevant to a need | Assessable | Errors |', '|---|---|---|---|---|');
  for (const row of schema) L.push(`| ${row.ref} | ${row.valid ? 'yes' : 'no'} | ${relevantAnywhere(row.ref) ? 'yes' : 'no'} | ${assessable[row.ref] ? 'yes' : 'no'} | ${row.errors.join('; ')} |`);
  L.push('');

  // Revised schema
  const errorTable = (rows) => {
    const counts = {};
    for (const row of rows) for (const error of row.errors) counts[error] = (counts[error] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };
  const rowsC = starter.rows;
  const validCount = (rows) => rows.filter((row) => row.valid).length;
  L.push('## 10. The revised schema 0.1 (2026-10-23) on the same records', '');
  L.push('The revision applies the report\'s proposals (sections 11 and 13.1) to the unpublished 0.1 draft. Three runs over the same records separate the effect of the schema from the effect of the mapping. Run C drafts each record into the starter model: publications with their native versions and statuses, the source repository with its forge id and observed status, license, runtime, setup, and the provenance of every value. Its ids are assigned by the harness from the record reference, never derived from a name, so identity can only come from publications and sources. A native value that the schema cannot hold is left out, never shortened.', '');
  L.push('| Run | Mapping | Schema | Valid drafts |', '|---|---|---|---|');
  L.push(`| A (section 9) | schema-0.1 mapping (\`draftManifest\`) | 0.1, draft of 2026-10-22 | ${validCount(schema)} of ${schema.length} |`);
  L.push(`| B | the same mapping | 0.1, revised 2026-10-23 | ${validCount(revised)} of ${revised.length} |`);
  L.push(`| C | starter-model mapping (\`draftStarterManifest\`) | 0.1, revised 2026-10-23 | ${validCount(rowsC)} of ${rowsC.length} |`, '');
  for (const [label, rows] of [['B', revised], ['C', rowsC]]) {
    L.push(`Errors in run ${label}:`, '', '| Error (code and path) | Drafts |', '|---|---|');
    for (const [error, n] of errorTable(rows)) L.push(`| ${error} | ${n} |`);
    L.push('');
  }
  const idRejected = schema.filter((row) => row.errors.some((error) => error.startsWith('INVALID_FORMAT /id')));
  const revisedByRef = Object.fromEntries(revised.map((row) => [row.ref, row]));
  L.push(`Ids that the 2026-10-22 pattern rejects: ${idRejected.map((row) => `\`${row.id}\` (${row.ref})`).join(', ') || 'none'}; the revised pattern accepts ${idRejected.filter((row) => !revisedByRef[row.ref].errors.some((error) => error.startsWith('INVALID_FORMAT /id'))).length} of them.`, '');

  const levelOrder = ['none', 'discoverable', 'assessable', 'adoptable', 'governed'];
  const researchOrder = ['none', 'discoverable', 'assessable'];
  L.push('Completeness level the validator reports in run C, against the level section 8 measured from the same records (rows: validator; columns: section 8):', '');
  L.push(`| Validator level | ${researchOrder.join(' | ')} | Total |`, `|---|${researchOrder.map(() => '---').join('|')}|---|`);
  for (const level of [null, ...levelOrder]) {
    const ofLevel = rowsC.filter((row) => row.level === level);
    if (level !== null && !levelOrder.slice(0, 3).includes(level) && ofLevel.length === 0) continue;
    L.push(`| ${level ?? 'invalid (no level)'} | ${researchOrder.map((r) => ofLevel.filter((row) => row.researchLevel === r).length).join(' | ')} | ${ofLevel.length} |`);
  }
  const disagreements = rowsC.filter((row) => row.level !== row.researchLevel);
  L.push('', `Disagreements: ${disagreements.map((row) => `${row.ref} (validator ${row.level ?? 'invalid'}, section 8 ${row.researchLevel}${row.next ? `; ${row.next[0]} needs ${row.next[1].join(', ')}` : ''}${row.valid ? '' : `; ${row.errors.join(', ')}`})`).join('; ') || 'none'}.`, '');
  const nextCounts = {};
  for (const row of rowsC.filter((r) => r.next)) for (const fact of row.next[1]) nextCounts[`${row.next[0]}: ${fact}`] = (nextCounts[`${row.next[0]}: ${fact}`] ?? 0) + 1;
  L.push('Facts the next level needs, as the validator reports them (run C):', '', '| Next level: fact | Drafts |', '|---|---|');
  for (const [fact, n] of Object.entries(nextCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) L.push(`| ${fact} | ${n} |`);
  L.push('');

  L.push('J2 through the validator: the pairs that its shared-location warnings link in run C, scored against the judged identity groups as in section 6:', '');
  L.push('| Validator findings | Distinct links | Correct pairs | False pairs | Missed pairs |', '|---|---|---|---|---|');
  for (const [rule, r] of Object.entries(starter.identity)) L.push(`| ${rule} | ${r.links} | ${r.truePairs} | ${r.falsePairs.length} | ${r.missedPairs.length} |`);
  for (const [rule, r] of Object.entries(starter.identity)) L.push('', `${rule}: false pairs ${r.falsePairs.join(', ') || 'none'}; missed pairs ${r.missedPairs.join(', ') || 'none'}.`);
  L.push('', `Judged pairs with a member that is invalid in run C, which Stage 2 therefore does not check: ${starter.missedBecauseInvalid.join(', ') || 'none'}.`, '');
  const dm = sensitivity.descriptionMandatory;
  L.push(`Sensitivity: run C with \`description\` kept mandatory, as before the revision: ${dm.valid} of ${rowsC.length} drafts valid (invalid: ${dm.invalid.join('; ') || 'none'}); identity through the validator ${dm.identity.truePairs} correct, ${dm.identity.falsePairs.length} false, ${dm.identity.missedPairs.length} missed (${dm.missedBecauseInvalid.join(', ') || 'none'} because a member is invalid and Stage 2 does not check it).`, '');

  const unverifiedCounts = {};
  for (const row of rowsC) for (const code of row.unverified) unverifiedCounts[code] = (unverifiedCounts[code] ?? 0) + 1;
  const warningCounts = {};
  for (const row of rowsC) for (const code of row.warnings) warningCounts[code] = (warningCounts[code] ?? 0) + 1;
  L.push('Warnings and unverified findings in run C:', '', '| Finding | Severity | Count |', '|---|---|---|');
  for (const [code, n] of Object.entries(warningCounts).sort((a, b) => b[1] - a[1])) L.push(`| ${code} | warning | ${n} |`);
  for (const [code, n] of Object.entries(unverifiedCounts).sort((a, b) => b[1] - a[1])) L.push(`| ${code} | unverified | ${n} |`);
  const unconfirmed = {};
  for (const row of rowsC) for (const field of row.unconfirmed) unconfirmed[field] = (unconfirmed[field] ?? 0) + 1;
  L.push('', `Values inferred by a heuristic and reported as unconfirmed (DERIVED_VALUE_UNCONFIRMED), by field: ${Object.entries(unconfirmed).sort((a, b) => b[1] - a[1]).map(([field, n]) => `${field} ${n}`).join(', ') || 'none'}. Section 8 counts heuristic answers per question: kind ${count((r) => r.kinds.kind === 'heuristic')}, interface ${count((r) => r.kinds.interface === 'heuristic')}, who ${count((r) => r.kinds.who === 'heuristic')}.`, '');
  L.push('| Ref | Format | Valid | Validator level | Section 8 level | Next level needs | Errors | Unverified |', '|---|---|---|---|---|---|---|---|');
  for (const row of rowsC) L.push(`| ${row.ref} | ${row.format} | ${row.valid ? 'yes' : 'no'} | ${row.level ?? '-'} | ${row.researchLevel} | ${row.next ? `${row.next[0]}: ${row.next[1].join(', ')}` : '-'} | ${row.errors.join('; ')} | ${[...new Set(row.unverified)].join(', ')} |`);
  L.push('', 'Starter-model draft of N1-09 (the Docker catalog build of Microsoft\'s Playwright MCP server), as run C validates it:', '', '```yaml', toYamlText(starter.example).trimEnd(), '```', '');

  const summary = [
    `Analysed ${records.length} distinct records (${nonCards.length} capabilities, ${usableCards.length} agent cards).`,
    ...j1.map(({ need, variants }) => `  ${need.id}: V0 recall ${pct(variants.V0.recall)} precision ${pct(variants.V0.precision)} | V1 recall ${pct(variants.V1.recall)} precision ${pct(variants.V1.precision)} | V2 recall ${pct(variants.V2.recall)} precision ${pct(variants.V2.precision)}`),
    `  schema 0.1 of 2026-10-22: ${validCount(schema)} of ${schema.length} drafts valid; assessable ${count((r) => r.reached.assessable)} of ${j4.length} (${count((r) => r.reached.assessableNoInference)} without inference)`,
    `  revised schema 0.1: ${validCount(revised)} of ${revised.length} drafts valid with the same mapping; ${validCount(rowsC)} of ${rowsC.length} starter-model drafts valid`,
    `  validator levels (starter drafts): ${levelOrder.map((level) => `${level} ${rowsC.filter((row) => row.level === level).length}`).join(', ')}; identity via the validator: ${starter.identity['DUPLICATE_PUBLICATION + DUPLICATE_SOURCE'].truePairs} correct, ${starter.identity['DUPLICATE_PUBLICATION + DUPLICATE_SOURCE'].falsePairs.length} false, ${starter.identity['DUPLICATE_PUBLICATION + DUPLICATE_SOURCE'].missedPairs.length} missed`,
  ];
  return { results, markdown: `${L.join('\n')}\n`, summary };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { results, markdown, summary } = await runResearch();
  writeFileSync(join(ROOT, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);
  writeFileSync(join(ROOT, 'results.md'), markdown);
  console.log([...summary, 'Wrote research/spikes-1-3/results.md and results.json.'].join('\n'));
}
