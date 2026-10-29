// Stage 1 - structural validation.
//
// Routes the manifest to the schema for its declared schemaVersion, validates it with a
// standard JSON Schema 2020-12 validator (Ajv), and translates raw validator errors into
// findings that state where the problem is, what is wrong, and how to fix it.

import { fromTokens, getAt, toLabel, toTokens } from './json-pointer.js';
import { compareSchemaVersions, isWellFormedSchemaVersion, schemaAt } from './schema-registry.js';

export function validateStructure(data, registry, locate = () => ({})) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return {
      validatedAgainst: null,
      findings: [
        finding({
          code: 'NOT_A_MAPPING',
          path: '',
          message: 'The manifest must be a YAML mapping of field names to values.',
          hint: 'Start the document with fields such as \'schemaVersion: "0.1"\' and \'id: <namespace>/<name>\'.',
          location: locate(''),
        }),
      ],
    };
  }

  const declared = data.schemaVersion;
  if (isWellFormedSchemaVersion(declared) && !registry.get(declared)) {
    // A well-formed but unknown version: its rules are unknown, so validating it against
    // another version's schema would produce misleading errors. Stop here, explicitly.
    const newer = compareSchemaVersions(declared, registry.latest) > 0;
    return {
      validatedAgainst: null,
      findings: [
        finding({
          code: 'SCHEMA_VERSION_UNSUPPORTED',
          path: '/schemaVersion',
          message: `schemaVersion "${declared}" is not supported by this validator (supported: ${registry.versions.join(', ')}); the manifest was not validated further.`,
          hint: newer
            ? `Use a validator release that supports schema ${declared}, or author the manifest against schema ${registry.latest}.`
            : `Migrate the manifest to schema ${registry.latest}.`,
          location: locate('/schemaVersion'),
        }),
      ],
    };
  }

  // A missing or malformed schemaVersion is reported as a field error; the rest of the manifest
  // is checked against the latest supported schema so the author gets complete feedback at once.
  const entry = registry.get(isWellFormedSchemaVersion(declared) ? declared : registry.latest);
  entry.validate(data);
  const context = { schema: entry.schema, version: entry.version, data, locate, registry };
  return { validatedAgainst: entry.version, findings: translateErrors(entry.validate.errors ?? [], context) };
}

function translateErrors(errors, context) {
  // "if" errors only say "must match then schema"; errors below a "contains" are per-item noise.
  const relevant = errors.filter((error) => error.keyword !== 'if' && !/\/contains\/./.test(error.schemaPath));

  const unknownFields = new Map();
  for (const error of relevant.filter((e) => e.keyword === 'additionalProperties')) {
    unknownFields.set(error.instancePath, [...(unknownFields.get(error.instancePath) ?? []), error.params.additionalProperty]);
  }

  return dedupe(
    relevant.map((error) => {
      const tokens = toTokens(error.instancePath);
      const fieldSchema = schemaAt(context.schema, tokens);
      const input = {
        error,
        context,
        tokens,
        label: toLabel(error.instancePath),
        fieldSchema,
        fieldHint: fieldSchema?.['x-hint'],
        rule: conditionalRule(error, context),
        unknownFields,
      };
      return (TRANSLATORS[error.keyword] ?? translateOther)(input);
    }),
  );
}

// One translator per JSON Schema keyword. Each returns a finding with an actionable hint.
const TRANSLATORS = {
  required: translateRequired,
  additionalProperties: translateUnknownField,
  type: translateType,
  enum: translateEnum,
  const: translateConst,
  pattern: translateFormat,
  format: translateFormat,
  minLength: translateLength,
  maxLength: translateLength,
  minItems: translateItemCount,
  maxItems: translateItemCount,
  uniqueItems: translateUniqueItems,
  contains: translateContains,
};

// Newer registered schema versions whose definition at this location satisfies `accepts`, so
// that a field or value from a newer version is answered with "declare that version".
function newerVersions(context, tokens, accepts) {
  return context.registry.versions.filter((version) => {
    if (compareSchemaVersions(version, context.version) <= 0) return false;
    const definition = schemaAt(context.registry.get(version).schema, tokens);
    return definition !== undefined && accepts(definition);
  });
}

function useNewerVersionHint(subject, versions) {
  return `${subject} is defined from schema ${versions[0]}; declare schemaVersion: "${versions.at(-1)}" to use it.`;
}

function translateRequired({ error, context, tokens, label, rule, unknownFields }) {
  const field = error.params.missingProperty;
  const path = fromTokens([...tokens, field]);
  const missingSchema = schemaAt(context.schema, [...tokens, field]);
  const allowedValues = missingSchema?.enum ? ` Allowed values: ${missingSchema.enum.join(', ')}.` : '';
  const fieldHint = (missingSchema?.['x-hint'] ?? `Add '${field}'.`) + allowedValues;
  const misspelling = closest(field, unknownFields.get(error.instancePath) ?? []);
  const typoNote = misspelling ? ` The unknown field '${misspelling}' looks like a misspelling of it.` : '';
  const where = tokens.length > 0 ? ` in '${label}'` : '';
  const location = context.locate(error.instancePath, { key: true });

  if (rule) {
    return finding({
      code: 'CONDITIONAL_FIELD_REQUIRED',
      path,
      message: `Field '${field}'${where} is required because ${rule.trigger}. Rule: ${rule.description}`,
      hint: (rule.hint ?? fieldHint) + typoNote,
      location,
    });
  }
  return finding({
    code: 'MISSING_REQUIRED_FIELD',
    path,
    message: tokens.length > 0 ? `Missing required field '${field}' in '${label}'.` : `Missing mandatory field '${field}'.`,
    hint: fieldHint + typoNote,
    location,
  });
}

function translateUnknownField({ error, context, tokens, label, fieldSchema }) {
  const field = error.params.additionalProperty;
  const path = fromTokens([...tokens, field]);
  const known = Object.keys(fieldSchema?.properties ?? {});
  const suggestion = closest(field, known);
  const synonymOf = synonymFor(field, fieldSchema);
  const allowsExtensions = Object.keys(fieldSchema?.patternProperties ?? {}).some((pattern) => pattern.startsWith('^x-'));

  const newer = newerVersions(context, [...tokens, field], () => true);
  let hint = `Remove it. Fields allowed in '${label}': ${known.join(', ')}.`;
  if (suggestion) hint = `Did you mean '${suggestion}'?`;
  else if (synonymOf) hint = `Use '${synonymOf}': it holds what native formats call '${field}'.`;
  else if (newer.length > 0) hint = useNewerVersionHint(`'${field}'`, newer);
  else if (allowsExtensions) hint = `Remove it, or rename it to an extension field such as 'x-${field}' to keep it as custom metadata.`;

  const where = tokens.length > 0 ? ` in '${label}'` : '';
  return finding({
    code: 'UNKNOWN_FIELD',
    path,
    message: `Unknown field '${field}'${where}: it is not defined in schema ${context.version}.`,
    hint,
    location: context.locate(path, { key: true }),
  });
}

function translateType({ error, context, label, fieldHint = '' }) {
  const actual = jsonType(error.data);
  const expected = [error.params.type].flat().join(' or ');
  let hint = fieldHint;
  if (actual === 'null') {
    hint = `Manifests never use null: provide a value, or omit the field if it is optional and the value is unknown. ${fieldHint}`;
  } else if (expected === 'string' && !/quote/i.test(fieldHint)) {
    hint = `Quote the value so that YAML reads it as text. ${fieldHint}`;
  }
  const actualText = actual === 'null' ? 'null' : withArticle(actual);
  return finding({
    code: 'INVALID_TYPE',
    path: error.instancePath,
    message: `Field '${label}' must be ${withArticle(expected)}, but it is ${actualText}.`,
    hint: hint.trim(),
    location: context.locate(error.instancePath),
  });
}

function translateEnum({ error, context, tokens, label }) {
  const allowed = error.schema;
  const suggestion = typeof error.data === 'string' ? closest(error.data, allowed) : null;
  const newer = newerVersions(context, tokens, (definition) => definition.enum?.includes(error.data));
  let prefix = '';
  if (newer.length > 0) prefix = `${useNewerVersionHint(display(error.data), newer)} `;
  else if (suggestion) prefix = `Did you mean '${suggestion}'? `;
  return finding({
    code: 'INVALID_VALUE',
    path: error.instancePath,
    message: `${display(error.data)} is not an allowed value for '${label}'.`,
    hint: `${prefix}Allowed values: ${allowed.join(', ')}.`,
    location: context.locate(error.instancePath),
  });
}

function translateUniqueItems({ error, context, label, fieldHint }) {
  return finding({
    code: 'CONSTRAINT_VIOLATION',
    path: error.instancePath,
    message: `Field '${label}' must not contain duplicate items (items ${error.params.j} and ${error.params.i} are identical).`,
    hint: fieldHint ?? `Remove the duplicate items from '${label}'.`,
    location: context.locate(error.instancePath),
  });
}

function translateConst({ error, context, label, fieldHint }) {
  return finding({
    code: 'INVALID_VALUE',
    path: error.instancePath,
    message: `${display(error.data)} is not a valid value for '${label}'.`,
    hint: fieldHint ?? `Use ${display(error.schema)}.`,
    location: context.locate(error.instancePath),
  });
}

function translateFormat({ error, context, label, fieldSchema, fieldHint }) {
  const isIdentifier = fieldSchema?.pattern === context.schema.$defs?.capabilityId?.pattern;
  const looksLikeUrl = typeof error.data === 'string' && /^[a-z][a-z0-9+.-]*:\/\//i.test(error.data);
  const urlNote = isIdentifier && looksLikeUrl
    ? 'A URL is a source reference, not a capability identifier: keep it in source.url and assign a stable namespaced id. '
    : '';
  return finding({
    code: 'INVALID_FORMAT',
    path: error.instancePath,
    message: `${display(error.data)} does not match the required format for '${label}'.`,
    hint: urlNote + (fieldHint ?? `Expected format: ${error.params.format ?? error.params.pattern}.`),
    location: context.locate(error.instancePath),
  });
}

function translateLength({ error, context, label, fieldHint }) {
  const bound = error.keyword === 'minLength' ? 'least' : 'most';
  return finding({
    code: 'CONSTRAINT_VIOLATION',
    path: error.instancePath,
    message: `Field '${label}' must be at ${bound} ${error.params.limit} characters long (it has ${Array.from(error.data).length}).`,
    hint: fieldHint ?? `Adjust the length of '${label}'.`,
    location: context.locate(error.instancePath),
  });
}

function translateItemCount({ error, context, label, fieldHint }) {
  const bound = error.keyword === 'minItems' ? 'least' : 'most';
  return finding({
    code: 'CONSTRAINT_VIOLATION',
    path: error.instancePath,
    message: `Field '${label}' must contain at ${bound} ${error.params.limit} item(s) (it has ${error.data.length}).`,
    hint: fieldHint ?? `Adjust the number of items in '${label}'.`,
    location: context.locate(error.instancePath),
  });
}

function translateContains(input) {
  const { error, context, label, rule, fieldHint } = input;
  if (!rule) return translateOther(input);
  return finding({
    code: 'CONDITIONAL_RULE_VIOLATION',
    path: error.instancePath,
    message: `Field '${label}' does not satisfy a rule that applies because ${rule.trigger}. Rule: ${rule.description}`,
    hint: rule.hint ?? fieldHint ?? '',
    location: context.locate(error.instancePath),
  });
}

function translateOther({ error, context, label, fieldHint }) {
  return finding({
    code: 'SCHEMA_VIOLATION',
    path: error.instancePath,
    message: `Field '${label}' ${error.message}.`,
    hint: fieldHint ?? '',
    location: context.locate(error.instancePath),
  });
}

// When an error comes from the "then" branch of an if/then rule, returns the rule's
// description, its fix hint, and a description of the values that triggered it.
function conditionalRule(error, context) {
  const match = /\/allOf\/(\d+)\/then(\/.*)?$/.exec(error.schemaPath);
  if (!match) return null;

  // The rule belongs to the object that holds it: strip one instance token for every
  // "properties/<name>" step taken inside the "then" branch.
  const tail = (match[2] ?? '').split('/').filter(Boolean);
  let depth = 0;
  for (let i = 0; i < tail.length - 1; i += 1) {
    if (tail[i] === 'properties') {
      depth += 1;
      i += 1;
    }
  }
  const instanceTokens = toTokens(error.instancePath);
  const ownerTokens = instanceTokens.slice(0, instanceTokens.length - depth);
  const rule = schemaAt(context.schema, ownerTokens)?.allOf?.[Number(match[1])];
  if (!rule?.if) return null;

  return {
    description: rule.description,
    hint: rule['x-hint'],
    trigger: describeTrigger(rule.if, getAt(context.data, ownerTokens), ownerTokens),
  };
}

function describeTrigger(ifSchema, instance, tokens) {
  const values = Object.entries(ifSchema.properties ?? {}).map(([key, sub]) =>
    sub.properties
      ? describeTrigger(sub, instance?.[key], [...tokens, key])
      : `${toLabel(fromTokens([...tokens, key]))} is ${display(instance?.[key])}`,
  );
  // "if": { "not": { "required": [...] } } - a rule that applies when a field is absent.
  const absent = (ifSchema.not?.required ?? []).map((key) => `${toLabel(fromTokens([...tokens, key]))} is absent`);
  return [...values, ...absent].join(' and ');
}

// The field whose x-synonyms annotation lists `name`: the name a native format uses for it.
function synonymFor(name, objectSchema) {
  const lower = name.toLowerCase();
  return Object.entries(objectSchema?.properties ?? {}).find(([, property]) =>
    (property['x-synonyms'] ?? []).some((synonym) => synonym.toLowerCase() === lower))?.[0] ?? null;
}

// One finding per location and problem; a type error makes other errors at the same
// location (enum, const, format) redundant.
function dedupe(findings) {
  const typed = new Set(findings.filter((f) => f.code === 'INVALID_TYPE').map((f) => f.path));
  const seen = new Set();
  return findings.filter((f) => {
    if (typed.has(f.path) && f.code !== 'INVALID_TYPE') return false;
    const key = `${f.path}\u0000${f.code}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function finding({ code, path, message, hint, location = {} }) {
  return {
    severity: 'error',
    stage: 'structural',
    check: 'structure',
    code,
    path,
    line: location.line,
    column: location.column,
    message,
    hint,
  };
}

function jsonType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function withArticle(type) {
  return `${/^[aeiou]/.test(type) ? 'an' : 'a'} ${type}`;
}

function display(value) {
  if (typeof value !== 'string') return JSON.stringify(value);
  const text = value.length > 70 ? value.slice(0, 67) + '...' : value;
  return `'${text}'`;
}

// Closest candidate by edit distance (case-insensitive, '-' and '_' treated alike), if close
// enough to be a plausible typo.
export function closest(value, candidates) {
  const normalize = (text) => text.toLowerCase().replace(/[-_]/g, '');
  let best = null;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const distance = levenshtein(normalize(value), normalize(candidate));
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  const tolerance = Math.min(2, Math.floor(value.length / 4));
  return bestDistance <= tolerance ? best : null;
}

function levenshtein(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[b.length];
}
