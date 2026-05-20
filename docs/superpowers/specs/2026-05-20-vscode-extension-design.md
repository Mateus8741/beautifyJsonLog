# VSCode Extension Design — beautify-json-log

## Overview

Add a VSCode extension to the repo that lets the user select any JSON text in the editor, press `Ctrl+Shift+/`, and see it rendered in a formatted, colorized split panel — using the existing `JsonViewer` React component from the library.

---

## Structure

New folder `vscode-extension/` at repo root. Nothing outside this folder changes.

```
vscode-extension/
  package.json          ← VSCode extension manifest
  tsconfig.json
  esbuild.js            ← build script (extension + webview)
  src/
    extension.ts        ← extension host code
    webview/
      index.tsx         ← React entry point, renders <JsonViewer>
      webview.html      ← HTML template that loads webview.js
  dist/
    extension.js        ← host bundle (Node, no DOM)
    webview.js          ← webview bundle (browser, React + JsonViewer)
```

The local library is referenced as `"@codewaveds/beautify-json-log": "file:../"` so the extension always uses the current repo code.

---

## Flow

1. User selects JSON text in the editor.
2. User presses `Ctrl+Shift+/`.
3. `extension.ts` reads `editor.document.getText(editor.selection)`.
4. Opens (or reveals if already open) a `WebviewPanel` in `ViewColumn.Beside`.
5. Posts message `{ type: 'update', value: selectedText }` to the webview.
6. Webview receives the message, calls `JSON.parse`, renders `<JsonViewer value={parsed} title="JSON Preview" />`.
7. If JSON is invalid, the webview renders a styled error message instead.

---

## Build

`esbuild.js` produces two bundles via a single `npm run build`:

| Bundle | Platform | Externals |
|---|---|---|
| `dist/extension.js` | node | `vscode` |
| `dist/webview.js` | browser | — |

Additional scripts:
- `npm run watch` — incremental rebuild for development
- `F5` in VSCode launches the Extension Development Host

---

## Communication

The extension host and webview communicate via the VSCode webview message API:

- **Host → Webview:** `panel.webview.postMessage({ type: 'update', value: string })`
- **Webview → (none needed for MVP)**

The webview parses the string and passes the result to `<JsonViewer>`. Parse errors are caught and displayed inline.

---

## Panel Behavior

- Title: `JSON Preview`
- Column: `ViewColumn.Beside` (split view alongside editor)
- Reuse: if the panel is already open, it is revealed and updated — no duplicate panels
- Theme: default lib theme (VS Code dark), consistent with the editor

---

## Publishing

- The extension is a standalone `.vsix`, publishable to the VSCode Marketplace independently of the npm package.
- `package.json` uses a separate name (e.g., `beautify-json-log-vscode`) and version.
- The lib's own build (`tsdx build`) and publish flow are unaffected.

---

## Out of Scope

- Auto-detecting JSON without a selection
- Custom keybinding settings UI
- Theme picker inside the webview
- Publishing automation / CI for the extension
