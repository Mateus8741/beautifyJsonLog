// Root entry: re-exports everything for backwards compatibility.
// Prefer the subpath entries to avoid pulling React into Node-only code:
//   @codewaveds/beautify-json-log/core
//   @codewaveds/beautify-json-log/terminal
//   @codewaveds/beautify-json-log/react
export * from './core';
export * from './terminal';
export * from './react';
