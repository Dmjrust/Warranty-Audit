# Progress Log — Warranty Audit AI

Atualizar ao final de cada sessão de desenvolvimento.
O Claude Code lê este arquivo ao iniciar cada nova sessão para recuperar o contexto.

---

## Estado Atual

**Fase:** Fase 2 (Policy Engine) — CONCLUÍDA
**Data:** 2026-04-30
**Próxima fase:** Fase 3 — Workflow de Auditoria (4 passos end-to-end)

---

## Fase 1 — Fundação ✅

- [x] Monorepo: `apps/web` (Next.js 14) + `apps/api` (NestJS)
- [x] `docker-compose.yml` — PostgreSQL 16 + pgvector + Redis
- [x] Schema Prisma migrado: SQLite → PostgreSQL + User + Score + RagDocument
- [x] Auth NestJS: JWT + Guards (AuthGuard, RoleGuard, TenantGuard)
- [x] NextAuth.js no frontend — login page funcional
- [x] Seed: 6 manufacturers + Volvo policy v1.0.0 + 3 usuários de teste

---

## Fase 2 — Policy Engine ✅

### O que foi implementado

**`apps/api/src/modules/policy-engine/`**

| Arquivo | Responsabilidade |
|---|---|
| `types/policy.types.ts` | Interfaces TypeScript de todo o schema JSON da policy |
| `policy-engine.service.ts` | Carrega policy, valida elegibilidade, gera checklist |
| `deterministic-score.service.ts` | Calcula SD (0–100) e score composto SD+ST+SH |
| `policy-engine.controller.ts` | Expõe todos os endpoints REST |
| `policy-engine.module.ts` | Wiring do módulo |

**`apps/api/src/modules/manufacturers/`**

| Arquivo | Responsabilidade |
|---|---|
| `manufacturers.service.ts` | Lista montadoras + policy versions |
| `manufacturers.controller.ts` | `GET /manufacturers`, `GET /manufacturers/:id` |
| `manufacturers.module.ts` | Wiring do módulo |

### Endpoints disponíveis (todos autenticados)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/manufacturers` | Lista montadoras ativas |
| `GET` | `/api/manufacturers/:id` | Detalhes + templates + versão ativa |
| `GET` | `/api/manufacturers/:id/policy-versions` | Histórico de versions |
| `GET` | `/api/manufacturers/:id/active-policy` | Policy ativa com schema parsed |
| `GET` | `/api/tenants/:id/active-policy` | Policy ativa do tenant (com TenantGuard) |
| `GET` | `/api/policies/:id` | Policy version completa |
| `GET` | `/api/policies/:id/checklist` | Checklist dinâmico gerado pela policy |
| `POST` | `/api/policies/:id/validate-eligibility` | Valida VIN, km, modelo (Passo 1) |
| `POST` | `/api/policies/:id/evaluate-checklist` | Avalia respostas → SD parcial (Passo 2) |
| `POST` | `/api/policies/:id/composite-score` | Score final SD+ST+SH com decisão |

### Lógica do SD (DeterministicScoreService)

```
SD = (pontos obtidos no checklist / pontos máximos possíveis) × 100

Decisão automática baseada nos limites da policy:
  ≥ 85 → aprovado automático
  40–84 → revisão manual (gestor)
  < 40 → nao_submeter

Bloqueantes: qualquer resposta desfavorável em questão bloqueante → nao_submeter
```

---

## Usuários de teste

| Email | Senha | Perfil |
|---|---|---|
| admin@warranty-audit.com | admin@123 | admin_plataforma |
| gestor@demo.com | demo@123 | gestor_garantia |
| tecnico@demo.com | demo@123 | tecnico |

---

## Fase 3 — Workflow de Auditoria (próxima)

**Objetivo:** 4 passos funcionando end-to-end com dados reais

**Tasks:**
- [ ] Módulo `warranty-process` no NestJS (CRUD de ProcessInstance)
- [ ] Endpoint `POST /api/processes` — cria processo novo (vincula policy ativa do tenant)
- [ ] Endpoint `PATCH /api/processes/:id/step/:step` — salva dados de cada passo
- [ ] Endpoint `GET /api/processes` — lista processos do tenant (multi-tenancy obrigatório)
- [ ] Portar `ProcessWizard.tsx` para Next.js App Router
- [ ] Integrar frontend com API (trocar Zustand mock → fetch real)
- [ ] Upload de imagens via Cloudflare R2

---

## Stack definida

```
Frontend:   Next.js 14 + TypeScript + Tailwind CSS
Backend:    NestJS + TypeScript
ORM:        Prisma
Banco:      PostgreSQL + pgvector
IA:         GPT-4o (OpenAI) — Fase 4
Fila:       BullMQ + Redis — Fase 5
Infra:      Docker Compose (dev) → Railway (produção MVP)
Storage:    Cloudflare R2 — Fase 3
```
