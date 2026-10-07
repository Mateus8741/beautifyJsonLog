export type ViewState =
  | { kind: 'empty' }
  | { kind: 'valid'; value: unknown }
  | { kind: 'error'; message: string };

function nextStringState(ch: string, escaped: boolean, inString: boolean): { escaped: boolean; inString: boolean } {
  if (escaped) return { escaped: false, inString };
  if (ch === '\\') return { escaped: true, inString };
  if (ch === '"') return { escaped: false, inString: false };
  return { escaped: false, inString };
}

function findJsonEnd(text: string, start: number): number {
  const opener = text[start];
  const closer = opener === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString || escaped) {
      ({ escaped, inString } = nextStringState(ch, escaped, inString));
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === opener) depth++;
    else if (ch === closer && --depth === 0) return i;
  }
  return -1;
}

// Finds the first balanced JSON object or array in text, returns parsed value or throws.
function extractEmbeddedJson(text: string): unknown {
  const start = text.search(/[{[]/);
  if (start === -1) throw new Error('No JSON object or array found');
  const end = findJsonEnd(text, start);
  if (end === -1) throw new Error('No valid JSON object or array found in selection');
  return JSON.parse(text.slice(start, end + 1));
}

// Unquotes a JS/TS string literal (single, double, or backtick) and parses inner JSON.
function extractQuotedJson(text: string): unknown {
  const trimmed = text.trim();
  const quoteMatch = /^(['"`])([\s\S]*)\1$/.exec(trimmed);
  if (!quoteMatch) throw new Error('Not a quoted string');
  return JSON.parse(unescapeJsString(quoteMatch[2]));
}

const SIMPLE_ESCAPES: Record<string, string> = {
  n: '\n',
  r: '\r',
  t: '\t',
  b: '\b',
  f: '\f',
  v: '\v',
};

// Decodes the escape sequences of a JS string literal body (without quotes).
export function unescapeJsString(body: string): string {
  let out = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch !== '\\') {
      out += ch;
      continue;
    }
    const next = body[++i];
    if (next === undefined) throw new Error('Unterminated escape sequence');
    if (next in SIMPLE_ESCAPES) {
      out += SIMPLE_ESCAPES[next];
    } else if (next === '0' && !/[0-9]/.test(body[i + 1] ?? '')) {
      out += '\0';
    } else if (next === 'x') {
      const hex = body.slice(i + 1, i + 3);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) throw new Error('Invalid \\x escape');
      out += String.fromCharCode(parseInt(hex, 16));
      i += 2;
    } else if (next === 'u' && body[i + 1] === '{') {
      const close = body.indexOf('}', i + 2);
      const hex = close === -1 ? '' : body.slice(i + 2, close);
      if (!/^[0-9a-fA-F]{1,6}$/.test(hex)) throw new Error('Invalid \\u{} escape');
      out += String.fromCodePoint(parseInt(hex, 16));
      i = close;
    } else if (next === 'u') {
      const hex = body.slice(i + 1, i + 5);
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new Error('Invalid \\u escape');
      out += String.fromCharCode(parseInt(hex, 16));
      i += 4;
    } else if (next === '\r') {
      // Line continuation (\r\n or \r): produces nothing.
      if (body[i + 1] === '\n') i++;
    } else if (next === '\n' || next === '\u2028' || next === '\u2029') {
      // Line continuation: produces nothing.
    } else {
      // \' \" \` \\ and any other identity escape.
      out += next;
    }
  }
  return out;
}

// Parses text as JSON. When the result is a string that itself holds a JSON
// object or array (e.g. a double-quoted, escaped JSON literal copied from code
// or logs), the inner value is returned instead.
function parseDirect(text: string): unknown {
  const value: unknown = JSON.parse(text);
  if (typeof value === 'string') {
    try {
      const inner: unknown = JSON.parse(value);
      if (inner !== null && typeof inner === 'object') return inner;
    } catch {
      // not nested JSON; keep the plain string
    }
  }
  return value;
}

function tryStrategy(fn: () => unknown): ViewState | null {
  try {
    return { kind: 'valid', value: fn() };
  } catch {
    return null;
  }
}

export function parseJson(text: string): ViewState {
  if (!text.trim()) return { kind: 'empty' };

  const trimmed = text.trim();
  return (
    tryStrategy(() => parseDirect(trimmed)) ??
    tryStrategy(() => extractQuotedJson(trimmed)) ??
    tryStrategy(() => extractEmbeddedJson(text)) ?? {
      kind: 'error',
      message: 'No valid JSON object or array found in selection',
    }
  );
}
