// src/react/JsonViewer.tsx
import React from 'react';
import { RenderNode, Plugin, CssTheme } from '../core/types';
import { buildTree } from '../core/builder';
import { JsonNode } from './JsonNode';
import { defaultCssTheme } from './css-theme';

export interface JsonViewerProps {
  value: unknown;
  title?: string;
  theme?: CssTheme;
  indent?: number;
  plugins?: Plugin[];
  style?: React.CSSProperties;
}

export function JsonViewer({
  value,
  title,
  theme = defaultCssTheme,
  indent = 16,
  plugins = [],
  style,
}: JsonViewerProps): React.ReactElement {
  const tree = React.useMemo(() => {
    let node: RenderNode = buildTree(value);
    for (const plugin of plugins) {
      node = plugin(node);
    }
    return node;
  }, [value, plugins]);

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 14, ...style }}>
      {title !== undefined && (
        <div data-testid="json-viewer-title" style={{ fontWeight: 'bold', marginBottom: 4 }}>
          {title}
        </div>
      )}
      <JsonNode node={tree} theme={theme} depth={0} indent={indent} />
    </div>
  );
}
