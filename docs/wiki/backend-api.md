# Backend API (.NET)

## Papel

O backend é a **fonte da verdade** para projetos, backlog, sprints, work items, reviews, wiki, checkpoints e logs de execução de agentes. Expõe OpenAPI (Swagger) em desenvolvimento e aplica migrações EF Core no startup (exceto ambiente de testes).

## Stack

- **.NET** (versão alinhada ao repositório; ver `AgenticTodoList.Api.csproj`)
- **PostgreSQL** via Npgsql + Entity Framework Core
- **Serviços principais:** `ScrumService`, `ApiKeyService`, `MetricsEventService`, `DevLakeSyncService`, `DevLakeSyncWorker` (hosted)

## Domínio (resumo)

Entidades centrais incluem: `Project`, `BacklogItem` (tags, wiki refs, constraints), `Sprint`, `WorkItem` (sub-tasks recursivas, branch, feedback, tokens), `Review`, `WikiPage`, `KnowledgeCheckpoint`, `AgentRunLog`, e entidades de métricas/DevLake conforme migrações.

## Endpoints representativos

- Saúde: `GET /health`
- Projetos e config: `GET/POST/PATCH/DELETE /api/projects`, `PATCH /api/projects/{id}/config` (GitHub URL, `localPath`, `techStack`, `mainBranch`)
- Backlog e contexto: `GET/POST` backlog, `PATCH /api/backlog-items/{id}/context`
- Sprints e work items: criação de sprint, status, sub-tasks, reviews
- Conhecimento: wiki, checkpoints, agent runs
- Métricas em tempo real e integração DevLake (serviços internos + worker)

A lista completa está no [README principal](../../README.md) na secção REST API.

## Integrações

- **CORS:** origens configuráveis (`Cors:AllowedOrigins` / `FRONTEND_ORIGINS`), padrão inclui o frontend em `8400`.
- **DevLake:** cliente HTTP nomeado `devlake`; worker em background sincroniza quando configurado.
- **API keys:** serviço singleton para RBAC quando aplicável (ver código e testes).

## Testes

Projeto `AgenticTodoList.Api.Tests`: testes de integração contra PostgreSQL real (sem mocks de persistência no fluxo principal). Comando: `dotnet test` na solução.

## Onde aprofundar

- `Program.cs` — mapeamento de rotas e DI
- `Domain/` e `Data/AppDbContext.cs` — modelo
- `Services/` — regras de negócio e sync
