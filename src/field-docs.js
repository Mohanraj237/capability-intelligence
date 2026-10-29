// Generates the field dictionary from the schema, so that field documentation cannot drift from
// the validation contract. Run with `npm run docs`; a test fails if the committed file is stale.

import { compareSchemas } from './schema-compat.js';
import { resolveRef } from './schema-registry.js';

/**
 * @param {object} schema
 * @param {{ sourcePath: string, previous?: { version: string, schema: object } }} options
 *   previous: the preceding schema version, to document what changed.
 */
export function generateFieldDictionary(schema, { sourcePath, previous }) {
  const version = schema.properties.schemaVersion.const;
  const fields = [];
  const rules = [];
  collect(schema, resolveRef(schema, schema), { prefix: '', parentLevel: 'mandatory', itemOf: null }, fields, rules);

  const topLevel = fields.filter((field) => !field.path.includes('.'));
  const count = (level) => topLevel.filter((field) => field.level === level).length;
  const transitions = schema.properties.lifecycleStatus['x-lifecycleTransitions'];
  const extensionPattern = Object.keys(schema.patternProperties ?? {})[0];
  const synonyms = Object.entries(schema.properties).filter(([, property]) => property['x-synonyms']);

  const lines = [
    `# AI Capability Manifest ${version}: Field Dictionary`,
    '',
    `> Generated from \`${sourcePath}\` by \`npm run docs\`. Do not edit by hand: change the schema and regenerate.`,
    '',
    schema.description,
    '',
    `Schema \`$id\`: \`${schema.$id}\``,
    '',
    '## Requirement levels',
    '',
    '- **mandatory**: always required.',
    '- **conditional**: required only when the stated condition holds.',
    '- **optional**: may be omitted. Omission means "not provided"; consumers must not infer a value.',
    '',
    `Top-level fields: ${count('mandatory')} mandatory, ${count('conditional')} conditional, ${count('optional')} optional.`,
    '',
    ...completenessSection(schema['x-completenessLevels']),
    '## Fields',
    '',
    '| Field | Type | Requirement | Description | Constraints | Example |',
    '|---|---|---|---|---|---|',
    ...fields.map((field) =>
      row([`\`${field.path}\``, field.type, field.requirement, field.description, field.constraints, field.example]),
    ),
    '',
    '## Conditional rules',
    '',
    '| Applies to | When | Then required | Rule |',
    '|---|---|---|---|',
    ...rules.map((rule) => row([rule.appliesTo, rule.when, rule.required, rule.description])),
    '',
    '## Lifecycle states and transitions (proposed)',
    '',
    'Read from `x-lifecycleTransitions` on `lifecycleStatus`. A state may always stay unchanged.',
    '',
    '| From | Allowed next states |',
    '|---|---|',
    ...Object.entries(transitions).map(([from, to]) =>
      row([`\`${from}\``, to.length ? to.map((state) => `\`${state}\``).join(', ') : 'none (terminal)']),
    ),
    '',
    '## Extension fields',
    '',
    `Top-level fields matching \`${extensionPattern}\` are extension fields: accepted without validation and ignored ` +
      'by core consumers. Any other unknown field is an error.',
    '',
    ...(synonyms.length > 0
      ? [
        '## Names used by native formats',
        '',
        'Read from `x-synonyms`. An unknown field with one of these names is answered with the manifest field to use.',
        '',
        '| Field | Native names |',
        '|---|---|',
        ...synonyms.map(([name, property]) => row([`\`${name}\``, property['x-synonyms'].map((synonym) => `\`${synonym}\``).join(', ')])),
        '',
      ]
      : []),
    ...(previous ? changesSince(previous, schema) : []),
  ];
  return lines.join('\n');
}

function completenessSection(levels) {
  if (!levels) return [];
  return [
    '## Completeness levels (proposed)',
    '',
    'Read from `x-completenessLevels`. Levels are cumulative: a manifest reaches a level when it states the facts of that',
    'level and of every level below it. A fact is stated when any of its fields has a value; an explicit empty list counts',
    "(it declares none). The validator reports the level of every structurally valid manifest ('none' below the first",
    'level) and enforces one only when asked (`validate --require-level <level>`).',
    '',
    '| Level | Adds | Fields that state each fact |',
    '|---|---|---|',
    ...levels.map(({ level, description, requires }) => row([
      `**${level}**`,
      description,
      requires.map(({ fact, anyOf, excluding }) =>
        `${fact}: ${anyOf.map((path) => `\`${path}\``).join(' or ')}${excluding ? ` (not ${excluding.map((value) => `\`${value}\``).join(', ')})` : ''}`).join('; '),
    ])),
    '',
  ];
}

function changesSince(previous, schema) {
  const changes = compareSchemas(previous.schema, schema);
  const contract = changes.filter((change) => change.impact !== 'annotation');
  const annotations = changes.filter((change) => change.impact === 'annotation').map((change) => `\`${change.path}\``);
  return [
    `## Changes since ${previous.version}`,
    '',
    'Classified by `capability-manifest schema-compat` (see docs/manifest-spec.md section 9).',
    '',
    ...(contract.length > 0
      ? ['| Impact | Change | Field | Detail |', '|---|---|---|---|', ...contract.map((c) => row([c.impact, `\`${c.code}\``, `\`${c.path}\``, c.message]))]
      : ['No changes to the contract.']),
    '',
    ...(annotations.length > 0 ? [`Annotation-only changes (descriptions, examples, hints): ${annotations.join(', ')}.`, ''] : []),
  ];
}

function collect(root, objectSchema, { prefix, parentLevel, itemOf }, fields, rules) {
  const required = new Set(objectSchema.required ?? []);
  const conditional = (objectSchema.allOf ?? []).filter((rule) => rule.if && rule.then);

  for (const rule of conditional) {
    rules.push({
      appliesTo: prefix ? `\`${prefix}\`` : 'manifest',
      when: describeCondition(rule.if, prefix),
      required: (rule.then.required ?? []).map((name) => `\`${prefix ? `${prefix}.` : ''}${name}\``).join(', '),
      description: rule.description ?? '',
    });
  }

  for (const [name, raw] of Object.entries(objectSchema.properties ?? {})) {
    const field = resolveRef(root, raw);
    const path = prefix ? `${prefix}.${name}` : name;
    const conditions = conditional
      .filter((rule) => rule.then.required?.includes(name))
      .map((rule) => describeCondition(rule.if, prefix));
    const { level, text } = requirementOf(name, { required, conditions, prefix, parentLevel, itemOf });

    fields.push({
      path,
      level,
      requirement: text,
      type: typeOf(root, field),
      description: field.description ?? '',
      constraints: constraintsOf(field),
      example: field.examples ? `\`${JSON.stringify(field.examples[0])}\`` : '',
    });

    const items = field.type === 'array' ? resolveRef(root, field.items) : null;
    if (field.type === 'object' && field.properties) {
      collect(root, field, { prefix: path, parentLevel: level, itemOf: null }, fields, rules);
    } else if (items?.type === 'object' && items.properties) {
      collect(root, items, { prefix: `${path}[]`, parentLevel: level, itemOf: path }, fields, rules);
    }
  }
}

function requirementOf(name, { required, conditions, prefix, parentLevel, itemOf }) {
  if (required.has(name)) {
    if (itemOf) return { level: 'conditional', text: `conditional: required in each \`${itemOf}\` item` };
    if (parentLevel === 'mandatory') return { level: 'mandatory', text: 'mandatory' };
    return { level: 'conditional', text: `conditional: required when \`${prefix}\` is present` };
  }
  if (conditions.length > 0) return { level: 'conditional', text: `conditional: required when ${conditions.join('; or when ')}` };
  return { level: 'optional', text: 'optional' };
}

function describeCondition(ifSchema, prefix) {
  const values = Object.entries(ifSchema.properties ?? {}).map(([key, sub]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (sub.properties) return describeCondition(sub, path);
    if ('const' in sub) return `\`${path}\` is \`${sub.const}\``;
    if (sub.enum) return `\`${path}\` is one of ${sub.enum.map((value) => `\`${value}\``).join(', ')}`;
    return `\`${path}\` matches the rule's condition`;
  });
  const absent = (ifSchema.not?.required ?? []).map((key) => `\`${prefix ? `${prefix}.${key}` : key}\` is absent`);
  return [...values, ...absent].join(' and ');
}

function typeOf(root, field) {
  if (field.type !== 'array') return field.type ?? 'any';
  const items = resolveRef(root, field.items);
  return items?.type === 'object' ? 'array of objects' : `array of ${items?.type ?? 'any'}s`;
}

function constraintsOf(field) {
  const parts = [];
  if ('const' in field) parts.push(`must be \`${JSON.stringify(field.const)}\``);
  if (field.enum) parts.push(`one of: ${field.enum.map((value) => `\`${value}\``).join(', ')}`);
  if (field.format) parts.push(`format \`${field.format}\``);
  if (field.pattern) {
    // Long patterns are unreadable in a table; the authoring hint describes them instead.
    const hint = (field['x-hint'] ?? '').replace(/\.$/, '');
    parts.push(field.pattern.length <= 40 ? `pattern \`${field.pattern}\`` : `pattern in schema (${hint})`);
  }
  const length = range(field.minLength, field.maxLength);
  if (length) parts.push(`${length} characters`);
  const items = range(field.minItems, field.maxItems);
  if (items) parts.push(`${items} item(s)`);
  return parts.join('; ');
}

function range(min, max) {
  if (min !== undefined && max !== undefined) return `${min}-${max}`;
  if (max !== undefined) return `at most ${max}`;
  if (min !== undefined) return `at least ${min}`;
  return '';
}

// Escapes table separators, and angle brackets that Markdown renderers would treat as HTML tags.
function row(cells) {
  const escape = (cell) => String(cell ?? '').replaceAll('|', '\\|').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `| ${cells.map(escape).join(' | ')} |`;
}
