// src/terminal/ansi.ts
import { AnsiTheme } from '../core/types';

const c = (code: string) => (s: string) => `\x1b[${code}m${s}\x1b[0m`;

export const ansi = {
  boldGreen: (s: string) => `\x1b[1;32m${s}\x1b[0m`,
  green: c('32'),
  cyan: c('36'),
  yellow: c('33'),
  blue: c('34'),
  magenta: c('35'),
  red: c('31'),
  white: c('37'),
  gray: c('90'),
};

export const defaultAnsiTheme: AnsiTheme = {
  key: ansi.green,
  string: ansi.blue,
  number: ansi.yellow,
  boolean: ansi.magenta,
  null: ansi.red,
  undefined: ansi.gray,
  bigint: ansi.yellow,
  date: ansi.cyan,
  error: ansi.red,
  bracket: ansi.white,
  punctuation: ansi.white,
  circular: ansi.red,
  special: ansi.cyan,
};
