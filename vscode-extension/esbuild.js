const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');

const watch = process.argv.includes('--watch');
const production = process.argv.includes('--production');

const watchPlugin = (name) => ({
  name: 'watch-log',
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length) console.error(`${name}: build failed`);
      else console.log(`${name}: rebuilt`);
    });
  },
});

// Resolve the library straight from its sources (../src) so the extension does
// not depend on the root package being built first. React and react-dom are
// pinned to this folder's node_modules so exactly one React copy is bundled,
// even when ../src files are resolved next to the root node_modules.
const alias = {
  '@codewaveds/beautify-json-log': path.resolve(__dirname, '../src'),
  react: path.resolve(__dirname, 'node_modules/react'),
  'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
};

async function main() {
  const base = {
    bundle: true,
    sourcemap: !production,
    minify: production,
    logLevel: 'warning',
  };

  const extensionCtx = await esbuild.context({
    ...base,
    entryPoints: ['src/extension.ts'],
    outfile: 'dist/extension.js',
    platform: 'node',
    format: 'cjs',
    external: ['vscode'],
    plugins: watch ? [watchPlugin('extension')] : [],
  });

  const webviewCtx = await esbuild.context({
    ...base,
    entryPoints: ['src/webview/index.tsx'],
    outfile: 'dist/webview.js',
    platform: 'browser',
    alias,
    define: {
      'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
    },
    plugins: watch ? [watchPlugin('webview')] : [],
  });

  // Production builds start from a clean dist/ so no stale sourcemaps linger.
  if (production) fs.rmSync('dist', { recursive: true, force: true });
  fs.mkdirSync('dist', { recursive: true });

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
    console.log(`Build complete${production ? ' (production)' : ''}.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
