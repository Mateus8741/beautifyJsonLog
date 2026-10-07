import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'terminal/index': 'src/terminal/index.ts',
    'react/index': 'src/react/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'es2018',
  external: ['react'],
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.js' };
  },
});
