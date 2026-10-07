/**
 * Rode na raiz: npm run terminal-demo
 * Imprime um JSON formatado colorido no terminal (stdout).
 */

const { BeautifyJsonLog } = require('../dist/terminal/index.js');

const sampleData = {
  name: 'Alice',
  age: 30,
  active: true,
  score: null,
  tags: ['admin', 'user'],
  nested: { role: 'editor' },
  deep: {
    ids: [1, 2, { mixed: ['a', 3, false] }],
  },
};

BeautifyJsonLog('terminal-demo', sampleData);
