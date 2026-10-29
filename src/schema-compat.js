// Schema compatibility: classifies the differences between two versions of the manifest schema
// using the evolution rules in docs/manifest-spec.md section 9, and optionally confirms the
// result empirically by re-validating manifests that were valid under the previous version.
//
//   breaking   - an existing valid manifest may become invalid     -> MAJOR bump
//   additive   - new optional fields or allowed values              -> MINOR bump
//   relaxation - a constraint was loosened                          -> MINOR bump
//   annotation - descriptions, examples, or hints only              -> no contract change

import { readFileSync } from 'node:fs';
import { createAjv, isWellFormedSchemaVersion, resolveRef } from './schema-registry.js';
import { validateStructure } from './structural.js';
import { parseManifestText } from './yaml-source.js';

const IMPACT_RANK = { none: 0, annotation: 1, relaxation: 2, additive: 2, breaking: 3 };
const BUMP_RANK = { none: 0, minor: 1, major: 2 };
const BOUNDS = [['minLength', 'min'], ['maxLength', 'max'], ['minItems', 'min'], ['maxItems', 'max']];
const ANNOTATIONS = ['title', 'description', 'examples', '$comment', 'x-hint', 'x-synonyms'];

// Accepts a registered schema version ("0.1") or a path to a schema file (for unregistered drafts).
export function loadSchemaInput(input, registry) {
  const registered = registry.get(input);
  if (registered) return registered;
  const schema = JSON.parse(readFileSync(input, 'utf8'));
  return { version: schema.properties?.schemaVersion?.const, file: input, schema, validate: createAjv().compile(schema) };
}

/**
 * @param {{ version: string, schema: object, validate: Function }} previous
 * @param {{ version: string, schema: object, validate: Function }} next
 * @param {{ corpus?: Array<{ file: string, text: string }> }} [options]
 */
export function checkSchemaCompatibility(previous, next, { corpus } = {}) {
  const changes = compareSchemas(previous.schema, next.schema);
  const findings = [];
  const corpusResult = corpus ? checkCorpus(previous, next, corpus) : null;

  if (corpusResult?.regressions.length > 0) {
    changes.push({
      impact: 'breaking',
      code: 'CORPUS_REGRESSION',
      path: '(corpus)',
      message: `${corpusResult.regressions.length} manifest(s) valid under ${previous.version} are invalid under ${next.version}.`,
    });
  }

  const classification = changes.reduce((worst, change) => (IMPACT_RANK[change.impact] > IMPACT_RANK[worst] ? change.impact : worst), 'none');
  const requiredBump = { breaking: 'major', additive: 'minor', relaxation: 'minor' }[classification] ?? 'none';
  const actualBump = bumpBetween(previous.version, next.version);
  const versioning = checkBump(previous.version, next.version, requiredBump, actualBump, findings);

  return {
    ok: !findings.some((finding) => finding.severity === 'error'),
    previousVersion: previous.version,
    nextVersion: next.version,
    classification,
    requiredBump,
    actualBump,
    versioning,
    changes,
    corpus: corpusResult,
    findings,
  };
}

export function compareSchemas(previousSchema, nextSchema) {
  const a = flatten(previousSchema);
  const b = flatten(nextSchema);
  const changes = [];
  const add = (impact, code, path, message) => changes.push({ impact, code, path: path || '(root)', message });

  // Fields present in one version only. Fields inside a structure that is itself added or
  // removed are covered by that structure's change.
  for (const [path, field] of a.fields) {
    if (!b.fields.has(path) && !field.item && b.objects.has(field.parent)) {
      add('breaking', 'FIELD_REMOVED', path, `Field '${path}' was removed; manifests that use it become invalid.`);
    }
  }
  for (const [path, field] of b.fields) {
    if (a.fields.has(path) || field.item || !a.objects.has(field.parent)) continue;
    if (b.objects.get(field.parent).required?.includes(field.name)) {
      add('breaking', 'REQUIRED_FIELD_ADDED', path, `Field '${path}' was added as required; existing manifests lack it.`);
    } else {
      add('additive', 'FIELD_ADDED', path, `Optional field '${path}' was added.`);
    }
  }

  for (const [path, field] of a.fields) {
    if (b.fields.has(path)) compareField(path, field.schema, b.fields.get(path).schema, add);
  }
  for (const [path, object] of a.objects) {
    if (b.objects.has(path)) compareObject(path, object, b.objects.get(path), a, b, add);
  }
  compareLevels(previousSchema['x-completenessLevels'], nextSchema['x-completenessLevels'], add);
  return changes;
}

// Completeness levels are not validation rules, but `validate --require-level` enforces them, so
// a level that requires more can turn a passing manifest into an error. Introducing levels
// rejects nothing: they are reported, and enforced only on request.
function compareLevels(before, after, add) {
  const byLevel = (levels) => new Map((levels ?? []).map((entry) => [entry.level, new Map(entry.requires.map((r) => [r.fact, r]))]));
  const a = byLevel(before);
  const b = byLevel(after);
  const path = (level) => `x-completenessLevels.${level}`;
  for (const level of b.keys()) if (!a.has(level)) add('additive', 'LEVEL_ADDED', path(level), `Completeness level '${level}' was added.`);
  for (const level of a.keys()) if (!b.has(level)) add('breaking', 'LEVEL_REMOVED', path(level), `Completeness level '${level}' was removed; requiring it is no longer possible.`);
  for (const [level, facts] of a) {
    if (!b.has(level)) continue;
    const next = b.get(level);
    for (const fact of next.keys()) if (!facts.has(fact)) add('breaking', 'LEVEL_REQUIREMENT_ADDED', path(level), `Level '${level}' now also requires: ${fact}.`);
    for (const [fact, requirement] of facts) {
      if (!next.has(fact)) {
        add('relaxation', 'LEVEL_REQUIREMENT_REMOVED', path(level), `Level '${level}' no longer requires: ${fact}.`);
        continue;
      }
      const after = next.get(fact);
      const removed = requirement.anyOf.filter((field) => !after.anyOf.includes(field));
      const added = after.anyOf.filter((field) => !requirement.anyOf.includes(field));
      if (removed.length > 0 || canonical(requirement.excluding ?? []) !== canonical(after.excluding ?? [])) {
        add('breaking', 'LEVEL_REQUIREMENT_NARROWED', path(level), `Fewer fields now state '${fact}'${removed.length ? `: ${removed.join(', ')} no longer count` : ' (excluded values changed)'}.`);
      } else if (added.length > 0) {
        add('relaxation', 'LEVEL_REQUIREMENT_WIDENED', path(level), `'${fact}' can now also be stated by: ${added.join(', ')}.`);
      }
    }
  }
}

function flatten(root) {
  const fields = new Map();
  const objects = new Map();
  const visit = (schema, path) => {
    objects.set(path, schema);
    for (const [name, raw] of Object.entries(schema.properties ?? {})) {
      const field = resolveRef(root, raw);
      const fieldPath = path ? `${path}.${name}` : name;
      fields.set(fieldPath, { schema: field, parent: path, name, item: false });
      if (field.type === 'object' && field.properties) visit(field, fieldPath);
      if (field.type === 'array' && field.items) {
        const items = resolveRef(root, field.items);
        if (items.type === 'object' && items.properties) visit(items, `${fieldPath}[]`);
        else fields.set(`${fieldPath}[]`, { schema: items, parent: fieldPath, name: '[]', item: true });
      }
    }
  };
  visit(resolveRef(root, root), '');
  return { fields, objects };
}

function compareField(path, f, g, add) {
  if (path === 'schemaVersion') return; // its constant identifies the version and changes by design

  if (canonical(f.type) !== canonical(g.type)) add('breaking', 'TYPE_CHANGED', path, `Type changed from ${canonical(f.type)} to ${canonical(g.type)}.`);
  if (('const' in f || 'const' in g) && canonical(f.const) !== canonical(g.const)) {
    add('breaking', 'CONST_CHANGED', path, `Required constant changed from ${canonical(f.const)} to ${canonical(g.const)}.`);
  }
  compareEnum(path, f.enum, g.enum, add);

  if (f.pattern !== g.pattern) {
    if (g.pattern === undefined) add('relaxation', 'PATTERN_REMOVED', path, 'The pattern constraint was removed.');
    else add('breaking', 'PATTERN_CHANGED', path, 'The pattern changed; it cannot be proven to accept every value the previous pattern accepted.');
  }
  if (f.format !== g.format) {
    if (g.format === undefined) add('relaxation', 'FORMAT_REMOVED', path, `Format '${f.format}' is no longer required.`);
    else add('breaking', 'FORMAT_CHANGED', path, `Format changed from '${f.format ?? 'none'}' to '${g.format}'.`);
  }
  for (const [key, kind] of BOUNDS) {
    const before = f[key];
    const after = g[key];
    if (before === after) continue;
    const tighter = after !== undefined && (before === undefined || (kind === 'min' ? after > before : after < before));
    add(tighter ? 'breaking' : 'relaxation', tighter ? 'CONSTRAINT_TIGHTENED' : 'CONSTRAINT_RELAXED', path,
      `${key} changed from ${before ?? 'none'} to ${after ?? 'none'}.`);
  }
  if (!f.uniqueItems && g.uniqueItems) add('breaking', 'CONSTRAINT_TIGHTENED', path, 'Items must now be unique.');
  if (f.uniqueItems && !g.uniqueItems) add('relaxation', 'CONSTRAINT_RELAXED', path, 'Items no longer need to be unique.');

  compareTransitions(path, f['x-lifecycleTransitions'], g['x-lifecycleTransitions'], add);
  const annotationsChanged = ANNOTATIONS.filter((key) => canonical(f[key]) !== canonical(g[key]));
  if (annotationsChanged.length > 0) add('annotation', 'ANNOTATION_CHANGED', path, `${annotationsChanged.join(', ')} changed.`);
}

function compareEnum(path, before, after, add) {
  if (!before && !after) return;
  if (!before) return add('breaking', 'ENUM_ADDED', path, `Values are now restricted to: ${after.join(', ')}.`);
  if (!after) return add('relaxation', 'ENUM_REMOVED', path, 'Values are no longer restricted to a list.');
  const removed = before.filter((value) => !after.includes(value));
  const added = after.filter((value) => !before.includes(value));
  if (removed.length > 0) add('breaking', 'ENUM_VALUES_REMOVED', path, `Allowed values removed: ${removed.join(', ')}.`);
  if (added.length > 0) add('additive', 'ENUM_VALUES_ADDED', path, `Allowed values added: ${added.join(', ')}.`);
}

// Lifecycle transitions are not validation rules, but compat enforces them, so removing one
// can turn a previously accepted revision into an error.
function compareTransitions(path, before, after, add) {
  if (!before && !after) return;
  for (const state of new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])) {
    const removed = (before?.[state] ?? []).filter((target) => !(after?.[state] ?? []).includes(target));
    const added = (after?.[state] ?? []).filter((target) => !(before?.[state] ?? []).includes(target));
    if (removed.length > 0) add('breaking', 'TRANSITION_REMOVED', path, `Transitions from '${state}' removed: ${removed.join(', ')}.`);
    if (added.length > 0) add('relaxation', 'TRANSITION_ADDED', path, `Transitions from '${state}' added: ${added.join(', ')}.`);
  }
}

function compareObject(path, before, after, a, b, add) {
  const fieldPath = (name) => (path ? `${path}.${name}` : name);
  for (const name of after.required ?? []) {
    if (!(before.required ?? []).includes(name) && a.fields.has(fieldPath(name))) {
      add('breaking', 'REQUIREMENT_ADDED', fieldPath(name), `Field '${fieldPath(name)}' is now required.`);
    }
  }
  for (const name of before.required ?? []) {
    if (!(after.required ?? []).includes(name) && b.fields.has(fieldPath(name))) {
      add('relaxation', 'REQUIREMENT_REMOVED', fieldPath(name), `Field '${fieldPath(name)}' is no longer required.`);
    }
  }

  // Conditional rules are compared without their annotations; a changed rule shows as one
  // removed and one added rule.
  const rules = (schema) => new Map((schema.allOf ?? []).map((rule) => [canonical({ if: rule.if, then: rule.then, else: rule.else }), rule]));
  const beforeRules = rules(before);
  const afterRules = rules(after);
  for (const [key, rule] of afterRules) {
    if (!beforeRules.has(key)) add('breaking', 'RULE_ADDED', path, `Conditional rule added: ${rule.description ?? key}`);
  }
  for (const [key, rule] of beforeRules) {
    if (!afterRules.has(key)) add('relaxation', 'RULE_REMOVED', path, `Conditional rule removed: ${rule.description ?? key}`);
  }

  const beforeExtensions = Object.keys(before.patternProperties ?? {});
  const afterExtensions = Object.keys(after.patternProperties ?? {});
  for (const pattern of beforeExtensions.filter((p) => !afterExtensions.includes(p))) {
    add('breaking', 'EXTENSIONS_RESTRICTED', path, `Extension fields matching ${pattern} are no longer accepted.`);
  }
  for (const pattern of afterExtensions.filter((p) => !beforeExtensions.includes(p))) {
    add('relaxation', 'EXTENSIONS_ALLOWED', path, `Extension fields matching ${pattern} are now accepted.`);
  }
  if (before.additionalProperties !== false && after.additionalProperties === false) {
    add('breaking', 'OBJECT_CLOSED', path, 'Unknown fields are now rejected.');
  }
  if (before.additionalProperties === false && after.additionalProperties !== false) {
    add('relaxation', 'OBJECT_OPENED', path, 'Unknown fields are now accepted.');
  }
}

// Empirical check: every manifest declared for, and valid under, the previous version is
// re-declared as the next version and validated again.
function checkCorpus(previous, next, inputs) {
  const single = (entry) => ({ versions: [entry.version], latest: entry.version, get: (v) => (v === entry.version ? entry : undefined) });
  let checked = 0;
  const regressions = [];
  for (const { file, text } of inputs) {
    const parsed = parseManifestText(text);
    if (parsed.errors.length > 0 || parsed.data?.schemaVersion !== previous.version) continue;
    if (validateStructure(parsed.data, single(previous)).findings.length > 0) continue;
    checked += 1;
    const { findings } = validateStructure({ ...parsed.data, schemaVersion: next.version }, single(next));
    if (findings.length > 0) regressions.push({ file, codes: [...new Set(findings.map((f) => f.code))] });
  }
  return { checked, stillValid: checked - regressions.length, regressions };
}

function bumpBetween(previousVersion, nextVersion) {
  if (!isWellFormedSchemaVersion(previousVersion) || !isWellFormedSchemaVersion(nextVersion)) return null;
  const [aMajor, aMinor] = previousVersion.split('.').map(Number);
  const [bMajor, bMinor] = nextVersion.split('.').map(Number);
  if (bMajor < aMajor || (bMajor === aMajor && bMinor < aMinor)) return 'decrease';
  if (bMajor > aMajor) return 'major';
  if (bMinor > aMinor) return 'minor';
  return 'none';
}

function checkBump(previousVersion, nextVersion, requiredBump, actualBump, findings) {
  const problem = (severity, code, message, hint) => findings.push({ severity, stage: 'schema-compatibility', code, message, hint });
  if (actualBump === null) {
    problem('unverified', 'VERSION_NOT_COMPARABLE', 'One of the schemas does not declare a MAJOR.MINOR schemaVersion constant.', 'Set properties.schemaVersion.const in both schemas.');
    return 'unverified';
  }
  if (actualBump === 'decrease') {
    problem('error', 'VERSION_DECREASED', `schemaVersion decreased from ${previousVersion} to ${nextVersion}.`, 'Compare the older schema as <previous> and the newer one as <next>.');
    return 'inconsistent';
  }
  if (BUMP_RANK[actualBump] >= BUMP_RANK[requiredBump]) return 'consistent';

  const step = actualBump === 'none'
    ? `the version did not change (${previousVersion})`
    : `${previousVersion} -> ${nextVersion} is a ${actualBump.toUpperCase()} step`;
  const message = `The changes require a ${requiredBump.toUpperCase()} version, but ${step}.`;
  if (Number(previousVersion.split('.')[0]) === 0) {
    const hint = requiredBump === 'major'
      ? 'Prefer a MINOR version without breaking changes, or document the breaking changes with the version.'
      : 'Publish the change as a new MINOR version; revising a version in place is acceptable only while it is an unpublished draft.';
    problem('warning', 'INSUFFICIENT_VERSION_BUMP', `${message} Below 1.0 SemVer makes no compatibility promise, so this is a warning.`, hint);
    return 'consistent';
  }
  problem('error', 'INSUFFICIENT_VERSION_BUMP', message, `Publish the changes as a new ${requiredBump.toUpperCase()} version, or remove the breaking changes.`);
  return 'inconsistent';
}

function canonical(value) {
  if (value === undefined) return 'undefined';
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort((x, y) => x.localeCompare(y)).map((key) => [key, sortKeys(value[key])]));
}
