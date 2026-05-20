const esbuild = require('esbuild');
const fs = require('node:fs');

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
    fs.copyFileSync('src/webview/webview.html', 'dist/webview.html');
    console.log('Watching...');
  } else {
    await extensionCtx.rebuild();
    await webviewCtx.rebuild();
    fs.copyFileSync('src/webview/webview.html', 'dist/webview.html');
    await extensionCtx.dispose();
    await webviewCtx.dispose();
    console.log('Build complete.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
