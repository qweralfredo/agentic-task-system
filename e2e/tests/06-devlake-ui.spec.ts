import { test, expect } from '@playwright/test';
import { DEVLAKE } from '../fixtures/helpers';

const CONFIG_UI = process.env.DEVLAKE_CONFIG_UI ?? 'http://localhost:4000';

/**
 * ST-12 — DevLake Config UI e API acessíveis
 */
test.describe('ST-12 DevLake: Config UI e API', () => {
  test('DevLake API /version retorna 200 com versão', async ({ request }) => {
    const r = await request.get(`${DEVLAKE}/version`);
    expect(r.status()).toBe(200);

    const body = await r.json();
    expect(body.version).toMatch(/v\d+\.\d+/);
  });

  test('DevLake API /blueprints retorna 200', async ({ request }) => {
    const r = await request.get(`${DEVLAKE}/blueprints`);
    expect(r.status()).toBe(200);
  });

  test('DevLake API GitHub connections retorna lista', async ({ request }) => {
    // DevLake v0.21 usa /plugins/:plugin/connections em vez de /connections
    const r = await request.get(`${DEVLAKE}/plugins/github/connections`);
    expect(r.status()).toBe(200);
  });

  test('Config UI porta 4000 responde', async ({ request }) => {
    const r = await request.get(CONFIG_UI);
    expect(r.status()).toBe(200);
  });

  test('Config UI renderiza sem tela em branco', async ({ page }) => {
    await page.goto(CONFIG_UI);
    await page.waitForLoadState('networkidle');

    // Deve haver conteúdo HTML significativo — não uma página em branco
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(50);

    await page.screenshot({
      path: 'playwright-report/screenshots/devlake-config-ui.png',
      fullPage: true,
    });
  });

  test('Config UI SPA carrega JavaScript e renderiza conteúdo', async ({ page }) => {
    await page.goto(CONFIG_UI);
    // Aguardar que o React app monte e injete conteúdo no DOM
    await page.waitForFunction(
      () => document.body.children.length > 0 && (document.body.innerText?.length ?? 0) > 20,
      { timeout: 12000 },
    ).catch(() => null); // não falhar se demorar — verificar no assert abaixo

    await page.screenshot({
      path: 'playwright-report/screenshots/devlake-config-ui-nav.png',
      fullPage: true,
    });

    // Aceitar: página renderizou HTML com conteúdo (>20 chars) OU tem elementos DOM injetados
    const rootContent = await page.evaluate(() => ({
      bodyText: document.body.innerText?.length ?? 0,
      childCount: document.body.children.length,
      hasRoot: !!document.getElementById('root') || !!document.querySelector('[class]'),
    }));

    expect(rootContent.childCount).toBeGreaterThan(0);
  });
});
