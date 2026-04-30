# Progress Log — Warranty Audit AI

Atualizar ao final de cada sessão de desenvolvimento.
O Claude Code lê este arquivo ao iniciar cada nova sessão para recuperar o contexto.

---

## Estado Atual

**Fase:** Fase 1 (Fundação) — CONCLUÍDA
**Data:** 2026-04-30
**Próxima fase:** Fase 2 — Policy Engine

---

## Fase 1 — Fundação ✅

### Completado
- [x] Monorepo: `apps/web` (Next.js 14) + `apps/api` (NestJS)
- [x] `docker-compose.yml` — PostgreSQL 16 + pgvector + Redis
- [x] Schema Prisma migrado: SQLite → PostgreSQL + User + Score + RagDocument
- [x] Auth NestJS: JWT + PassportJWT + Guards (AuthGuard, RoleGuard, TenantGuard)
- [x] NextAuth.js no frontend — login page funcional
- [x] Seed data: 6 manufacturers + Volvo policy v1.0.0 + 3 usuários de teste

### Estrutura criada
```
apps/
├── api/                        (NestJS)
│   ├── src/
│   │   ├── modules/auth/       (JWT + Guards + RBAC)
│   │   ├── prisma/             (PrismaService)
│   │   └── shared/enums.ts     (UserRole, ProcessStatus, etc.)
│   └── prisma/
│       ├── schema.prisma       (PostgreSQL + pgvector)
│       └── seed.ts
└── web/                        (Next.js 14)
    ├── app/
    │   ├── (authenticated)/
    │   │   ├── layout.tsx      (sessão obrigatória + sidebar)
    │   │   └── dashboard/      (placeholder com KPIs)
    │   ├── auth/login/         (página de login)
    │   └── api/auth/           (NextAuth route)
    └── lib/
        ├── auth.ts             (NextAuth config)
        └── api.ts              (cliente HTTP tipado)
```

### Usuários de teste
| Email | Senha | Perfil |
|---|---|---|
| admin@warranty-audit.com | admin@123 | admin_plataforma |
| gestor@demo.com | demo@123 | gestor_garantia |
| tecnico@demo.com | demo@123 | tecnico |

---

## Stack Definida

```
Frontend:   Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
Backend:    NestJS + TypeScript
ORM:        Prisma
Banco:      PostgreSQL + pgvector
IA:         GPT-4o (OpenAI) + text-embedding-3-small
Fila:       BullMQ + Redis
Infra:      Docker Compose (dev) → Railway (produção MVP)
Storage:    Cloudflare R2
```

---

## Fase 2 — Policy Engine (próxima)

**Objetivo:** Motor de regras dinâmico funcionando

**Tasks:**
- [ ] Módulo `policy-engine` no NestJS
- [ ] `PolicyService.getActivePolicy(manufacturerId)`
- [ ] `PolicyService.validateEligibility(vin, km, policy)`
- [ ] `ChecklistService.generateChecklist(policySchema)`
- [ ] `ScoringService.calculateSD(checklistAnswers, policy)`
- [ ] Endpoint `GET /api/policies/:id/schema`
- [ ] Endpoint `POST /api/policies/validate-eligibility`

---

## Fase 3 — Workflow de Auditoria

**Objetivo:** 4 passos funcionando end-to-end

- [ ] Portar `ProcessWizard.tsx` para Next.js App Router
- [ ] Integrar frontend com API (Zustand → React Query)
- [ ] Upload de imagens via Cloudflare R2

---

## Decisões Técnicas

| Decisão | Racional |
|---|---|
| Next.js 14 App Router | Server Components, auth server-side, melhor DX |
| NestJS | Estrutura modular, Guards nativos, injeção de dependência |
| pgvector | RAG no mesmo PostgreSQL — zero dependências extras |
| SH estatístico no MVP | Dados insuficientes para ML; migrar com 500+ processos |
| Onboarding Opção B | Manual no MVP — controle total, fácil verificação |
