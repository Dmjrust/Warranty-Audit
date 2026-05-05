import { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'tecnico@demo.com',
  password: 'demo@123',
};

export const GESTOR_USER = {
  email: 'gestor@demo.com',
  password: 'demo@123',
};

export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/auth/login');
  await page.getByLabel(/e-?mail/i).fill(email);
  await page.getByLabel(/senha/i).fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/dashboard/);
}
