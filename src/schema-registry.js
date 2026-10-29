// Registry of supported manifest schema versions.
//
// Each supported version lives in schema/<MAJOR.MINOR>/capability.schema.json and declares
// its own version in properties.schemaVersion.const. Adding a schema version means adding a
// directory; no code change is required to route manifests to it.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { getAt, toTokens } from './json-pointer.js';

export const SCHEMA_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'schema');
export const SCHEMA_FILE_NAME = 'capability.schema.json';

const SCHEMA_VERSION_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

// Annotation-only keywords used by the manifest schema. JSON Schema 2020-12 validators that
// do not know them ignore them; Ajv's strict mode needs them declared.
//   x-hint                  authoring hint shown with a finding
//   x-lifecycleTransitions  allowed lifecycleStatus transitions (enforced by compat)
//   x-completenessLevels    completeness levels (reported by validate, enforced on request)
//   x-synonyms              names that native formats use for a field (used in hints)
export const ANNOTATION_KEYWORDS = ['x-hint', 'x-lifecycleTransitions', 'x-completenessLevels', 'x-synonyms'];

export function createAjv() {
  // strictRequired/strictTypes are disabled because conditional rules (if/then) legitimately
  // require properties that are declared on the enclosing object, not inside the branch.
  const ajv = new Ajv2020({
    allErrors: true,
    verbose: true,
    strict: true,
    strictRequired: false,
    strictTypes: false,
  });
  addFormats(ajv);
  for (const keyword of ANNOTATION_KEYWORDS) ajv.addKeyword({ keyword });
  return ajv;
}

export function isWellFormedSchemaVersion(value) {
  return typeof value === 'string' && SCHEMA_VERSION_PATTERN.test(value);
}

export function compareSchemaVersions(a, b) {
  const [aMajor, aMinor] = a.split('.').map(Number);
  const [bMajor, bMinor] = b.split('.').map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}

export function loadSchemaRegistry(root = SCHEMA_ROOT) {
  const ajv = createAjv();
  const entries = new Map();

  for (const dir of readdirSync(root)) {
    const file = join(root, dir, SCHEMA_FILE_NAME);
    if (!isWellFormedSchemaVersion(dir) || !existsSync(file)) continue;

    const schema = JSON.parse(readFileSync(file, 'utf8'));
    const declared = schema.properties?.schemaVersion?.const;
    if (declared !== dir) {
      throw new Error(`${file} declares schemaVersion ${JSON.stringify(declared)}; expected "${dir}" to match its directory.`);
    }
    // ajv.compile validates the schema against the Draft 2020-12 meta-schema first.
    entries.set(dir, { version: dir, file, schema, validate: ajv.compile(schema) });
  }

  if (entries.size === 0) throw new Error(`No manifest schemas found under ${root}.`);

  const versions = [...entries.keys()].sort(compareSchemaVersions);
  return {
    versions,
    latest: versions.at(-1),
    get: (version) => entries.get(version),
  };
}

// Resolves the (merged) schema that applies at an instance location by walking properties,
// items and local $refs from the root. Annotations at the $ref site (description, examples)
// override those of the referenced definition.
export function schemaAt(root, tokens) {
  let schema = resolveRef(root, root);
  for (const token of tokens) {
    if (schema?.properties && Object.hasOwn(schema.properties, token)) {
      schema = resolveRef(root, schema.properties[token]);
    } else if (schema?.items && /^\d+$/.test(token)) {
      schema = resolveRef(root, schema.items);
    } else {
      return undefined;
    }
  }
  return schema;
}

export function resolveRef(root, schema) {
  if (!schema?.$ref) return schema;
  const { $ref, ...site } = schema;
  return { ...resolveRef(root, getAt(root, toTokens($ref.slice(1)))), ...site };
}
