import { parseJson } from './parseJson';

describe('parseJson', () => {
  it('returns empty state for blank string', () => {
    expect(parseJson('')).toEqual({ kind: 'empty' });
    expect(parseJson('   ')).toEqual({ kind: 'empty' });
  });

  it('returns valid state with parsed value for valid JSON', () => {
    const result = parseJson('{"name":"Alice","age":30}');
    expect(result).toEqual({ kind: 'valid', value: { name: 'Alice', age: 30 } });
  });

  it('returns valid state for JSON arrays', () => {
    const result = parseJson('[1,2,3]');
    expect(result).toEqual({ kind: 'valid', value: [1, 2, 3] });
  });

  it('returns valid state for JSON primitives', () => {
    expect(parseJson('42')).toEqual({ kind: 'valid', value: 42 });
    expect(parseJson('"hello"')).toEqual({ kind: 'valid', value: 'hello' });
    expect(parseJson('true')).toEqual({ kind: 'valid', value: true });
    expect(parseJson('null')).toEqual({ kind: 'valid', value: null });
  });

  it('returns error state with message for invalid JSON', () => {
    const result = parseJson('{bad json}');
    expect(result.kind).toBe('error');
    if (result.kind === 'error') {
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
