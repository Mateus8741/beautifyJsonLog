# VSCode Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `vscode-extension/` folder to the repo that registers `Ctrl+Shift+/` to open a split-panel webview rendering the selected JSON with `<JsonViewer>`.

**Architecture:** The extension host (`extension.ts`) captures the editor selection and posts it to a `WebviewPanel`. The webview (`index.tsx`) is a React app that receives messages and renders `<JsonViewer>` from the local library. Two esbuild bundles are produced: one for the extension host (Node, `vscode` external) and one for the webview (browser, React included).

**Tech Stack:** TypeScript, React 19, `@codewaveds/beautify-json-log` (local `file:../`), esbuild, Jest + ts-jest + @testing-library/react, VSCode Extension API (`@types/vscode ^1.85`)

---

## File Map

| File | Role |
|---|---|
| `vscode-extension/package.json` | Extension manifest + scripts + jest config |
| `vscode-extension/tsconfig.json` | TS config (ES2020, DOM lib, jsx: react) |
| `vscode-extension/esbuild.js` | Builds extension.js and webview.js |
| `vscode-extension/src/extension.ts` | Host: registers command, manages WebviewPanel |
| `vscode-extension/src/webview/parseJson.ts` | Pure function: string → ViewState |
| `vscode-extension/src/webview/parseJson.test.ts` | Unit tests for parseJson |
| `vscode-extension/src/webview/App.tsx` | React component: renders JsonViewer or error |
| `vscode-extension/src/webview/App.test.tsx` | Component tests |
| `vscode-extension/src/webview/index.tsx` | Webview entry point: mounts App, wires messages |
| `vscode-extension/src/webview/webview.html` | HTML template with nonce-based CSP |

---

## Task 1: Scaffold `package.json` and `tsconfig.json`

**Files:**
- Create: `vscode-extension/package.json`
- Create: `vscode-extension/tsconfig.json`

- [ ] **Step 1: Create `vscode-extension/package.json`**

```json
{
  "name": "beautify-json-log-vscode",
  "displayName": "Beautify JSON Log",
  "description": "Preview selected JSON with syntax highlighting in a split panel",
  "version": "0.0.1",
  "publisher": "codewaveds",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "activationEvents": [],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "beautify-json-log.preview",
        "title": "Beautify JSON Log: Preview Selection"
      }
    ],
    "keybindings": [
      {
        "command": "beautify-json-log.preview",
        "key": "ctrl+shift+/",
        "mac": "cmd+shift+/",
        "when": "editorTextFocus"
      }
    ]
  },
  "scripts": {
    "build": "node esbuild.js",
    "watch": "node esbuild.js --watch",
    "test": "jest",
    "vscode:prepublish": "node esbuild.js"
  },
  "dependencies": {
    "@codewaveds/beautify-json-log": "file:../",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20.0.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.2",
    "@types/vscode": "^1.85.0",
    "esbuild": "^0.24.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.8.3"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "jsdom",
    "testPathPattern": "src/webview",
    "moduleNameMapper": {
      "@codewaveds/beautify-json-log": "<rootDir>/../dist/index.js"
    }
  }
}
```

- [ ] **Step 2: Create `vscode-extension/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Install dependencies**

```bash
cd vscode-extension && npm install
```

Expected: `node_modules/` created, `package-lock.json` generated. No errors.

- [ ] **Step 4: Commit scaffold**

```bash
git add vscode-extension/package.json vscode-extension/package-lock.json vscode-extension/tsconfig.json
git commit -m "feat(vscode): scaffold extension package"
```

---

## Task 2: Create `esbuild.js` build script

**Files:**
- Create: `vscode-extension/esbuild.js`

- [ ] **Step 1: Create `vscode-extension/esbuild.js`**

```js
const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const watchPlugin = (name) => ({
  name: 'watch-log',
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length) console.error(`${name}: build failed`);
      else console.log(`${name}: rebuilt`);
    });
  },
});

async function main() {
  const base = { bundle: true, sourcemap: true, minify: false };

  const extensionCtx = await esbuild.context({
    ...base,
    entryPoints: ['src/extension.ts'],
    outfile: 'dist/extension.js',
    platform: 'node',
    external: ['vscode'],
    plugins: watch ? [watchPlugin('extension')] : [],
  });

  const webviewCtx = await esbuild.context({
    ...base,
    entryPoints: ['src/webview/index.tsx'],
    outfile: 'dist/webview.js',
    platform: 'browser',
    plugins: watch ? [watchPlugin('webview')] : [],
  });

  if (watch) {
    await extensionCtx.watch();
    await webviewCtx.watch();
    console.log('Watching...');
  } else {
    await extensionCtx.rebuild();
    await webviewCtx.rebuild();
    await extensionCtx.dispose();
    await webviewCtx.dispose();
    console.log('Build complete.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Create stub entry points so the build succeeds**

Create `vscode-extension/src/extension.ts`:
```typescript
export function activate() {}
export function deactivate() {}
```

Create `vscode-extension/src/webview/index.tsx`:
```tsx
// entry point — implemented in Task 5
```

- [ ] **Step 3: Run the build and verify it succeeds**

```bash
cd vscode-extension && npm run build
```

Expected output:
```
Build complete.
```

Expected files: `dist/extension.js` and `dist/webview.js` exist.

- [ ] **Step 4: Commit**

```bash
git add vscode-extension/esbuild.js vscode-extension/src/extension.ts vscode-extension/src/webview/index.tsx vscode-extension/dist/
git commit -m "feat(vscode): add esbuild build script"
```

---

## Task 3: `parseJson` — pure function with tests (TDD)

**Files:**
- Create: `vscode-extension/src/webview/parseJson.ts`
- Create: `vscode-extension/src/webview/parseJson.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `vscode-extension/src/webview/parseJson.test.ts`:

```typescript
import { parseJson } from './parseJson';

describe('parseJson', () => {
  it('returns empty state for blank string', () => {
    expect(parseJson('')).toEqual({ kind: 'empty' });
    expect(parseJson('   ')).toEqual({ kind: 'empty' });
  });

  it('returns valid state with parsed value for valid JSON', () => {
    const result = parseJson('{"name":"Alice","age":30}');
    expect(result).toEqual({ kind: 'valid', value: { name: 'Alice', age: 30 } });
  });

  it('returns valid state for JSON arrays', () => {
    const result = parseJson('[1,2,3]');
    expect(result).toEqual({ kind: 'valid', value: [1, 2, 3] });
  });

  it('returns valid state for JSON primitives', () => {
    expect(parseJson('42')).toEqual({ kind: 'valid', value: 42 });
    expect(parseJson('"hello"')).toEqual({ kind: 'valid', value: 'hello' });
    expect(parseJson('true')).toEqual({ kind: 'valid', value: true });
    expect(parseJson('null')).toEqual({ kind: 'valid', value: null });
  });

  it('returns error state with message for invalid JSON', () => {
    const result = parseJson('{bad json}');
    expect(result.kind).toBe('error');
    if (result.kind === 'error') {
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd vscode-extension && npm test -- --testPathPattern=parseJson
```

Expected: FAIL — `Cannot find module './parseJson'`

- [ ] **Step 3: Implement `parseJson.ts`**

Create `vscode-extension/src/webview/parseJson.ts`:

```typescript
export type ViewState =
  | { kind: 'empty' }
  | { kind: 'valid'; value: unknown }
  | { kind: 'error'; message: string };

export function parseJson(text: string): ViewState {
  if (!text.trim()) return { kind: 'empty' };
  try {
    return { kind: 'valid', value: JSON.parse(text) };
  } catch (e) {
    return { kind: 'error', message: (e as Error).message };
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd vscode-extension && npm test -- --testPathPattern=parseJson
```

Expected: PASS — 5 test suites passing.

- [ ] **Step 5: Commit**

```bash
git add vscode-extension/src/webview/parseJson.ts vscode-extension/src/webview/parseJson.test.ts
git commit -m "feat(vscode): add parseJson with tests"
```

---

## Task 4: `App.tsx` — React component with tests (TDD)

**Files:**
- Create: `vscode-extension/src/webview/App.tsx`
- Create: `vscode-extension/src/webview/App.test.tsx`

> Prerequisite: `dist/index.js` must exist in the parent repo. Run `npm run build` in the repo root if it doesn't.

- [ ] **Step 1: Write the failing tests**

Create `vscode-extension/src/webview/App.test.tsx`:

```tsx
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('shows idle message when no message received', () => {
    render(<App />);
    expect(screen.getByText(/select json text/i)).toBeInTheDocument();
  });

  it('renders JsonViewer when a valid JSON message is posted', () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'update', value: '{"hello":"world"}' },
        })
      );
    });
    // JsonViewer renders the key "hello" — defaultCssTheme colors it
    expect(screen.getByText(/hello/i)).toBeInTheDocument();
  });

  it('shows error when invalid JSON message is posted', () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'update', value: '{bad}' },
        })
      );
    });
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
  });

  it('ignores messages with unknown type', () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { data: { type: 'other', value: '{}' } })
      );
    });
    expect(screen.getByText(/select json text/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd vscode-extension && npm test -- --testPathPattern=App
```

Expected: FAIL — `Cannot find module './App'`

- [ ] **Step 3: Implement `App.tsx`**

Create `vscode-extension/src/webview/App.tsx`:

```tsx
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd vscode-extension && npm test -- --testPathPattern=App
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Run all webview tests together**

```bash
cd vscode-extension && npm test
```

Expected: PASS — all 9 tests passing (5 parseJson + 4 App).

- [ ] **Step 6: Commit**

```bash
git add vscode-extension/src/webview/App.tsx vscode-extension/src/webview/App.test.tsx
git commit -m "feat(vscode): add App component with tests"
```

---

## Task 5: Webview HTML template and entry point

**Files:**
- Create: `vscode-extension/src/webview/webview.html`
- Modify: `vscode-extension/src/webview/index.tsx`

- [ ] **Step 1: Create `webview.html`**

Create `vscode-extension/src/webview/webview.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; script-src 'nonce-{{nonce}}'; style-src 'unsafe-inline';"
  />
  <title>JSON Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #1e1e1e; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="{{nonce}}" src="{{webviewScriptUri}}"></script>
</body>
</html>
```

- [ ] **Step 2: Replace the stub `index.tsx` with the real entry point**

Replace contents of `vscode-extension/src/webview/index.tsx`:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

- [ ] **Step 3: Rebuild to verify the webview bundle compiles cleanly**

```bash
cd vscode-extension && npm run build
```

Expected: `Build complete.` — no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add vscode-extension/src/webview/webview.html vscode-extension/src/webview/index.tsx vscode-extension/dist/
git commit -m "feat(vscode): add webview HTML template and entry point"
```

---

## Task 6: Extension host (`extension.ts`)

**Files:**
- Modify: `vscode-extension/src/extension.ts`

- [ ] **Step 1: Replace the stub with the full implementation**

Replace contents of `vscode-extension/src/extension.ts`:

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'beautify-json-log.preview',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const text = editor.document.getText(
        editor.selection.isEmpty ? undefined : editor.selection
      );

      if (!text.trim()) {
        vscode.window.showWarningMessage(
          'Beautify JSON Log: select some JSON text first.'
        );
        return;
      }

      if (!panel) {
        const nonce = getNonce();
        panel = vscode.window.createWebviewPanel(
          'beautifyJsonLog',
          'JSON Preview',
          vscode.ViewColumn.Beside,
          {
            enableScripts: true,
            localResourceRoots: [
              vscode.Uri.file(path.join(context.extensionPath, 'dist')),
            ],
          }
        );
        panel.webview.html = buildHtml(context, panel.webview, nonce);
        panel.onDidDispose(() => { panel = undefined; }, null, context.subscriptions);
      } else {
        panel.reveal(vscode.ViewColumn.Beside, true);
      }

      panel.webview.postMessage({ type: 'update', value: text });
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {}

function buildHtml(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
  nonce: string
): string {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview.js'))
  );
  const htmlPath = path.join(
    context.extensionPath,
    'src',
    'webview',
    'webview.html'
  );
  return fs
    .readFileSync(htmlPath, 'utf8')
    .replace(/\{\{nonce\}\}/g, nonce)
    .replace('{{webviewScriptUri}}', scriptUri.toString());
}

function getNonce(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}
```

- [ ] **Step 2: Rebuild and verify no TypeScript errors**

```bash
cd vscode-extension && npm run build
```

Expected: `Build complete.` — no errors.

- [ ] **Step 3: Commit**

```bash
git add vscode-extension/src/extension.ts vscode-extension/dist/extension.js
git commit -m "feat(vscode): implement extension host with webview panel"
```

---

## Task 7: Smoke test in VSCode

**Files:** none — manual verification only.

- [ ] **Step 1: Open the `vscode-extension/` folder in VSCode**

Open VSCode in the extension folder:
```bash
code vscode-extension/
```

- [ ] **Step 2: Press `F5` to launch the Extension Development Host**

A new VSCode window opens with the title `[Extension Development Host]`.

Expected: no errors in the Debug Console.

- [ ] **Step 3: Open any file in the Extension Development Host and type some JSON**

In the new window, create a new file (`Ctrl+N`) and paste:
```json
{"user":"Alice","age":30,"active":true,"tags":["admin","user"]}
```

Select all the text (`Ctrl+A`).

- [ ] **Step 4: Press `Ctrl+Shift+/` (or `Cmd+Shift+/` on Mac)**

Expected: a split panel opens on the right titled `JSON Preview` showing the object with color-coded keys, strings, numbers, and booleans.

- [ ] **Step 5: Test invalid JSON**

Select the text `{bad json}` and press `Ctrl+Shift+/`.

Expected: the panel updates and shows `Invalid JSON: ...` in red.

- [ ] **Step 6: Test that re-triggering reuses the existing panel**

Select valid JSON, press the shortcut again.

Expected: no new panel is opened — the existing one updates.

- [ ] **Step 7: Commit final state**

```bash
git add vscode-extension/
git commit -m "feat(vscode): complete VSCode extension MVP"
```
