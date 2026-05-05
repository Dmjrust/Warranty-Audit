import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('exibe os 4 cartões de KPI', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/Processos em aberto/i)).toBeVisible();
    await expect(page.getByText(/Score médio/i)).toBeVisible();
    await expect(page.getByText(/Taxa de aprovação/i)).toBeVisible();
    await expect(page.getByText(/SLA em risco/i)).toBeVisible();
  });

  test('exibe seção de distribuição por status', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/Distribuição por Status/i)).toBeVisible();
  });

  test('link "Ver todos" navega para /processes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText(/Ver todos/i).click();
    await expect(page).toHaveURL(/\/processes/);
  });

  test('botão Novo Processo navega para /processes/new', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: /\+ Novo Processo/i }).first().click();
    await expect(page).toHaveURL(/\/processes\/new/);
  });
});
