// T13. AI Catalog interoperability test on the 22 production manifests (decision register U7).
//
//   node research/phase-1/ai-catalog/run.js            offline; reuses url-checks.json if present
//   node research/phase-1/ai-catalog/run.js --online   also fetches every artifact URL once
//
// Writes outputs/ai-catalog-{reference,manifest,hybrid}.json, results.json, and
// docs/phase-1-testing/drafts/T13-ai-catalog.md.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { valuesAt } from '../../../src/completeness.js';
import { expandPaths, validateManifests } from '../../../src/validator.js';
import { stringify } from 'yaml';
import { KNOWN_TYPES, MANIFEST_TYPE, artifactEntries, fromEntry, toCatalog, validateCatalog } from './ai-catalog.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const OUT = join(HERE, 'outputs');
const DRAFT = join(ROOT, 'docs', 'phase-1-testing', 'drafts', 'T13-ai-catalog.md');
const TODAY = '2026-11-16';
mkdirSync(OUT, { recursive: true });

const corpus = expandPaths([join(ROOT, 'case-studies/production-set/manifests')]).sort().map((file) => ({ file: relative(ROOT, file).replaceAll('\\', '/'), manifest: parse(readFileSync(file, 'utf8')) }));
const manifests = corpus.map((entry) => entry.manifest);
const audit = JSON.parse(readFileSync(join(ROOT, 'research/phase-1/field-audit/results.json'), 'utf8'));
const fieldPaths = audit.fields.map((field) => field.path);

// ---- 1. Projections, validated -------------------------------------------------------------
const projections = {};
for (const name of ['reference', 'manifest', 'hybrid']) {
  const catalog = toCatalog(manifests, name);
  const { findings, level } = validateCatalog(catalog);
  writeFileSync(join(OUT, `ai-catalog-${name}.json`), `${JSON.stringify(catalog, null, 2)}\n`);
  projections[name] = {
    catalog,
    level,
    errors: findings.filter((finding) => finding.severity === 'error'),
    warnings: findings.filter((finding) => finding.severity === 'warning'),
    bytes: Buffer.byteLength(JSON.stringify(catalog)),
  };
}

// ---- 2. Round trip ----------------------------------------------------------------------------
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const roundTrip = {};
for (const [name, projection] of Object.entries(projections)) {
  const rebuilt = projection.catalog.entries.map(fromEntry);
  const report = await validateManifests(rebuilt.map((manifest, i) => ({ file: `rebuilt-${i}.yaml`, text: stringify(manifest, { defaultStringType: 'QUOTE_DOUBLE', defaultKeyType: 'PLAIN' }) })), { today: TODAY });
  const missingRequired = {};
  for (const result of report.results) for (const finding of result.findings.filter((item) => item.code === 'MISSING_REQUIRED_FIELD')) missingRequired[finding.path] = (missingRequired[finding.path] ?? 0) + 1;
  roundTrip[name] = {
    identical: rebuilt.filter((manifest, i) => same(manifest, manifests[i])).length,
    valid: report.summary.valid,
    missingRequired,
    perField: fieldPaths.map((path) => {
      const holders = manifests.map((manifest, i) => ({ i, values: valuesAt(manifest, path) })).filter((holder) => holder.values.length > 0);
      const kept = holders.filter((holder) => same(valuesAt(rebuilt[holder.i], path), holder.values)).length;
      return { path, holders: holders.length, kept };
    }),
  };
}
const classify = (row) => (row.holders === 0 ? 'not stated' : row.kept === row.holders ? 'kept' : row.kept === 0 ? 'lost' : 'partly kept');

// ---- 3. Artifact types used by the reference projection -----------------------------------------
const artifacts = artifactEntries(projections.reference.catalog);
const byType = {};
for (const artifact of artifacts) byType[artifact.type] = (byType[artifact.type] ?? 0) + 1;
const perCapability = projections.reference.catalog.entries.map((entry, i) => {
  const inner = entry.type === 'application/ai-catalog+json' ? entry.data.entries : [entry];
  return { id: manifests[i].id, type: manifests[i].capabilityType, artifacts: inner.length, known: inner.filter((item) => KNOWN_TYPES.has(item.type)).length, types: inner.map((item) => item.type) };
});
const unrepresented = manifests.flatMap((manifest) => (manifest.publications ?? []).filter((publication) => !['package', 'registry_entry'].includes(publication.kind) || !(/^pkg:(npm|pypi)\//.test(publication.locator) || publication.kind === 'registry_entry')).map((publication) => `${manifest.id}: ${publication.kind} ${publication.locator}`));

// ---- 4. Live catalogs ---------------------------------------------------------------------------
const snapshots = {
  'exa.ai': JSON.parse(readFileSync(join(HERE, 'snapshots/exa.ai-ai-catalog-2026-11-16.json'), 'utf8')),
  'github.com': JSON.parse(readFileSync(join(HERE, 'snapshots/github.com-ai-catalog-2026-11-16.json'), 'utf8')),
};
const live = Object.entries(snapshots).map(([host, catalog]) => {
  const { findings } = validateCatalog(catalog, { operatorIsPublisher: true });
  const defined = new Set(['identifier', 'displayName', 'type', 'url', 'data', 'version', 'description', 'tags', 'publisher', 'digest', 'trustManifests', 'updatedAt', 'extensions']);
  const unrecognized = [...new Set(catalog.entries.flatMap((entry) => Object.keys(entry).filter((key) => !defined.has(key))))];
  const ours = artifacts.filter((artifact) => catalog.entries.some((entry) => entry.url === artifact.url));
  return {
    host,
    entries: catalog.entries.map((entry) => ({ identifier: entry.identifier, type: entry.type, url: entry.url })),
    errors: findings.filter((finding) => finding.severity === 'error').map((finding) => `${finding.path}: ${finding.message}`),
    warnings: findings.filter((finding) => finding.severity === 'warning').map((finding) => `${finding.path}: ${finding.message}`),
    unrecognized,
    matchedByOurUrls: ours.map((artifact) => artifact.url),
  };
});

// ---- 5. Artifact URLs online ---------------------------------------------------------------------
const checksFile = join(HERE, 'url-checks.json');
if (process.argv.includes('--online')) {
  const checks = [];
  for (const artifact of artifacts) {
    let status;
    let contentType;
    try {
      const response = await fetch(artifact.url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
      status = response.status;
      contentType = response.headers.get('content-type');
    } catch (error) {
      status = `error: ${error.cause?.code ?? error.name}`;
    }
    checks.push({ url: artifact.url, type: artifact.type, status, contentType });
  }
  writeFileSync(checksFile, `${JSON.stringify({ checkedOn: TODAY, checks }, null, 2)}\n`);
}
const urlChecks = existsSync(checksFile) ? JSON.parse(readFileSync(checksFile, 'utf8')) : null;

// ---- Results and draft --------------------------------------------------------------------------
const results = {
  generatedOn: TODAY,
  specification: 'github.com/Agent-Card/ai-catalog specification/ai-catalog.md, commit ecade3e (2026-11-08)',
  projections: Object.fromEntries(Object.entries(projections).map(([name, p]) => [name, { level: p.level, errors: p.errors, warnings: p.warnings.length, bytes: p.bytes }])),
  roundTrip,
  byType,
  perCapability,
  unrepresented,
  live,
  urlChecks,
};
writeFileSync(join(HERE, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);

const table = (header, rows) => [`| ${header.join(' | ')} |`, `|${header.map(() => '---').join('|')}|`, ...rows.map((row) => `| ${row.map((cell) => String(cell ?? '').replaceAll('|', '\\|')).join(' | ')} |`)].join('\n');
const ref = roundTrip.reference;
const kept = ref.perField.filter((row) => classify(row) === 'kept');
const partly = ref.perField.filter((row) => classify(row) === 'partly kept');
const lost = ref.perField.filter((row) => classify(row) === 'lost');
const okChecks = urlChecks ? urlChecks.checks.filter((check) => check.status === 200) : [];
const draft = `# T13. AI Catalog interoperability

| | |
|---|---|
| Date | ${TODAY} |
| Specification | AI Catalog editor's draft, ${results.specification} |
| Corpus | The 22 production manifests |
| Generated by | \`node research/phase-1/field-audit/../ai-catalog/run.js\` (\`research/phase-1/ai-catalog/run.js\`); do not edit by hand |

## Projections

${table(['Projection', 'AI Catalog level reached', 'Errors', 'Warnings', 'Size (bytes)', 'Round trip identical', 'Rebuilt manifests valid'], Object.entries(projections).map(([name, p]) => [name, p.level === 0 ? 'none (invalid)' : `Level ${p.level}`, p.errors.length, p.warnings.length, p.bytes, `${roundTrip[name].identical}/22`, `${roundTrip[name].valid}/22`]))}

Mandatory manifest fields missing after the reference round trip: ${Object.entries(ref.missingRequired).map(([path, count]) => `\`${path}\` ${count}`).join(', ') || 'none'}.

## Field loss in the reference projection

Of ${ref.perField.filter((row) => row.holders > 0).length} field paths stated by at least one manifest: ${kept.length} kept, ${partly.length} partly kept, ${lost.length} lost.

${table(['Field', 'Stated in', 'Kept in', 'Result'], ref.perField.filter((row) => row.holders > 0).map((row) => [`\`${row.path}\``, row.holders, row.kept, classify(row)]))}

## Artifact types (reference projection)

${artifacts.length} artifact entries for 22 capabilities; ${artifacts.filter((artifact) => KNOWN_TYPES.has(artifact.type)).length} use a known type of the specification, ${artifacts.filter((artifact) => !KNOWN_TYPES.has(artifact.type)).length} need a vendor type.

${table(['Type', 'Known type?', 'Entries'], Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => [`\`${type}\``, KNOWN_TYPES.has(type) ? 'yes' : 'no (vendor)', count]))}

${table(['Capability', 'Type', 'Artifacts', 'Known types', 'Artifact types'], perCapability.map((row) => [row.id, row.type, row.artifacts, row.known, row.types.map((type) => `\`${type}\``).join(', ')]))}

Publications with no retrievable artifact document (kept only in the manifest): ${unrepresented.length}.

${unrepresented.map((item) => `- ${item}`).join('\n')}

## Live AI Catalogs (snapshots of ${TODAY})

${table(['Host', 'Entries', 'Errors', 'Warnings', 'Members the specification does not define', 'Same artifact URL in our projection'], live.map((row) => [row.host, row.entries.map((entry) => `${entry.identifier} (\`${entry.type}\`)`).join('<br>'), row.errors.length, row.warnings.join('<br>') || '0', row.unrecognized.join(', ') || '-', row.matchedByOurUrls.join('<br>') || '-']))}

## Artifact URLs

${urlChecks ? `Checked online on ${urlChecks.checkedOn}: ${okChecks.length} of ${urlChecks.checks.length} returned HTTP 200.\n\n${table(['URL', 'Type', 'Status', 'Content type'], urlChecks.checks.map((check) => [check.url, `\`${check.type}\``, check.status, check.contentType ?? '-']))}` : 'Not checked (run with --online).'}
`;
writeFileSync(DRAFT, draft);
console.log(`reference L${projections.reference.level} (${projections.reference.errors.length} errors), manifest L${projections.manifest.level}, hybrid L${projections.hybrid.level}; round trip identical: reference ${roundTrip.reference.identical}, manifest ${roundTrip.manifest.identical}, hybrid ${roundTrip.hybrid.identical}; fields kept/partly/lost: ${kept.length}/${partly.length}/${lost.length}; artifacts ${artifacts.length} (${artifacts.filter((a) => KNOWN_TYPES.has(a.type)).length} known)${urlChecks ? `; urls ok ${okChecks.length}/${urlChecks.checks.length}` : ''}`);
void MANIFEST_TYPE;
