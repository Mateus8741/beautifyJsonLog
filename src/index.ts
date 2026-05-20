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
