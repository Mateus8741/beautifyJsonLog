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
    const received: string[] = [];
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
