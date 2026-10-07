# Beautify JSON Log

Preview JSON from your editor with syntax highlighting in a side panel. It also handles JSON that is buried inside log lines or wrapped in string literals. Works in **VS Code** and **Cursor**.

## Features

- **Side-by-side preview**: the JSON opens in a panel next to your editor, and the panel is reused each time you run the command.
- **Follows your theme**: colors, fonts and font size come from the active editor theme (light, dark or high contrast) in both VS Code and Cursor.
- **Lenient parsing**: the extension tries each of these in order:
  - plain JSON (objects, arrays and primitives);
  - JSON inside a JS/TS string literal (`'...'`, `"..."` or `` `...` ``), with escape sequences decoded (`\n`, `\t`, `\uXXXX`, `\u{...}`, `\xXX`, `\'`, `\"` and the rest);
  - the first balanced `{...}` or `[...]` found inside a log line, for example `2024-01-01 INFO payload={"id":1}`.
- **Readable errors**: when nothing in the text parses, the panel says so.

## Usage

1. Select some JSON (or a log line that contains JSON) in the editor. If nothing is selected, the extension uses the whole document.
2. Run **Beautify JSON Log: Preview Selection** in any of these ways:
   - press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>/</kbd> (Windows/Linux) or <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>/</kbd> (macOS);
   - right-click the selection and choose **Preview Selection** from the context menu;
   - open the Command Palette (<kbd>Ctrl/Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>) and search for "Beautify JSON Log".

## Install

### VS Code

Install from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=codewaveds.beautify-json-log-vscode), or search for **Beautify JSON Log** in the Extensions view (<kbd>Ctrl/Cmd</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd>).

### Cursor

- Open the Extensions panel and search for **Beautify JSON Log**. Cursor serves extensions from the [Open VSX Registry](https://open-vsx.org/extension/codewaveds/beautify-json-log-vscode).
- Or install the packaged file: download `beautify-json-log-vscode-<version>.vsix` from the [GitHub releases](https://github.com/Mateus8741/beautifyJsonLog/releases), then run **Extensions: Install from VSIX...** from the Command Palette.

The same `.vsix` also installs in VS Code and other VS Code-based editors (VSCodium and similar).

## Development

```bash
cd vscode-extension
npm install
npm run build      # bundle into dist/
npm test           # jest
npm run typecheck
npm run package    # produces beautify-json-log-vscode-<version>.vsix
```

The webview bundles the React viewer directly from the library sources (`../src/react`), so you do not need to build the root package first.

## License

MIT
