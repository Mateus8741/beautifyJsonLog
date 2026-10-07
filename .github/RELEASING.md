# Como publicar

Este repositório tem três workflows:

| Workflow | Gatilho | O que faz |
| --- | --- | --- |
| `ci.yml` | PRs e push na `main` | lint, formatação, typecheck, testes, build e size-limit da lib; typecheck, testes, build e `.vsix` da extensão |
| `release.yml` | tag `v*` ou execução manual | publica `@codewaveds/beautify-json-log` no npm via **Trusted Publishing** (sem token) e cria a GitHub Release |
| `release-extension.yml` | tag `vscode-v*` ou execução manual | publica a extensão no VS Code Marketplace e no Open VSX (Cursor) e anexa o `.vsix` à GitHub Release |

O CI **nunca** altera versões nem faz commits/push. A versão é sempre definida localmente.

---

## 1. Configuração única do npm Trusted Publishing

O npm revogou os tokens clássicos e os tokens granulares de escrita expiram rápido — por isso o erro
`404 Not Found - PUT https://registry.npmjs.org/@codewaveds%2fbeautify-json-log`. Com Trusted Publishing
o GitHub Actions se autentica no npm via OIDC, sem nenhum token guardado em secrets, e a
provenance é gerada automaticamente.

1. Entre em <https://www.npmjs.com> com a conta `matt8741`.
2. Abra o pacote **@codewaveds/beautify-json-log** → **Settings**.
3. Em **Trusted Publisher**, escolha **GitHub Actions** e preencha:
   - **Organization or user:** `Mateus8741`
   - **Repository:** `beautifyJsonLog`
   - **Workflow filename:** `release.yml`
   - **Environment:** deixe em branco
4. Salve.

Depois que a primeira publicação pelo workflow funcionar (opcional, mas recomendado):

- Em **Settings → Publishing access**, selecione *"Require two-factor authentication and disallow tokens"*.
  O Trusted Publishing continua funcionando.
- Apague o secret `NPM_TOKEN` em GitHub → Settings → Secrets and variables → Actions. Ele não é mais usado.

> Requisitos já atendidos pelo workflow: Node 24, npm >= 11.5.1 (`npm install -g npm@latest`),
> permissão `id-token: write` e `repository.url` do `package.json` apontando para
> `https://github.com/Mateus8741/beautifyJsonLog`.

---

## 2. Publicar a biblioteca (npm)

Na `main`, atualizada e com a árvore limpa:

```bash
npm version patch   # ou minor / major — cria o commit e a tag vX.Y.Z
git push --follow-tags
```

O push da tag `vX.Y.Z` dispara o `release.yml`, que:

1. confere se a tag é igual a `v` + versão do `package.json` (falha se não for);
2. pula a publicação se essa versão já existir no npm;
3. roda lint, typecheck, testes e build;
4. executa `npm publish --access public` (com provenance);
5. cria a GitHub Release com notas geradas automaticamente.

### Situação atual: versão 1.0.2

A tag `v1.0.2` já existe no GitHub, mas a versão 1.0.2 **nunca foi publicada** no npm (o último publicado é 1.0.1).
Duas opções:

- **Publicar a 1.0.2:** depois de configurar o Trusted Publisher, vá em GitHub → Actions → *Release (npm)* →
  **Run workflow**, escolha a branch `main` e rode. A execução manual publica a versão que estiver no
  `package.json` daquela ref (1.0.2). Execuções manuais não criam GitHub Release.
- **Ou simplesmente lançar a próxima versão** com `npm version patch && git push --follow-tags` (1.0.3).

---

## 3. Extensão VS Code / Cursor

### Configuração única

**VS Code Marketplace**

1. Crie o publisher `codewaveds` em <https://marketplace.visualstudio.com/manage>.
2. No Azure DevOps (<https://dev.azure.com>), gere um Personal Access Token com
   organização **All accessible organizations** e escopo **Marketplace → Manage**.
3. Salve o token no GitHub como secret **`VSCE_PAT`**.

**Open VSX** (registro usado pelo Cursor, VSCodium etc.)

1. Entre em <https://open-vsx.org> com sua conta GitHub.
2. Em **Settings**, vincule a conta Eclipse e assine o *Publisher Agreement*.
3. Em **Settings → Access Tokens**, gere um token e salve no GitHub como secret **`OVSX_PAT`**.
4. Crie o namespace uma única vez:

   ```bash
   npx ovsx create-namespace codewaveds -p <token>
   ```

Se um dos secrets não estiver configurado, o workflow apenas pula aquele registro (com um aviso) e continua.

### Publicar uma nova versão da extensão

```bash
cd vscode-extension
npm version patch --no-git-tag-version   # ou edite "version" no package.json
cd ..
git commit -am "chore(vscode): release 0.0.3"
git tag vscode-v0.0.3                    # deve ser igual a vscode-v + versão do package.json
git push && git push origin vscode-v0.0.3
```

O push da tag `vscode-v*` dispara o `release-extension.yml`, que testa, faz o build, empacota o
`.vsix`, publica no Marketplace e no Open VSX e anexa o `.vsix` à GitHub Release.
