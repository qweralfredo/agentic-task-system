## 📋 Backlog

### Epic: Plataforma Agentica de TodoList Scrum com MCP

#### 🟦 Story 1: Estruturar backend .NET com domínio Scrum e persistência real
- [x] Task 1.1 — Modelar entidades de projeto, backlog, sprint, task e review
- [x] Task 1.2 — Configurar EF Core com PostgreSQL (sem mocks)
- [x] Task 1.3 — Expor API REST para CRUD e fluxo Scrum

#### 🟦 Story 2: Integrar capacidades agenticas e MCP
- [x] Task 2.1 — Expor endpoint MCP para tools/list e tools/call
- [x] Task 2.2 — Incluir contexto de IA: wiki, checkpoints, onboarding e base de conhecimento
- [x] Task 2.3 — Registrar logs de execução agentica por projeto

#### 🟦 Story 3: Construir dashboard React para humanos
- [x] Task 3.1 — Tela de overview de projetos e métricas de sprint
- [x] Task 3.2 — Tela de backlog/sprint board
- [x] Task 3.3 — Tela de knowledge hub (wiki, checkpoints, onboarding)

#### 🟦 Story 4: Operação com Docker, backup e confiabilidade
- [x] Task 4.1 — Subir app+db com docker compose
- [x] Task 4.2 — Persistir dados e backups em disco local
- [x] Task 4.3 — Documentar restore e operação

---

## 🏃 Sprint 1 — Escopo

- [x] Task 1.1
- [x] Task 1.2
- [x] Task 1.3
- [x] Task 2.1
- [x] Task 2.2
- [x] Task 3.1
- [x] Task 3.2
- [x] Task 3.3
- [x] Task 4.1
- [x] Task 4.2
- [x] Task 4.3

**Critérios de aceite:**
- [x] Cobertura de testes >= 80%
- [x] Todos os testes passando
- [x] Validação E2E (API e UI) executada
- [x] Sem fallback e sem mock em runtime
