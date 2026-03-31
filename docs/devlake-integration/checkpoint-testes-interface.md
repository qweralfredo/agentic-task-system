# Checkpoint — Testes de Interface (Playwright / Chrome DevTools)

> Gerado em: 2026-03-24 | Referência: BL-19 E2E Testing Suite
> Parent work item: `e0819111-8397-41bc-ad38-9d74ca1f788e`

---

## Objetivo

Validação visual de todas as funcionalidades implementadas na integração DevLake.
Cada sub-task deve ser executada com **Playwright MCP** ou **Chrome DevTools** conforme indicado.

---

## Pré-requisitos

```bash
# Stack completa rodando
docker compose --profile devlake up -d

# Verificar serviços
docker compose ps

# URLs base
# Frontend:    http://localhost:8400
# API:         http://localhost:8500
# Grafana:     http://localhost:3002  (admin/pandora)
# DevLake UI:  http://localhost:4000
```

---

## ST-01 — Frontend: Kanban board carrega work items

**Ferramenta:** Playwright MCP
**URL:** `http://localhost:8400`

**Passos:**
1. Navegar para `http://localhost:8400`
2. Verificar que a lista de projetos renderiza sem erros de console
3. Selecionar um projeto com work items
4. Verificar que o kanban/backlog exibe cards com título, status e assignee
5. Verificar que a ordenação alfabética está ativa (implementada em commit `084df43`)

**Critérios de aceitação:**
- [ ] Página carrega sem erros 4xx/5xx no console
- [ ] Work items aparecem com status visível (Todo/InProgress/Done)
- [ ] Sem erros de JavaScript no console

---

## ST-02 — Frontend: TokenInsightsPage exibe métricas

**Ferramenta:** Playwright MCP
**URL:** `http://localhost:8400/token-insights` (ou rota equivalente)

**Passos:**
1. Navegar para a página de Token Insights
2. Verificar que os dados de `GET /api/projects/{id}/metrics/token-summary` são exibidos
3. Verificar campos: totalRuns, successRate, totalCostUsd, byModel
4. Verificar que o cost-budget mostra alertLevel (ok/warning/critical)

**Critérios de aceitação:**
- [ ] Componente `TokenInsightsPage` renderiza sem erro
- [ ] Dados de API aparecem (ou loader/empty state adequado)
- [ ] AlertLevel exibe cor correta (verde=ok, amarelo=warning, vermelho=critical)

---

## ST-03 — Grafana: AI Dev Overview — painéis visíveis

**Ferramenta:** Playwright MCP
**URL:** `http://localhost:3002/d/pandora-ai-overview`

**Passos:**
1. Fazer login no Grafana (`admin` / senha configurada)
2. Navegar para o dashboard `pandora-ai-overview`
3. Aguardar carregamento dos painéis (máx 10s)
4. Verificar que os 6 painéis estão visíveis (sem "No data" crítico)

**Critérios de aceitação:**
- [ ] Dashboard carrega sem erro 404
- [ ] Painéis: Agent Runs, Token Usage, Success Rate, Cost Efficiency visíveis
- [ ] Nenhum painel com ícone de erro vermelho

---

## ST-04 — Grafana: Human Evaluation Board — scores renderizam

**Ferramenta:** Playwright MCP
**URL:** `http://localhost:3002/d/pandora-human-eval`

**Passos:**
1. Navegar para `pandora-human-eval`
2. Verificar painéis: Review Queue, Quality Scores, Feedback Distribution
3. Verificar que template variable `$project` está disponível
4. Verificar painel de leaderboard de revisores

**Critérios de aceitação:**
- [ ] Dashboard `pandora-human-eval` carrega
- [ ] Painel "Review Queue" visível
- [ ] Template variable dropdown presente no topo

---

## ST-05 — Grafana: DORA Metrics — 4 métricas visíveis

**Ferramenta:** Playwright MCP
**URL:** `http://localhost:3002/d/pandora-dora-metrics`

**Passos:**
1. Navegar para `pandora-dora-metrics`
2. Verificar os 4 painéis stat no topo: Deployment Frequency, Lead Time, MTTR, Change Failure Rate
3. Verificar timeseries de tendência
4. Verificar benchmark vs DORA elite

**Critérios de aceitação:**
- [ ] Dashboard carrega com 4 stat panels no topo
- [ ] Painéis exibem thresholds de cor (verde/amarelo/vermelho)
- [ ] Timeseries renderiza eixo de tempo correto

---

## ST-06 — Grafana: Token Cost Analytics — budget e custo

**Ferramenta:** Playwright MCP
**URL:** `http://localhost:3002/d/pandora-token-cost`

**Passos:**
1. Navegar para `pandora-token-cost`
2. Verificar painel de Budget Alert (gauge)
3. Verificar Cost per Project (timeseries)
4. Verificar Model Cost Comparison (barchart)
5. Verificar ROI metrics panel

**Critérios de aceitação:**
- [ ] Gauge de budget exibe percentual de uso
- [ ] Barchart de comparação de modelos presente
- [ ] Sem erros de datasource no painel

---

## ST-07 — Grafana: Code Quality — PR metrics e leaderboard

**Ferramenta:** Playwright MCP
**URL:** `http://localhost:3002/d/pandora-code-quality`

**Passos:**
1. Navegar para `pandora-code-quality`
2. Verificar 4 stat panels: Avg PR Review Time, Review Cycles, Lines Changed, Stale PRs
3. Verificar timeseries de Lead Time Trend
4. Verificar tabela de PR Review Efficiency by Author
5. Verificar template variable `$repo` no topo

**Critérios de aceitação:**
- [ ] 4 stat panels visíveis com thresholds de cor
- [ ] Tabela com colunas: Author, PRs Merged, Avg Lead Time, Review Cycles
- [ ] Variable `$repo` presente e selecionável

---

## ST-08 — Grafana: ML Performance — leaderboard e drift

**Ferramenta:** Playwright MCP
**URL:** `http://localhost:3002/d/pandora-ml-performance`

**Passos:**
1. Navegar para `pandora-ml-performance`
2. Verificar stat panel: Avg Latency, Success Rate, Max Latency Drift
3. Verificar timeseries de Latency Trend by Model
4. Verificar tabela ML Model Leaderboard ordenada por latência

**Critérios de aceitação:**
- [ ] Stat panel de Drift exibe threshold vermelho se > 15%
- [ ] Tabela leaderboard ordenada por Avg Latency asc
- [ ] Timeseries com legenda de modelos

---

## ST-09 — API: SSE conecta e recebe evento "connected"

**Ferramenta:** Chrome DevTools (Network tab) ou Playwright
**URL:** `http://localhost:8500/api/metrics/stream`

**Passos:**

*Com Chrome DevTools:*
1. Abrir DevTools → Network → Filter: `EventSource`
2. Navegar para `http://localhost:8500/api/metrics/stream` com header `Accept: text/event-stream`
3. Verificar conexão persistente (status 200, não fecha)
4. Verificar primeiro evento recebido: `event: connected`

*Com Playwright:*
```javascript
// Verificar SSE no contexto de página
const response = await page.request.get('/api/metrics/stream', {
  headers: { 'Accept': 'text/event-stream' }
});
expect(response.status()).toBe(200);
expect(response.headers()['content-type']).toContain('text/event-stream');
```

**Critérios de aceitação:**
- [ ] Status 200 com Content-Type `text/event-stream`
- [ ] Primeiro chunk contém `event: connected`
- [ ] Conexão mantém keep-alive (`: keep-alive` a cada 15s)

---

## ST-10 — API: Token Summary retorna estrutura correta

**Ferramenta:** Chrome DevTools (Fetch) ou Playwright

**Passos:**

*Com Chrome DevTools Console:*
```javascript
const r = await fetch('/api/projects/<project-id>/metrics/token-summary');
const d = await r.json();
console.log(d);
// Verificar: totalRuns, successRate, byModel[], dailyRollup[]
```

*Com Playwright:*
```javascript
const r = await page.request.get(`/api/projects/${projectId}/metrics/token-summary`);
const body = await r.json();
expect(body).toHaveProperty('totalRuns');
expect(body).toHaveProperty('byModel');
expect(body).toHaveProperty('dailyRollup');
```

**Critérios de aceitação:**
- [ ] Status 200
- [ ] Body contém `totalRuns`, `successRate`, `totalCostUsd`
- [ ] `byModel` é array (pode ser vazio)
- [ ] `dailyRollup` é array com `date`, `runs`, `totalCostUsd`

---

## ST-11 — API: Endpoints protegidos retornam 401 sem API key

**Ferramenta:** Chrome DevTools (Fetch) ou Playwright

**Passos:**

*Com Chrome DevTools Console:*
```javascript
// Sem API key → 401
const r1 = await fetch('/api/devlake/sync/status');
console.log(r1.status); // esperado: 401

// Com API key → 200
const r2 = await fetch('/api/devlake/sync/status', {
  headers: { 'X-Pandora-Api-Key': '<sua-api-key>' }
});
console.log(r2.status); // esperado: 200
```

**Critérios de aceitação:**
- [ ] `GET /api/devlake/sync/status` sem header → 401
- [ ] `GET /api/devlake/sync/status` com header correto → 200
- [ ] `GET /api/projects/{id}/audit-log` sem header → 401
- [ ] Response body do 401 não vaza informações sensíveis

---

## ST-12 — DevLake: Config UI acessível e connector visível

**Ferramenta:** Playwright MCP
**URL:** `http://localhost:4000`

**Passos:**
1. Navegar para `http://localhost:4000`
2. Verificar que a Config UI do DevLake carrega
3. Navegar para Connections → GitHub
4. Verificar que a conexão GitHub está configurada
5. Verificar que o Blueprint de coleta existe

**Critérios de aceitação:**
- [ ] Config UI abre sem erro (não tela em branco)
- [ ] Menu de navegação principal visível
- [ ] Conexão GitHub listada em Connections
- [ ] Blueprint com schedule `0 */6 * * *` configurado

---

## Resumo das Sub-Tasks

| ID | Área | Ferramenta | BL Referência |
|----|------|------------|---------------|
| ST-01 | Frontend Kanban | Playwright | BL-01/BL-02 |
| ST-02 | Frontend TokenInsights | Playwright | BL-07 |
| ST-03 | Grafana AI Overview | Playwright | BL-10 |
| ST-04 | Grafana Human Eval | Playwright | BL-11 |
| ST-05 | Grafana DORA | Playwright | BL-12 |
| ST-06 | Grafana Token Cost | Playwright | BL-07/BL-09 |
| ST-07 | Grafana Code Quality | Playwright | BL-09 |
| ST-08 | Grafana ML Performance | Playwright | BL-17 |
| ST-09 | API SSE Stream | DevTools/Playwright | BL-13 |
| ST-10 | API Token Summary | DevTools/Playwright | BL-07 |
| ST-11 | API Auth/401 | DevTools/Playwright | BL-14/BL-16 |
| ST-12 | DevLake Config UI | Playwright | BL-01/BL-04 |

---

## Ordem de Execução Recomendada

```
1. Verificar infra (docker compose ps) → todos services healthy
2. ST-12 (DevLake UI) → valida que stack está funcionando
3. ST-03 a ST-08 (Grafana dashboards) → podem ser executados em paralelo
4. ST-09, ST-10, ST-11 (API endpoints) → independentes
5. ST-01, ST-02 (Frontend) → dependem do frontend estar rodando
```
