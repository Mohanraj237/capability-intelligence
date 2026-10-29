// Parses a manifest (YAML 1.2; JSON is a subset) while keeping source positions, so that
// findings can point to the line and column where a fix is needed.

import { isMap, isPair, isScalar, isSeq, LineCounter, parseDocument, visit } from 'yaml';
import { fromTokens, toTokens } from './json-pointer.js';

const PARSE_OPTIONS = {
  uniqueKeys: true, // duplicate keys are errors, not silent overrides
  prettyErrors: true, // attaches line/column positions to parse errors
};

// Unquoted values that YAML 1.2 reads as strings but YAML 1.1 parsers (for example PyYAML)
// read as dates or booleans, so that other consumers would see different data.
const YAML_1_1_DATE = /^\d{4}-\d{1,2}-\d{1,2}(?:[Tt ].*)?$/;
const YAML_1_1_BOOLEAN = /^(?:y|Y|yes|Yes|YES|n|N|no|No|NO|on|On|ON|off|Off|OFF)$/;

export function parseManifestText(text) {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { ...PARSE_OPTIONS, lineCounter });
  const position = (node) => {
    const { line, col } = lineCounter.linePos(node.range[0]);
    return { line, column: col };
  };

  const errors = doc.errors.map((error) => ({
    code: error.code === 'DUPLICATE_KEY' ? 'DUPLICATE_KEY' : 'YAML_SYNTAX_ERROR',
    message: error.message.split('\n')[0].replace(/ at line \d+, column \d+:?$/, ''),
    line: error.linePos?.[0]?.line,
    column: error.linePos?.[0]?.col,
  }));

  return {
    data: errors.length === 0 ? doc.toJS({ maxAliasCount: 100 }) : undefined,
    errors,
    portabilityWarnings: errors.length === 0 ? findAmbiguousScalars(doc, position) : [],
    locate: (pointer, options) => locate(doc, lineCounter, pointer, options),
  };
}

function findAmbiguousScalars(doc, position) {
  const warnings = [];
  visit(doc, {
    Scalar(key, node, ancestors) {
      if (key === 'key' || node.type !== 'PLAIN' || typeof node.value !== 'string') return;
      const readAs = (YAML_1_1_DATE.test(node.value) && 'a date') || (YAML_1_1_BOOLEAN.test(node.value) && 'a boolean');
      if (readAs) warnings.push({ path: pointerOf(ancestors, node), value: node.value, readAs, ...position(node) });
    },
  });
  return warnings;
}

function pointerOf(ancestors, node) {
  const chain = [...ancestors, node];
  const tokens = [];
  for (let i = 0; i < chain.length - 1; i += 1) {
    const parent = chain[i];
    if (isPair(parent)) tokens.push(String(isScalar(parent.key) ? parent.key.value : parent.key));
    else if (isSeq(parent)) tokens.push(String(parent.items.indexOf(chain[i + 1])));
  }
  return fromTokens(tokens);
}

// Returns { line, column } for a JSON Pointer. When the pointer does not exist (for example a
// missing field), the closest existing ancestor is returned, which is where the fix belongs.
// With { key: true }, the position of the mapping key is preferred over its value.
function locate(doc, lineCounter, pointer, { key = false } = {}) {
  let node = doc.contents;
  let keyNode = null;

  for (const token of toTokens(pointer)) {
    if (isMap(node)) {
      const pair = node.items.find((item) => String(isScalar(item.key) ? item.key.value : item.key) === token);
      if (!pair) break;
      keyNode = pair.key;
      node = pair.value ?? pair.key;
    } else if (isSeq(node) && node.items[Number(token)]) {
      keyNode = null;
      node = node.items[Number(token)];
    } else {
      break;
    }
  }

  const target = key && keyNode ? keyNode : node;
  if (!target?.range) return {};
  const { line, col } = lineCounter.linePos(target.range[0]);
  return { line, column: col };
}
