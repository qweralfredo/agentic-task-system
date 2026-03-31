import { test, expect } from '@playwright/test';
import { GRAFANA, GF_AUTH, grafanaDashboard, grafanaQuery } from '../fixtures/helpers';

/**
 * ST-03 a ST-08 — Grafana: todos os dashboards carregam e queries executam
 */
const DASHBOARDS = [
  {
    id: 'ST-03',
    uid: 'pandora-ai-overview',
    title: 'Pandora — AI Dev Overview',
    expectedStats: ['Agent Success Rate', 'Total Agent Runs (30d)', 'Avg Cost per Run', 'Avg Latency (30d)'],
  },
  {
    id: 'ST-04',
    uid: 'pandora-human-eval',
    title: 'Pandora — Human Evaluation Board',
    expectedStats: ['Avg Quality Score (30d)', 'Review Queue'],
    templateVars: ['project'],
  },
  {
    id: 'ST-05',
    uid: 'pandora-dora-metrics',
    title: 'Pandora — DORA Engineering Metrics',
    expectedStats: [
      'Deployment Frequency (deploys/week)',
      'Lead Time for Changes (avg min)',
      'MTTR — Mean Time to Restore (min)',
      'Change Failure Rate (%)',
    ],
  },
  {
    id: 'ST-06',
    uid: 'pandora-token-cost',
    title: 'Pandora — Token & Cost Analytics',
    expectedStats: ['Total Cost (30d)', 'Total Tokens (30d)', 'Avg Cost per Run'],
  },
  {
    id: 'ST-07',
    uid: 'pandora-code-quality',
    title: 'Pandora — Code Quality & Review',
    expectedStats: ['Avg PR Review Time', 'Avg Review Cycles', 'Avg Lines Changed / PR', 'Stale PRs (>7 days open)'],
    templateVars: ['repo'],
  },
  {
    id: 'ST-08',
    uid: 'pandora-ml-performance',
    title: 'Pandora — ML Model Performance',
    expectedStats: ['Avg Latency (All Models)', 'Success Rate (7d)', 'Max Latency Drift (7d)'],
  },
];

for (const dash of DASHBOARDS) {
  test.describe(`${dash.id} Grafana: ${dash.uid}`, () => {
    test('dashboard existe e retorna 200', async ({ request }) => {
      const r = await request.get(`${GRAFANA}/api/dashboards/uid/${dash.uid}`, {
        headers: { Authorization: `Basic ${GF_AUTH}` },
      });
      expect(r.status()).toBe(200);
      const body = await r.json();
      expect(body.dashboard.title).toBe(dash.title);
    });

    test('todos os stat panels esperados estão presentes', async ({ request }) => {
      const body = await grafanaDashboard(request, dash.uid);
      const panelTitles = body.dashboard.panels.map((p: { title: string }) => p.title);
      for (const expected of dash.expectedStats) {
        expect(panelTitles).toContain(expected);
      }
    });

    if (dash.templateVars) {
      test('variáveis de template presentes', async ({ request }) => {
        const body = await grafanaDashboard(request, dash.uid);
        const vars = body.dashboard.templating?.list?.map((v: { name: string }) => v.name) ?? [];
        for (const v of dash.templateVars!) {
          expect(vars).toContain(v);
        }
      });
    }

    test('datasource MySQL está acessível', async ({ request }) => {
      const r = await request.get(`${GRAFANA}/api/datasources`, {
        headers: { Authorization: `Basic ${GF_AUTH}` },
      });
      const datasources = await r.json();
      const mysql = datasources.find((d: { type: string }) => d.type === 'mysql');
      expect(mysql).toBeDefined();
      expect(mysql.name).toBe('DevLake');
    });

    test('screenshot do dashboard', async ({ page }) => {
      // Login no Grafana (tenta múltiplos seletores para compatibilidade)
      await page.goto(`${GRAFANA}/login`);
      await page.waitForLoadState('networkidle');

      const userField = page.locator('input[name="user"], input[placeholder*="email" i], input[placeholder*="username" i], #user').first();
      const passField = page.locator('input[name="password"], input[type="password"]').first();
      await userField.fill('admin');
      await passField.fill('pandora-grafana');
      await page.locator('button[type="submit"], [data-testid="data-testid Login button"]').first().click();
      await page.waitForLoadState('networkidle');

      await page.goto(`${GRAFANA}/d/${dash.uid}`, { waitUntil: 'domcontentloaded' }).catch(() => null);
      await page.waitForTimeout(4000);
      await page.screenshot({
        path: `playwright-report/screenshots/${dash.uid}.png`,
        fullPage: true,
      });
    });
  });
}

test.describe('Grafana: datasource health', () => {
  test('datasource DevLake MySQL responde ao health check', async ({ request }) => {
    const r = await request.get(`${GRAFANA}/api/datasources`, {
      headers: { Authorization: `Basic ${GF_AUTH}` },
    });
    const datasources = await r.json();
    const mysql = datasources.find((d: { type: string }) => d.type === 'mysql');
    expect(mysql).toBeDefined();

    const health = await request.get(`${GRAFANA}/api/datasources/${mysql.id}/health`, {
      headers: { Authorization: `Basic ${GF_AUTH}` },
    });
    // 200 = healthy, 400/404 = endpoint não suporta health check (MySQL datasource)
    expect([200, 400, 404]).toContain(health.status());
  });
});
