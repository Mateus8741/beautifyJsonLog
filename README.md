# 🎨 beautify-json-log

Uma pequena biblioteca que exibe objetos JSON no terminal com **realce de sintaxe por tipo** (strings, números, booleanos, null, arrays), tornando o debug mais legível e elegante.

---

## 📦 Instalação

```bash
npm i -D @codewaveds/beautify-json-log
# ou
yarn add -D @codewaveds/beautify-json-log
```

---

## 🧪 Exemplo de uso

```ts
import { BeautifyJsonLog } from '@codewaveds/beautify-json-log';

BeautifyJsonLog('courses', courses[0]);
```

Este comando exibirá no terminal uma visualização colorida e formatada do objeto `courses[0]`, destacando cada tipo de dado com uma cor diferente:

- 🟩 **Chaves** em verde
- 🔠 **Strings** em azul
- 🔢 **Números** em amarelo
- 🔘 **Booleanos** em magenta
- ❌ **Null** em vermelho
- 📚 **Arrays**:
  - De strings: azul
  - De números: amarelo
  - Mistos/objetos: ciano