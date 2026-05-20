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
