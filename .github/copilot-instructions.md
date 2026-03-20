# GitHub Copilot — Instruções do Workspace: Todolist

Este workspace é o projeto **Pandora Todo List** — uma plataforma agêntica de gestão de tarefas com Scrum, MCP e IA.

---

## Projeto Pandora (Obrigatório)

**Projeto:** `Todolist`  
**ID:** `f0b41abc-3a17-423c-a8b1-57aded62095c`  
**MCP:** `http://127.0.0.1:8481/mcp` (serviço `pandora-mcp` no Docker Compose)

### Regra Inegociável

Toda tarefa executada neste workspace **deve** ser refletida no Pandora Todo List via MCP:

1. **Antes de codificar** — Criar backlog item + sprint + work item no Pandora
2. **Durante** — Atualizar status do work item (InProgress = 1)
3. **Ao concluir** — Marcar work item como Done (status = 2) + fazer commit

Nunca execute uma tarefa sem registrá-la antes no Pandora.

### Campos obrigatórios nas chamadas MCP

| Tool | Campos obrigatórios |
|---|---|
| `backlog_add` | `project_id`, `title`, `description`, `priority` (int), `story_points` |
| `sprint_create` | `project_id`, `name`, `goal`, `start_date` (YYYY-MM-DD), `end_date`, `backlog_item_ids` |
| `workitem_update` | `work_item_id`, `status` (int), `assignee` |
| `knowledge_checkpoint` | `project_id`, `name`, `context_snapshot`, `decisions`, `risks`, `next_actions` |

### Enums

- `BacklogItemPriority`: Low=0, Medium=1, High=2, Critical=3
- `WorkItemStatus`: Todo=0, InProgress=1, Done=2, Review=3

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
- [Arquitetura agêntica](../docs/ARQUITETURA_AGENTICA.md)
- [Backlog e sprints](../docs/BACKLOG_SPRINT.md)
- [MCP no VS Code](../docs/MCP_VSCODE.md)
- [Backup e restore](../docs/OPERACAO_BACKUP_RESTORE.md)
