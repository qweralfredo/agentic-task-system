## 📋 Backlog

### Epic: Plataforma Agentica de TodoList Scrum com MCP

#### 🟦 Story 1: Estruturar backend .NET com domínio Scrum e persistência real
- [ ] Task 1.1 — Modelar entidades de projeto, backlog, sprint, task e review
- [ ] Task 1.2 — Configurar EF Core com PostgreSQL (sem mocks)
- [ ] Task 1.3 — Expor API REST para CRUD e fluxo Scrum

#### 🟦 Story 2: Integrar capacidades agenticas e MCP
- [ ] Task 2.1 — Expor endpoint MCP para tools/list e tools/call
- [ ] Task 2.2 — Incluir contexto de IA: wiki, checkpoints, onboarding e base de conhecimento
- [ ] Task 2.3 — Registrar logs de execução agentica por projeto

#### 🟦 Story 3: Construir dashboard React para humanos
- [ ] Task 3.1 — Tela de overview de projetos e métricas de sprint
- [ ] Task 3.2 — Tela de backlog/sprint board
- [ ] Task 3.3 — Tela de knowledge hub (wiki, checkpoints, onboarding)

#### 🟦 Story 4: Operação com Docker, backup e confiabilidade
- [ ] Task 4.1 — Subir app+db com docker compose
- [ ] Task 4.2 — Persistir dados e backups em disco local
- [ ] Task 4.3 — Documentar restore e operação

---

## 🏃 Sprint 1 — Escopo

- [ ] Task 1.1
- [ ] Task 1.2
- [ ] Task 1.3
- [ ] Task 2.1
- [ ] Task 2.2
- [ ] Task 3.1
- [ ] Task 3.2
- [ ] Task 3.3
- [ ] Task 4.1
- [ ] Task 4.2
- [ ] Task 4.3

**Critérios de aceite:**
- [ ] Cobertura de testes >= 80%
- [ ] Todos os testes passando
- [ ] Validação E2E (API e UI) executada
- [ ] Sem fallback e sem mock em runtime
