// RFC 6901 JSON Pointer helpers. Findings report locations as JSON Pointers ("/owner/contact")
// and messages use a readable label ("owner.contact", "interfaces[0].type").

export function toTokens(pointer) {
  if (!pointer) return [];
  return pointer.slice(1).split('/').map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~'));
}

export function fromTokens(tokens) {
  return tokens.map((token) => '/' + String(token).replace(/~/g, '~0').replace(/\//g, '~1')).join('');
}

export function toLabel(pointer) {
  let label = '';
  for (const token of toTokens(pointer)) {
    label += /^\d+$/.test(token) ? `[${token}]` : (label ? '.' : '') + token;
  }
  return label || '(manifest root)';
}

export function getAt(value, tokens) {
  let current = value;
  for (const token of tokens) {
    if (current === null || typeof current !== 'object') return undefined;
    current = current[token];
  }
  return current;
}
