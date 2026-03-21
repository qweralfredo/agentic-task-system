# GitHub Copilot — Instruções do Workspace: Todolist

Este workspace é o projeto **Pandora Todo List** — um **Agentic Task System**: plataforma agêntica de gestão de tarefas com Scrum, MCP e IA.

---

## Projeto Pandora (Obrigatório)

**Projeto:** `Todolist`  
**ID:** `f0b41abc-3a17-423c-a8b1-57aded62095c`  
**MCP:** `http://127.0.0.1:8481/mcp` (serviço `pandora-mcp` no Docker Compose)

### Regra Inegociável

Toda tarefa executada neste workspace **deve** ser refletida no Pandora Todo List via MCP:

0. **Ao iniciar qualquer sessão** — Chamar `project_config_update` (ou ler o projeto via `project_list`) para obter `mainBranch`, `gitHubUrl`, `localPath` e `techStack`. Usar essas informações em todas as decisões da sessão (branch de trabalho, caminhos, stack).
1. **Antes de codificar** — Criar backlog item + sprint + work item no Pandora. Perguntar ao usuário se é necessário atualizar as bases de conhecimento (wiki, docs, checkpoint, README).
2. **Durante** — Atualizar status do work item (InProgress = 1)
3. **Ao concluir** — Marcar work item como Done (status = 3) + fazer commit. Perguntar ao usuário se é necessário atualizar as bases de conhecimento do projeto (wiki, docs, checkpoint, README).

Nunca execute uma tarefa sem registrá-la antes no Pandora.

### Sincronização obrigatória: checklist → work items

| Evento | Tool MCP | Status |
|---|---|---|
| Task criada no plano | `backlog_add` + `workitem_update` | Todo = 0 |
| Iniciando trabalho | `workitem_update` | InProgress = 1 |
| Task concluída | `workitem_update` + commit | Done = 3 |
| Task em revisão | `workitem_update` | Review = 2 |

Evite criar itens duplicados — verifique com `backlog_list` e `workitem_list` antes de criar.

Ao concluir uma epic ou sprint, chamar `knowledge_checkpoint` para salvar contexto, decisões e próximos passos.

### Campos obrigatórios nas chamadas MCP

| Tool | Campos obrigatórios |
|---|---|
| `backlog_add` | `project_id`, `title`, `description`, `priority` (int), `story_points` |
| `sprint_create` | `project_id`, `name`, `goal`, `start_date` (YYYY-MM-DD), `end_date`, `backlog_item_ids` |
| `workitem_update` | `work_item_id`, `status` (**string label** preferido: `"done"`, `"review"`, `"todo"`, `"in_progress"`, `"blocked"`), `assignee`, `agent_name`, `model_used`, `ide_used`, `tokens_used`, `feedback` |
| `knowledge_checkpoint` | `project_id`, `name`, `context_snapshot`, `decisions`, `risks`, `next_actions` |

### Valores fixos para workitem_update (contexto do agente)

Sempre preencha os campos de contexto do agente em **toda** chamada `workitem_update`:

| Campo | Valor |
|---|---|
| `agent_name` | `GitHub Copilot` |
| `model_used` | `Claude Sonnet 4.6` |
| `ide_used` | `VS Code` |
| `tokens_used` | estimativa de tokens usados na sessão (inteiro) |
| `feedback` | resumo do que foi feito nesta task |
| `metadata_json` | JSON opcional com detalhes extras (pode ser `{}`) |

### Enums

- `BacklogItemPriority`: Low=0, Medium=1, High=2, Critical=3
- `WorkItemStatus`: Todo=0, InProgress=1, Review=2, Done=3, Blocked=4
  - **Prefer string labels** (`"done"`, `"review"`, etc.) em vez de inteiros para evitar erros de enum mismatch

---

## Stack

| Serviço | Porta | Tecnologia |
|---|---|---|
| API Backend | 8480 | .NET 10 / ASP.NET Core / EF Core / PostgreSQL |
| Frontend | 8400 | React 19 / TypeScript / Vite / MUI |
| MCP Server | 8481 | Python / FastMCP |
| PostgreSQL | 5432 (interno) | PostgreSQL 16 |

## Iniciar tudo

```bash
docker compose up -d
```

## Estrutura

```
backend/AgenticTodoList.Api/         # .NET 10 Web API
backend/AgenticTodoList.Api.Tests/   # xUnit + testes de integração
frontend/src/                        # React + TypeScript
mcp-server-python/server.py          # FastMCP (proxy da API)
ops/scripts/                         # PowerShell backup/restore
```

## Convenções importantes

- **Testes primeiro** — TDD obrigatório, cobertura ≥ 80%
- **Sem mocks em runtime** — integração real com PostgreSQL
- **Commit por task** — `feat:`, `fix:`, `test:`, `refactor:`
- **Migrations EF Core** — `dotnet ef migrations add <Nome>`
- **SPA Routing** — Nginx com `try_files /index.html` (ver `frontend/nginx.conf`)
- **Rotas diretas funcionam** — `/sprints`, `/backlog`, `/knowledge/wiki` etc.

## Links úteis

- [README do projeto](../README.md)
- [Agentic Architecture](../docs/ARCHITECTURE.md)
- [Backup e Restore](../docs/BACKUP-RESTORE.md)
- [Top 10 Coding Agents](../docs/TOP10-AGENTS.md)
- [Skill: agent-customization](../docs/skills/copilot/agent-customization.md)
- [Skills: GitHub PR & Issues](../docs/skills/github-pr/github-pr-skills.md)
- [MCP: Pandora Todo List](../docs/mcps/pandora-mcp.md)
- [MCP: Playwright](../docs/mcps/playwright-mcp.md)
