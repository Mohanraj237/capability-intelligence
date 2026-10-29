// Public validation API: parse -> Stage 1 (structural) -> Stage 2 (consistency) -> completeness
// level -> report.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { assessCompleteness, levelRank, levelsAbove, levelsOf } from './completeness.js';
import { checkConsistency } from './consistency.js';
import { loadSchemaRegistry } from './schema-registry.js';
import { validateStructure } from './structural.js';
import { parseManifestText } from './yaml-source.js';

export const TOOL_VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

export const VALIDITY_NOTICE =
  'Structural validity does not establish that a source is reachable, a dependency is available, ' +
  'or a capability is secure or approved for production.';

export const CHECKS = ['structure', 'identity', 'references', 'metadata', 'risk', 'source'];

// Version of the JSON report format (schema/contracts/validation-report-0.1.schema.json).
export const REPORT_FORMAT_VERSION = '0.1';

const MANIFEST_EXTENSIONS = new Set(['.yaml', '.yml', '.json']);
const SEVERITY_ORDER = { error: 0, warning: 1, unverified: 2 };

let defaultRegistry;
export function getRegistry() {
  defaultRegistry ??= loadSchemaRegistry();
  return defaultRegistry;
}

// Stage 1 for a single manifest text. Never throws for invalid input; problems become findings.
export function validateManifestText(text, { file = '<input>', registry = getRegistry() } = {}) {
  const parsed = parseManifestText(text);
  if (parsed.errors.length > 0) {
    return {
      file,
      manifest: undefined,
      validatedAgainst: null,
      locate: parsed.locate,
      findings: parsed.errors.map((error) => ({
        severity: 'error',
        stage: 'structural',
        check: 'structure',
        code: error.code,
        path: '',
        line: error.line,
        column: error.column,
        message: error.message,
        hint: error.code === 'DUPLICATE_KEY'
          ? 'Each field may appear only once in a mapping: remove or merge the duplicate key.'
          : 'Fix the YAML syntax at the reported position (one manifest per file).',
      })),
    };
  }

  const { validatedAgainst, findings } = validateStructure(parsed.data, registry, parsed.locate);
  for (const warning of parsed.portabilityWarnings) {
    findings.push({
      severity: 'warning',
      stage: 'structural',
      check: 'structure',
      code: 'YAML_PORTABILITY',
      path: warning.path,
      line: warning.line,
      column: warning.column,
      message: `Unquoted value '${warning.value}' is a string in YAML 1.2 but ${warning.readAs} in YAML 1.1 parsers (for example PyYAML), so other consumers may read this manifest differently.`,
      hint: `Quote the value: "${warning.value}".`,
    });
  }
  return { file, manifest: parsed.data, validatedAgainst, locate: parsed.locate, findings };
}

export function hasErrors(findings) {
  return findings.some((finding) => finding.severity === 'error');
}

/**
 * Validates manifests together, so that consistency checks (duplicate ids, references) can
 * look across them, and reports the completeness level of each structurally valid manifest.
 * @param {Array<{ file: string, text: string }>} inputs
 * @param {{ checkSources?: boolean, fetch?: typeof fetch, today?: string, registry?: object, requireLevel?: string }} [options]
 *   requireLevel: a completeness level (validate --require-level); manifests below it get an error.
 */
export async function validateManifests(inputs, options = {}) {
  const registry = options.registry ?? getRegistry();
  if (options.requireLevel) assertKnownLevel(registry, options.requireLevel);
  const results = inputs.map(({ file, text }) => validateManifestText(text, { file, registry }));
  const structurallyValid = results.filter((result) => !hasErrors(result.findings));
  await checkConsistency(structurallyValid, options);
  for (const result of structurallyValid) {
    const { schema } = registry.get(result.validatedAgainst);
    result.completeness = assessCompleteness(result.manifest, schema);
    if (options.requireLevel && result.completeness) checkRequiredLevel(result, levelsOf(schema), options.requireLevel);
  }
  return buildReport(results, new Set(structurallyValid), registry);
}

export function completenessLevels(registry = getRegistry(), version = registry.latest) {
  return (levelsOf(registry.get(version)?.schema) ?? []).map((entry) => entry.level);
}

function assertKnownLevel(registry, level) {
  const known = completenessLevels(registry);
  if (!known.includes(level)) {
    throw new Error(`Unknown completeness level '${level}' (schema ${registry.latest} defines: ${known.join(', ') || 'none'}).`);
  }
}

// A manifest below the level the caller requires gets one error that lists, per level, the facts
// still to provide. The level itself stays in the report either way.
function checkRequiredLevel(result, levels, required) {
  const { level, unmet } = result.completeness;
  if (levelRank(levels, level) >= levelRank(levels, required)) return;
  const needed = levelsAbove(levels, level, required).map((name) => `${name}: ${unmet[name].join(', ') || 'met'}`);
  const location = result.locate?.('') ?? {};
  result.findings.push({
    severity: 'error',
    stage: 'completeness',
    check: 'metadata',
    code: 'COMPLETENESS_BELOW_REQUIRED',
    path: '',
    line: location.line,
    column: location.column,
    message: `The manifest reaches completeness level '${level}'; this validation requires '${required}'.`,
    hint: `Provide the missing facts (${needed.join('; ')}), with their provenance where known.`,
  });
}

export async function validateFiles(paths, options = {}) {
  const inputs = expandPaths(paths).map((file) => ({ file, text: readFileSync(file, 'utf8') }));
  return validateManifests(inputs, options);
}

// Files are taken as given; directories are searched recursively for .yaml, .yml and .json.
export function expandPaths(paths) {
  const files = [];
  for (const path of paths) {
    if (!statSync(path).isDirectory()) {
      files.push(path);
      continue;
    }
    for (const name of readdirSync(path).sort()) {
      const child = join(path, name);
      if (statSync(child).isDirectory()) files.push(...expandPaths([child]));
      else if (MANIFEST_EXTENSIONS.has(extname(name))) files.push(child);
    }
  }
  return files;
}

function buildReport(results, consistencyChecked, registry) {
  const finalized = results.map((result) => {
    const counts = countBySeverity(result.findings);
    return {
      file: result.file,
      id: result.manifest?.id,
      capabilityType: result.manifest?.capabilityType,
      schemaVersion: result.manifest?.schemaVersion,
      validatedAgainst: result.validatedAgainst,
      valid: counts.errors === 0,
      checks: summarizeChecks(result.findings, consistencyChecked.has(result)),
      completeness: result.completeness ?? null,
      counts,
      findings: [...result.findings].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || (a.line ?? 0) - (b.line ?? 0),
      ),
      manifest: result.manifest,
    };
  });

  const totals = countBySeverity(finalized.flatMap((result) => result.findings));
  return {
    reportFormatVersion: REPORT_FORMAT_VERSION,
    tool: 'capability-manifest',
    toolVersion: TOOL_VERSION,
    supportedSchemaVersions: registry.versions,
    summary: {
      manifests: finalized.length,
      valid: finalized.filter((result) => result.valid).length,
      invalid: finalized.filter((result) => !result.valid).length,
      ...totals,
    },
    results: finalized,
    notice: VALIDITY_NOTICE,
  };
}

// The report as exchanged (validation-report contract): parsed manifests stay in memory for
// in-process consumers but are not part of the report.
export function toReportJson(report) {
  return { ...report, results: report.results.map(({ manifest, ...result }) => result) };
}

// Per-check status: the worst severity among that check's findings, 'passed' when it ran and
// found nothing, 'skipped' when Stage 2 did not run because Stage 1 failed.
function summarizeChecks(findings, consistencyRan) {
  return Object.fromEntries(
    CHECKS.map((check) => {
      if (check !== 'structure' && !consistencyRan) return [check, 'skipped'];
      const severities = new Set(findings.filter((f) => f.check === check).map((f) => f.severity));
      if (severities.has('error')) return [check, 'failed'];
      if (severities.has('warning')) return [check, 'warning'];
      if (severities.has('unverified')) return [check, 'unverified'];
      return [check, 'passed'];
    }),
  );
}

function countBySeverity(findings) {
  return {
    errors: findings.filter((f) => f.severity === 'error').length,
    warnings: findings.filter((f) => f.severity === 'warning').length,
    unverified: findings.filter((f) => f.severity === 'unverified').length,
  };
}
