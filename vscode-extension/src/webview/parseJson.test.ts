import { parseJson, unescapeJsString } from './parseJson';

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

  it('parses a single-quoted JS literal with escaped newline inside a JSON string', () => {
    // Source text as it appears in code: '{"a":"x\\ny"}'
    const literal = String.raw`'{"a":"x\\ny"}'`;
    expect(parseJson(literal)).toEqual({ kind: 'valid', value: { a: 'x\ny' } });
  });

  it('parses a single-quoted JS literal with escaped quotes', () => {
    const literal = String.raw`'{"msg":"it\'s \"ok\""}'`;
    // JS value is {"msg":"it's "ok""} -> not valid JSON on its own, so use \\"
    const valid = String.raw`'{"msg":"it\'s \\"ok\\""}'`;
    expect(parseJson(valid)).toEqual({ kind: 'valid', value: { msg: 'it\'s "ok"' } });
    expect(parseJson(literal).kind).toBe('error');
  });

  it('parses a JS literal using \\u, \\u{} and \\x escapes', () => {
    const literal = String.raw`'{"A":"\x42","c":"\u{1F600}"}'`;
    expect(parseJson(literal)).toEqual({
      kind: 'valid',
      value: { A: 'B', c: '\u{1F600}' },
    });
  });

  it('parses a JS literal with whitespace escapes between tokens', () => {
    const literal = String.raw`"{\n\t\"a\": 1,\r\n\t\"b\": [true]\n}"`;
    expect(parseJson(literal)).toEqual({ kind: 'valid', value: { a: 1, b: [true] } });
  });

  it('parses a backtick literal with escaped backticks', () => {
    // Source text: `{"tpl":"\`x\`"}`
    const literal = '`{"tpl":"\\`x\\`"}`';
    expect(parseJson(literal)).toEqual({ kind: 'valid', value: { tpl: '`x`' } });
  });
});

describe('unescapeJsString', () => {
  it('decodes all JS escape sequences', () => {
    expect(unescapeJsString(String.raw`a\nb\rc\td\be\ff\vg\0h`)).toBe(
      'a\nb\rc\td\be\ff\vg\0h'
    );
    expect(unescapeJsString(String.raw`A\u{42}\x43`)).toBe('ABC');
    expect(unescapeJsString('\\\'\\"\\`\\\\')).toBe('\'"`\\');
  });

  it('throws on malformed escapes', () => {
    expect(() => unescapeJsString(String.raw`\x4`)).toThrow();
    expect(() => unescapeJsString(String.raw`\u12`)).toThrow();
    expect(() => unescapeJsString('abc\\')).toThrow();
  });
});
