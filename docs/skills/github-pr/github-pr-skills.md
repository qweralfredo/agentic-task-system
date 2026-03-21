# Skills: GitHub Pull Request & Issues

> **Tipo:** Skills da extensão `github.vscode-pull-request-github`  
> **Agente:** GitHub Copilot Chat (com a extensão GitHub Pull Requests)  
> **Quando usar:** Trabalhar com issues, PRs e notificações do GitHub diretamente no VS Code

---

## O Que São

Um conjunto de 4 skills fornecidas pela extensão **GitHub Pull Requests and Issues** para o Copilot Chat:

| Skill | Quando usar |
|---|---|
| `summarize-github-issue-pr-notification` | Resumir uma issue, PR ou notificação |
| `suggest-fix-issue` | Sugerir uma correção estruturada para uma issue |
| `form-github-search-query` | Montar uma query de busca para issues/PRs |
| `show-github-search-result` | Exibir resultados de busca em tabela |

---

## Como Instalar

### 1. Instalar a extensão

```bash
# Via terminal
code --install-extension GitHub.vscode-pull-request-github

# Ou via UI: Extensões (Ctrl+Shift+X) -> pesquisar "GitHub Pull Requests"
```

### 2. Autenticar com o GitHub

1. Abrir a paleta de comandos: `Ctrl+Shift+P`
2. Executar: `GitHub Pull Requests: Sign In`
3. Seguir o fluxo OAuth no navegador
4. Confirmar autenticao: ícone do GitHub na barra lateral

### 3. Verificar se as skills estão disponíveis

No Copilot Chat, as skills são carregadas automaticamente após a autenticação. Para confirmar, pergunte:

```
@copilot Quais skills você tem disponíveis?
```

---

## Como Usar Cada Skill

### summarize-github-issue-pr-notification

Resumo automático de uma issue, PR ou notificação. **Sempre use ao mencionar uma issue/PR.**

```
Resuma a issue #42 do repositório atual.

Resuma o PR #15 — o que mudou?

Qual é a última notificação do GitHub?
```

### suggest-fix-issue

Gera uma sugestão de correção estruturada para uma issue.

```
Sugira uma correção para a issue #88.

Com base na issue #42, como devo corrigir o problema?
```

### form-github-search-query

Cria queries de busca otimizadas para o GitHub.

```
Crie uma query para encontrar issues abertas sobre "login"
rotuladas como bug neste repositório.

Quero encontrar PRs mergeados nos últimos 7 dias por mim.
```

### show-github-search-result

Formata e exibe resultados de busca como uma tabela Markdown legível.

```
Mostre os resultados da busca de issues abertas com a label "enhancement".
```

---

## Fluxo Recomendado

```
issue mencionada
    |
summarize-github-issue-pr-notification   (entender o contexto)
    |
suggest-fix-issue                        (obter sugestão estruturada)
    |
Implementar via TDD                      (Red -> Green -> Refactor)
    |
Commit + fechar issue via PR
```

---

## Configuração de Permissões do Repositório

Para que as skills acessem repositórios privados, garanta:

1. Você está autenticado na extensão GitHub Pull Requests
2. Você tem ao menos permissão `read` no repositório
3. O repositório está configurado como `remote origin` no workspace

```bash
# Verificar remote
git remote -v
# Deve exibir: origin  https://github.com/<owner>/<repo>.git
```

---

## Referências

- [Extensão GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github)
- [GitHub Issues no VS Code](https://code.visualstudio.com/docs/sourcecontrol/github)
- [Skills do Copilot Chat](https://docs.github.com/en/copilot/using-github-copilot/copilot-chat/using-copilot-chat-in-visual-studio-code)
