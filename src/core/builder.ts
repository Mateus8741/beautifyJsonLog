// src/core/builder.ts
import type { RenderNode, PrimitiveNode } from './types';

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

  if (typeof value === 'object' && value !== null) {
    if (visited.has(value)) return { kind: 'circular' };
    visited.add(value);

    let result: RenderNode;

    if (value instanceof Map) {
      const entries = Array.from(value.entries()).map(([k, v]) => ({
        key: String(k),
        value: buildTree(v, visited),
      }));
      result = { kind: 'special', label: `Map(${value.size})`, entries };
    } else if (value instanceof Set) {
      const items = Array.from(value.values()).map(v => buildTree(v, visited));
      result = { kind: 'special', label: `Set(${value.size})`, items };
    } else if (Array.isArray(value)) {
      const items = value.map(item => buildTree(item, visited));
      result = { kind: 'array', items };
    } else {
      const entries = Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
        key: k,
        value: buildTree(v, visited),
      }));
      result = { kind: 'object', entries };
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
