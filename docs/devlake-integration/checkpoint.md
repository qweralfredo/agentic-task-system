# DevLake Integration — Checkpoint de Planejamento
> Complexity C=2 | Gerado em: 2026-03-24 | Projeto: code-agent (Pandora ID: d73ba2b0)

---

## Estrutura Hierárquica (C=2)

| Nível | Fórmula | Total |
|-------|---------|-------|
| Backlogs | 10 × 2 | **20** |
| Sprints | 7 × 2 | **14** (total do projeto) |
| Tasks | 3 × 2 | **6** por Sprint → 84 total |
| Subtasks | 4 × 2 | **8** por Task → 672 total |

---

## BACKLOGS (20)

| ID | Título | Prioridade | Story Points | Sprint(s) |
|----|--------|-----------|--------------|-----------|
| BL-01 | DevLake Infrastructure & Docker Compose | Critical | 13 | SP-01 |
| BL-02 | DevLake Data Source Connectors Configuration | Critical | 8 | SP-01 |
| BL-03 | Pandora Custom Plugin for DevLake | High | 21 | SP-02 |
| BL-04 | GitHub Integration via DevLake API | High | 8 | SP-02 |
| BL-05 | AI Agent Metrics Collection Pipeline | High | 13 | SP-03 |
| BL-06 | Human Evaluation Framework | High | 13 | SP-03 |
| BL-07 | Token & Cost Analytics Pipeline | Medium | 8 | SP-04, SP-09 |
| BL-08 | Sprint Velocity & Burndown Metrics | Medium | 8 | SP-04 |
| BL-09 | Code Quality & Review Metrics | Medium | 8 | SP-08 |
| BL-10 | Grafana Dashboard — AI Dev Overview | Critical | 13 | SP-05 |
| BL-11 | Grafana Dashboard — Human Evaluation Board | Critical | 13 | SP-06 |
| BL-12 | Grafana Dashboard — DORA Operational Metrics | High | 8 | SP-07 |
| BL-13 | DevLake Real-time Integration Layer | Medium | 13 | SP-10 |
| BL-14 | DevLake Authentication & RBAC | High | 8 | SP-11 |
| BL-15 | Pandora API ↔ DevLake Sync Service | High | 13 | SP-12 |
| BL-16 | DevLake Webhook & Event System | Medium | 8 | SP-10 |
| BL-17 | ML Model Performance Tracking | Medium | 8 | SP-13 |
| BL-18 | DevLake Data Transformation & Normalization | Medium | 8 | SP-04 |
| BL-19 | E2E Testing Suite — DevLake Integration | High | 13 | SP-14 |
| BL-20 | Documentation, Wiki & Knowledge Checkpoints | Medium | 5 | SP-14 |

---

## SPRINTS (14)

### SP-01 — DevLake Foundation
**Período:** 2026-03-25 → 2026-04-07
**Goal:** Infraestrutura DevLake funcional com Docker Compose, MySQL, Grafana e conectores básicos
**Backlogs:** BL-01, BL-02

| Task | Título |
|------|--------|
| T-01-1 | Adicionar serviços DevLake ao docker-compose.yml (devlake, mysql, grafana, lake-ui) |
| T-01-2 | Configurar MySQL 8 dedicado para DevLake com volumes e healthcheck |
| T-01-3 | Configurar Grafana com DevLake datasource e provisioning automático |
| T-01-4 | Criar networking, healthchecks e dependências no Docker Compose |
| T-01-5 | Script de inicialização e seed do DevLake (env.dev, .env.example) |
| T-01-6 | Configurar GitHub connector via DevLake REST API |

**Subtasks T-01-1:**
- ST-01-1-1: Definir imagem devlake/lake:latest com versão fixada
- ST-01-1-2: Configurar porta 8082 (DevLake API) e 4000 (Config UI)
- ST-01-1-3: Adicionar volume persistente para DevLake data
- ST-01-1-4: Configurar environment variables MYSQL_URL, NOTIFICATION_ENDPOINT
- ST-01-1-5: Mapear porta Grafana 3002:3000 (evitar conflito)
- ST-01-1-6: Adicionar service devlake-lake-ui na porta 4000
- ST-01-1-7: Configurar depend_on com condition: service_healthy para mysql
- ST-01-1-8: Escrever smoke test: curl http://localhost:8082/api/version

**Subtasks T-01-2:**
- ST-01-2-1: Imagem mysql:8.0 com charset utf8mb4
- ST-01-2-2: Volume ops/devlake/mysql/data para persistência
- ST-01-2-3: Healthcheck: mysqladmin ping
- ST-01-2-4: Variáveis MYSQL_ROOT_PASSWORD, MYSQL_DATABASE=lake
- ST-01-2-5: Script init.sql para criação de banco e usuário
- ST-01-2-6: Configurar max_connections=200 via my.cnf
- ST-01-2-7: Teste de conectividade do DevLake ao MySQL
- ST-01-2-8: Documentar credenciais no .env.example

**Subtasks T-01-3:**
- ST-01-3-1: Imagem grafana/grafana-oss:10.x
- ST-01-3-2: Provisioning datasource devlake via YAML (grafana/provisioning/datasources/)
- ST-01-3-3: Provisioning de dashboards via YAML (grafana/provisioning/dashboards/)
- ST-01-3-4: Volume ops/devlake/grafana/data
- ST-01-3-5: Configurar GF_INSTALL_PLUGINS=grafana-piechart-panel
- ST-01-3-6: Admin credentials via env (GF_SECURITY_ADMIN_PASSWORD)
- ST-01-3-7: Anonymous access disabled, RBAC habilitado
- ST-01-3-8: Health check: curl http://localhost:3002/api/health

**Subtasks T-01-4:**
- ST-01-4-1: Criar docker network: pandora-devlake-net
- ST-01-4-2: Conectar serviços existentes (api, frontend, mcp) à nova network
- ST-01-4-3: Healthcheck intervalo 30s, retries 5 para devlake
- ST-01-4-4: Ordem: mysql → devlake → grafana → lake-ui
- ST-01-4-5: Configurar restart: unless-stopped em todos serviços DevLake
- ST-01-4-6: Testar docker compose up --profile devlake
- ST-01-4-7: Criar profile "devlake" para composição opcional
- ST-01-4-8: Validar que serviços existentes continuam funcionando

**Subtasks T-01-5:**
- ST-01-5-1: Criar scripts/devlake-init.sh para seed inicial
- ST-01-5-2: Script de geração de .env.devlake a partir de .env.example
- ST-01-5-3: Criar ops/devlake/ com subpastas: mysql/, grafana/, config/
- ST-01-5-4: README em ops/devlake/ com instruções de setup
- ST-01-5-5: Criar .gitignore para ops/devlake/mysql/data e ops/devlake/grafana/data
- ST-01-5-6: Makefile target: make devlake-up, make devlake-down
- ST-01-5-7: Variáveis de ambiente documentadas com descrição e valor default
- ST-01-5-8: Validação de pré-requisitos: Docker ≥24, RAM ≥4GB

**Subtasks T-01-6:**
- ST-01-6-1: Gerar GitHub Personal Access Token com scopes: repo, read:user
- ST-01-6-2: POST /api/plugins/github/connections via DevLake API
- ST-01-6-3: Criar blueprint para coleta de PRs, commits, issues
- ST-01-6-4: Configurar conexão para repositório qweralfredo/agentic-task-system
- ST-01-6-5: Trigger manual de coleta via DevLake API
- ST-01-6-6: Verificar dados no MySQL: tabela github_pull_requests
- ST-01-6-7: Criar Grafana panel simples para validar dados GitHub
- ST-01-6-8: Armazenar token via docker secret ou env criptografado

---

### SP-02 — Pandora Plugin & GitHub Integration
**Período:** 2026-04-08 → 2026-04-21
**Goal:** Plugin customizado do DevLake para Pandora e integração GitHub completa
**Backlogs:** BL-03, BL-04

| Task | Título |
|------|--------|
| T-02-1 | Estrutura base do plugin DevLake para Pandora (Go module) |
| T-02-2 | Implementar Collector de Projects e Backlog Items |
| T-02-3 | Implementar Collector de Sprints e Work Items |
| T-02-4 | Mapeamento de entidades Pandora → schema DevLake (issues, boards) |
| T-02-5 | GitHub repository connector: PRs, commits, reviews |
| T-02-6 | Testes unitários e integração do plugin Pandora |

**Subtasks por Task (resumo):**
- T-02-1: init Go module, plugin interface, ApiClient Pandora, config struct, Dockerfile, makefile build, lint, CI workflow
- T-02-2: HTTP collector tasks, rate limiting, pagination, backlog_items table schema, incremental sync, error handling, unit tests, mock API
- T-02-3: sprint_items table, workitem status mapping, story_points extraction, agent_runs collection, velocity calc, subtasks collection, batch upsert, integration test
- T-02-4: Map Pandora backlog → DevLake Issue, Map Sprint → DevLake Board/Sprint, status enum translation, priority mapping, assignee normalization, custom fields, changelog events, schema migration
- T-02-5: GitHub API auth via connector, PR data → pull_requests table, commit → commits table, review → reviews table, label extraction, time-to-merge calc, reopen detection, webhook config
- T-02-6: Unit tests ≥80% coverage, mock DevLake datasource, integration test with live API, CI/CD pipeline, plugin binary artifact, smoke test em staging, documentation, changelog

---

### SP-03 — Metrics Collection
**Período:** 2026-04-22 → 2026-05-05
**Goal:** Pipeline de coleta de métricas IA e framework de avaliação humana operacionais
**Backlogs:** BL-05, BL-06

| Task | Título |
|------|--------|
| T-03-1 | Schema de métricas para agent runs no Pandora API |
| T-03-2 | Collector de tokens, model usage e latência por run |
| T-03-3 | API endpoints para submissão de avaliação humana |
| T-03-4 | Schema de scoring, feedback e rating de outputs IA |
| T-03-5 | Pipeline de processamento e agregação de métricas |
| T-03-6 | DevLake transformation rules para métricas IA |

**Subtasks por Task (resumo):**
- T-03-1: EF migration AgentRun entity, tokens_input/output fields, model_name, latency_ms, success bool, error_message, project_id FK, created_at, API DTO
- T-03-2: Background collector service, batch insert agent_runs, rate window aggregation, percentile calculations (p50/p95/p99), model cost table, daily rollups, alertas threshold, unit tests
- T-03-3: POST /api/evaluations endpoint, validation DTO, score 1-5 scale, categories enum (accuracy/relevance/safety/completeness), reviewer_id, work_item_id FK, timestamp, Swagger docs
- T-03-4: EvaluationScore entity, aggregate score calc, category weights, feedback text field, requires_review flag, escalation rules, EF migration, seed data para testes
- T-03-5: .NET BackgroundService para pipeline, queue-based processing, retry com exponential backoff, dead letter queue, metrics_daily rollup table, pipeline health endpoint, Prometheus metrics export, tests
- T-03-6: DevLake custom_metrics table, transformation SQL pandora_agent_runs → devlake_metrics, cron schedule via DevLake blueprint, metric type registry, Grafana variable template, validation queries, documentation

---

### SP-04 — Data Pipeline & ETL
**Período:** 2026-05-06 → 2026-05-19
**Goal:** Pipeline ETL completo para sincronização e normalização de todos os dados
**Backlogs:** BL-07, BL-08, BL-18

| Task | Título |
|------|--------|
| T-04-1 | Pipeline de custo e tokens agregado por projeto/agent |
| T-04-2 | Sprint velocity metrics collector e calculadora |
| T-04-3 | Burndown chart data pipeline e projeção |
| T-04-4 | ETL transformations: normalização para schema DevLake |
| T-04-5 | Agendador de coleta de dados (scheduler service) |
| T-04-6 | Validação, testes e monitoramento do pipeline ETL |

---

### SP-05 — AI Dev Overview Dashboard
**Período:** 2026-05-20 → 2026-06-02
**Goal:** Dashboard Grafana completo de visão geral de desenvolvimento com IA
**Backlogs:** BL-10

| Task | Título |
|------|--------|
| T-05-1 | Configurar datasource DevLake no Grafana via provisioning |
| T-05-2 | Panel: Agent Runs Overview (total, success rate, trend) |
| T-05-3 | Panel: Token Usage Over Time (heatmap + linha temporal) |
| T-05-4 | Panel: Success Rate by Model (comparativo de modelos) |
| T-05-5 | Panel: Cost Efficiency Metrics (custo/task, ROI estimado) |
| T-05-6 | Provisioning automático e import/export JSON dashboard |

---

### SP-06 — Human Evaluation Dashboard
**Período:** 2026-06-03 → 2026-06-16
**Goal:** Dashboard completo de avaliação humana de outputs de IA
**Backlogs:** BL-11

| Task | Título |
|------|--------|
| T-06-1 | Panel: Human Review Queue (pendentes por categoria) |
| T-06-2 | Panel: Quality Scores Over Time (média móvel 7/30 dias) |
| T-06-3 | Panel: Feedback Distribution (pizza por categoria) |
| T-06-4 | Panel: Human vs AI Agreement Rate (correlação) |
| T-06-5 | Panel: Evaluator Performance (leaderboard revisores) |
| T-06-6 | Alertas Grafana para outputs com score < 3 |

---

### SP-07 — DORA Metrics Dashboard
**Período:** 2026-06-17 → 2026-06-30
**Goal:** Dashboard DORA metrics via DevLake + GitHub
**Backlogs:** BL-12

| Task | Título |
|------|--------|
| T-07-1 | Panel: Deployment Frequency (por semana/mês) |
| T-07-2 | Panel: Lead Time for Changes (commit → production) |
| T-07-3 | Panel: Mean Time to Recovery (MTTR) |
| T-07-4 | Panel: Change Failure Rate (% deploys com rollback) |
| T-07-5 | Integração GitHub Actions → DevLake para deployment events |
| T-07-6 | Benchmark comparativo: DORA elite vs current state |

---

### SP-08 — Code Quality Dashboard
**Período:** 2026-07-01 → 2026-07-14
**Goal:** Dashboard de qualidade de código e review metrics
**Backlogs:** BL-09

| Task | Título |
|------|--------|
| T-08-1 | PR Review Time metrics (first review, approval, merge) |
| T-08-2 | Code Churn analysis (additions/deletions por sprint) |
| T-08-3 | Defect Density tracking (bugs por KLOC) |
| T-08-4 | Panel: Code Review Efficiency (review cycles, comments) |
| T-08-5 | Panel: Technical Debt Indicators (stale PRs, reverts) |
| T-08-6 | Correlação: AI assistance vs redução de defects |

---

### SP-09 — Token Cost Analytics Dashboard
**Período:** 2026-07-15 → 2026-07-28
**Goal:** Dashboard analítico completo de custos e tokens IA
**Backlogs:** BL-07

| Task | Título |
|------|--------|
| T-09-1 | Panel: Cost per Project (por dia/semana/mês) |
| T-09-2 | Panel: Cost per Agent Run (breakdown detalhado) |
| T-09-3 | Panel: Model Cost Comparison (claude vs gpt vs ollama) |
| T-09-4 | Budget alerts e thresholds configuráveis |
| T-09-5 | ROI metrics: tokens → tasks completadas |
| T-09-6 | Export de relatórios CSV/PDF via Grafana |

---

### SP-10 — Real-time Integration & Webhooks
**Período:** 2026-07-29 → 2026-08-11
**Goal:** Integração em tempo real via webhooks e Server-Sent Events
**Backlogs:** BL-13, BL-16

| Task | Título |
|------|--------|
| T-10-1 | DevLake webhook endpoint no Pandora API (.NET) |
| T-10-2 | Event schema para workitem updates e agent runs |
| T-10-3 | SSE endpoint /api/metrics/stream para live data |
| T-10-4 | Frontend: componente LiveMetricsPanel com SSE |
| T-10-5 | Retry logic & dead-letter queue para webhooks |
| T-10-6 | Load testing: 100 eventos/seg via k6 |

---

### SP-11 — Auth & Security
**Período:** 2026-08-12 → 2026-08-25
**Goal:** Autenticação, RBAC e hardening de segurança completos
**Backlogs:** BL-14

| Task | Título |
|------|--------|
| T-11-1 | Configurar autenticação DevLake (API Key + Basic Auth) |
| T-11-2 | RBAC para dashboards Grafana (viewer/editor/admin) |
| T-11-3 | API key management para DevLake connectors |
| T-11-4 | Auditoria de acesso e logs estruturados |
| T-11-5 | Secrets management via Docker secrets / env vault |
| T-11-6 | Security scan (Trivy para containers, OWASP ZAP para APIs) |

---

### SP-12 — Bidirectional Sync Service
**Período:** 2026-08-26 → 2026-09-08
**Goal:** Serviço .NET de sincronização bidirecional Pandora ↔ DevLake
**Backlogs:** BL-15

| Task | Título |
|------|--------|
| T-12-1 | DevLakeSyncWorker: .NET BackgroundService |
| T-12-2 | Mapeamento bidirecional de entidades (Pandora ↔ DevLake) |
| T-12-3 | Conflict resolution: last-write-wins com timestamp |
| T-12-4 | Sync scheduling: cron via Quartz.NET |
| T-12-5 | Error handling, retry exponencial e circuit breaker |
| T-12-6 | Testes de integração com DevLake real + mock |

---

### SP-13 — ML Model Performance Tracking
**Período:** 2026-09-09 → 2026-09-22
**Goal:** Sistema completo de tracking de performance de modelos de linguagem
**Backlogs:** BL-17

| Task | Título |
|------|--------|
| T-13-1 | Schema de ML metrics: latency p50/p95/p99, throughput |
| T-13-2 | Hallucination rate tracker com baseline e drift detection |
| T-13-3 | Model comparison framework (A/B testing por projeto) |
| T-13-4 | Panel: ML Performance Leaderboard (ranking de modelos) |
| T-13-5 | Alertas de drift: degradação > 15% em 7 dias |
| T-13-6 | Pipeline de cálculo de accuracy via human evaluation scores |

---

### SP-14 — E2E Tests & Documentation
**Período:** 2026-09-23 → 2026-10-06
**Goal:** Suite E2E completa, documentação finalizada e knowledge checkpoint
**Backlogs:** BL-19, BL-20

| Task | Título |
|------|--------|
| T-14-1 | E2E: DevLake Docker startup e healthchecks |
| T-14-2 | E2E: Data pipeline end-to-end (Pandora → DevLake → Grafana) |
| T-14-3 | E2E: Dashboard rendering e data accuracy |
| T-14-4 | Documentação: DevLake Setup & Configuration Guide |
| T-14-5 | Documentação: Architecture Decision Records (ADRs) |
| T-14-6 | Knowledge checkpoint final + release notes |

---

## WIKI (10 páginas)

| ID | Título | Conteúdo |
|----|--------|----------|
| W-01 | DevLake Architecture Overview | Diagrama de arquitetura completo: DevLake + Pandora + Grafana. Data flow, componentes, ports |
| W-02 | Pandora ↔ DevLake Data Model | Mapeamento de entidades: BacklogItem→Issue, Sprint→Board, WorkItem→Task, AgentRun→CustomMetric |
| W-03 | DevLake Custom Plugin Guide | Como desenvolver e publicar o plugin Pandora para DevLake (Go module structure, APIs) |
| W-04 | Dashboard Design Decisions | Decisões de design dos dashboards: paleta de cores, thresholds, refresh rates, drill-down |
| W-05 | AI Metrics Schema Specification | Schema completo de métricas IA: campos, tipos, enums, cálculos de agregação |
| W-06 | Human Evaluation Framework Design | Design do sistema de avaliação humana: scoring rubric, workflow, SLA de revisão |
| W-07 | DORA Metrics Implementation | Como os 4 DORA metrics são calculados via DevLake + GitHub Actions |
| W-08 | Security & Authentication Architecture | RBAC, API keys, secrets management, audit logging para DevLake + Grafana |
| W-09 | Real-time Integration Design | Arquitetura SSE + Webhooks: event schema, retry policy, ordering guarantees |
| W-10 | ML Performance Tracking System | Metodologia de tracking de LLMs: métricas, baselines, drift detection, alertas |

---

## DOCUMENTATION (10 páginas)

| ID | Título | Tipo |
|----|--------|------|
| D-01 | DevLake Setup Guide | Setup/Installation |
| D-02 | Docker Compose Configuration Reference | Reference |
| D-03 | GitHub Connector Setup | How-to |
| D-04 | Pandora Plugin Installation Guide | How-to |
| D-05 | Grafana Dashboard Import Guide | How-to |
| D-06 | Token Analytics API Reference | API Reference |
| D-07 | Human Evaluation API Reference | API Reference |
| D-08 | Webhook Integration Guide | Integration Guide |
| D-09 | Troubleshooting Guide | Troubleshooting |
| D-10 | Performance Tuning Guide | Operations |

---

## KNOWLEDGE CHECKPOINTS (10)

| ID | Nome | Sprint de Origem |
|----|------|-----------------|
| KP-01 | DevLake Foundation Complete | SP-01 |
| KP-02 | Pandora Plugin Released | SP-02 |
| KP-03 | Metrics Collection Live | SP-03 |
| KP-04 | Data Pipeline Operational | SP-04 |
| KP-05 | Core AI & Human Eval Dashboards Live | SP-05, SP-06 |
| KP-06 | DORA & Code Quality Dashboards Live | SP-07, SP-08 |
| KP-07 | Real-time Integration Complete | SP-10 |
| KP-08 | Security Hardened & Sync Stable | SP-11, SP-12 |
| KP-09 | ML Performance Tracking Deployed | SP-13 |
| KP-10 | Project Complete — Full E2E Validated | SP-14 |

---

## Tecnologias DevLake

| Componente | Tecnologia | Porta |
|-----------|-----------|-------|
| DevLake API | devlake/lake:latest | 8082 |
| DevLake Config UI | devlake/config-ui:latest | 4000 |
| MySQL (DevLake) | mysql:8.0 | 3306 (interno) |
| Grafana | grafana/grafana-oss:10.x | 3002 |
| Pandora Plugin | Go 1.21, gorilla/mux | — |
| Sync Service | .NET 10 BackgroundService | — |
| Webhook Receiver | ASP.NET Core Minimal API | /api/devlake/webhook |
| SSE Endpoint | ASP.NET Core SSE | /api/metrics/stream |

---

## Status
- [x] Checkpoint.md criado (2026-03-24)
- [x] 20 Backlogs criados no Pandora MCP — Projeto: Todolist (f0b41abc)
- [x] 14 Sprints criadas no Pandora MCP (SP-01 a SP-14)
- [x] Tasks detalhadas documentadas neste checkpoint (SP-01 com subtasks completas)
- [x] 10 Wiki pages criadas no Pandora MCP (W-01 a W-10)
- [x] 10 Documentation pages criadas no Pandora MCP (D-01 a D-10)
- [x] 10 Knowledge Checkpoints criados no Pandora MCP (KP-01 a KP-10)
- [ ] Desenvolvimento iniciado (aguardando pandora-execute SP-01)

## Pandora MCP — IDs dos Backlogs (Projeto Todolist)

| BL | ID |
|----|----|
| BL-01 | 3b571ac0-d5a8-400f-90f9-5c9a39907d80 |
| BL-02 | 787b47f3-b610-4b7c-95d7-ee4e1d27b470 |
| BL-03 | 0811067b-8b02-4dc5-bbd8-b9af7d8e5c6e |
| BL-04 | 08470faa-da36-47ed-a504-513fe44c2185 |
| BL-05 | 6160174d-40ec-48e6-8838-799c6905d366 |
| BL-06 | cff202a2-c27b-4ea8-9761-807517162233 |
| BL-07 | a29afb2b-8602-4522-bdb4-38888aa92884 |
| BL-08 | 1d285a1c-187e-44da-9332-fb937cb17c3d |
| BL-09 | 1ee7a1e1-dc35-439a-a80b-fbf498de585a |
| BL-10 | 91eb0f44-557f-4005-997b-ed6cb40dc5c2 |
| BL-11 | 83c73510-b128-42ce-b018-d31c58c1890a |
| BL-12 | a5defddd-99fa-4510-9ff9-9d395a4cdfcc |
| BL-13 | b916d6d1-847e-40bd-a4d7-851c6df0efeb |
| BL-14 | 1608f48c-951b-4f61-9672-0055b133beaa |
| BL-15 | 14dc283c-f6b6-477b-aa91-133c0b0100f8 |
| BL-16 | e45fbdda-16ff-4d44-8b60-570c26a47889 |
| BL-17 | 97979b33-bcef-44a7-b8ea-6b17b84b3a88 |
| BL-18 | a68b1297-693c-479f-9192-2bd8b4f362ab |
| BL-19 | 4d1b251c-a832-49de-81b9-703eb145522d |
| BL-20 | 3c75b82f-aaf1-408f-aed5-1e52686d45c5 |
