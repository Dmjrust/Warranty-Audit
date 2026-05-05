import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * Fluxo completo de auditoria — Passos 1 → 4.
 *
 * Pré-requisitos:
 *   - API rodando em http://localhost:4000
 *   - Banco populado com o seed (tenant + policy Volvo v1.0.0 + usuário tecnico@demo.com)
 */
test.describe('Fluxo de auditoria — 4 passos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('lista de processos carrega corretamente', async ({ page }) => {
    await page.goto('/processes');
    await expect(page.getByText(/Processos de Auditoria/i)).toBeVisible();
    await expect(page.getByText(/processo\(s\) encontrado\(s\)/i)).toBeVisible();
  });

  test('cria novo processo e exibe o wizard no Passo 1', async ({ page }) => {
    await page.goto('/processes/new');
    await expect(page.getByText(/Novo Processo de Auditoria/i)).toBeVisible();
    // Step indicator deve mostrar Veículo como ativo
    await expect(page.getByText('Veículo')).toBeVisible();
    await expect(page.getByText('Checklist')).toBeVisible();
    await expect(page.getByText('Análise Técnica')).toBeVisible();
    await expect(page.getByText('Veredito')).toBeVisible();
  });

  test('Passo 1 — preenche dados do veículo e avança', async ({ page }) => {
    await page.goto('/processes/new');

    // Aguarda o formulário do Step1
    await expect(page.getByPlaceholder(/VIN/i)).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder(/VIN/i).fill('9BM384075LB123456');
    await page.getByPlaceholder(/modelo/i).fill('Volvo FH 540');
    await page.getByPlaceholder(/hodômetro|km/i).fill('45000');
    await page.getByPlaceholder(/sistema/i).fill('Motor');

    await page.getByRole('button', { name: /salvar/i }).click();

    // Deve avançar para Checklist
    await expect(page.getByText(/Checklist/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Passo 2 — responde checklist e avança para Análise', async ({ page }) => {
    // Navega para um processo já no passo CHECKLIST
    await page.goto('/processes');

    // Se não há processos no checklist, cria um novo e avança o Passo 1
    const checklistRow = page.locator('tr', { hasText: 'Checklist' }).first();
    const hasChecklist = await checklistRow.isVisible().catch(() => false);

    if (!hasChecklist) {
      // Cria e avança o Passo 1 primeiro
      await page.goto('/processes/new');
      await expect(page.getByPlaceholder(/VIN/i)).toBeVisible({ timeout: 15_000 });
      await page.getByPlaceholder(/VIN/i).fill('9BM384075LB999000');
      await page.getByPlaceholder(/modelo/i).fill('Volvo FH 460');
      await page.getByPlaceholder(/hodômetro|km/i).fill('30000');
      await page.getByRole('button', { name: /salvar/i }).click();
      await expect(page.getByText(/Checklist/i).first()).toBeVisible({ timeout: 15_000 });
    } else {
      await checklistRow.getByText(/Abrir/).click();
    }

    // Responde as perguntas do checklist com "Sim"
    const simButtons = page.getByRole('button', { name: /^Sim$/i });
    const count = await simButtons.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      await simButtons.nth(0).click();
    }

    await page.getByRole('button', { name: /salvar|continuar/i }).click();

    // Deve avançar para Análise Técnica
    await expect(page.getByText(/Análise Técnica|sintomas/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Passo 3 — preenche análise técnica e avança para Veredito', async ({ page }) => {
    await page.goto('/processes');

    const analysisRow = page.locator('tr', { hasText: 'Análise' }).first();
    const hasAnalysis = await analysisRow.isVisible().catch(() => false);

    if (!hasAnalysis) {
      test.skip(true, 'Nenhum processo no passo de Análise disponível');
      return;
    }

    await analysisRow.getByText(/Abrir/).click();

    // Preenche campos obrigatórios
    await page.locator('textarea').nth(0).fill('Motor com barulho anormal ao acelerar acima de 1500 RPM');
    await page.locator('textarea').nth(1).fill('Inspeção visual identificou folga na turbina');
    await page.locator('textarea').nth(2).fill('Falha no rolamento da turbina — desgaste prematuro por falta de lubrificação');

    await page.getByRole('button', { name: /salvar|analisar/i }).click();

    // Aguarda resultado da IA ou avanço direto para Veredito
    await expect(
      page.getByText(/veredito|score técnico|continuar/i).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test('health check da API responde 200', async ({ request }) => {
    const res = await request.get('http://localhost:4000/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.checks.database.status).toBe('ok');
  });
});
