# Integração com agentes

## Objetivo

Permitir que **agentes de IA** (via MCP) e **humanos** (via UI) partilhem o mesmo estado: backlog, sprints, tarefas, wiki e checkpoints, com **rastreabilidade** para git e decisões.

## Fluxo recomendado (resumo)

1. **Discovery:** `project_list`, dashboard, work items ativos.
2. **Warm-up:** ler wikis e checkpoints do projeto (recursos MCP ou UI).
3. **Context injection:** enriquecer backlog com `tags`, `wikiRefs`, `constraints` (`backlog_context_update`).
4. **Execução:** `workitem_update` com status, branch, feedback e tokens; sub-tasks para trabalho grande.
5. **Validação:** sub-tasks concluídas, parent atualizado; documentar no wiki e `knowledge_checkpoint` em marcos.

## Rastreabilidade

- Commits devem referenciar IDs Pandora quando a equipa adota essa política (ver skill Pandora / README).
- Work items suportam **branch** e **commit IDs** para ligar código a tarefas.

## Atomic-Agent Flow

Planeamento hierárquico opcional (complexidade C) para quebrar épicos em tarefas atômicas — ver `docs/skills/pandora-atomic-flow.md` e skills em `docs/skills/claude/`.

## Ferramentas auxiliares no repo

- Playwright MCP (documentação em `docs/mcps/playwright-mcp.md`) para E2E quando há UI web.
- Scripts em `ops/scripts` para MCP VS Code, validação pós-deploy, importação de histórico git.

## Governança

Para regras de processo e qualidade, ver [../GOVERNANCE.md](../GOVERNANCE.md).
