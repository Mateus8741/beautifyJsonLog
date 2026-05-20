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
