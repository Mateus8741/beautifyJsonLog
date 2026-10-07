# Changelog

## 0.1.0

- Published for Cursor through the Open VSX Registry, alongside the VS Code Marketplace.
- The preview now follows the active editor theme (light and dark) using VS Code theme colors and editor fonts.
- Added **Preview Selection** to the editor context menu when text is selected; the command now sits under the "Beautify JSON Log" category.
- JS/TS string literals are now fully unescaped (`\n`, `\t`, `\uXXXX`, `\u{...}`, `\xXX` and more) before they are parsed.
- Double-quoted, escaped JSON literals now show as objects instead of plain strings.
- When no text is found, the warning message now describes the situation accurately.
- The webview bundles the React viewer from the library sources, with a single bundled React copy and a minified production build.
