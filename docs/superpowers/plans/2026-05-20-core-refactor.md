# BeautifyJsonLog Core Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the regex-based terminal logger with a recursive tree-building engine that drives terminal and React output targets.

**Architecture:** A `buildTree()` function traverses any JavaScript value recursively into a typed `RenderNode` tree (no regex, no JSON.stringify). A terminal formatter renders the tree to an ANSI-colored string; a React component renders the same tree as JSX. Themes, transports, and plugins are injected at the call site, not hardcoded.

**Tech Stack:** TypeScript 5.x, TSDX, Jest (via tsdx test), React 19

---

## Scope Note

The original spec covers four output targets: terminal, React, React Native, and a formatting engine. **React Native is excluded from this plan** — it requires different peer dependencies (`react-native` instead of `react`) and a separate build target. Deliver this plan first to establish the core API, then follow up with a React Native plan that imports `src/core/*` types.

---

## File Structure

**Created:**
- `src/core/types.ts` — `RenderNode`, `AnsiTheme`, `CssTheme`, `Plugin`, `Transport` types
- `src/core/builder.ts` — `buildTree()` recursive traversal
- `src/terminal/ansi.ts` — ANSI escape helpers + `defaultAnsiTheme`
- `src/terminal/formatter.ts` — `formatTree()` renders `RenderNode` → ANSI string
- `src/terminal/logger.ts` — `BeautifyJsonLog()` public API with transport + plugin support
- `src/react/css-theme.ts` — `CssTheme` type + `defaultCssTheme`
- `src/react/JsonNode.tsx` — recursive React component for a single `RenderNode`
- `src/react/JsonViewer.tsx` — `<JsonViewer>` public component
- `src/index.ts` — all public re-exports
- `test/core/builder.test.ts`
- `test/terminal/formatter.test.ts`
- `test/terminal/logger.test.ts`
- `test/react/JsonViewer.test.tsx`

**Deleted:**
- `src/index.tsx` — replaced by `src/index.ts` + the new modules
- `test/blah.test.tsx` — replaced by proper test files

---

## Task 1: Core Types

**Files:**
- Create: `src/core/types.ts`

> No tests needed — pure type declarations.

- [ ] **Step 1: Create `src/core/types.ts`**

```typescript
// src/core/types.ts

export interface PrimitiveNode {
  kind: 'primitive';
  valueType:
    | 'string'
    | 'number'
    | 'boolean'
    | 'null'
    | 'undefined'
    | 'bigint'
    | 'date'
    | 'error';
  raw: string;
}

export interface ObjectNode {
  kind: 'object';
  entries: Array<{ key: string; value: RenderNode }>;
}

export interface ArrayNode {
  kind: 'array';
  items: RenderNode[];
}

export interface CircularNode {
  kind: 'circular';
}

export interface SpecialNode {
  kind: 'special';
  label: string;
  entries?: Array<{ key: string; value: RenderNode }>; // Map
  items?: RenderNode[]; // Set
}

export type RenderNode =
  | PrimitiveNode
  | ObjectNode
  | ArrayNode
  | CircularNode
  | SpecialNode;

export type ThemeKey =
  | 'key'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'bigint'
  | 'date'
  | 'error'
  | 'bracket'
  | 'punctuation'
  | 'circular'
  | 'special';

export type AnsiTheme = Record<ThemeKey, (s: string) => string>;
export type CssTheme = Record<ThemeKey, string>;

export type Plugin = (node: RenderNode) => RenderNode;
export type Transport = (output: string) => void;
```

- [ ] **Step 2: Commit**

```bash
git add src/core/types.ts
git commit -m "feat: add core RenderNode and theme types"
```

---

## Task 2: Tree Builder

**Files:**
- Create: `src/core/builder.ts`
- Test: `test/core/builder.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// test/core/builder.test.ts
import { buildTree } from '../../src/core/builder';

function strip(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('buildTree — primitives', () => {
  test('null', () => {
    expect(buildTree(null)).toEqual({ kind: 'primitive', valueType: 'null', raw: 'null' });
  });

  test('undefined', () => {
    expect(buildTree(undefined)).toEqual({ kind: 'primitive', valueType: 'undefined', raw: 'undefined' });
  });

  test('string', () => {
    expect(buildTree('hello')).toEqual({ kind: 'primitive', valueType: 'string', raw: '"hello"' });
  });

  test('number', () => {
    expect(buildTree(42)).toEqual({ kind: 'primitive', valueType: 'number', raw: '42' });
  });

  test('boolean true', () => {
    expect(buildTree(true)).toEqual({ kind: 'primitive', valueType: 'boolean', raw: 'true' });
  });

  test('boolean false', () => {
    expect(buildTree(false)).toEqual({ kind: 'primitive', valueType: 'boolean', raw: 'false' });
  });

  test('bigint', () => {
    expect(buildTree(BigInt(9007199254740991))).toEqual({
      kind: 'primitive',
      valueType: 'bigint',
      raw: '9007199254740991n',
    });
  });

  test('Date', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    expect(buildTree(date)).toEqual({
      kind: 'primitive',
      valueType: 'date',
      raw: '2024-01-01T00:00:00.000Z',
    });
  });

  test('Error', () => {
    const err = new Error('oops');
    expect(buildTree(err)).toEqual({
      kind: 'primitive',
      valueType: 'error',
      raw: 'Error: oops',
    });
  });
});

describe('buildTree — objects', () => {
  test('empty object', () => {
    expect(buildTree({})).toEqual({ kind: 'object', entries: [] });
  });

  test('flat object', () => {
    expect(buildTree({ a: 1, b: 'x' })).toEqual({
      kind: 'object',
      entries: [
        { key: 'a', value: { kind: 'primitive', valueType: 'number', raw: '1' } },
        { key: 'b', value: { kind: 'primitive', valueType: 'string', raw: '"x"' } },
      ],
    });
  });

  test('nested object', () => {
    expect(buildTree({ outer: { inner: true } })).toEqual({
      kind: 'object',
      entries: [
        {
          key: 'outer',
          value: {
            kind: 'object',
            entries: [
              { key: 'inner', value: { kind: 'primitive', valueType: 'boolean', raw: 'true' } },
            ],
          },
        },
      ],
    });
  });

  test('circular reference becomes CircularNode', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj['self'] = obj;
    expect(buildTree(obj)).toEqual({
      kind: 'object',
      entries: [
        { key: 'a', value: { kind: 'primitive', valueType: 'number', raw: '1' } },
        { key: 'self', value: { kind: 'circular' } },
      ],
    });
  });

  test('shared reference (same object, two paths) is NOT circular', () => {
    const shared = { x: 1 };
    const obj = { a: shared, b: shared };
    const result = buildTree(obj);
    expect(result).toEqual({
      kind: 'object',
      entries: [
        {
          key: 'a',
          value: {
            kind: 'object',
            entries: [{ key: 'x', value: { kind: 'primitive', valueType: 'number', raw: '1' } }],
          },
        },
        {
          key: 'b',
          value: {
            kind: 'object',
            entries: [{ key: 'x', value: { kind: 'primitive', valueType: 'number', raw: '1' } }],
          },
        },
      ],
    });
  });
});

describe('buildTree — arrays', () => {
  test('empty array', () => {
    expect(buildTree([])).toEqual({ kind: 'array', items: [] });
  });

  test('mixed array', () => {
    expect(buildTree([1, 'a', null])).toEqual({
      kind: 'array',
      items: [
        { kind: 'primitive', valueType: 'number', raw: '1' },
        { kind: 'primitive', valueType: 'string', raw: '"a"' },
        { kind: 'primitive', valueType: 'null', raw: 'null' },
      ],
    });
  });

  test('nested array', () => {
    expect(buildTree([[1, 2], [3]])).toEqual({
      kind: 'array',
      items: [
        {
          kind: 'array',
          items: [
            { kind: 'primitive', valueType: 'number', raw: '1' },
            { kind: 'primitive', valueType: 'number', raw: '2' },
          ],
        },
        {
          kind: 'array',
          items: [{ kind: 'primitive', valueType: 'number', raw: '3' }],
        },
      ],
    });
  });
});

describe('buildTree — special types', () => {
  test('Map', () => {
    const m = new Map<string, number>([['a', 1], ['b', 2]]);
    expect(buildTree(m)).toEqual({
      kind: 'special',
      label: 'Map(2)',
      entries: [
        { key: 'a', value: { kind: 'primitive', valueType: 'number', raw: '1' } },
        { key: 'b', value: { kind: 'primitive', valueType: 'number', raw: '2' } },
      ],
    });
  });

  test('empty Map', () => {
    expect(buildTree(new Map())).toEqual({ kind: 'special', label: 'Map(0)', entries: [] });
  });

  test('Set', () => {
    const s = new Set([1, 2, 3]);
    expect(buildTree(s)).toEqual({
      kind: 'special',
      label: 'Set(3)',
      items: [
        { kind: 'primitive', valueType: 'number', raw: '1' },
        { kind: 'primitive', valueType: 'number', raw: '2' },
        { kind: 'primitive', valueType: 'number', raw: '3' },
      ],
    });
  });

  test('empty Set', () => {
    expect(buildTree(new Set())).toEqual({ kind: 'special', label: 'Set(0)', items: [] });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx tsdx test test/core/builder.test.ts --no-coverage
```

Expected: FAIL with `Cannot find module '../../src/core/builder'`

- [ ] **Step 3: Create `src/core/builder.ts`**

```typescript
// src/core/builder.ts
import {
  RenderNode,
  PrimitiveNode,
  ObjectNode,
  ArrayNode,
  CircularNode,
  SpecialNode,
} from './types';

export function buildTree(
  value: unknown,
  visited: WeakSet<object> = new WeakSet()
): RenderNode {
  if (value === null) return primitive('null', 'null');
  if (value === undefined) return primitive('undefined', 'undefined');
  if (typeof value === 'boolean') return primitive('boolean', String(value));
  if (typeof value === 'number') return primitive('number', String(value));
  if (typeof value === 'string') return primitive('string', JSON.stringify(value));
  if (typeof value === 'bigint') return primitive('bigint', `${value}n`);
  if (value instanceof Date) return primitive('date', value.toISOString());
  if (value instanceof Error) return primitive('error', `${value.name}: ${value.message}`);

  if (typeof value === 'object') {
    if (visited.has(value)) return { kind: 'circular' } satisfies CircularNode;
    visited.add(value);

    let result: RenderNode;

    if (value instanceof Map) {
      const entries = Array.from(value.entries()).map(([k, v]) => ({
        key: String(k),
        value: buildTree(v, visited),
      }));
      result = { kind: 'special', label: `Map(${value.size})`, entries } satisfies SpecialNode;
    } else if (value instanceof Set) {
      const items = Array.from(value.values()).map(v => buildTree(v, visited));
      result = { kind: 'special', label: `Set(${value.size})`, items } satisfies SpecialNode;
    } else if (Array.isArray(value)) {
      const items = value.map(item => buildTree(item, visited));
      result = { kind: 'array', items } satisfies ArrayNode;
    } else {
      const entries = Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
        key: k,
        value: buildTree(v, visited),
      }));
      result = { kind: 'object', entries } satisfies ObjectNode;
    }

    visited.delete(value);
    return result;
  }

  return primitive('string', String(value));
}

function primitive(
  valueType: PrimitiveNode['valueType'],
  raw: string
): PrimitiveNode {
  return { kind: 'primitive', valueType, raw };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx tsdx test test/core/builder.test.ts --no-coverage
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/builder.ts test/core/builder.test.ts
git commit -m "feat: add recursive buildTree with Map/Set/BigInt/Date/Error/circular support"
```

---

## Task 3: ANSI Helpers + Terminal Formatter

**Files:**
- Create: `src/terminal/ansi.ts`
- Create: `src/terminal/formatter.ts`
- Test: `test/terminal/formatter.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// test/terminal/formatter.test.ts
import { formatTree } from '../../src/terminal/formatter';
import { buildTree } from '../../src/core/builder';

function strip(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('formatTree — primitives', () => {
  test('null', () => expect(strip(formatTree(buildTree(null)))).toBe('null'));
  test('undefined', () => expect(strip(formatTree(buildTree(undefined)))).toBe('undefined'));
  test('string', () => expect(strip(formatTree(buildTree('hello')))).toBe('"hello"'));
  test('number', () => expect(strip(formatTree(buildTree(42)))).toBe('42'));
  test('boolean', () => expect(strip(formatTree(buildTree(true)))).toBe('true'));
  test('bigint', () => expect(strip(formatTree(buildTree(BigInt(1))))).toBe('1n'));
  test('circular', () => expect(strip(formatTree({ kind: 'circular' }))).toBe('[Circular]'));
});

describe('formatTree — objects', () => {
  test('empty object', () => {
    expect(strip(formatTree(buildTree({})))).toBe('{}');
  });

  test('flat object', () => {
    expect(strip(formatTree(buildTree({ a: 1 })))).toBe('{\n  "a": 1\n}');
  });

  test('nested object', () => {
    expect(strip(formatTree(buildTree({ a: { b: 2 } })))).toBe(
      '{\n  "a": {\n    "b": 2\n  }\n}'
    );
  });

  test('respects custom indent', () => {
    expect(strip(formatTree(buildTree({ a: 1 }), { indent: 4 }))).toBe('{\n    "a": 1\n}');
  });
});

describe('formatTree — arrays', () => {
  test('empty array', () => {
    expect(strip(formatTree(buildTree([])))).toBe('[]');
  });

  test('number array', () => {
    expect(strip(formatTree(buildTree([1, 2])))).toBe('[\n  1,\n  2\n]');
  });

  test('last item has no trailing comma', () => {
    const result = strip(formatTree(buildTree([1, 2, 3])));
    const lines = result.split('\n');
    expect(lines[lines.length - 2]).toBe('  3');
  });
});

describe('formatTree — special types', () => {
  test('Set', () => {
    const result = strip(formatTree(buildTree(new Set([1, 2]))));
    expect(result).toBe('Set(2) (\n  1,\n  2\n)');
  });

  test('empty Set', () => {
    expect(strip(formatTree(buildTree(new Set())))).toBe('Set(0) ()');
  });

  test('Map', () => {
    const result = strip(formatTree(buildTree(new Map([['k', 1]]))));
    expect(result).toBe('Map(1) (\n  "k": 1\n)');
  });

  test('empty Map', () => {
    expect(strip(formatTree(buildTree(new Map())))).toBe('Map(0) ()');
  });
});

describe('formatTree — ANSI output', () => {
  test('string value has ANSI codes', () => {
    const result = formatTree(buildTree('hi'));
    expect(result).toContain('\x1b[');
  });

  test('custom theme is applied', () => {
    const noOp = (s: string) => s;
    const theme = {
      key: noOp, string: noOp, number: noOp, boolean: noOp,
      null: noOp, undefined: noOp, bigint: noOp, date: noOp,
      error: noOp, bracket: noOp, punctuation: noOp, circular: noOp, special: noOp,
    };
    const result = formatTree(buildTree({ a: 1 }), { theme });
    expect(result).not.toContain('\x1b[');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx tsdx test test/terminal/formatter.test.ts --no-coverage
```

Expected: FAIL with `Cannot find module '../../src/terminal/formatter'`

- [ ] **Step 3: Create `src/terminal/ansi.ts`**

```typescript
// src/terminal/ansi.ts
import { AnsiTheme } from '../core/types';

const c = (code: string) => (s: string) => `\x1b[${code}m${s}\x1b[0m`;

export const ansi = {
  boldGreen: (s: string) => `\x1b[1;32m${s}\x1b[0m`,
  green: c('32'),
  cyan: c('36'),
  yellow: c('33'),
  blue: c('34'),
  magenta: c('35'),
  red: c('31'),
  white: c('37'),
  gray: c('90'),
};

export const defaultAnsiTheme: AnsiTheme = {
  key: ansi.green,
  string: ansi.blue,
  number: ansi.yellow,
  boolean: ansi.magenta,
  null: ansi.red,
  undefined: ansi.gray,
  bigint: ansi.yellow,
  date: ansi.cyan,
  error: ansi.red,
  bracket: ansi.white,
  punctuation: ansi.white,
  circular: ansi.red,
  special: ansi.cyan,
};
```

- [ ] **Step 4: Create `src/terminal/formatter.ts`**

```typescript
// src/terminal/formatter.ts
import { RenderNode, PrimitiveNode, AnsiTheme } from '../core/types';
import { defaultAnsiTheme } from './ansi';

export interface FormatOptions {
  indent?: number;
  theme?: AnsiTheme;
}

export function formatTree(
  node: RenderNode,
  options: FormatOptions = {},
  depth: number = 0
): string {
  const theme = options.theme ?? defaultAnsiTheme;
  const indent = options.indent ?? 2;
  const pad = ' '.repeat(depth * indent);
  const inner = ' '.repeat((depth + 1) * indent);

  switch (node.kind) {
    case 'primitive':
      return applyTheme(node, theme);

    case 'circular':
      return theme.circular('[Circular]');

    case 'array': {
      if (node.items.length === 0) return theme.bracket('[]');
      const items = node.items
        .map((item, i) => {
          const line = `${inner}${formatTree(item, options, depth + 1)}`;
          return i < node.items.length - 1 ? line + theme.punctuation(',') : line;
        })
        .join('\n');
      return `${theme.bracket('[')}\n${items}\n${pad}${theme.bracket(']')}`;
    }

    case 'object': {
      if (node.entries.length === 0) return theme.bracket('{}');
      const entries = node.entries
        .map(({ key, value }, i) => {
          const line = `${inner}${theme.key(`"${key}"`)}: ${formatTree(value, options, depth + 1)}`;
          return i < node.entries.length - 1 ? line + theme.punctuation(',') : line;
        })
        .join('\n');
      return `${theme.bracket('{')}\n${entries}\n${pad}${theme.bracket('}')}`;
    }

    case 'special': {
      const label = theme.special(node.label);

      if (node.items !== undefined) {
        if (node.items.length === 0) return `${label} ${theme.bracket('()')}`;
        const lines = node.items
          .map((item, i) => {
            const line = `${inner}${formatTree(item, options, depth + 1)}`;
            return i < node.items!.length - 1 ? line + theme.punctuation(',') : line;
          })
          .join('\n');
        return `${label} ${theme.bracket('(')}\n${lines}\n${pad}${theme.bracket(')')}`;
      }

      if (node.entries !== undefined) {
        if (node.entries.length === 0) return `${label} ${theme.bracket('()')}`;
        const lines = node.entries
          .map(({ key, value }, i) => {
            const line = `${inner}${theme.key(`"${key}"`)}: ${formatTree(value, options, depth + 1)}`;
            return i < node.entries!.length - 1 ? line + theme.punctuation(',') : line;
          })
          .join('\n');
        return `${label} ${theme.bracket('(')}\n${lines}\n${pad}${theme.bracket(')')}`;
      }

      return label;
    }
  }
}

function applyTheme(node: PrimitiveNode, theme: AnsiTheme): string {
  return theme[node.valueType](node.raw);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx tsdx test test/terminal/formatter.test.ts --no-coverage
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/terminal/ansi.ts src/terminal/formatter.ts test/terminal/formatter.test.ts
git commit -m "feat: add ANSI theme and terminal tree formatter"
```

---

## Task 4: Terminal Logger with Transport and Plugins

**Files:**
- Create: `src/terminal/logger.ts`
- Test: `test/terminal/logger.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// test/terminal/logger.test.ts
import { BeautifyJsonLog } from '../../src/terminal/logger';

function strip(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('BeautifyJsonLog', () => {
  test('calls transport once with title and value', () => {
    const outputs: string[] = [];
    BeautifyJsonLog('My Title', { a: 1 }, { transport: s => outputs.push(s) });
    expect(outputs).toHaveLength(1);
    const out = strip(outputs[0]!);
    expect(out).toContain('🔍 My Title');
    expect(out).toContain('"a"');
    expect(out).toContain('1');
  });

  test('uses console.log when no transport given', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    BeautifyJsonLog('Test', { x: 2 });
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test('applies plugins before formatting', () => {
    const outputs: string[] = [];
    BeautifyJsonLog(
      'Test',
      { secret: 'password123' },
      {
        transport: s => outputs.push(s),
        plugins: [
          node => {
            if (node.kind !== 'object') return node;
            return {
              ...node,
              entries: node.entries.map(e =>
                e.key === 'secret'
                  ? { key: e.key, value: { kind: 'primitive' as const, valueType: 'string' as const, raw: '"[REDACTED]"' } }
                  : e
              ),
            };
          },
        ],
      }
    );
    const out = strip(outputs[0]!);
    expect(out).toContain('[REDACTED]');
    expect(out).not.toContain('password123');
  });

  test('plugins receive the root RenderNode', () => {
    const received: unknown[] = [];
    BeautifyJsonLog(
      'Test',
      [1, 2],
      {
        transport: () => {},
        plugins: [node => { received.push(node.kind); return node; }],
      }
    );
    expect(received).toEqual(['array']);
  });

  test('custom indent is respected', () => {
    const outputs: string[] = [];
    BeautifyJsonLog('Test', { a: 1 }, { transport: s => outputs.push(s), indent: 4 });
    expect(strip(outputs[0]!)).toContain('    "a"');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx tsdx test test/terminal/logger.test.ts --no-coverage
```

Expected: FAIL with `Cannot find module '../../src/terminal/logger'`

- [ ] **Step 3: Create `src/terminal/logger.ts`**

```typescript
// src/terminal/logger.ts
import { RenderNode, Plugin, Transport } from '../core/types';
import { buildTree } from '../core/builder';
import { formatTree, FormatOptions } from './formatter';
import { ansi } from './ansi';

export interface LoggerOptions extends FormatOptions {
  transport?: Transport;
  plugins?: Plugin[];
}

export function BeautifyJsonLog(
  title: string,
  obj: unknown,
  options: LoggerOptions = {}
): void {
  const { transport = defaultTransport, plugins = [], ...formatOptions } = options;

  let tree: RenderNode = buildTree(obj);
  for (const plugin of plugins) {
    tree = plugin(tree);
  }

  const formatted = formatTree(tree, formatOptions);
  const header = ansi.boldGreen(`🔍 ${title}`);
  transport(`${header}\n${formatted}`);
}

const defaultTransport: Transport = output => {
  console.log(output);
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx tsdx test test/terminal/logger.test.ts --no-coverage
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/terminal/logger.ts test/terminal/logger.test.ts
git commit -m "feat: add BeautifyJsonLog with transport and plugin support"
```

---

## Task 5: React CSS Theme and JsonNode Component

**Files:**
- Create: `src/react/css-theme.ts`
- Create: `src/react/JsonNode.tsx`

> `JsonNode` is an internal component — it is not exported from `src/index.ts`. Unit tests for it come in Task 6 as part of `<JsonViewer>` integration tests.

- [ ] **Step 1: Create `src/react/css-theme.ts`**

```typescript
// src/react/css-theme.ts
import { CssTheme } from '../core/types';

export const defaultCssTheme: CssTheme = {
  key: '#7ec699',
  string: '#ce9178',
  number: '#b5cea8',
  boolean: '#569cd6',
  null: '#f44747',
  undefined: '#808080',
  bigint: '#b5cea8',
  date: '#4fc1ff',
  error: '#f44747',
  bracket: '#d4d4d4',
  punctuation: '#d4d4d4',
  circular: '#f44747',
  special: '#4fc1ff',
};
```

- [ ] **Step 2: Create `src/react/JsonNode.tsx`**

```tsx
// src/react/JsonNode.tsx
import React from 'react';
import { RenderNode, CssTheme } from '../core/types';

interface JsonNodeProps {
  node: RenderNode;
  theme: CssTheme;
  depth: number;
  indent: number;
}

export function JsonNode({ node, theme, depth, indent }: JsonNodeProps): React.ReactElement {
  switch (node.kind) {
    case 'primitive':
      return <span style={{ color: theme[node.valueType] }}>{node.raw}</span>;

    case 'circular':
      return <span style={{ color: theme.circular }}>[Circular]</span>;

    case 'array': {
      if (node.items.length === 0) {
        return <span style={{ color: theme.bracket }}>[]</span>;
      }
      return (
        <>
          <span style={{ color: theme.bracket }}>[</span>
          <div style={{ paddingLeft: indent }}>
            {node.items.map((item, i) => (
              <div key={i}>
                <JsonNode node={item} theme={theme} depth={depth + 1} indent={indent} />
                {i < node.items.length - 1 && (
                  <span style={{ color: theme.punctuation }}>,</span>
                )}
              </div>
            ))}
          </div>
          <span style={{ color: theme.bracket }}>]</span>
        </>
      );
    }

    case 'object': {
      if (node.entries.length === 0) {
        return <span style={{ color: theme.bracket }}>{'{}'}</span>;
      }
      return (
        <>
          <span style={{ color: theme.bracket }}>{'{'}</span>
          <div style={{ paddingLeft: indent }}>
            {node.entries.map(({ key, value }, i) => (
              <div key={key}>
                <span style={{ color: theme.key }}>{`"${key}"`}</span>
                <span style={{ color: theme.punctuation }}>: </span>
                <JsonNode node={value} theme={theme} depth={depth + 1} indent={indent} />
                {i < node.entries.length - 1 && (
                  <span style={{ color: theme.punctuation }}>,</span>
                )}
              </div>
            ))}
          </div>
          <span style={{ color: theme.bracket }}>{'}'}</span>
        </>
      );
    }

    case 'special': {
      const isSet = node.items !== undefined;
      const isEmpty = isSet ? node.items!.length === 0 : node.entries!.length === 0;

      if (isEmpty) {
        return (
          <>
            <span style={{ color: theme.special }}>{node.label}</span>
            {' '}
            <span style={{ color: theme.bracket }}>()</span>
          </>
        );
      }

      return (
        <>
          <span style={{ color: theme.special }}>{node.label}</span>
          {' '}
          <span style={{ color: theme.bracket }}>(</span>
          <div style={{ paddingLeft: indent }}>
            {isSet
              ? node.items!.map((item, i) => (
                  <div key={i}>
                    <JsonNode node={item} theme={theme} depth={depth + 1} indent={indent} />
                    {i < node.items!.length - 1 && (
                      <span style={{ color: theme.punctuation }}>,</span>
                    )}
                  </div>
                ))
              : node.entries!.map(({ key, value }, i) => (
                  <div key={key}>
                    <span style={{ color: theme.key }}>{`"${key}"`}</span>
                    <span style={{ color: theme.punctuation }}>: </span>
                    <JsonNode node={value} theme={theme} depth={depth + 1} indent={indent} />
                    {i < node.entries!.length - 1 && (
                      <span style={{ color: theme.punctuation }}>,</span>
                    )}
                  </div>
                ))}
          </div>
          <span style={{ color: theme.bracket }}>)</span>
        </>
      );
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/react/css-theme.ts src/react/JsonNode.tsx
git commit -m "feat: add React JsonNode component and default CSS theme"
```

---

## Task 6: React JsonViewer Component

**Files:**
- Create: `src/react/JsonViewer.tsx`
- Test: `test/react/JsonViewer.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// test/react/JsonViewer.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { JsonViewer } from '../../src/react/JsonViewer';

describe('<JsonViewer>', () => {
  test('renders a string value', () => {
    render(<JsonViewer value="hello" />);
    expect(screen.getByText('"hello"')).toBeTruthy();
  });

  test('renders a number value', () => {
    render(<JsonViewer value={42} />);
    expect(screen.getByText('42')).toBeTruthy();
  });

  test('renders null', () => {
    render(<JsonViewer value={null} />);
    expect(screen.getByText('null')).toBeTruthy();
  });

  test('renders an object key', () => {
    render(<JsonViewer value={{ greeting: 'hi' }} />);
    expect(screen.getByText('"greeting"')).toBeTruthy();
    expect(screen.getByText('"hi"')).toBeTruthy();
  });

  test('renders title when provided', () => {
    render(<JsonViewer title="My Data" value={{ a: 1 }} />);
    expect(screen.getByText('My Data')).toBeTruthy();
  });

  test('omits title element when title is not provided', () => {
    const { container } = render(<JsonViewer value={{ a: 1 }} />);
    expect(container.querySelector('[data-testid="json-viewer-title"]')).toBeNull();
  });

  test('applies plugin before rendering', () => {
    render(
      <JsonViewer
        value={{ secret: 'password' }}
        plugins={[
          node => {
            if (node.kind !== 'object') return node;
            return {
              ...node,
              entries: node.entries.map(e =>
                e.key === 'secret'
                  ? { key: e.key, value: { kind: 'primitive' as const, valueType: 'string' as const, raw: '"[REDACTED]"' } }
                  : e
              ),
            };
          },
        ]}
      />
    );
    expect(screen.getByText('"[REDACTED]"')).toBeTruthy();
    expect(screen.queryByText('"password"')).toBeNull();
  });

  test('accepts custom CssTheme', () => {
    const customTheme = {
      key: 'hotpink', string: 'hotpink', number: 'hotpink', boolean: 'hotpink',
      null: 'hotpink', undefined: 'hotpink', bigint: 'hotpink', date: 'hotpink',
      error: 'hotpink', bracket: 'hotpink', punctuation: 'hotpink',
      circular: 'hotpink', special: 'hotpink',
    };
    const { container } = render(<JsonViewer value="x" theme={customTheme} />);
    const span = container.querySelector('span');
    expect(span?.style.color).toBe('hotpink');
  });

  test('renders boolean true and false', () => {
    render(<JsonViewer value={{ yes: true, no: false }} />);
    expect(screen.getByText('true')).toBeTruthy();
    expect(screen.getByText('false')).toBeTruthy();
  });

  test('renders empty array as []', () => {
    render(<JsonViewer value={[]} />);
    expect(screen.getByText('[')).toBeTruthy();
    expect(screen.getByText(']')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Install `@testing-library/react`**

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx tsdx test test/react/JsonViewer.test.tsx --no-coverage
```

Expected: FAIL with `Cannot find module '../../src/react/JsonViewer'`

- [ ] **Step 4: Create `src/react/JsonViewer.tsx`**

```tsx
// src/react/JsonViewer.tsx
import React from 'react';
import { RenderNode, Plugin, CssTheme } from '../core/types';
import { buildTree } from '../core/builder';
import { JsonNode } from './JsonNode';
import { defaultCssTheme } from './css-theme';

export interface JsonViewerProps {
  value: unknown;
  title?: string;
  theme?: CssTheme;
  indent?: number;
  plugins?: Plugin[];
  style?: React.CSSProperties;
}

export function JsonViewer({
  value,
  title,
  theme = defaultCssTheme,
  indent = 16,
  plugins = [],
  style,
}: JsonViewerProps): React.ReactElement {
  const tree = React.useMemo(() => {
    let node: RenderNode = buildTree(value);
    for (const plugin of plugins) {
      node = plugin(node);
    }
    return node;
  }, [value, plugins]);

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 14, ...style }}>
      {title !== undefined && (
        <div data-testid="json-viewer-title" style={{ fontWeight: 'bold', marginBottom: 4 }}>
          {title}
        </div>
      )}
      <JsonNode node={tree} theme={theme} depth={0} indent={indent} />
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx tsdx test test/react/JsonViewer.test.tsx --no-coverage
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/react/JsonViewer.tsx test/react/JsonViewer.test.tsx
git commit -m "feat: add <JsonViewer> React component with plugin and theme support"
```

---

## Task 7: Update Exports and Remove Old Files

**Files:**
- Create: `src/index.ts`
- Delete: `src/index.tsx`
- Delete: `test/blah.test.tsx`

- [ ] **Step 1: Create `src/index.ts`**

```typescript
// src/index.ts

// Core
export { buildTree } from './core/builder';
export type {
  RenderNode,
  PrimitiveNode,
  ObjectNode,
  ArrayNode,
  CircularNode,
  SpecialNode,
  AnsiTheme,
  CssTheme,
  ThemeKey,
  Plugin,
  Transport,
} from './core/types';

// Terminal
export { BeautifyJsonLog } from './terminal/logger';
export type { LoggerOptions } from './terminal/logger';
export { defaultAnsiTheme, ansi } from './terminal/ansi';
export { formatTree } from './terminal/formatter';
export type { FormatOptions } from './terminal/formatter';

// React
export { JsonViewer } from './react/JsonViewer';
export type { JsonViewerProps } from './react/JsonViewer';
export { defaultCssTheme } from './react/css-theme';
```

- [ ] **Step 2: Delete old files**

```bash
rm src/index.tsx test/blah.test.tsx
```

- [ ] **Step 3: Run the full test suite**

```bash
npx tsdx test --no-coverage
```

Expected: all tests PASS, no failures

- [ ] **Step 4: Build the package**

```bash
npx tsdx build
```

Expected: build succeeds, `dist/` contains `index.js`, `index.d.ts`, `beautify-json-log.esm.js`

- [ ] **Step 5: Smoke-test the terminal output**

Create a temporary script `smoke.js` at repo root:

```javascript
const { BeautifyJsonLog } = require('./dist/index.js');

BeautifyJsonLog('Smoke Test', {
  name: 'Alice',
  age: 30,
  active: true,
  score: null,
  tags: ['admin', 'user'],
  nested: { role: 'editor' },
  big: BigInt(9007199254740991),
  created: new Date('2024-01-01T00:00:00.000Z'),
  meta: new Map([['k', 1]]),
  ids: new Set([1, 2, 3]),
});
```

Run it:

```bash
node smoke.js
```

Expected: colored output in the terminal with title `🔍 Smoke Test` and all fields rendered without `[object Object]`, no regex errors, circular reference handled.

- [ ] **Step 6: Delete the smoke script and commit**

```bash
rm smoke.js
git add -A
git commit -m "feat: update exports and remove legacy index.tsx"
```

---

## Self-Review Checklist

### Spec Coverage

| Requirement | Task |
|---|---|
| Recursive renderer — no regex | Task 2 (`buildTree`) |
| Nested objects | Task 2 (nested object test) |
| Complex arrays | Task 2 (nested array test) |
| Multiline strings | Handled — strings use `JSON.stringify()` which escapes `\n` |
| BigInt | Task 2 (bigint test) |
| Circular references | Task 2 (circular test) |
| Date | Task 2 (Date test) |
| Map | Task 2 (Map test) |
| Set | Task 2 (Set test) |
| Error | Task 2 (Error test) |
| Decouple from console.log | Task 4 (transport option) |
| Themes | Tasks 3 + 5 (AnsiTheme + CssTheme) |
| Custom renderers | Users can pass `theme` with custom functions (terminal) or any theme object (React) |
| Custom transports | Task 4 (transport option) |
| Plugins | Tasks 4 + 6 (plugins array) |
| React integration | Tasks 5 + 6 |
| TypeScript — no `any` | All files use typed interfaces |
| React Native | **OUT OF SCOPE** — separate plan needed |

### Placeholder Scan

No TBD, TODO, or vague steps found. All steps include complete code.

### Type Consistency

- `RenderNode` defined in Task 1, used identically in Tasks 2, 3, 4, 5, 6, 7
- `AnsiTheme` and `CssTheme` use the same `ThemeKey` union throughout
- `Plugin = (node: RenderNode) => RenderNode` consistent in logger and JsonViewer
- `buildTree()` signature `(value: unknown, visited?: WeakSet<object>) => RenderNode` — only the public call site passes one arg
- `FormatOptions.indent` (number) matches `LoggerOptions extends FormatOptions`
