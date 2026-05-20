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
        return (
          <>
            <span style={{ color: theme.bracket }}>[</span>
            <span style={{ color: theme.bracket }}>]</span>
          </>
        );
      }
      return (
        <>
          <span style={{ color: theme.bracket }}>[</span>
          <div style={{ paddingLeft: indent }}>
            {node.items.map((item, i) => (
              // eslint-disable-next-line react/no-array-index-key
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
      if (node.items !== undefined) {
        if (node.items.length === 0) {
          return (
            <>
              <span style={{ color: theme.special }}>{node.label}</span>
              {' '}
              <span style={{ color: theme.bracket }}>()</span>
            </>
          );
        }
        const items = node.items;
        return (
          <>
            <span style={{ color: theme.special }}>{node.label}</span>
            {' '}
            <span style={{ color: theme.bracket }}>(</span>
            <div style={{ paddingLeft: indent }}>
              {items.map((item, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i}>
                  <JsonNode node={item} theme={theme} depth={depth + 1} indent={indent} />
                  {i < items.length - 1 && (
                    <span style={{ color: theme.punctuation }}>,</span>
                  )}
                </div>
              ))}
            </div>
            <span style={{ color: theme.bracket }}>)</span>
          </>
        );
      }

      if (node.entries !== undefined) {
        if (node.entries.length === 0) {
          return (
            <>
              <span style={{ color: theme.special }}>{node.label}</span>
              {' '}
              <span style={{ color: theme.bracket }}>()</span>
            </>
          );
        }
        const entries = node.entries;
        return (
          <>
            <span style={{ color: theme.special }}>{node.label}</span>
            {' '}
            <span style={{ color: theme.bracket }}>(</span>
            <div style={{ paddingLeft: indent }}>
              {entries.map(({ key, value }, i) => (
                <div key={key}>
                  <span style={{ color: theme.key }}>{`"${key}"`}</span>
                  <span style={{ color: theme.punctuation }}>: </span>
                  <JsonNode node={value} theme={theme} depth={depth + 1} indent={indent} />
                  {i < entries.length - 1 && (
                    <span style={{ color: theme.punctuation }}>,</span>
                  )}
                </div>
              ))}
            </div>
            <span style={{ color: theme.bracket }}>)</span>
          </>
        );
      }

      return <span style={{ color: theme.special }}>{node.label}</span>;
    }
  }
}
