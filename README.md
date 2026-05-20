# 🎨 beautify-json-log

Uma biblioteca para visualizar e inspecionar valores JavaScript/JSON com **realce de sintaxe por tipo**, tanto no terminal (Node.js) quanto em aplicações React.

---

## 📦 Instalação

```bash
npm i -D @codewaveds/beautify-json-log
# ou
yarn add -D @codewaveds/beautify-json-log
```

---

## Terminal

```ts
import { BeautifyJsonLog } from '@codewaveds/beautify-json-log';

BeautifyJsonLog('Meu objeto', {
  nome: 'Alice',
  idade: 30,
  ativo: true,
  score: null,
  tags: ['admin', 'user'],
  criado: new Date(),
  meta: new Map([['chave', 1]]),
  ids: new Set([1, 2, 3]),
});
```

Exibe no terminal uma visualização colorida e formatada, com suporte completo a:

- 🟩 **Chaves** em verde
- 🔠 **Strings** em azul
- 🔢 **Números** em amarelo
- 🔘 **Booleanos** em magenta
- ❌ **Null / Error** em vermelho
- 🔵 **Date / Map / Set** em ciano
- ⚫ **undefined** em cinza
- 🔁 **Referências circulares** detectadas e exibidas como `[Circular]`
- 📦 **BigInt** com sufixo `n`

### Opções

```ts
BeautifyJsonLog('título', valor, {
  indent: 4,           // espaços de indentação (padrão: 2)
  theme: meuTema,      // AnsiTheme customizado
  transport: console.error, // onde enviar a saída (padrão: console.log)
  plugins: [minhaTransformação], // transforma a árvore antes de renderizar
});
```

---

## React

```tsx
import { JsonViewer } from '@codewaveds/beautify-json-log';

<JsonViewer title="Resposta da API" value={data} />
```

### Props

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `value` | `unknown` | — | Valor a exibir |
| `title` | `string` | — | Título opcional acima do viewer |
| `theme` | `CssTheme` | tema padrão (VS Code dark) | Cores CSS para cada tipo |
| `indent` | `number` | `16` | Indentação em pixels |
| `plugins` | `Plugin[]` | `[]` | Transforma a árvore antes de renderizar |
| `style` | `CSSProperties` | — | Estilo do container |

---

## Plugins

Plugins são funções que recebem o nó raiz da árvore (`RenderNode`) e retornam um nó transformado. Útil para ocultar campos sensíveis, mascarar valores, etc.

```ts
import { BeautifyJsonLog, Plugin } from '@codewaveds/beautify-json-log';

const redact: Plugin = node => {
  if (node.kind !== 'object') return node;
  return {
    ...node,
    entries: node.entries.map(e =>
      e.key === 'senha'
        ? { key: e.key, value: { kind: 'primitive', valueType: 'string', raw: '"[REDACTED]"' } }
        : e
    ),
  };
};

BeautifyJsonLog('Usuário', usuario, { plugins: [redact] });
```

O mesmo plugin funciona tanto no terminal quanto no `<JsonViewer>`.

---

## Temas

### Terminal (AnsiTheme)

```ts
import { BeautifyJsonLog, AnsiTheme } from '@codewaveds/beautify-json-log';

const meuTema: AnsiTheme = {
  key: s => `\x1b[35m${s}\x1b[0m`,      // magenta
  string: s => `\x1b[33m${s}\x1b[0m`,   // amarelo
  number: s => `\x1b[36m${s}\x1b[0m`,   // ciano
  boolean: s => `\x1b[32m${s}\x1b[0m`,  // verde
  null: s => `\x1b[31m${s}\x1b[0m`,     // vermelho
  undefined: s => s,
  bigint: s => `\x1b[36m${s}\x1b[0m`,
  date: s => `\x1b[34m${s}\x1b[0m`,
  error: s => `\x1b[31m${s}\x1b[0m`,
  bracket: s => s,
  punctuation: s => s,
  circular: s => `\x1b[31m${s}\x1b[0m`,
  special: s => `\x1b[34m${s}\x1b[0m`,
};

BeautifyJsonLog('Log', dados, { theme: meuTema });
```

### React (CssTheme)

```tsx
import { JsonViewer, CssTheme } from '@codewaveds/beautify-json-log';

const meuTema: CssTheme = {
  key: '#c586c0',
  string: '#ce9178',
  number: '#b5cea8',
  boolean: '#569cd6',
  null: '#f44747',
  undefined: '#808080',
  bigint: '#b5cea8',
  date: '#4fc1ff',
  error: '#f44747',
  bracket: '#d4d4d4',
  punctuation: '#d4d4d4',
  circular: '#f44747',
  special: '#4fc1ff',
};

<JsonViewer value={dados} theme={meuTema} />
```

---

## API

```ts
// Renderização no terminal
BeautifyJsonLog(title: string, value: unknown, options?: LoggerOptions): void
formatTree(node: RenderNode, options?: FormatOptions): string
buildTree(value: unknown): RenderNode

// Componente React
<JsonViewer value={unknown} ...props />

// Tipos
type Plugin = (node: RenderNode) => RenderNode
type Transport = (output: string) => void
type AnsiTheme = Record<ThemeKey, (s: string) => string>
type CssTheme = Record<ThemeKey, string>
```