import { test, expect } from '@playwright/test';
import { FRONTEND } from '../fixtures/helpers';

/**
 * ST-01 — Frontend: Kanban board carrega work items
 * Verifica que o board renderiza cards com dados reais.
 */
test.describe('ST-01 Frontend: Kanban Board', () => {
  test('página inicial carrega sem erros 4xx/5xx', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });

    await page.goto(FRONTEND);
    await page.waitForLoadState('networkidle');

    expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
  });

  test('lista de projetos é visível', async ({ page }) => {
    await page.goto(FRONTEND);
    await page.waitForLoadState('networkidle');

    // Deve existir ao menos um item de projeto ou mensagem de empty state
    const hasProjects = await page.locator('[data-testid="project-item"], .project-card, .MuiCard-root').count();
    expect(hasProjects).toBeGreaterThan(0);
  });

  test('projeto "E2E Visual Test Suite" aparece na lista', async ({ page }) => {
    await page.goto(FRONTEND);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('E2E Visual Test Suite')).toBeVisible({ timeout: 10000 });
  });

  test('work items do projeto carregam com status visível', async ({ page }) => {
    await page.goto(FRONTEND);
    await page.waitForLoadState('networkidle');

    // Clicar no projeto seeded
    await page.getByText('E2E Visual Test Suite').first().click();
    await page.waitForLoadState('networkidle');

    // Deve aparecer status labels (Todo / InProgress / Done)
    const statusLabels = page.locator('text=/Todo|InProgress|Done|Backlog/i');
    await expect(statusLabels.first()).toBeVisible({ timeout: 8000 });
  });

  test('sem erros de JavaScript no console', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(FRONTEND);
    await page.waitForLoadState('networkidle');

    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('Warning'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('screenshot do kanban board', async ({ page }) => {
    await page.goto(FRONTEND);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-report/screenshots/kanban-board.png', fullPage: true });
  });
});
