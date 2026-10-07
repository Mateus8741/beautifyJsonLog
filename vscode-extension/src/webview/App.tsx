import React, { useState, useEffect } from 'react';
import { JsonViewer } from '@codewaveds/beautify-json-log/react';
import type { JsonViewerProps } from '@codewaveds/beautify-json-log/react';
import { parseJson, ViewState } from './parseJson';

type CssTheme = NonNullable<JsonViewerProps['theme']>;

// Colors come from the host editor's theme (VS Code / Cursor expose them as
// CSS variables inside webviews), with Dark+ fallbacks.
export const vscodeTheme: CssTheme = {
  key: 'var(--vscode-debugTokenExpression-name, #9cdcfe)',
  string: 'var(--vscode-debugTokenExpression-string, #ce9178)',
  number: 'var(--vscode-debugTokenExpression-number, #b5cea8)',
  boolean: 'var(--vscode-debugTokenExpression-boolean, #569cd6)',
  null: 'var(--vscode-debugTokenExpression-boolean, #569cd6)',
  undefined: 'var(--vscode-descriptionForeground, #808080)',
  bigint: 'var(--vscode-debugTokenExpression-number, #b5cea8)',
  date: 'var(--vscode-symbolIcon-eventForeground, #4fc1ff)',
  error: 'var(--vscode-debugTokenExpression-error, #f44747)',
  bracket: 'var(--vscode-editor-foreground, #d4d4d4)',
  punctuation: 'var(--vscode-editor-foreground, #d4d4d4)',
  circular: 'var(--vscode-errorForeground, #f44747)',
  special: 'var(--vscode-debugTokenExpression-value, #4fc1ff)',
};

const fontFamily = 'var(--vscode-editor-font-family, monospace)';
const fontSize = 'var(--vscode-editor-font-size, 14px)';

const containerStyle: React.CSSProperties = {
  background: 'var(--vscode-editor-background, #1e1e1e)',
  color: 'var(--vscode-editor-foreground, #d4d4d4)',
  padding: 16,
  minHeight: '100vh',
  boxSizing: 'border-box',
};

const messageStyle: React.CSSProperties = {
  fontFamily,
  fontSize,
  color: 'var(--vscode-descriptionForeground, #808080)',
};

const errorStyle: React.CSSProperties = {
  fontFamily,
  fontSize,
  color: 'var(--vscode-errorForeground, #f44747)',
  border: '1px solid var(--vscode-errorForeground, #f44747)',
  borderRadius: 4,
  padding: '8px 12px',
};

const viewerStyle: React.CSSProperties = { fontFamily, fontSize };

export function App(): React.ReactElement {
  const [state, setState] = useState<ViewState>({ kind: 'empty' });

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const msg = event.data as { type: string; value: string };
      if (msg.type === 'update') {
        setState(parseJson(msg.value));
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div style={containerStyle}>
      {state.kind === 'empty' && (
        <p style={messageStyle}>
          Select JSON text in the editor and press Ctrl+Shift+/ (Cmd+Shift+/ on
          macOS) to preview.
        </p>
      )}
      {state.kind === 'error' && (
        <p style={errorStyle}>Invalid JSON: {state.message}</p>
      )}
      {state.kind === 'valid' && (
        <JsonViewer
          value={state.value}
          title="JSON Preview"
          theme={vscodeTheme}
          style={viewerStyle}
        />
      )}
    </div>
  );
}
