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
  const inner = quoteMatch[2].replace(/\\(['"\\])/g, '$1');
  return JSON.parse(inner);
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
    tryStrategy(() => JSON.parse(trimmed)) ??
    tryStrategy(() => extractQuotedJson(trimmed)) ??
    tryStrategy(() => extractEmbeddedJson(text)) ?? {
      kind: 'error',
      message: 'No valid JSON object or array found in selection',
    }
  );
}
