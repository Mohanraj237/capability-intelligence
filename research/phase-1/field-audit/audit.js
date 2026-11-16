// Phase 1 field audit: tests every field of manifest schema 0.1, one by one, against the 22
// production manifests, the completeness levels, the pre-registered journeys and needs
// (protocol.yaml), the consumer needs of the other missions, and what an AI host needs to load a
// capability. Writes results.json and one Markdown draft per test under docs/phase-1-testing/.
//
//   node research/phase-1/field-audit/audit.js
//
// Deterministic: no network, a fixed "today", and inputs read from the repository only.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import { valuesAt, assessCompleteness, levelsOf } from '../../../src/completeness.js';
import { buildExchangeDocument } from '../../../src/exchange.js';
import { resolveRef } from '../../../src/schema-registry.js';
import { expandPaths, getRegistry, validateManifests, validateManifestText } from '../../../src/validator.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const DRAFTS = join(ROOT, 'docs', 'phase-1-testing', 'drafts');
const TODAY = '2026-11-16';
const CORPUS_DIR = 'case-studies/production-set/manifests';

const registry = getRegistry();
const schema = registry.get('0.1').schema;
const levels = levelsOf(schema);
const protocol = parse(readFileSync(join(HERE, 'protocol.yaml'), 'utf8'));

const files = expandPaths([join(ROOT, CORPUS_DIR)]).sort();
const corpus = files.map((file) => {
  const text = readFileSync(file, 'utf8');
  return { file: relative(ROOT, file).replaceAll('\\', '/'), text, manifest: parse(text) };
});
const ids = corpus.map((entry) => entry.manifest.id);

// ---------------------------------------------------------------------------------------------
// Helpers

const pct = (part, whole) => (whole === 0 ? '-' : `${Math.round((100 * part) / whole)}%`);
const has = (manifest, path) => valuesAt(manifest, path).length > 0;
const clone = (value) => structuredClone(value);
const toYaml = (manifest) => stringify(manifest, { defaultStringType: 'QUOTE_DOUBLE', defaultKeyType: 'PLAIN' });
const table = (header, rows) => [
  `| ${header.join(' | ')} |`,
  `|${header.map(() => '---').join('|')}|`,
  ...rows.map((row) => `| ${row.map((cell) => String(cell ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')).join(' | ')} |`),
].join('\n');

async function validateSet(manifests) {
  return validateManifests(manifests.map((manifest, i) => ({ file: corpus[i]?.file ?? `extra-${i}.yaml`, text: toYaml(manifest) })), { today: TODAY });
}

// Deletes the value at a field path ("a.b", "a[].b") everywhere it occurs.
function deletePath(object, path) {
  const parts = path.split('.');
  const visit = (node, index) => {
    if (node === undefined || node === null) return;
    const part = parts[index];
    const key = part.replace(/\[\]$/, '');
    if (index === parts.length - 1) {
      delete node[key];
      return;
    }
    const next = node[key];
    if (part.endsWith('[]')) (Array.isArray(next) ? next : []).forEach((item) => visit(item, index + 1));
    else visit(next, index + 1);
  };
  visit(object, 0);
  return object;
}

// Sets the first occurrence of a field path; returns its JSON Pointer, or null if absent.
function setFirst(object, path, value) {
  const parts = path.split('.');
  let node = object;
  const pointer = [];
  for (let i = 0; i < parts.length; i += 1) {
    const key = parts[i].replace(/\[\]$/, '');
    if (node?.[key] === undefined) return null;
    pointer.push(key);
    if (i === parts.length - 1) {
      node[key] = value;
      return `/${pointer.join('/')}`;
    }
    node = node[key];
    if (parts[i].endsWith('[]')) {
      if (!Array.isArray(node) || node.length === 0) return null;
      const index = node.findIndex((item) => item && typeof item === 'object' && has(item, parts.slice(i + 1).join('.')));
      if (index < 0) return null;
      pointer.push(String(index));
      node = node[index];
    }
  }
  return null;
}

// JSON Pointer of a provenance entry -> field path (/publications/1/nativeVersion -> publications[].nativeVersion).
function pointerToPath(pointer) {
  const tokens = pointer.split('/').slice(1);
  const parts = [];
  for (const token of tokens) {
    if (/^\d+$/.test(token)) parts[parts.length - 1] += '[]';
    else parts.push(token);
  }
  return parts.join('.');
}

// ---------------------------------------------------------------------------------------------
// T1. Field inventory: every field path the schema defines, with its requirement and level.

function inventory() {
  const fields = [];
  const conditionalTop = new Map();
  for (const rule of schema.allOf ?? []) {
    for (const name of rule.then?.required ?? []) conditionalTop.set(name, rule.description);
  }
  const levelOf = new Map();
  for (const { level, requires } of levels) {
    for (const requirement of requires) for (const path of requirement.anyOf) if (!levelOf.has(path)) levelOf.set(path, `${level} (${requirement.fact})`);
  }
  const visit = (objectSchema, prefix, depth, parentRequirement) => {
    const required = new Set(objectSchema.required ?? []);
    const conditional = new Set((objectSchema.allOf ?? []).flatMap((rule) => rule.then?.required ?? []));
    for (const [name, raw] of Object.entries(objectSchema.properties ?? {})) {
      const field = resolveRef(schema, raw);
      const path = prefix ? `${prefix}.${name}` : name;
      let requirement;
      if (depth === 0) requirement = required.has(name) ? 'mandatory' : conditionalTop.has(name) ? 'conditional' : 'optional';
      else requirement = required.has(name) ? `required in ${prefix}` : conditional.has(name) ? `conditional in ${prefix}` : `optional in ${prefix}`;
      const items = field.type === 'array' ? resolveRef(schema, field.items) : null;
      fields.push({
        path,
        depth,
        requirement,
        parentRequirement,
        type: field.type === 'array' ? `array of ${items?.type ?? 'any'}` : field.type ?? (field.$ref ? 'object' : 'any'),
        enum: field.enum ?? items?.enum ?? null,
        level: levelOf.get(path) ?? null,
        schemaNode: field,
        itemsNode: items,
      });
      if (field.type === 'object' && field.properties) visit(field, path, depth + 1, requirement);
      if (items?.type === 'object' && items.properties) visit(items, `${path}[]`, depth + 1, requirement);
    }
  };
  visit(schema, '', 0, null);
  return fields;
}

// ---------------------------------------------------------------------------------------------
// T2. Coverage and provenance.

function coverage(fields) {
  const provenance = new Map();
  for (const { manifest } of corpus) {
    for (const entry of manifest.provenance ?? []) {
      const path = pointerToPath(entry.field);
      const top = path.split('.')[0].replace(/\[\]$/, '');
      for (const key of new Set([path, top])) {
        if (!provenance.has(key)) provenance.set(key, {});
        const counts = provenance.get(key);
        counts[entry.method] = (counts[entry.method] ?? 0) + 1;
      }
    }
  }
  return fields.map((field) => {
    const present = corpus.filter(({ manifest }) => has(manifest, field.path));
    const empty = present.filter(({ manifest }) => valuesAt(manifest, field.path).every((value) => Array.isArray(value) && value.length === 0));
    const byType = {};
    for (const { manifest } of present) byType[manifest.capabilityType] = (byType[manifest.capabilityType] ?? 0) + 1;
    return { path: field.path, present: present.length, emptyList: empty.length, byType, provenance: provenance.get(field.path.replace(/\[\]$/, '')) ?? provenance.get(field.path) ?? null };
  });
}

// ---------------------------------------------------------------------------------------------
// T4. Journey answerability, and each field's contribution to the answers.

function answered(manifest, question) {
  const answering = question.anyOf.filter((path) => valuesAt(manifest, path).some((value) => !(question.excluding ?? []).includes(value)));
  return answering;
}

function journeys() {
  const rows = [];
  const credit = new Map();
  const sole = new Map();
  let answeredInstances = 0;
  for (const journey of protocol.journeys) {
    for (const question of journey.questions) {
      let count = 0;
      const byManifest = {};
      for (const { manifest } of corpus) {
        const answering = answered(manifest, question);
        byManifest[manifest.id] = answering;
        if (answering.length === 0) continue;
        count += 1;
        answeredInstances += 1;
        for (const path of answering) credit.set(path, (credit.get(path) ?? 0) + 1 / answering.length);
        if (answering.length === 1) sole.set(answering[0], (sole.get(answering[0]) ?? 0) + 1);
      }
      rows.push({ journey: journey.id, question: question.id, ask: question.ask, need: question.need, governance: !!question.governance, anyOf: question.anyOf, answered: count, byManifest });
    }
  }
  const perManifest = corpus.map(({ manifest }) => {
    const required = rows.filter((row) => row.need === 'required' && !row.governance);
    const ok = required.filter((row) => row.byManifest[manifest.id].length > 0);
    return { id: manifest.id, type: manifest.capabilityType, requiredAnswered: ok.length, required: required.length, missing: required.filter((row) => row.byManifest[manifest.id].length === 0).map((row) => `${row.journey}.${row.question}`) };
  });
  return { rows, credit, sole, answeredInstances, perManifest };
}

// ---------------------------------------------------------------------------------------------
// T3. Removal (ablation): remove one field from every manifest that has it, validate the whole
// set again, and record what changes: validity, completeness level, findings, journey answers.

async function ablation(fields, baseline) {
  const baseByFile = new Map(baseline.results.map((result) => [result.file, result]));
  const results = [];
  for (const field of fields) {
    const holders = corpus.map((entry, i) => ({ ...entry, i })).filter(({ manifest }) => has(manifest, field.path));
    if (holders.length === 0) continue;
    const effect = { path: field.path, holders: holders.length, invalid: 0, levelDrops: {}, codesAdded: {}, codesRemoved: {}, questionsLost: 0 };
    for (const holder of holders) {
      const manifests = corpus.map((entry) => clone(entry.manifest));
      deletePath(manifests[holder.i], field.path);
      const report = await validateSet(manifests);
      const after = report.results.find((result) => result.file === holder.file);
      const before = baseByFile.get(holder.file);
      if (!after.valid) effect.invalid += 1;
      const levelBefore = before.completeness?.level ?? 'invalid';
      const levelAfter = after.valid ? after.completeness?.level ?? 'none' : 'invalid';
      if (levelBefore !== levelAfter) {
        const key = `${levelBefore} -> ${levelAfter}`;
        effect.levelDrops[key] = (effect.levelDrops[key] ?? 0) + 1;
      }
      const codes = (result) => result.findings.map((finding) => finding.code);
      const beforeCodes = codes(before);
      const afterCodes = codes(after);
      for (const code of new Set(afterCodes)) if (afterCodes.filter((c) => c === code).length > beforeCodes.filter((c) => c === code).length) effect.codesAdded[code] = (effect.codesAdded[code] ?? 0) + 1;
      for (const code of new Set(beforeCodes)) if (beforeCodes.filter((c) => c === code).length > afterCodes.filter((c) => c === code).length) effect.codesRemoved[code] = (effect.codesRemoved[code] ?? 0) + 1;
      for (const journey of protocol.journeys) {
        for (const question of journey.questions) {
          if (answered(corpus[holder.i].manifest, question).length > 0 && answered(manifests[holder.i], question).length === 0) effect.questionsLost += 1;
        }
      }
    }
    results.push(effect);
  }
  return results;
}

// ---------------------------------------------------------------------------------------------
// T5. J1 retrieval efficiency: which fields find the right capabilities.

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function textOf(manifest, fieldNames) {
  return fieldNames.flatMap((name) => protocol.searchFields[name].flatMap((path) => valuesAt(manifest, path))).flat().filter((value) => typeof value === 'string').join(' \n ');
}
function matches(manifest, need, fieldNames) {
  const text = textOf(manifest, fieldNames);
  return need.terms.some((term) => new RegExp(`(^|[^A-Za-z0-9])${escapeRegex(term)}([^A-Za-z0-9]|$)`, 'i').test(text));
}
function retrievalScore(fieldNames) {
  let relevantFound = 0;
  let relevantTotal = 0;
  let returned = 0;
  let acceptable = 0;
  const perNeed = {};
  for (const need of protocol.needs) {
    const found = corpus.filter(({ manifest }) => matches(manifest, need, fieldNames)).map(({ manifest }) => manifest.id);
    const ok = new Set([...need.relevant, ...need.partial]);
    relevantTotal += need.relevant.length;
    relevantFound += need.relevant.filter((id) => found.includes(id)).length;
    returned += found.length;
    acceptable += found.filter((id) => ok.has(id)).length;
    perNeed[need.id] = { found, missed: need.relevant.filter((id) => !found.includes(id)), wrong: found.filter((id) => !ok.has(id)) };
  }
  const recall = relevantFound / relevantTotal;
  const precision = returned === 0 ? 0 : acceptable / returned;
  return { fields: fieldNames, recall, precision, f1: recall + precision === 0 ? 0 : (2 * recall * precision) / (recall + precision), perNeed };
}
function retrieval() {
  const all = Object.keys(protocol.searchFields);
  const base = ['name', 'description'];
  const configs = [
    retrievalScore(['name']),
    retrievalScore(base),
    ...all.filter((name) => !base.includes(name)).map((name) => retrievalScore([...base, name])),
    retrievalScore(all),
    ...all.map((name) => retrievalScore(all.filter((other) => other !== name))),
  ];
  return { configs, full: retrievalScore(all) };
}

// ---------------------------------------------------------------------------------------------
// T6. Identity: does the manifest recognise the same capability, and only the same one?

async function identity() {
  const cases = [];
  const copy = (manifest, overrides) => ({ ...clone(manifest), id: `audit/${manifest.id.split('/')[1]}-copy`, ...overrides });
  const run = async (label, signal, extra, expectCode) => {
    const report = await validateSet([...corpus.map((entry) => entry.manifest), extra]);
    const result = report.results.at(-1);
    const codes = result.findings.map((finding) => finding.code);
    cases.push({ label, signal, id: extra.id, expected: expectCode ?? 'no duplicate finding', detected: expectCode ? codes.includes(expectCode) : !codes.some((code) => code.startsWith('DUPLICATE_')), codes: codes.filter((code) => code.startsWith('DUPLICATE_')) });
  };
  for (const { manifest } of corpus) {
    if (manifest.publications) {
      // Re-registered under a new id from a different source location, with the same channels.
      await run('same publications, new id and source', 'publications[].locator', copy(manifest, { source: { type: 'other', description: 'Re-registered by the audit' } }), 'DUPLICATE_PUBLICATION');
    }
    if (manifest.source?.repositoryId) {
      // The repository was renamed: new URL, same forge id, no publications.
      const renamed = copy(manifest, { source: { ...manifest.source, url: `${manifest.source.url}-renamed` } });
      delete renamed.publications;
      await run('repository renamed, new id', 'source.repositoryId', renamed, 'DUPLICATE_SOURCE');
    }
    // Same display name only: a different capability that happens to share the name.
    const namesake = { schemaVersion: '0.1', id: `audit/${manifest.id.split('/')[1]}-namesake`, name: manifest.name, capabilityType: manifest.capabilityType, source: { type: 'repository', url: `https://github.com/audit-other/${manifest.id.split('/')[1]}` }, riskTier: 'unassessed', ...(manifest.capabilityType === 'mcp_server' ? { interfaces: [{ type: 'mcp' }] } : {}) };
    await run('same name only, different capability', 'name (must not link)', namesake, null);
  }
  const base = await validateSet(corpus.map((entry) => entry.manifest));
  const falseLinks = base.results.flatMap((result) => result.findings.filter((finding) => finding.code.startsWith('DUPLICATE_')).map((finding) => `${result.id}: ${finding.code}`));
  // A real pair: the earlier Playwright MCP example and the production manifest.
  const example = parse(readFileSync(join(ROOT, 'examples/valid/playwright-mcp.capability.yaml'), 'utf8'));
  const pair = await validateSet([...corpus.map((entry) => entry.manifest), { ...example, id: 'audit/playwright-mcp-example' }]);
  const pairCodes = pair.results.at(-1).findings.map((finding) => finding.code).filter((code) => code.startsWith('DUPLICATE_'));
  return { cases, falseLinks, realPair: pairCodes };
}

// ---------------------------------------------------------------------------------------------
// T7. Mutation per field: put a wrong value in the field and check that the validator rejects it
// at that field.

// A value that the pattern rejects, so the mutation is really invalid.
function breaking(pattern) {
  const regex = new RegExp(pattern, 'u');
  return [' leading space', 'BAD VALUE !', 'trailing space ', ''].find((candidate) => !regex.test(candidate)) ?? null;
}

function mutationFor(field) {
  const node = field.schemaNode;
  if (node.type === 'array' && field.itemsNode?.pattern && !field.itemsNode.enum) return { value: [breaking(field.itemsNode.pattern)], kind: 'item breaks the pattern' };
  if (node.type === 'string' && node.pattern && !node.enum && !node.pattern.startsWith('^https://') && !/date/i.test(node.$ref ?? '')) return { value: breaking(node.pattern), kind: 'breaks the pattern' };
  if (node.type === 'object' || (field.itemsNode?.type === 'object')) return { value: 'not-an-object-or-list', kind: 'wrong type' };
  if (node.const !== undefined) return { value: 'zz', kind: 'wrong constant' };
  if (node.enum) return { value: 'not-a-valid-value', kind: 'value outside the list' };
  if (node.type === 'array') {
    if (field.itemsNode?.enum) return { value: ['not-a-valid-value'], kind: 'item outside the list' };
    if (field.itemsNode?.pattern) return { value: ['BAD VALUE'], kind: 'item breaks the pattern' };
    if (field.itemsNode?.$ref || field.itemsNode?.type === 'string') return { value: [42], kind: 'item of the wrong type' };
    return { value: 'not-a-list', kind: 'wrong type' };
  }
  if (node.type === 'boolean') return { value: 'yes', kind: 'wrong type' };
  if (node.type === 'integer' || node.type === 'number') return { value: 'x', kind: 'wrong type' };
  if (node.format === 'date' || /date/i.test(node.$ref ?? '') || /date/i.test(node.description ?? '') && node.pattern?.includes('\\d{4}')) return { value: '2026-02-30', kind: 'impossible date' };
  if (node.pattern?.startsWith('^https://')) return { value: 'http://insecure.example.com', kind: 'not https' };
  if (node.pattern) return { value: breaking(node.pattern), kind: 'breaks the pattern' };
  return { value: 42, kind: 'wrong type' };
}

// Fields that no production manifest states are mutated in the example manifests instead.
const examples = expandPaths([join(ROOT, 'examples/valid')]).sort().map((file) => ({ file: relative(ROOT, file).replaceAll('\\', '/'), manifest: parse(readFileSync(file, 'utf8')) }));

function mutations(fields) {
  const rows = [];
  for (const field of fields) {
    const holder = corpus.find(({ manifest }) => has(manifest, field.path)) ?? examples.find(({ manifest }) => has(manifest, field.path));
    if (!holder) {
      rows.push({ path: field.path, tested: false });
      continue;
    }
    const manifest = clone(holder.manifest);
    const { value, kind } = mutationFor(field);
    const pointer = setFirst(manifest, field.path, value);
    if (!pointer) {
      rows.push({ path: field.path, tested: false });
      continue;
    }
    const { findings } = validateManifestText(toYaml(manifest), { file: holder.file, registry });
    const errors = findings.filter((finding) => finding.severity === 'error');
    const atField = errors.filter((finding) => finding.path === pointer || finding.path.startsWith(`${pointer}/`) || pointer.startsWith(finding.path) && finding.path !== '');
    rows.push({ path: field.path, tested: true, manifest: holder.manifest.id, kind, value: JSON.stringify(value), caught: atField.length > 0, codes: [...new Set(atField.map((finding) => finding.code))], otherErrors: errors.length - atField.length });
  }
  return rows;
}

// ---------------------------------------------------------------------------------------------
// T8. AI host recipe: can a host configure the capability from structured fields alone (no
// free text)? Builds the connection or install recipe an AI host or agent would need.

function purlCommand(locator) {
  const npm = /^pkg:npm\/(.+?)(@.*)?$/.exec(locator);
  if (npm) return { install: `npm install ${decodeURIComponent(npm[1])}`, run: `npx -y ${decodeURIComponent(npm[1])}` };
  const pypi = /^pkg:pypi\/(.+?)(@.*)?$/.exec(locator);
  if (pypi) return { install: `pip install ${pypi[1]}`, run: `uvx ${pypi[1]}` };
  return null;
}

function hostRecipe(manifest) {
  const steps = [];
  const gaps = [];
  const interfaces = manifest.interfaces ?? [];
  const publications = manifest.publications ?? [];
  const types = interfaces.map((item) => item.type);
  // Items without a group are always needed; grouped items are alternatives (setup[].group, C13).
  const ungrouped = (manifest.setup ?? []).filter((item) => !item.group);
  const secrets = ungrouped.filter((item) => item.required !== false);
  const env = secrets.filter((item) => !item.kind || ['env_var', 'header', 'input'].includes(item.kind));
  const other = ungrouped.filter((item) => item.kind && !['env_var', 'header', 'input'].includes(item.kind));
  const groups = {};
  for (const item of (manifest.setup ?? []).filter((entry) => entry.group)) (groups[item.group] ??= []).push(`${item.name}${item.secret ? ' (secret)' : ''}`);
  const alternatives = Object.entries(groups).map(([group, items]) => `${group}: ${items.join(' + ')}`);
  let launchable = false;

  if (types.includes('mcp')) {
    const transports = interfaces.filter((item) => item.type === 'mcp').map((item) => item.transport).filter(Boolean);
    if (transports.length === 0) gaps.push('MCP transport not stated');
    for (const publication of publications) {
      if (publication.kind === 'package' && purlCommand(publication.locator)) {
        steps.push(`stdio: \`${purlCommand(publication.locator).run}\``);
        launchable = true;
      } else if (publication.kind === 'container_image') {
        steps.push(`stdio: \`docker run -i --rm ${publication.locator}\``);
        launchable = true;
      } else if (publication.kind === 'hosted_endpoint') {
        steps.push(`remote: ${publication.locator}`);
        launchable = true;
      } else if (publication.kind === 'registry_entry') {
        steps.push(`registry: ${publication.locator} (host resolves the package)`);
        launchable = true;
      } else if (publication.kind === 'marketplace_entry') {
        steps.push(`plugin: \`/plugin install ${publication.locator}\``);
        launchable = true;
      }
    }
  }
  if (types.includes('agent_skill')) {
    const ref = interfaces.find((item) => item.type === 'agent_skill')?.contractRef;
    if (ref) {
      steps.push(`skill: load SKILL.md from ${ref}`);
      launchable = true;
    } else if (manifest.source?.url) {
      steps.push(`skill: load SKILL.md from ${manifest.source.url}${manifest.source.path ? `/${manifest.source.path}` : ''}`);
      launchable = true;
    }
  }
  if (manifest.capabilityType === 'plugin' || types.includes('other')) {
    const entry = publications.find((publication) => publication.kind === 'marketplace_entry');
    if (entry) {
      steps.push(`plugin: \`/plugin install ${entry.locator}\``);
      launchable = true;
    }
  }
  if (types.includes('library')) {
    const pkg = publications.find((publication) => publication.kind === 'package' && purlCommand(publication.locator));
    if (pkg) {
      steps.push(`library: \`${purlCommand(pkg.locator).install}\``);
      launchable = true;
    } else gaps.push('library without a package publication');
  }
  if (types.includes('ci_action')) {
    const repo = publications.find((publication) => publication.kind === 'repository') ?? (manifest.source?.url ? { locator: manifest.source.url } : null);
    if (repo) {
      steps.push(`ci: \`uses: ${repo.locator.replace('https://github.com/', '')}@<pin>\``);
      launchable = true;
    }
  }
  if (types.includes('cli') && !launchable) {
    const pkg = publications.find((publication) => publication.kind === 'package' && purlCommand(publication.locator));
    if (pkg) {
      steps.push(`cli: \`${purlCommand(pkg.locator).install}\``);
      launchable = true;
    }
  }
  if (!launchable) gaps.push('no structured install or launch location');
  if (manifest.setup === undefined) gaps.push('setup not stated');
  return {
    id: manifest.id,
    type: manifest.capabilityType,
    interfaces: types.join(', '),
    steps,
    env: env.map((item) => `${item.name}${item.secret ? ' (secret)' : ''}`),
    otherSetup: other.map((item) => `${item.name} [${item.kind}]`),
    alternatives,
    hosts: [...new Set((manifest.publications ?? []).flatMap((publication) => publication.platformCompatibility ?? []))],
    launchable,
    gaps,
    freeTextOnly: !launchable && (manifest.runtime ?? []).some((item) => item.detail),
  };
}

// ---------------------------------------------------------------------------------------------
// T9. Native-format counterparts: where an AI host or registry already states the fact. Taken
// from the formats' published definitions (MCP server.json, Agent Skills SKILL.md front matter,
// A2A Agent Card, npm package.json, Python core metadata); "-" = no counterpart.

const NATIVE = {
  schemaVersion: ['$schema', '-', 'protocolVersion (of A2A, not of this record)', '-', 'Metadata-Version (of the format)'],
  id: ['name (registry name, not stable across forks)', 'name', 'name', 'name', 'Name'],
  name: ['title / name', 'name', 'name', 'name', 'Name'],
  description: ['description', 'description', 'description', 'description', 'Summary'],
  capabilityType: ['(implied: MCP server)', '(implied: skill)', '(implied: agent)', '-', '-'],
  capabilityVersion: ['version', '-', 'version', 'version', 'Version'],
  source: ['repository.url', '-', 'provider.url', 'repository', 'Project-URL (Source)'],
  publications: ['packages[], remotes[]', '-', 'url', '(the package itself)', '(the package itself)'],
  owner: ['(namespace)', '-', 'provider.organization', 'author / maintainers', 'Author / Maintainer'],
  license: ['-', 'license', '-', 'license', 'License-Expression'],
  documentation: ['websiteUrl', '-', 'documentationUrl', 'homepage', 'Project-URL (Documentation)'],
  keywords: ['-', '-', 'skills[].tags', 'keywords', 'Keywords'],
  lifecycleStatus: ['(registry status: observed, goes to publications[].status)', '-', '-', 'deprecated (observed)', 'yanked (observed)'],
  lastUpdated: ['-', '-', '-', '-', '-'],
  deprecation: ['-', '-', '-', 'deprecated message', '-'],
  maturity: ['-', '-', '-', '-', 'Development Status classifier'],
  riskTier: ['-', '-', '-', '-', '-'],
  assessmentReference: ['-', '-', '-', '-', '-'],
  supportedUseCases: ['-', '(inside description)', 'skills[].examples', '-', '-'],
  interfaces: ['packages[].transport, remotes[].type', '(the format)', 'preferredTransport, additionalInterfaces', 'bin (cli)', 'entry points (cli)'],
  runtime: ['packages[].runtimeHint', '-', '-', 'engines', 'Requires-Python'],
  setup: ['packages[].environmentVariables, headers', '-', 'securitySchemes', '-', '-'],
  integrations: ['-', '-', '-', '-', 'Framework classifier'],
  dependencies: ['-', '-', '-', '-', '-'],
  limitations: ['-', '-', '-', '-', '-'],
  costInformation: ['-', '-', '-', '-', '-'],
  components: ['-', '-', '-', '-', '-'],
  parent: ['-', '-', '-', '-', '-'],
  embeddedComponents: ['(tools/list at runtime)', '-', 'skills[]', '-', '-'],
  relations: ['-', '-', '-', '-', '-'],
  provenance: ['-', '-', '-', '-', '-'],
};

// ---------------------------------------------------------------------------------------------
// T11. Exchange round trip.

async function exchangeRoundTrip(baseline) {
  const document = buildExchangeDocument(baseline);
  const byId = new Map(corpus.map(({ manifest }) => [manifest.id, manifest]));
  const lossless = document.capabilities.filter(({ manifest }) => JSON.stringify(manifest) === JSON.stringify(byId.get(manifest.id))).length;
  const levelsCarried = document.capabilities.filter(({ manifest, validation }) => validation.completeness === baseline.results.find((result) => result.id === manifest.id).completeness.level).length;
  return { capabilities: document.capabilities.length, rejected: document.rejected.length, lossless, levelsCarried };
}

// ---------------------------------------------------------------------------------------------
// T12. Governed level: Mission 3 assessments are simulated as an overlay (riskTier 'low' with an
// assessment reference) to test the top completeness level and the 12-month expiry. The real
// manifests stay 'unassessed': no real assessment exists, and a low tier must never be inferred.

async function governedSimulation() {
  const overlay = (assessedOn, withReference = true) => corpus.map(({ manifest }, i) => ({
    ...clone(manifest),
    riskTier: 'low',
    ...(withReference ? { assessmentReference: { id: `M3-SIMULATED-${String(i + 1).padStart(3, '0')}`, assessedOn } } : {}),
  }));
  const tally = (report) => {
    const levelsReached = {};
    const codes = {};
    for (const result of report.results) {
      const level = result.valid ? result.completeness?.level : 'invalid';
      levelsReached[level] = (levelsReached[level] ?? 0) + 1;
      for (const finding of result.findings) codes[finding.code] = (codes[finding.code] ?? 0) + 1;
    }
    return { levels: levelsReached, codes };
  };
  return [
    { scenario: 'Assessed low on 2026-11-16 (current)', ...tally(await validateSet(overlay('2026-11-16'))) },
    { scenario: 'Assessed low on 2025-11-15 (more than 12 months ago)', ...tally(await validateSet(overlay('2025-11-15'))) },
    { scenario: 'Tier low without an assessment reference', ...tally(await validateSet(overlay(null, false))) },
  ];
}

// ---------------------------------------------------------------------------------------------
// Run

const fields = inventory();
const baseline = await validateSet(corpus.map((entry) => entry.manifest));
const cover = coverage(fields);
const journey = journeys();
const removal = await ablation(fields, baseline);
const search = retrieval();
const ident = await identity();
const mutation = mutations(fields);
const recipes = corpus.map(({ manifest }) => hostRecipe(manifest));
const exchange = await exchangeRoundTrip(baseline);
const governed = await governedSimulation();

const coverageOf = new Map(cover.map((row) => [row.path, row]));
const removalOf = new Map(removal.map((row) => [row.path, row]));
const mutationOf = new Map(mutation.map((row) => [row.path, row]));

const MISSION_NEEDS = {
  'Mission 1': ['description', 'supportedUseCases', 'capabilityType', 'interfaces', 'publications', 'integrations', 'riskTier', 'assessmentReference', 'costInformation', 'maturity', 'lifecycleStatus', 'limitations', 'dependencies', 'runtime', 'setup', 'license', 'deprecation'],
  'Mission 2': ['maturity', 'lifecycleStatus', 'supportedUseCases', 'limitations', 'description', 'id', 'name', 'capabilityType', 'source', 'owner', 'publications', 'relations'],
  'Mission 3': ['riskTier', 'assessmentReference', 'lifecycleStatus', 'deprecation', 'owner', 'source', 'dependencies', 'license'],
  'Mission 5': ['owner', 'capabilityVersion', 'lastUpdated', 'schemaVersion', 'provenance'],
};
const missionsOf = (top) => Object.entries(MISSION_NEEDS).filter(([, list]) => list.includes(top)).map(([mission]) => mission.replace('Mission ', 'M'));
const HOST_FIELDS = new Set(['interfaces', 'interfaces[].type', 'interfaces[].transport', 'interfaces[].contractRef', 'publications', 'publications[].kind', 'publications[].locator', 'setup', 'setup[].name', 'setup[].kind', 'setup[].secret', 'setup[].required', 'source.url', 'source.path', 'publications[].platformCompatibility', 'capabilityType']);
const journeyQuestionsOf = (path) => journey.rows.filter((row) => row.anyOf.includes(path)).map((row) => `${row.journey}.${row.question}`);

const perField = fields.map((field) => {
  const c = coverageOf.get(field.path);
  const r = removalOf.get(field.path);
  const m = mutationOf.get(field.path);
  const top = field.path.split('.')[0].replace(/\[\]$/, '');
  return {
    path: field.path,
    depth: field.depth,
    requirement: field.requirement,
    level: field.level,
    type: field.type,
    present: c.present,
    emptyList: c.emptyList,
    byType: c.byType,
    provenance: c.provenance,
    journeyQuestions: journeyQuestionsOf(field.path),
    journeyCredit: Number((journey.credit.get(field.path) ?? 0).toFixed(2)),
    soleAnswers: journey.sole.get(field.path) ?? 0,
    missions: field.depth === 0 ? missionsOf(top) : [],
    hostUse: HOST_FIELDS.has(field.path),
    native: field.depth === 0 ? NATIVE[field.path] ?? null : null,
    removal: r ?? null,
    mutation: m ?? null,
  };
});

const results = {
  generatedOn: TODAY,
  corpus: corpus.map(({ file, manifest }) => ({ file, id: manifest.id, type: manifest.capabilityType })),
  baseline: { summary: baseline.summary, levels: Object.fromEntries(baseline.results.map((result) => [result.id, result.completeness?.level])) },
  fields: perField,
  journeys: { rows: journey.rows.map(({ byManifest, ...row }) => row), perManifest: journey.perManifest, answeredInstances: journey.answeredInstances },
  retrieval: search.configs.map(({ perNeed, ...config }) => config),
  retrievalFull: search.full,
  identity: ident,
  recipes,
  exchange,
  governed,
};
writeFileSync(join(HERE, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);

// ---------------------------------------------------------------------------------------------
// Drafts: one Markdown file per test.

mkdirSync(DRAFTS, { recursive: true });
const header = (title, purpose) => `# ${title}\n\n| | |\n|---|---|\n| Date | ${TODAY} |\n| Corpus | ${corpus.length} production manifests in \`${CORPUS_DIR}\` |\n| Generated by | \`node research/phase-1/field-audit/audit.js\` (do not edit by hand; rerun instead) |\n| Purpose | ${purpose} |\n\n`;
const top = perField.filter((field) => field.depth === 0);
const write = (name, text) => writeFileSync(join(DRAFTS, name), `${text.trim()}\n`);

const levelCounts = {};
for (const level of Object.values(results.baseline.levels)) levelCounts[level] = (levelCounts[level] ?? 0) + 1;

write('T01-field-inventory.md', header('T1. Field inventory', 'Every field path that schema 0.1 defines, with its requirement and the completeness level that needs it.')
  + `Schema 0.1 defines **${fields.length} field paths**: ${top.length} top-level fields and ${fields.length - top.length} nested ones. ${fields.filter((f) => f.requirement === 'mandatory').length} top-level fields are mandatory, ${fields.filter((f) => f.requirement === 'conditional').length} are conditional, and ${top.filter((f) => f.requirement === 'optional').length} are optional. ${fields.filter((f) => f.level).length} field paths are named by a completeness level.\n\n`
  + table(['Field', 'Requirement', 'Type', 'Completeness level (fact)', 'Allowed values'], fields.map((f) => [`\`${f.path}\``, f.requirement, f.type, f.level ?? '-', f.enum ? f.enum.join(', ') : '-'])));

write('T02-coverage-and-provenance.md', header('T2. Coverage and provenance', 'How many of the 22 manifests state each field, by capability type, and where the values came from (native: the source states it; linked: a declared source; derived: inferred; curated: written by the curator; owner: confirmed by the owner).')
  + `Baseline: ${baseline.summary.valid} of ${baseline.summary.manifests} valid; levels: ${Object.entries(levelCounts).map(([level, count]) => `${count} ${level}`).join(', ')}.\n\n`
  + table(['Field', 'Requirement', 'Stated in', 'of which []', 'By type', 'Provenance entries'], perField.map((f) => [`\`${f.path}\``, f.requirement, `${f.present}/22 (${pct(f.present, 22)})`, f.emptyList || '', Object.entries(f.byType).map(([type, count]) => `${type} ${count}`).join(', '), f.provenance ? Object.entries(f.provenance).map(([method, count]) => `${method} ${count}`).join(', ') : '-'])));

write('T03-removal-ablation.md', header('T3. Removal (ablation) test', 'Each field is removed from every manifest that states it, and the whole set is validated again. A field that changes nothing when removed contributes nothing the validator, the levels, or the journeys can see.')
  + table(['Field', 'Removed from', 'Becomes invalid', 'Level change', 'Findings added', 'Findings removed', 'Journey answers lost'], removal.map((r) => [`\`${r.path}\``, r.holders, r.invalid || '', Object.entries(r.levelDrops).map(([k, v]) => `${v}× ${k}`).join('; '), Object.entries(r.codesAdded).map(([k, v]) => `${k} ${v}`).join(', '), Object.entries(r.codesRemoved).map(([k, v]) => `${k} ${v}`).join(', '), r.questionsLost || ''])));

write('T04-journeys.md', header('T4. Journey answerability', 'Each pre-registered journey question (protocol.yaml) asked of each manifest: is it answered from the manifest, and by which fields. "Credit" splits each answer between the fields that gave it; "sole" counts answers that only one field gave.')
  + table(['Journey', 'Question', 'Need', 'Fields', 'Answered'], journey.rows.map((row) => [row.journey, row.ask, row.governance ? `${row.need} (governance)` : row.need, row.anyOf.map((p) => `\`${p}\``).join(', '), `${row.answered}/22 (${pct(row.answered, 22)})`]))
  + '\n\n## Required questions answered, per manifest\n\nGovernance questions are left out: only Mission 3 can answer them.\n\n'
  + table(['Manifest', 'Type', 'Required answered', 'Missing'], journey.perManifest.map((row) => [row.id, row.type, `${row.requiredAnswered}/${row.required}`, row.missing.join(', ') || '-']))
  + '\n\n## Contribution of each field to the journey answers\n\n'
  + `Total answered question-instances: ${journey.answeredInstances}.\n\n`
  + table(['Field', 'Questions', 'Credit', 'Share of all answers', 'Sole answers'], perField.filter((f) => f.journeyQuestions.length > 0).sort((a, b) => b.journeyCredit - a.journeyCredit).map((f) => [`\`${f.path}\``, f.journeyQuestions.join(', '), f.journeyCredit, pct(f.journeyCredit, journey.answeredInstances), f.soleAnswers])));

const fmt = (value) => value.toFixed(2);
write('T05-search-efficiency.md', header('T5. Search efficiency (J1)', 'Seven pre-registered needs, each with search terms and relevance judgments made before the run. A capability is found when a term occurs as a whole word in the searched fields. Recall: share of relevant capabilities found. Precision: share of results that are relevant or partly relevant.')
  + table(['Fields searched', 'Recall', 'Precision', 'F1'], search.configs.map((config) => [config.fields.join(' + '), fmt(config.recall), fmt(config.precision), fmt(config.f1)]))
  + '\n\n## Per need, all fields searched\n\n'
  + table(['Need', 'Statement', 'Found', 'Relevant missed', 'Not relevant but found'], protocol.needs.map((need) => [need.id, need.statement, search.full.perNeed[need.id].found.length, search.full.perNeed[need.id].missed.join(', ') || '-', search.full.perNeed[need.id].wrong.join(', ') || '-'])));

write('T06-identity.md', header('T6. Identity: the same capability, and only the same one', 'Synthetic re-registrations of each real manifest: under a new id with the same channels, after a repository rename, and a different capability with the same name. The validator must link the first two and must not link the third.')
  + table(['Case', 'Signal', 'Cases', 'Behaved as expected'], Object.values(ident.cases.reduce((groups, item) => {
    const key = item.label;
    groups[key] ??= { label: item.label, signal: item.signal, total: 0, ok: 0 };
    groups[key].total += 1;
    if (item.detected) groups[key].ok += 1;
    return groups;
  }, {})).map((group) => [group.label, `\`${group.signal}\``, group.total, `${group.ok}/${group.total}`]))
  + `\n\nFalse links among the 22 real manifests: ${ident.falseLinks.length === 0 ? 'none' : ident.falseLinks.join('; ')}.\n\nThe earlier Playwright MCP example (examples/valid) registered under a new id next to the production manifest: ${ident.realPair.join(', ') || 'not linked'}.\n\n`
  + '## Cases that did not behave as expected\n\n'
  + (ident.cases.filter((item) => !item.detected).length === 0 ? 'None.' : table(['Case', 'Copy', 'Expected', 'Got'], ident.cases.filter((item) => !item.detected).map((item) => [item.label, item.id, item.expected, item.codes.join(', ') || 'nothing']))));

write('T07-mutation-per-field.md', header('T7. Mutation test per field', 'One wrong value per field, put into a real manifest that states the field (or, for fields no production manifest states, an example manifest from examples/valid). The validator must reject it with an error at that field.')
  + `${mutation.filter((m) => m.tested).length} fields tested; ${mutation.filter((m) => m.tested && m.caught).length} caught at the field; ${mutation.filter((m) => m.tested && !m.caught).length} not caught; ${mutation.filter((m) => !m.tested).length} not stated in any production or example manifest.\n\n`
  + table(['Field', 'Mutation', 'Value', 'Caught', 'Codes'], mutation.map((m) => (m.tested ? [`\`${m.path}\``, m.kind, m.value, m.caught ? 'yes' : '**no**', m.codes.join(', ')] : [`\`${m.path}\``, '-', '-', 'not stated anywhere', '-']))));

write('T08-ai-host-recipes.md', header('T8. AI host recipes', 'For each manifest, the install or connection recipe that an AI host (Claude Code, Cursor, an agent framework) or a recommender could generate from structured fields alone, without reading free text. A gap means the host would have to read the README.')
  + `${recipes.filter((r) => r.launchable).length} of 22 manifests yield an install or connection recipe from structured fields; ${recipes.filter((r) => r.gaps.length === 0).length} have no gap.\n\n`
  + `${recipes.filter((r) => r.alternatives.length > 0).length} manifests declare alternative setup groups (setup[].group): the host asks for one complete group.\n\n`
  + table(['Manifest', 'Type', 'Interfaces', 'Recipe', 'Always needed', 'One of these groups', 'Other setup', 'Hosts', 'Gaps'], recipes.map((r) => [r.id, r.type, r.interfaces, r.steps.join('<br>') || '-', r.env.join(', ') || '-', r.alternatives.join('<br>') || '-', r.otherSetup.join(', ') || '-', r.hosts.join(', ') || '-', r.gaps.join('; ') || '-'])));

write('T09-native-counterparts.md', header('T9. Native-format counterparts', 'Where each top-level fact is already stated by a format that AI hosts or registries read. A field with no counterpart anywhere must come from a curator or the owner: it costs effort for every capability.')
  + table(['Field', 'MCP server.json', 'SKILL.md', 'A2A Agent Card', 'npm package.json', 'Python metadata', 'Stated in (of 22)', 'Provenance'], top.map((f) => [`\`${f.path}\``, ...(f.native ?? ['?', '?', '?', '?', '?']), f.present, f.provenance ? Object.entries(f.provenance).map(([method, count]) => `${method} ${count}`).join(', ') : '-'])));

write('T11-exchange-round-trip.md', header('T11. Exchange round trip', 'The 22 manifests exported as a Capability Exchange Document: are they carried unchanged, with their completeness level?')
  + table(['Check', 'Result'], [['Capabilities exported', exchange.capabilities], ['Rejected', exchange.rejected], ['Carried unchanged (field for field)', `${exchange.lossless}/${exchange.capabilities}`], ['Completeness level carried', `${exchange.levelsCarried}/${exchange.capabilities}`]]));

write('T12-governed-level.md', header('T12. Governed level (simulated Mission 3 assessments)', 'Mission 3 has not assessed any of the 22. To test the top completeness level, every manifest is given riskTier low with an assessment reference, as an overlay inside this test only; the real manifests stay unassessed, because a low tier must never be inferred. Three scenarios: a current assessment, one older than the 12-month validity, and a tier with no reference.')
  + table(['Scenario', 'Levels reached', 'Relevant findings'], governed.map((run) => [run.scenario, Object.entries(run.levels).map(([level, count]) => `${count} ${level}`).join(', '), ['ASSESSMENT_EXPIRED', 'CONDITIONAL_FIELD_REQUIRED', 'RISK_UNASSESSED'].filter((code) => run.codes[code]).map((code) => `${code} ${run.codes[code]}`).join(', ') || 'none']))
  + '\n\nExpected: all 22 `governed` with a current assessment; all 22 still `governed` but each with an `ASSESSMENT_EXPIRED` warning when the assessment is older than 12 months; all 22 invalid when the tier has no reference.');

console.log(`governed (current): ${JSON.stringify(governed[0].levels)}; expired: ${governed[1].codes.ASSESSMENT_EXPIRED ?? 0}; no reference: ${JSON.stringify(governed[2].levels)}`);
console.log(`fields: ${fields.length}; mutations caught: ${mutation.filter((m) => m.tested && m.caught).length}/${mutation.filter((m) => m.tested).length}; recipes: ${recipes.filter((r) => r.launchable).length}/22; retrieval F1 (all fields): ${fmt(search.full.f1)}; exchange lossless: ${exchange.lossless}/${exchange.capabilities}`);
