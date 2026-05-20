// src/terminal/logger.ts
import { RenderNode, Plugin, Transport } from '../core/types';
import { buildTree } from '../core/builder';
import { formatTree, FormatOptions } from './formatter';
import { ansi } from './ansi';

export interface LoggerOptions extends FormatOptions {
  transport?: Transport;
  plugins?: Plugin[];
}

export function BeautifyJsonLog(
  title: string,
  obj: unknown,
  options: LoggerOptions = {}
): void {
  const { transport = defaultTransport, plugins = [], ...formatOptions } = options;

  let tree: RenderNode = buildTree(obj);
  for (const plugin of plugins) {
    tree = plugin(tree);
  }

  const formatted = formatTree(tree, formatOptions);
  const header = ansi.boldGreen(`🔍 ${title}`);
  transport(`${header}\n${formatted}`);
}

const defaultTransport: Transport = output => {
  console.log(output);
};
