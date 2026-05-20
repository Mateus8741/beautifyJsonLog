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
