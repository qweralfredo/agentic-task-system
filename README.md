# Pandora Todo List Scrum Platform

[![MCP Python Server](https://img.shields.io/badge/MCP-Python%20FastMCP-3776AB?style=for-the-badge&logo=python&logoColor=white)](mcp-server-python/README.md)

[Add SQL MCP Server](vscode:mcp/install?%7B%22name%22%3A%22sql-mcp-server%22%2C%22type%22%3A%22stdio%22%2C%22command%22%3A%22dab%22%2C%22args%22%3A%5B%22start%22%2C%22--mcp-stdio%22%2C%22role%3Aanonymous%22%2C%22--config%22%2C%22%24%7BworkspaceFolder%7D%2Fdab-config.json%22%5D%7D)

Plataforma completa para gestao de desenvolvimento de software com foco em uso humano + IA:

- Backend: .NET 10 Web API com PostgreSQL real (EF Core)
- Frontend: React + TypeScript
- Protocolo agentico: servidor MCP em Python (SDK oficial FastMCP) para integracao com apps agenticos, especialmente VS Code
- Metodologia: estrutura Scrum (projeto, backlog, sprint, tasks, review)
- Knowledge hub: wiki, checkpoints de contexto, historico de execucoes agenticas
- Operacao: Docker Compose com persistencia e backup em disco local

## Instalar MCP no VS Code (1 comando)

No Windows, execute na raiz do repo:

- `powershell -ExecutionPolicy Bypass -File .\ops\scripts\install-pandora-mcp-vscode.ps1`

Opcional para abrir automaticamente o deep link de instalacao no VS Code:

- `powershell -ExecutionPolicy Bypass -File .\ops\scripts\install-pandora-mcp-vscode.ps1 -OpenInstallLink`

## Arquitetura

- `backend/AgenticTodoList.Api`: API principal com dominio e servicos REST
- `mcp-server-python`: servidor MCP oficial em Python (FastMCP) conectado a API REST e executado via Docker
- `backend/AgenticTodoList.Api.Tests`: testes xUnit
- `frontend`: dashboard web React
- `docker-compose.yml`: stack completa
- `ops/postgres/data`: dados persistidos do Postgres no host
- `ops/postgres/backups`: backups gerados no host (fora do Docker)
- `ops/scripts/backup-postgres.ps1`: script de backup no host
- `ops/scripts/restore-postgres.ps1`: script de restore no host

## Funcionalidades principais

### Scrum
- CRUD de projetos
- Backlog por projeto
- Criacao de sprint com itens de backlog selecionados
- Conversao automatica de backlog item para work item na sprint
- Atualizacao de status de task
- Reviews por sprint

### Pandora Knowledge
- Wiki por projeto
- Knowledge checkpoints (snapshot de contexto, decisoes, riscos, proximos passos)
- Log de execucoes de agentes
- Dashboard com metricas operacionais

### MCP para VS Code e apps agenticos

O servidor MCP roda em Python com SDK oficial FastMCP, publicado em HTTP pelo Docker Compose.

Setup rapido:
- `cd mcp-server-python`
- `python -m venv .venv`
- `. .venv/Scripts/activate`
- `pip install -r requirements.txt`

Endpoint MCP local:
- `http://127.0.0.1:8481/mcp`

Tools disponiveis:
- `project_list`
- `project_create`
- `project_delete` (soft delete por status)
- `backlog_add`
- `backlog_list`
- `sprint_create`
- `workitem_list`
- `workitem_update`
- `knowledge_checkpoint`

Prompts disponiveis:
- `pandora_project_create`
- `pandora_sprint_create`
- `pandora_resources_guide` (guia detalhado de todos os recursos da UI e mapeamento MCP/API)

Resources MCP (read-only para contexto de agentes):
- Diretos:
   - `pandora://about`
   - `pandora://projects/active`
   - `pandora://projects/all`
- Templates:
   - `pandora://projects/{project_id}/context`
   - `pandora://projects/{project_id}/dashboard`
   - `pandora://projects/{project_id}/backlog`
   - `pandora://projects/{project_id}/sprints`
   - `pandora://projects/{project_id}/workitems`
   - `pandora://projects/{project_id}/workitems/status/{status}`
   - `pandora://projects/{project_id}/sprints/{sprint_id}/workitems`
   - `pandora://projects/{project_id}/tasks/overview`
   - `pandora://projects/{project_id}/tasks/triage`
   - `pandora://projects/{project_id}/knowledge`

## Subir local sem Docker

1. Inicie um PostgreSQL local na porta 5432 com:
   - database: `pandora_todo_list`
   - user: `Pandora`
   - password: `Pandora`
2. Backend:
   - `cd backend/AgenticTodoList.Api`
   - `dotnet run`
3. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## Subir com Docker

- `docker compose up -d --build`

Portas publicadas no host (portas altas):
- PostgreSQL: `8432`
- API: `8480`
- Frontend: `8400`
- MCP: `8481` (`/mcp`)

## Backup fora do Docker (host)

Com stack ativa, execute:

- Backup:
   - `powershell -ExecutionPolicy Bypass -File .\ops\scripts\backup-postgres.ps1`
- Restore:
   - `powershell -ExecutionPolicy Bypass -File .\ops\scripts\restore-postgres.ps1 -FilePath .\ops\postgres\backups\NOME_ARQUIVO.sql`

Observacao: se Docker Desktop nao estiver em execucao no Windows, o compose falhara ao conectar no engine.

## Endpoints REST

- `GET /health`
- `GET /api/projects`
- `DELETE /api/projects/{projectId}`
- `POST /api/projects`
- `GET /api/projects/{projectId}/dashboard`
- `GET /api/projects/{projectId}/backlog`
- `POST /api/projects/{projectId}/backlog`
- `GET /api/projects/{projectId}/sprints`
- `POST /api/projects/{projectId}/sprints`
- `POST /api/work-items/{workItemId}/status`
- `POST /api/sprints/{sprintId}/reviews`
- `GET /api/projects/{projectId}/knowledge`
- `POST /api/projects/{projectId}/wiki`
- `POST /api/projects/{projectId}/checkpoints`
- `POST /api/projects/{projectId}/agent-runs`

## Testes

- `dotnet test AgenticTodoList.slnx`
- `dotnet test AgenticTodoList.slnx --collect:"XPlat Code Coverage"`

Status atual:
- Testes passando: 24/24
- Cobertura medida (line): 97.66%

## Sem fallback e sem mock

- Runtime usa apenas persistencia real no PostgreSQL
- Frontend consulta API real
- MCP Python opera diretamente sobre API e dados reais
- Nao ha camada de dados fake/mock no app em execucao

