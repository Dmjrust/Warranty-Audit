import { test, expect } from '@playwright/test';
import { login, TEST_USER } from './helpers';

test.describe('Autenticação', () => {
  test('redireciona para login quando não autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('login com credenciais válidas redireciona para dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });

  test('login com senha errada exibe erro', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/e-?mail/i).fill(TEST_USER.email);
    await page.getByLabel(/senha/i).fill('senha-errada');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page.getByText(/credenciais|inválid|incorret/i)).toBeVisible();
  });
});
