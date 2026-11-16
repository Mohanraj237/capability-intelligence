#!/usr/bin/env node
// Proves that the two checks can fail. A check that has only ever passed proves little, so this
// script breaks copies of the caveman manifests on purpose and requires that each break is caught:
//   - "validator" mutations must produce the expected finding from `capability-manifest validate`;
//   - "facts" mutations must make the expected check of verify-facts.mjs fail.
// The real manifests are never touched. Exit code 0 when every mutation is detected, 1 otherwise.
//
//   node case-studies/caveman/mutation-tests.mjs <path to a caveman clone>
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
// The manifests live with the rest of the production reference set; this folder keeps the scripts.
const manifestsDir = join(root, 'case-studies/production-set/manifests/caveman');
const clone = process.argv[2] ? resolve(process.argv[2]) : null;
if (!clone) {
  console.error('usage: node case-studies/caveman/mutation-tests.mjs <path to a caveman clone>');
  process.exit(2);
}
const cli = join(root, 'bin/capability-manifest.js');
const verify = join(here, 'verify-facts.mjs');

// The native cavecrew-builder description is 301 characters; the schema allows 300.
const builderNative = (() => {
  const text = readFileSync(join(clone, 'agents/cavecrew-builder.md'), 'utf8');
  return parse(text.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]).description.replace(/\s+/g, ' ').trim();
})();

const run = (file, args) => {
  try {
    return { code: 0, out: execFileSync('node', [file, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (error) {
    return { code: error.status, out: String(error.stdout ?? '') };
  }
};
const validatorCodes = (dir) => {
  const report = JSON.parse(run(cli, ['validate', dir, '--format', 'json']).out);
  return {
    codes: new Set(report.results.flatMap((r) => r.findings.map((f) => f.code))),
    errors: report.summary.errors,
    warnings: report.summary.warnings,
    invalid: report.summary.invalid,
  };
};
const failedChecks = (dir) => {
  const result = run(verify, [clone, '--manifests', dir]);
  return { code: result.code, failed: [...result.out.matchAll(/^FAIL\s+(\S+)/gm)].map((m) => m[1]) };
};

// edit: [file, find (string or RegExp), replacement]
const mutations = [
  { id: 'V1', kind: 'validator', text: 'child loses its parent link', expect: 'PARENT_CHILD_MISMATCH', edit: ['caveman-commit.capability.yaml', 'parent:\n  id: juliusbrussee/caveman-plugin\n', ''] },
  { id: 'V2', kind: 'validator', text: 'embedded component typed "subskill" (not an allowed type)', expect: 'INVALID_VALUE', edit: ['caveman-plugin.capability.yaml', '  - name: cavecrew\n    type: skill', '  - name: cavecrew\n    type: subskill'] },
  { id: 'V3', kind: 'validator', text: 'capabilityVersion written with a "v" prefix', expect: 'invalid', edit: ['caveman-plugin.capability.yaml', 'capabilityVersion: "4.1.0"', 'capabilityVersion: "v4.1.0"'] },
  { id: 'V4', kind: 'validator', text: 'two manifests share one id', expect: 'DUPLICATE_ID', edit: ['ultracave.capability.yaml', 'id: juliusbrussee/ultracave', 'id: juliusbrussee/megacave'] },
  { id: 'V5', kind: 'validator', text: 'riskTier "low" with no assessmentReference', expect: 'CONDITIONAL_FIELD_REQUIRED', edit: ['caveman-plugin.capability.yaml', 'riskTier: unassessed', 'riskTier: low'] },
  { id: 'V6', kind: 'validator', text: 'cavecrew-builder gets its native 301-character description', expect: 'invalid', edit: ['caveman-plugin.capability.yaml', '  - name: cavecrew-builder\n    type: agent\n', `  - name: cavecrew-builder\n    type: agent\n    description: ${JSON.stringify(builderNative)}\n`] },
  { id: 'V7', kind: 'validator', text: 'mode id off left unquoted (YAML 1.1 reads it as false)', expect: 'YAML_PORTABILITY', edit: ['caveman-plugin.capability.yaml', 'storedModes: ["off",', 'storedModes: [off,'] },
  { id: 'V8', kind: 'validator', text: 'misspelled top-level field', expect: 'UNKNOWN_FIELD', edit: ['caveman-plugin.capability.yaml', 'riskTier: unassessed', 'riskTier: unassessed\nlifecyleStatus: active'] },
  { id: 'V9', kind: 'validator', text: 'two children point at the same source path', expect: 'DUPLICATE_SOURCE', edit: ['ultracave.capability.yaml', 'path: skills/ultracave', 'path: skills/megacave'] },
  { id: 'V10', kind: 'validator', text: 'provenance entry points at a field that does not exist', expect: 'PROVENANCE_FIELD_NOT_FOUND', edit: ['caveman.capability.yaml', '{ field: /runtime,', '{ field: /deprecation,'] },
  { id: 'V11', kind: 'validator', text: 'lastUpdated in the future', expect: 'DATE_IN_FUTURE', edit: ['caveman.capability.yaml', 'lastUpdated: "2026-11-16"', 'lastUpdated: "2031-01-01"'] },
  { id: 'F1', kind: 'facts', text: 'capabilityVersion says 4.0.1, plugin.json says 4.1.0', expect: 'B2', edit: ['caveman-plugin.capability.yaml', 'capabilityVersion: "4.1.0"', 'capabilityVersion: "4.0.1"'] },
  { id: 'F2', kind: 'facts', text: 'typo in an embedded skill description', expect: 'S5', edit: ['caveman-plugin.capability.yaml', 'Diagnose ambiguous failures', 'Diagnose ambigious failures'] },
  { id: 'F3', kind: 'facts', text: 'embedded skill migration removed (one of 22 skills unaccounted for)', expect: 'S1', edit: ['caveman-plugin.capability.yaml', /  - name: migration\n[\s\S]*?(?=  - name: verify-and-stop)/, ''] },
  { id: 'F4', kind: 'facts', text: 'ultracave says the model may load it (front matter says it may not)', expect: 'K2', edit: ['ultracave.capability.yaml', 'disableModelInvocation: true', 'disableModelInvocation: false'] },
  { id: 'F5', kind: 'facts', text: 'wrong last-commit date on caveman-commit', expect: 'K1', edit: ['caveman-commit.capability.yaml', /2026-08-23/g, '2026-09-01'] },
  { id: 'F6', kind: 'facts', text: 'stored mode order changed', expect: 'M1', edit: ['caveman-plugin.capability.yaml', 'storedModes: ["off", caveman, ultracave,', 'storedModes: ["off", ultracave, caveman,'] },
  { id: 'F11', kind: 'facts', text: 'setup text for CAVEMAN_DEFAULT_MODE drops the compress mode', expect: 'M5', edit: ['caveman-plugin.capability.yaml', 'compress, or manual', 'or manual'] },
  { id: 'F7', kind: 'facts', text: 'license changed to MIT', expect: 'B7', edit: ['caveman-plugin.capability.yaml', 'expression: Apache-2.0', 'expression: MIT'] },
  { id: 'F8', kind: 'facts', text: 'owner contact points at another repository', expect: 'B6', edit: ['caveman-plugin.capability.yaml', 'https://github.com/JuliusBrussee/caveman/issues', 'https://github.com/JuliusBrussee/other/issues'] },
  { id: 'F9', kind: 'facts', text: 'a hook timeout stated wrongly', expect: 'H1', edit: ['caveman-plugin.capability.yaml', 'caveman-stats.js --record (timeout 5 s)', 'caveman-stats.js --record (timeout 30 s)'] },
  { id: 'F10', kind: 'facts', text: 'a setup variable that the code does not read', expect: 'P1', edit: ['caveman-plugin.capability.yaml', '- name: CAVEMAN_REINFORCE\n', '- name: CAVEMAN_REINFORCE_MODE\n'] },
];

const tmpRoot = mkdtempSync(join(tmpdir(), 'caveman-mutations-'));
const copy = (name) => {
  const dir = join(tmpRoot, name);
  cpSync(manifestsDir, dir, { recursive: true, filter: (src) => !/\.mjs$|\.py$|\.md$/.test(src) });
  return dir;
};

let missed = 0;
let baselineClean = false;
const rows = [];

// Baseline: the unmodified manifests must be clean, or the mutation results mean nothing.
{
  const dir = copy('baseline');
  const v = validatorCodes(dir);
  const f = failedChecks(dir);
  baselineClean = v.errors === 0 && v.warnings === 0 && v.invalid === 0 && f.failed.length === 0;
  rows.push(`${baselineClean ? 'CLEAN   ' : 'NOT CLEAN'}  base  unmodified copy: ${v.errors} errors, ${v.warnings} warnings, ${f.failed.length} failed fact checks`);
}

for (const m of mutations) {
  const dir = copy(m.id);
  const [file, find, replacement] = m.edit;
  const path = join(dir, file);
  const before = readFileSync(path, 'utf8');
  const after = before.replace(find, replacement);
  const changed = after !== before;
  writeFileSync(path, after);
  let detected = false;
  let seen = '';
  if (!changed) {
    seen = 'the edit did not change the file';
  } else if (m.kind === 'validator') {
    const v = validatorCodes(dir);
    detected = m.expect === 'invalid' ? v.invalid > 0 : v.codes.has(m.expect);
    seen = `invalid ${v.invalid}, errors ${v.errors}, warnings ${v.warnings}; codes: ${[...v.codes].filter((c) => !/^(SOURCE_NOT_CHECKED|RISK_UNASSESSED|LICENSE_NEEDS_REVIEW|DERIVED_VALUE_UNCONFIRMED)$/.test(c)).join(', ') || 'none'}`;
  } else {
    const f = failedChecks(dir);
    detected = f.failed.includes(m.expect);
    seen = `failed checks: ${f.failed.join(', ') || 'none'}`;
  }
  if (!detected) missed += 1;
  rows.push(`${detected ? 'DETECTED' : 'MISSED  '}  ${m.id.padEnd(4)}  ${m.kind.padEnd(9)} ${m.text}  [expect ${m.expect}; ${seen}]`);
}

rmSync(tmpRoot, { recursive: true, force: true });
console.log(rows.join('\n'));
console.log(`\nBaseline clean: ${baselineClean ? 'yes' : 'NO'}. ${mutations.length - missed} of ${mutations.length} mutations detected.`);
process.exit(missed || !baselineClean ? 1 : 0);
