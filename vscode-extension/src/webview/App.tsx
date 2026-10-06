import React, { useState, useEffect } from 'react';
import { JsonViewer } from '@codewaveds/beautify-json-log';
import { parseJson, ViewState } from './parseJson';

const containerStyle: React.CSSProperties = {
  background: '#1e1e1e',
  color: '#d4d4d4',
  padding: 16,
  minHeight: '100vh',
  boxSizing: 'border-box',
};

const messageStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 14,
  color: '#808080',
};

const errorStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 14,
  color: '#f44747',
  border: '1px solid #f44747',
  borderRadius: 4,
  padding: '8px 12px',
};

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
          Select JSON text in the editor and press Ctrl+Shift+/ to preview.
        </p>
      )}
      {state.kind === 'error' && (
        <p style={errorStyle}>Invalid JSON: {state.message}</p>
      )}
      {state.kind === 'valid' && (
        <JsonViewer value={state.value} title="JSON Preview" />
      )}
    </div>
  );
}
