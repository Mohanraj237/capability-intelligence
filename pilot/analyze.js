#!/usr/bin/env node
// Journey pilot analysis. Applies the crosswalk to the sampled capabilities, drafts a manifest
// for each, validates the drafts against the manifest schema, and measures how far the journeys
// can be completed from metadata that already exists. Reads only the snapshot in pilot/samples.
//
//   node pilot/analyze.js        writes pilot/drafts/ and pilot/results.md   (npm run pilot)

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import { getRegistry, validateManifests } from '../src/validator.js';
import { CONCEPTS, extract, FORMATS } from './crosswalk.js';

export const PILOT_ROOT = dirname(fileURLToPath(import.meta.url));
const AVAILABLE = new Set(['native', 'derived']);
const NEED_RANK = { required: 2, helpful: 1 };

export async function runPilot(root = PILOT_ROOT) {
  const index = JSON.parse(readFileSync(join(root, 'samples', 'sources.json'), 'utf8'));
  const { journeys, useCases } = parse(readFileSync(join(root, 'journeys.yaml'), 'utf8'));
  const items = index.capabilities.map((entry) => {
    const item = extract(JSON.parse(readFileSync(join(root, 'samples', entry.file), 'utf8')));
    const draft = `pilot/drafts/${entry.file.replace(/\.json$/, '.capability.yaml')}`;
    return { ...item, draft, text: draftYaml(item) };
  });
  const report = await validateManifests(items.map((item) => ({ file: item.draft, text: item.text })), { today: index.retrievedAt.slice(0, 10) });
  items.forEach((item, i) => { item.result = report.results[i]; });

  return {
    index,
    items,
    coverage: coverageOf(items),
    answers: answersOf(journeys, items),
    discovery: discoveryOf(useCases, items),
    needs: needsOf(journeys),
  };
}

function draftYaml(item) {
  const header = `# Draft manifest drafted automatically from ${item.sample.sourceUrl}\n` +
    '# by pilot/analyze.js (npm run pilot). Each value is native, derived, or default: see x-provenance.\n';
  return header + stringify(item.manifest, { defaultStringType: 'QUOTE_DOUBLE', defaultKeyType: 'PLAIN', lineWidth: 0 });
}

const provenanceOf = (item, key) => item.concepts[key]?.provenance ?? 'missing';

function coverageOf(items) {
  return CONCEPTS.map((concept) => {
    const cells = items.map((item) => provenanceOf(item, concept.key));
    const byFormat = Object.fromEntries(Object.keys(FORMATS).map((format) => [
      format,
      items.filter((item) => item.sample.format === format).map((item) => provenanceOf(item, concept.key)),
    ]));
    return { concept, cells, byFormat, available: cells.filter((cell) => AVAILABLE.has(cell)).length, native: cells.filter((cell) => cell === 'native').length };
  });
}

function answersOf(journeys, items) {
  return journeys.map((journey) => {
    const questions = journey.questions.map((question) => {
      const answered = items.map((item) => (question.concepts[0] === 'draftValid'
        ? item.result.valid
        : question.concepts.some((key) => AVAILABLE.has(provenanceOf(item, key)))));
      const natively = items.map((item) => question.concepts.some((key) => provenanceOf(item, key) === 'native'));
      return { ...question, answered: answered.filter(Boolean).length, natively: natively.filter(Boolean).length, perItem: answered };
    });
    const required = questions.filter((question) => question.need === 'required');
    const completeFor = (subset) => items.filter((_, i) => subset.every((question) => question.perItem[i])).length;
    const metadataOnly = required.filter((question) => !question.governance);
    return {
      ...journey,
      questions,
      complete: completeFor(required),
      completeApartFromGovernance: metadataOnly.length < required.length ? completeFor(metadataOnly) : null,
    };
  });
}

// Whole-word match of a use case's terms in the fields a person would search.
export function matchedTerms(useCase, manifest) {
  const text = [
    manifest.name,
    manifest.description,
    ...(manifest.keywords ?? []),
    ...(manifest.supportedUseCases ?? []).map((useCase) => useCase.title),
  ].join(' ');
  return useCase.terms.filter((term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));
}

function discoveryOf(useCases, items) {
  return useCases.map((useCase) => ({
    ...useCase,
    matches: items
      .map((item) => ({ item, terms: matchedTerms(useCase, item.manifest) }))
      .filter((match) => match.terms.length > 0),
  }));
}

// The strongest need any journey question has for each concept.
function needsOf(journeys) {
  const needs = {};
  for (const question of journeys.flatMap((journey) => journey.questions)) {
    for (const key of question.concepts) {
      if ((NEED_RANK[question.need] ?? 0) > (NEED_RANK[needs[key]] ?? 0)) needs[key] = question.need;
    }
  }
  return needs;
}

// Requirement level of a manifest field in the latest schema: mandatory, conditional, optional,
// followed by the completeness level that requires it, if any.
function requirementOf(field) {
  if (!field) return 'not in schema';
  const schema = getRegistry().get(getRegistry().latest).schema;
  const level = (schema['x-completenessLevels'] ?? []).find((entry) => entry.requires.some((requirement) => requirement.anyOf.includes(field)))?.level;
  const requirement = schemaRequirementOf(schema, field);
  return level && requirement !== 'mandatory' ? `${requirement}; ${level} level` : requirement;
}

function schemaRequirementOf(schema, field) {
  const [top, child] = field.split('.');
  const conditional = (schema.allOf ?? []).some((rule) => rule.then?.required?.includes(top));
  if (!schema.required.includes(top)) return conditional ? 'conditional' : 'optional';
  if (!child) return 'mandatory';
  const definition = schema.$defs[schema.properties[top].$ref.split('/').pop()];
  return definition.required?.includes(child) ? 'mandatory' : 'optional';
}

export function treatmentOf(concept, available, total, need) {
  if (concept.key === 'riskTier' || concept.key === 'assessmentReference') return 'From governance (Mission 3); never in native metadata';
  if (!need) return 'Not needed by these journeys';
  if (available / total >= 0.75) return 'Starter core: extract automatically';
  if (available / total >= 0.25) return 'Extract where present; curate the rest';
  return 'Curate: no native source in the sample';
}

const percent = (count, total) => `${count} (${Math.round((count / total) * 100)}%)`;

function cell(provenances) {
  const counts = ['native', 'derived', 'default'].map((kind) => [kind, provenances.filter((p) => p === kind).length]).filter(([, n]) => n > 0);
  return counts.length > 0 ? counts.map(([kind, n]) => `${n} ${kind}`).join(', ') : 'none';
}

export function renderResults(pilot) {
  const { index, items, coverage, answers, discovery, needs } = pilot;
  const total = items.length;
  const formats = Object.keys(FORMATS);
  const formatLabel = { 'agent-skill': 'Agent Skills', 'mcp-server-json': 'MCP Registry', 'npm-package': 'npm' };
  const short = items.map((item, i) => `${{ 'agent-skill': 'S', 'mcp-server-json': 'M', 'npm-package': 'N' }[item.sample.format]}${i + 1}`);
  const valid = items.filter((item) => item.result.valid).length;
  const symbol = { native: 'N', derived: 'D', default: '=', missing: '·' };

  const lines = [
    '# Journey pilot results (iteration 1)',
    '',
    `> Generated by \`npm run pilot\` from the snapshot in \`pilot/samples\` (retrieved ${index.retrievedAt.slice(0, 10)}, seed ${index.seed}). Do not edit by hand. The interpretation is in [docs/journey-pilot.md](../docs/journey-pilot.md).`,
    '',
    '## 1. Sample',
    '',
    `${total} public capabilities, drawn at random (seeded) from three sources. Native metadata only; email addresses were redacted.`,
    '',
    '| Source | Pool | Drawn |',
    '|---|---|---|',
    ...Object.values(index.pools).map((pool) => `| ${pool.description} | ${pool.size.toLocaleString('en-US')} | ${index.perSource} |`),
    '',
    '| Ref | Capability | Format | Drafted id |',
    '|---|---|---|---|',
    ...items.map((item, i) => `| ${short[i]} | [${item.sample.name}](${item.sample.sourceUrl}) | ${FORMATS[item.sample.format].label} | \`${item.manifest.id}\` |`),
    '',
    '## 2. How much metadata already matches',
    '',
    'For each manifest concept: how many capabilities provide it natively (a native field), derived (from context such as',
    'location, format, or namespace), or only as an explicit default. "Available" counts native plus derived.',
    '',
    `| Concept | In schema 0.1 | ${formats.map((format) => `${formatLabel[format]} (${coverage[0].byFormat[format].length})`).join(' | ')} | Available (of ${total}) |`,
    `|---|---|${formats.map(() => '---').join('|')}|---|`,
    ...coverage.map(({ concept, byFormat, available }) =>
      `| ${concept.label} | ${requirementOf(concept.field)} | ${formats.map((format) => cell(byFormat[format])).join(' | ')} | ${percent(available, total)} |`),
    '',
    `Per capability (N native, D derived, = default, · missing; refs as in section 1):`,
    '',
    `| Concept | ${short.join(' | ')} |`,
    `|---|${short.map(() => '---').join('|')}|`,
    ...coverage.map(({ concept, cells }) => `| ${concept.label} | ${cells.map((p) => symbol[p]).join(' | ')} |`),
    '',
    '## 3. Can the journeys be completed?',
    '',
    `Questions answerable from native or derived metadata, for the ${total} capabilities.`,
    '',
    '| Journey | Question | Need | Answerable | From native fields alone |',
    '|---|---|---|---|---|',
    ...answers.flatMap((journey) => journey.questions.map((question) =>
      `| ${journey.title} | ${question.ask} | ${question.need} | ${percent(question.answered, total)} | ${question.concepts[0] === 'draftValid' ? 'n/a' : question.natively} |`)),
    '',
    ...answers.map((journey) => {
      const apart = journey.completeApartFromGovernance === null
        ? ''
        : `; apart from the governance question, for ${journey.completeApartFromGovernance} of ${total}`;
      return `- **${journey.title}**: every required question answerable for ${journey.complete} of ${total} capabilities${apart}.`;
    }),
    '',
    '## 4. Drafted manifests against schema 0.1',
    '',
    `Each capability was drafted into a manifest from its native metadata alone. ${valid} of ${total} drafts are valid as drafted.`,
    '',
    '| Draft | Valid | Still needed from a person | Other findings |',
    '|---|---|---|---|',
    ...items.map((item) => {
      const missing = item.result.findings.filter((f) => f.code === 'MISSING_REQUIRED_FIELD' || f.code === 'CONDITIONAL_FIELD_REQUIRED').map((f) => `\`${f.path.slice(1)}\``);
      const other = item.result.findings.filter((f) => f.severity === 'error' && !missing.includes(`\`${f.path.slice(1)}\``)).map((f) => `${f.code} \`${f.path}\``);
      return `| [${item.manifest.id}](../${item.draft}) | ${item.result.valid ? 'yes' : 'no'} | ${missing.join(', ') || '-'} | ${other.join(', ') || '-'} |`;
    }),
    '',
    '## 5. Discovery scenarios',
    '',
    'Use cases written before the sample was drawn, matched (whole words) against name, description, and keywords.',
    '',
    '| Need | Matching capabilities (matched terms) |',
    '|---|---|',
    ...discovery.map((useCase) => `| ${useCase.need} | ${useCase.matches.map(({ item, terms }) => `\`${item.manifest.id}\` (${terms.join(', ')})`).join('; ') || 'none in this sample'} |`),
    '',
    '## 6. What the evidence suggests',
    '',
    'Treatment per concept, from how often it is available (section 2) and how strongly a journey needs it (section 3).',
    '',
    `| Concept | In schema 0.1 | Needed by journeys | Available (of ${total}) | Suggested treatment |`,
    '|---|---|---|---|---|',
    ...coverage.map(({ concept, available }) =>
      `| ${concept.label} | ${requirementOf(concept.field)} | ${needs[concept.key] ?? 'no'} | ${percent(available, total)} | ${treatmentOf(concept, available, total, needs[concept.key])} |`),
    '',
  ];
  return lines.join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pilot = await runPilot();
  rmSync(join(PILOT_ROOT, 'drafts'), { recursive: true, force: true });
  for (const item of pilot.items) {
    const file = join(PILOT_ROOT, '..', item.draft);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, item.text);
  }
  writeFileSync(join(PILOT_ROOT, 'results.md'), renderResults(pilot));
  const valid = pilot.items.filter((item) => item.result.valid).length;
  console.log(`Drafted ${pilot.items.length} manifests (${valid} valid as drafted); wrote pilot/drafts/ and pilot/results.md.`);
  for (const journey of pilot.answers) {
    const apart = journey.completeApartFromGovernance === null ? '' : ` (apart from governance: ${journey.completeApartFromGovernance})`;
    console.log(`  ${journey.title}: all required questions answerable for ${journey.complete} of ${pilot.items.length}${apart}`);
  }
}
