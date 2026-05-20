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
