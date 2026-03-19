# Agentic TodoList Scrum Platform

Plataforma completa para gestao de desenvolvimento de software com foco em uso humano + IA:

- Backend: .NET 10 Web API com PostgreSQL real (EF Core)
- Frontend: React + TypeScript
- Protocolo agentico: endpoint MCP (JSON-RPC) para integracao com apps agenticos, especialmente VS Code
- Metodologia: estrutura Scrum (projeto, backlog, sprint, tasks, review)
- Knowledge hub: wiki, checkpoints de contexto, historico de execucoes agenticas
- Operacao: Docker Compose com persistencia e backup em disco local

## Arquitetura

- `backend/AgenticTodoList.Api`: API principal com dominio, servicos e MCP
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

### Agentic Knowledge
- Wiki por projeto
- Knowledge checkpoints (snapshot de contexto, decisoes, riscos, proximos passos)
- Log de execucoes de agentes
- Dashboard com metricas operacionais

### MCP para VS Code e apps agenticos
Endpoint:
- `POST /mcp`

Metodos:
- `tools/list`
- `tools/call`

Tools disponiveis:
- `project.list`
- `project.create`
- `backlog.add`
- `sprint.create`
- `knowledge.checkpoint`

## Subir local sem Docker

1. Inicie um PostgreSQL local na porta 5432 com:
   - database: `agentic_todolist`
   - user: `agentic`
   - password: `agentic`
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
- PostgreSQL: `55432`
- API: `58080`
- Frontend: `53000`

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
- MCP opera diretamente sobre dados reais
- Nao ha camada de dados fake/mock no app em execucao
