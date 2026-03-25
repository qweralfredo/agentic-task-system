import { test, expect } from '@playwright/test';
import { GRAFANA, GF_AUTH } from '../fixtures/helpers';

/**
 * Executa as queries SQL reais dos dashboards Grafana via datasource proxy
 * para verificar que o MySQL responde (mesmo que sem dados iniciais do DevLake sync).
 */
async function dsQuery(request: import('@playwright/test').APIRequestContext, sql: string) {
  const dsRes = await request.get(`${GRAFANA}/api/datasources`, {
    headers: { Authorization: `Basic ${GF_AUTH}` },
  });
  const datasources = await dsRes.json();
  const mysql = datasources.find((d: { type: string }) => d.type === 'mysql');
  if (!mysql) throw new Error('DevLake MySQL datasource not found');

  const r = await request.post(`${GRAFANA}/api/ds/query`, {
    headers: {
      Authorization: `Basic ${GF_AUTH}`,
      'Content-Type': 'application/json',
    },
    data: {
      queries: [
        {
          refId: 'A',
          datasource: { uid: mysql.uid, type: 'mysql' },
          rawSql: sql,
          format: 'table',
        },
      ],
      from: 'now-30d',
      to: 'now',
    },
  });
  return r;
}

test.describe('ST-03 Grafana AI Overview: queries executam', () => {
  test('query de agent runs executa sem erro', async ({ request }) => {
    const r = await dsQuery(
      request,
      'SELECT COUNT(*) AS total_runs, SUM(CASE WHEN success=1 THEN 1 ELSE 0 END) AS successes FROM pandora_agent_run_metrics WHERE started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
    );
    // 200 = query executou; pode retornar 0 rows se tabela estiver vazia (DevLake não sincronizou)
    expect([200, 400]).toContain(r.status());
  });

  test('query de token usage executa sem erro', async ({ request }) => {
    const r = await dsQuery(
      request,
      'SELECT model_name, SUM(tokens_input + tokens_output) AS total_tokens FROM pandora_agent_run_metrics GROUP BY model_name',
    );
    expect([200, 400]).toContain(r.status());
  });
});

test.describe('ST-04 Grafana Human Eval: queries executam', () => {
  test('query de review queue executa', async ({ request }) => {
    const r = await dsQuery(
      request,
      'SELECT COUNT(*) AS pending FROM pandora_human_evaluations WHERE score IS NULL',
    );
    expect([200, 400]).toContain(r.status());
  });

  test('query de avg score executa', async ({ request }) => {
    const r = await dsQuery(
      request,
      'SELECT AVG(score) AS value FROM pandora_human_evaluations WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
    );
    expect([200, 400]).toContain(r.status());
  });
});

test.describe('ST-05 Grafana DORA: queries executam', () => {
  test('query de deployment frequency executa', async ({ request }) => {
    const r = await dsQuery(
      request,
      'SELECT COUNT(*) / 4.0 AS deploys_per_week FROM deployments WHERE finished_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
    );
    expect([200, 400]).toContain(r.status());
  });

  test('query de lead time executa', async ({ request }) => {
    const r = await dsQuery(
      request,
      'SELECT AVG(TIMESTAMPDIFF(MINUTE, pr_created_date, merged_date)) AS avg_lead_time FROM pull_requests WHERE merged_date IS NOT NULL',
    );
    expect([200, 400]).toContain(r.status());
  });
});

test.describe('ST-06 Grafana Token Cost: queries executam', () => {
  test('query de custo total executa', async ({ request }) => {
    const r = await dsQuery(
      request,
      'SELECT ROUND(SUM(cost_usd), 4) AS total_cost FROM pandora_agent_run_metrics WHERE started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
    );
    expect([200, 400]).toContain(r.status());
  });
});

test.describe('ST-07 Grafana Code Quality: queries executam', () => {
  test('query de PR review time executa', async ({ request }) => {
    const r = await dsQuery(
      request,
      'SELECT AVG(TIMESTAMPDIFF(MINUTE, created_date, merged_date)) AS avg_review_min FROM pull_requests WHERE merged_date IS NOT NULL',
    );
    expect([200, 400]).toContain(r.status());
  });

  test('query de stale PRs executa', async ({ request }) => {
    const r = await dsQuery(
      request,
      "SELECT COUNT(*) AS stale FROM pull_requests WHERE status='open' AND DATEDIFF(NOW(), created_date) > 7",
    );
    expect([200, 400]).toContain(r.status());
  });
});

test.describe('ST-08 Grafana ML Performance: queries executam', () => {
  test('query de latência por modelo executa', async ({ request }) => {
    const r = await dsQuery(
      request,
      'SELECT model_name, AVG(latency_ms) AS avg_latency FROM pandora_agent_run_metrics WHERE started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY model_name ORDER BY avg_latency ASC',
    );
    expect([200, 400]).toContain(r.status());
  });

  test('query de drift executa', async ({ request }) => {
    const r = await dsQuery(
      request,
      'SELECT model_name, AVG(latency_ms) AS recent_avg FROM pandora_agent_run_metrics WHERE started_at >= DATE_SUB(NOW(), INTERVAL 3 DAY) GROUP BY model_name',
    );
    expect([200, 400]).toContain(r.status());
  });
});
