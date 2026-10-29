#!/usr/bin/env node
// Command-line interface for the AI Capability Manifest proof of concept.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { compareManifestFiles } from '../src/compatibility.js';
import { buildExchangeDocument } from '../src/exchange.js';
import { generateFieldDictionary } from '../src/field-docs.js';
import { formatCompatibilityReport, formatExchange, formatSchemaCompatibility, formatValidationReport } from '../src/format.js';
import { checkSchemaCompatibility, loadSchemaInput } from '../src/schema-compat.js';
import { SCHEMA_ROOT } from '../src/schema-registry.js';
import { completenessLevels, expandPaths, getRegistry, toReportJson, validateFiles } from '../src/validator.js';

const USAGE = `Usage: capability-manifest <command> [options]

Commands:
  validate <path...>          Validate manifests (files or directories) together: structural
                              validation, then consistency checks across all of them, and the
                              completeness level each manifest reaches.
      --format text|json      Output format (default: text). JSON follows the validation-report contract.
      --check-sources         Also check that https source URLs are reachable (uses the network).
      --require-level <level> Treat manifests below this completeness level as errors
                              (discoverable, assessable, adoptable, governed).
  compat <previous> <next>    Check compatibility between two revisions of one capability.
      --format text|json
  export <path...>            Export the valid manifests as a Capability Exchange Document.
      --format text|json      text prints a summary; json prints the document.
      --out <file>            Also write the document as JSON to <file>.
  schema-compat <prev> <next> Classify the changes between two schema versions (registered
                              versions such as 0.1, or schema file paths).
      --corpus <path>         Also re-validate manifests valid under <prev> as <next> (repeatable).
      --format text|json
  docs                        Generate the field dictionary from the schemas.
      --out-dir <dir>         Write <dir>/<version>.md for every supported schema version;
                              without it, print the latest version's dictionary.

Exit codes: 0 no errors, 1 validation or compatibility errors, 2 usage or I/O error.`;

class UsageError extends Error {}

// Each command returns its exit code.
const COMMANDS = {
  async validate(paths, options) {
    if (paths.length === 0) throw new UsageError('validate needs at least one file or directory.');
    const requireLevel = options['require-level'];
    if (requireLevel !== undefined && !completenessLevels().includes(requireLevel)) {
      throw new UsageError(`Unknown --require-level '${requireLevel}' (use ${completenessLevels().join(', ')}).`);
    }
    const report = await validateFiles(paths, { checkSources: options['check-sources'], requireLevel });
    print(options.format, toReportJson(report), () => formatValidationReport(report));
    return report.summary.errors > 0 ? 1 : 0;
  },

  compat(files, options) {
    if (files.length !== 2) throw new UsageError('compat needs exactly two files: <previous> <next>.');
    const result = compareManifestFiles(files[0], files[1]);
    print(options.format, result, () => formatCompatibilityReport(result));
    return result.ok ? 0 : 1;
  },

  async export(paths, options) {
    if (paths.length === 0) throw new UsageError('export needs at least one file or directory.');
    const document = buildExchangeDocument(await validateFiles(paths));
    if (options.out) writeFileSync(options.out, `${JSON.stringify(document, null, 2)}\n`);
    print(options.format, document, () => formatExchange(document));
    return 0;
  },

  'schema-compat'(schemas, options) {
    if (schemas.length !== 2) throw new UsageError('schema-compat needs exactly two schemas: <previous> <next>.');
    const registry = getRegistry();
    const [previous, next] = schemas.map((input) => loadSchemaInput(input, registry));
    const corpus = options.corpus?.length
      ? expandPaths(options.corpus).map((file) => ({ file, text: readFileSync(file, 'utf8') }))
      : undefined;
    const result = checkSchemaCompatibility(previous, next, { corpus });
    print(options.format, result, () => formatSchemaCompatibility(result));
    return result.ok ? 0 : 1;
  },

  docs(_, options) {
    const registry = getRegistry();
    const dictionary = (version, index) => {
      const { schema, file } = registry.get(version);
      const previous = index > 0 ? registry.get(registry.versions[index - 1]) : undefined;
      return generateFieldDictionary(schema, { sourcePath: relative(dirname(SCHEMA_ROOT), file).split(sep).join('/'), previous });
    };
    if (!options['out-dir']) {
      process.stdout.write(dictionary(registry.latest, registry.versions.length - 1));
      return 0;
    }
    mkdirSync(options['out-dir'], { recursive: true });
    registry.versions.forEach((version, index) => writeFileSync(join(options['out-dir'], `${version}.md`), dictionary(version, index)));
    return 0;
  },
};

async function main(argv) {
  const [command, ...rest] = argv;
  if (command === '--help' || command === '-h' || command === 'help') {
    console.log(USAGE);
    return 0;
  }
  if (!command) throw new UsageError('No command given.');
  if (!Object.hasOwn(COMMANDS, command)) throw new UsageError(`Unknown command '${command}'.`);

  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      format: { type: 'string', default: 'text' },
      'check-sources': { type: 'boolean', default: false },
      'require-level': { type: 'string' },
      out: { type: 'string' },
      'out-dir': { type: 'string' },
      corpus: { type: 'string', multiple: true },
    },
  });
  if (!['text', 'json'].includes(values.format)) throw new UsageError(`Unknown --format '${values.format}' (use text or json).`);
  return COMMANDS[command](positionals, values);
}

function print(format, value, formatText) {
  console.log(format === 'json' ? JSON.stringify(value, null, 2) : formatText());
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (error) {
  if (error instanceof UsageError || error.code?.startsWith('ERR_PARSE_ARGS')) {
    console.error(`${error.message}\n\n${USAGE}`);
  } else {
    console.error(`Error: ${error.message}`);
  }
  process.exitCode = 2;
}
