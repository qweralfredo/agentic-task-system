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
| `backlog_context_update` | **NEW:** `backlog_item_id`, opcionais: `tags`, `wikiRefs`, `constraints` |
| `sprint_create` | `project_id`, `name`, `goal`, `start_date` (YYYY-MM-DD), `end_date`, `backlog_item_ids` |
| `workitem_update` | `work_item_id`, `status` (**string label** preferido: `"done"`, `"review"`, `"todo"`, `"in_progress"`, `"blocked"`), `assignee`, `branch`, `agent_name`, `model_used`, `ide_used`, `tokens_used`, `feedback` |
| `workitem_add_subtask` | **NEW:** `parent_work_item_id`, `title`, `description`, `assignee`, opcionais: `branch`, `tags` |
| `knowledge_checkpoint` | `project_id`, `name`, `context_snapshot`, `decisions`, `risks`, `next_actions` |

### Valores fixos para workitem_update (contexto do agente)

Sempre preencha os campos de contexto do agente em **toda** chamada `workitem_update`:

| Campo | Valor |
|---|---|
| `agent_name` | `GitHub Copilot` |
| `model_used` | `Claude Sonnet 4.6` |
| `ide_used` | `VS Code` |
| `branch` | **NEW:** branch de trabalho (ex: `develop`, `feat/xyz`) |
| `tokens_used` | estimativa de tokens usados na sessão (inteiro) |
| `feedback` | resumo do que foi feito nesta task |
| `metadata_json` | JSON opcional com detalhes extras (pode ser `{}`) |

---

## Atomic-Agent Flow (NEW)

Para intenções de alto nível que requerem planejamento proporcional à complexidade, use o **Atomic-Agent Flow** via `/pandora-atomic-flow`.

### Quando usar

| Cenário | C | Skill recomendada |
|---|---|---|
| Correção pontual / task isolada | 0.2 | `/pandora-plan` + `/pandora-execute` |
| Feature pequena / melhoria simples | 0.5 | `/pandora-atomic-flow` com C=0.5 |
| Iniciativa de médio porte / novo módulo | 1 | `/pandora-atomic-flow` com C=1 |
| Feature complexa / múltiplos domínios | 2 | `/pandora-atomic-flow` com C=2 |
| Refactor estrutural / grande épico | 3 | `/pandora-atomic-flow` com C=3 |

### Motor de Expansão (C ∈ {0.2, 0.5, 1, 2, 3})

| Nível             | C=0.2 | C=0.5 | C=1 | C=2 | C=3  |
|-------------------|-------|-------|-----|-----|------|
| Backlogs          | 2     | 5     | 10  | 20  | 30   |
| Sprints / Backlog | 1     | 4     | 7   | 14  | 21   |
| Tasks / Sprint    | 1     | 2     | 3   | 6   | 9    |
| Subtasks / Task   | 1     | 2     | 4   | 8   | 12   |

### Git Flow Atômico (Branches Efêmeras)

Cada subtask usa uma branch `task/{work_item_id}`:

```bash
git checkout -b task/{id}    # isolation
# implementação atômica
git merge task/{id} --no-ff  # merge
git branch -d task/{id}      # delete — sem acúmulo
```

Referência completa: [docs/skills/pandora-atomic-flow.md](../docs/skills/pandora-atomic-flow.md)

---

## Context-First Execution Flow (NEW)

**Obrigatório para qualquer work item complexo:**

Antes de implementar qualquer tarefa, execute o prompt `pandora_context_first_execute` em 5 etapas:

### 1. **Discovery (Scan do Contexto)**
Ler o estado atual do projeto sem pressupostos:
- Dashboard: `GET /api/projects/{projectId}/dashboard`
- Work items ativos: filtrar por status InProgress
- Visão geral: `pandora://projects/{projectId}/context`

### 2. **Knowledge Warm-up (Aquecimento)**
Carregar base de conhecimento relevante:
- Wiki pages do projeto
- Checkpoints recentes
- Decisões técnicas anteriores
- Constraints mapeados no backlog

### 3. **Context Injection (Injeção)**
Enriquecer o backlog item e work item:
- Ler tags, wikiRefs, constraints do backlog_context
- Confirmar branch de trabalho (mainBranch ou branch específica)
- Se faltarem dados: `backlog_context_update` para enriquecer
- Para tarefas grandes: planejar sub-tasks com `workitem_add_subtask`

### 4. **Execution (Implementação)**
Executar com manutenção cognitiva:
- `workitem_update(status='in_progress', branch='...')`
- Criar sub-tasks conforme necessário
- Atualizar constraints/wiki ao descobrir novos aprendizados
- Ao concluir: `workitem_update(status='done', feedback='...')`

### 5. **Validation Review (Validação)**
Verificar estado final:
- Todos sub-tasks Done? (pai é auto-completado)
- Dashboard reflete mudanças?
- Checkpoints/wiki atualizados com decisões?
- Nenhum item bloqueado orfão

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
- [Skill: Atomic-Agent Flow](../docs/skills/pandora-atomic-flow.md)
