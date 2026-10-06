import { buildTree } from '../../src/core/builder';

describe('buildTree — primitives', () => {
  test('null', () => {
    expect(buildTree(null)).toEqual({
      kind: 'primitive',
      valueType: 'null',
      raw: 'null',
    });
  });

  test('undefined', () => {
    expect(buildTree(undefined)).toEqual({
      kind: 'primitive',
      valueType: 'undefined',
      raw: 'undefined',
    });
  });

  test('string', () => {
    expect(buildTree('hello')).toEqual({
      kind: 'primitive',
      valueType: 'string',
      raw: '"hello"',
    });
  });

  test('number', () => {
    expect(buildTree(42)).toEqual({
      kind: 'primitive',
      valueType: 'number',
      raw: '42',
    });
  });

  test('boolean true', () => {
    expect(buildTree(true)).toEqual({
      kind: 'primitive',
      valueType: 'boolean',
      raw: 'true',
    });
  });

  test('boolean false', () => {
    expect(buildTree(false)).toEqual({
      kind: 'primitive',
      valueType: 'boolean',
      raw: 'false',
    });
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

  test('invalid Date does not throw and yields Invalid Date', () => {
    const date = new Date('x');
    expect(() => buildTree(date)).not.toThrow();
    expect(buildTree(date)).toEqual({
      kind: 'primitive',
      valueType: 'date',
      raw: 'Invalid Date',
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
        {
          key: 'a',
          value: { kind: 'primitive', valueType: 'number', raw: '1' },
        },
        {
          key: 'b',
          value: { kind: 'primitive', valueType: 'string', raw: '"x"' },
        },
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
              {
                key: 'inner',
                value: { kind: 'primitive', valueType: 'boolean', raw: 'true' },
              },
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
        {
          key: 'a',
          value: { kind: 'primitive', valueType: 'number', raw: '1' },
        },
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
            entries: [
              {
                key: 'x',
                value: { kind: 'primitive', valueType: 'number', raw: '1' },
              },
            ],
          },
        },
        {
          key: 'b',
          value: {
            kind: 'object',
            entries: [
              {
                key: 'x',
                value: { kind: 'primitive', valueType: 'number', raw: '1' },
              },
            ],
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
    const m = new Map<string, number>([
      ['a', 1],
      ['b', 2],
    ]);
    expect(buildTree(m)).toEqual({
      kind: 'special',
      label: 'Map(2)',
      entries: [
        {
          key: 'a',
          value: { kind: 'primitive', valueType: 'number', raw: '1' },
        },
        {
          key: 'b',
          value: { kind: 'primitive', valueType: 'number', raw: '2' },
        },
      ],
    });
  });

  test('Map with object key uses JSON label', () => {
    const m = new Map<unknown, number>([[{ a: 1 }, 1]]);
    expect(buildTree(m)).toEqual({
      kind: 'special',
      label: 'Map(1)',
      entries: [
        {
          key: '{"a":1}',
          value: { kind: 'primitive', valueType: 'number', raw: '1' },
        },
      ],
    });
  });

  test('Map with numeric key', () => {
    const m = new Map<number, string>([[1, 'x']]);
    expect(buildTree(m)).toEqual({
      kind: 'special',
      label: 'Map(1)',
      entries: [
        {
          key: '1',
          value: { kind: 'primitive', valueType: 'string', raw: '"x"' },
        },
      ],
    });
  });

  test('Map with circular object key does not throw', () => {
    const k: Record<string, unknown> = {};
    k['self'] = k;
    const m = new Map<unknown, number>([[k, 1]]);
    expect(() => buildTree(m)).not.toThrow();
    expect(buildTree(m)).toEqual({
      kind: 'special',
      label: 'Map(1)',
      entries: [
        {
          key: '[Object]',
          value: { kind: 'primitive', valueType: 'number', raw: '1' },
        },
      ],
    });
  });

  test('empty Map', () => {
    expect(buildTree(new Map())).toEqual({
      kind: 'special',
      label: 'Map(0)',
      entries: [],
    });
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
    expect(buildTree(new Set())).toEqual({
      kind: 'special',
      label: 'Set(0)',
      items: [],
    });
  });
});
