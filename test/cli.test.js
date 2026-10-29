// End-to-end tests of the command-line interface: commands, output formats, contracts, and exit codes.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { createAjv } from '../src/schema-registry.js';
import { ROOT } from './helpers.js';

const scratch = mkdtempSync(join(tmpdir(), 'capability-cli-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

function run(...args) {
  const result = spawnSync(process.execPath, ['bin/capability-manifest.js', ...args], { cwd: ROOT, encoding: 'utf8' });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

function contract(name) {
  return createAjv().compile(JSON.parse(readFileSync(join(ROOT, 'schema/contracts', name), 'utf8')));
}

describe('validate command', () => {
  it('exits 0 when all manifests are valid', () => {
    const { code, stdout } = run('validate', 'examples/valid');
    assert.equal(code, 0);
    assert.match(stdout, /8 manifest\(s\): 8 valid, 0 invalid - 0 error\(s\), 1 warning\(s\), 20 unverified/);
    assert.match(stdout, /Completeness of the 8 structurally valid manifest\(s\): none 1, discoverable 1, assessable 2, adoptable 2, governed 2/);
    assert.match(stdout, /completeness: assessable \(adoptable needs: setup, limitations\)/);
    assert.match(stdout, /does not establish that a source is reachable/);
  });

  it('exits 1 when manifests are below the level required with --require-level, and 2 for an unknown level', () => {
    const { code, stdout } = run('validate', 'examples/valid', '--require-level', 'adoptable');
    assert.equal(code, 1);
    assert.equal(stdout.match(/ERROR {2}COMPLETENESS_BELOW_REQUIRED/g).length, 4);
    assert.equal(run('validate', 'examples/valid', '--require-level', 'discoverable').code, 1); // sre-toolkit has no interface
    const unknown = run('validate', 'examples/valid', '--require-level', 'complete');
    assert.equal(unknown.code, 2);
    assert.match(unknown.stderr, /use discoverable, assessable, adoptable, governed/);
  });

  it('exits 1 and reports every invalid example', () => {
    const { code, stdout } = run('validate', 'examples/invalid');
    assert.equal(code, 1);
    for (const expected of ['MISSING_REQUIRED_FIELD', 'CONDITIONAL_FIELD_REQUIRED', 'INVALID_TYPE', 'INVALID_VALUE', 'INVALID_FORMAT', 'UNKNOWN_FIELD', 'SCHEMA_VERSION_UNSUPPORTED']) {
      assert.match(stdout, new RegExp(expected));
    }
  });

  it('writes JSON that conforms to the validation-report contract, without the parsed manifests', () => {
    const validate = contract('validation-report-0.1.schema.json');
    for (const target of ['examples/valid', 'examples/invalid']) {
      const { stdout } = run('validate', target, '--format', 'json', '--require-level', 'assessable');
      const report = JSON.parse(stdout);
      assert.equal(validate(report), true, `${target}: ${JSON.stringify(validate.errors)}`);
      assert.ok(report.results.every((result) => !('manifest' in result)));
    }
  });
});

describe('compat command', () => {
  it('exits 0 for a compatible revision and 1 for an incorrectly versioned breaking revision', () => {
    assert.equal(run('compat', 'examples/valid/sql-review.capability.yaml', 'examples/compatibility/sql-review.1.4.0-compatible.capability.yaml').code, 0);
    const breaking = run('compat', 'examples/valid/sql-review.capability.yaml', 'examples/compatibility/sql-review.1.4.0-breaking.capability.yaml');
    assert.equal(breaking.code, 1);
    assert.match(breaking.stdout, /INSUFFICIENT_VERSION_BUMP/);
  });
});

describe('export command', () => {
  it('prints a summary and writes an exchange document that conforms to its contract', () => {
    const out = join(scratch, 'exchange.json');
    const { code, stdout } = run('export', 'examples/valid', '--out', out);
    assert.equal(code, 0);
    assert.match(stdout, /Exchange document 0\.1: 8 capability manifest\(s\), 0 rejected/);
    assert.match(stdout, /microsoft\/playwright-mcp +mcp_server +schema 0\.1 +assessable +- +- +- +UNASSESSED +Microsoft Corporation \(external\)/);
    assert.match(stdout, /UNASSESSED = no risk assessment recorded/);
    const validate = contract('exchange-document-0.1.schema.json');
    const document = JSON.parse(readFileSync(out, 'utf8'));
    assert.equal(validate(document), true, JSON.stringify(validate.errors));
    assert.equal(document.capabilities.length, 8);
  });
});

describe('schema-compat command', () => {
  // An unregistered draft of a next MINOR version that adds one optional field.
  const draft = join(scratch, 'capability-0.2-draft.schema.json');
  const schema = JSON.parse(readFileSync(join(ROOT, 'schema/0.1/capability.schema.json'), 'utf8'));
  schema.$id = schema.$id.replace('/0.1/', '/0.2/');
  schema.properties.schemaVersion.const = '0.2';
  schema.properties.techStack = { type: 'array', items: { type: 'string' }, description: 'Technologies the capability is built with.' };
  writeFileSync(draft, JSON.stringify(schema, null, 2));

  it('exits 0 for an additive draft checked against the registered 0.1 and its corpus', () => {
    const { code, stdout } = run('schema-compat', '0.1', draft, '--corpus', 'examples/valid');
    assert.equal(code, 0);
    assert.match(stdout, /classification: additive \(non-breaking\); required bump: MINOR; actual bump: MINOR/);
    assert.match(stdout, /8 manifest\(s\) valid under 0\.1 re-declared as 0\.2: 8 still valid/);
  });

  it('confirms with the corpus that the 2026-10-23 revision of 0.1 invalidates no manifest valid under the 2026-10-22 draft', () => {
    const { code, stdout } = run('schema-compat', 'research/spikes-1-3/reference/capability-0.1-2026-10-22.schema.json', '0.1', '--corpus', 'research/spikes-1-3/reference/examples-2026-10-22');
    assert.equal(code, 0);
    assert.match(stdout, /Corpus: 9 manifest\(s\) valid under 0\.1 re-declared as 0\.1: 9 still valid\./);
    assert.match(stdout, /RELAXATION +REQUIREMENT_REMOVED +lifecycleStatus/);
  });

  it('exits 1 in the reverse direction, which removes a field and decreases the version', () => {
    assert.equal(run('schema-compat', draft, '0.1', '--format', 'json').code, 1);
  });
});

describe('docs command', () => {
  it('writes one field dictionary per schema version, identical to the committed ones', () => {
    const outDir = join(scratch, 'dictionaries');
    assert.equal(run('docs', '--out-dir', outDir).code, 0);
    for (const file of readdirSync(join(ROOT, 'docs/field-dictionary'))) {
      assert.equal(readFileSync(join(outDir, file), 'utf8'), readFileSync(join(ROOT, 'docs/field-dictionary', file), 'utf8'), file);
    }
  });
});

describe('usage errors', () => {
  it('exits 2 for unknown commands, unknown options, and missing files', () => {
    assert.equal(run('publish').code, 2);
    assert.equal(run('catalog', 'examples/valid').code, 2);
    assert.equal(run('validate', 'examples/valid', '--strict').code, 2);
    assert.equal(run('validate', 'examples/valid', '--format', 'xml').code, 2);
    const missing = run('validate', 'examples/does-not-exist.yaml');
    assert.equal(missing.code, 2);
    assert.match(missing.stderr, /no such file/);
  });

  it('prints usage with exit 0 for --help', () => {
    const { code, stdout } = run('--help');
    assert.equal(code, 0);
    assert.match(stdout, /Usage: capability-manifest/);
  });
});
