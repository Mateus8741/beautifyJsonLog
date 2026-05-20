import React from 'react';
import ReactDOM from 'react-dom/client';
import { JsonViewer } from '../src/react/JsonViewer';
import { BeautifyJsonLog } from '../src/terminal/logger';

const sampleData = {
  name: 'Alice',
  age: 30,
  active: true,
  score: null,
  tags: ['admin', 'user'],
  nested: { role: 'editor' },
};

// Terminal usage
BeautifyJsonLog('Example', sampleData);

// React usage
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <div style={{ padding: 16, background: '#1e1e1e', minHeight: '100vh' }}>
        <JsonViewer title="Example" value={sampleData} />
      </div>
    </React.StrictMode>
  );
}
