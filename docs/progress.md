# Progress Log — Warranty Audit AI

Atualizar ao final de cada sessão de desenvolvimento.
O Claude Code lê este arquivo ao iniciar cada nova sessão para recuperar o contexto.

---

## Estado Atual

**Fase:** Protótipo existente → Migração para target (CLAUDE.md)
**Data:** 2025-04
**Protótipo:** React 18 + Vite + Express + SQLite (estrutura visual completa)
**Target:** Next.js 14 + NestJS + PostgreSQL + GPT-4o
**Próximo passo:** Fase 1 — Fundação (monorepo + banco + auth)

---

## Documentação Concluída

- [x] `CLAUDE.md` — guia completo de desenvolvimento
- [x] `docs/policy-schema.md` — schema JSON da policy (baseado no manual VW real)
- [x] `docs/scoring-model.md` — modelo SD + ST + SH com fórmulas e persistência
- [x] `docs/rag-knowledge-base.md` — pipeline de ingestão e catálogo de documentos
- [x] `MIGRATION_PLAN.md` — plano de migração do protótipo para target
- [ ] `docs/architecture.md` — decisões arquiteturais detalhadas (gerar após Fase 1)

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

## O que Reusar do Protótipo

| Artefato | Arquivo | Status |
|---|---|---|
| Schema Prisma | `prisma/schema.prisma` | ✅ Migrar SQLite → PostgreSQL |
| Seed data | `prisma/seed.ts` | ✅ Adaptar para policy real VW |
| Types & Enums | `types.ts` | ✅ Adicionar tipos faltantes |
| ProcessWizard UI | `components/ProcessWizard.tsx` | ✅ Portar para Next.js |
| Dashboard UI | `components/Dashboard.tsx` | ✅ Manter, trocar dados mock |
| Styling Tailwind | Todos | ✅ 100% reutilizável |

---

## O que Reescrever

- Backend inteiro (Express → NestJS com 7 módulos)
- Roteamento frontend (HashRouter → Next.js App Router)
- Auth (mock → NextAuth.js + JWT + RBAC)
- Policy Engine (novo)
- Scoring (novo)
- IA + RAG pipeline (novo)
- Notificações + SLA (novo)

---

## Ordem de Implementação — 5 Fases

### ✅ Documentação Preparatória
- [x] CLAUDE.md
- [x] policy-schema.md
- [x] scoring-model.md
- [x] rag-knowledge-base.md
- [x] MIGRATION_PLAN.md

### Fase 1 — Fundação (40h)
- [ ] Setup monorepo: `apps/web` (Next.js) + `apps/api` (NestJS)
- [ ] docker-compose com PostgreSQL + Redis + pgvector
- [ ] Migrar schema Prisma
- [ ] Auth JWT (NestJS) + NextAuth.js (frontend)
- [ ] Seed data (Manufacturers + mock Policies)

### Fase 2 — Policy Engine (24h)
- [ ] Módulo policy-engine no NestJS
- [ ] Avaliador de checklist dinâmico
- [ ] Calculador de SD (Score Determinístico)
- [ ] Validador de elegibilidade

### Fase 3 — Workflow de Auditoria (32h)
- [ ] Portar ProcessWizard para Next.js
- [ ] Integrar frontend com API (React Query)
- [ ] 4 passos do workflow funcionando
- [ ] Upload de imagens via R2

### Fase 4 — IA + Scoring (48h)
- [ ] Módulo ai-analysis (GPT-4o + RAG)
- [ ] Pipeline RAG (ingestão, busca, reranking)
- [ ] Módulo scoring (SD + ST + SH)
- [ ] Cálculo de SH (Score Histórico)

### Fase 5 — Dashboard + Notificações (24h)
- [ ] Dashboard com dados reais
- [ ] BullMQ + Redis para alertas SLA
- [ ] Régua: Amarelo → Laranja → Vermelho

---

## Decisões Técnicas Registradas

| Decisão | Racional | Data |
|---|---|---|
| Next.js 14 em vez de Vite | Server Components, ISR, melhor DX em escala | 2025-04 |
| NestJS em vez de Express | Estrutura modular, Guards, injeção de dependência | 2025-04 |
| pdfplumber (não LlamaParse) | Manuais técnicos são texto corrido, extrator simples basta | 2025-04 |
| pgvector (não Pinecone) | Evitar serviço externo no MVP, mesmo PostgreSQL | 2025-04 |
| SH estatístico no MVP | Dados insuficientes para ML, migrar com 500+ processos | 2025-04 |
| Reusar componentes React | Lógica de UI está correta, apenas mudar bundler | 2025-04 |

---

## Log de Sessões

### Sessão 001 — Design e Documentação
- Escopo do projeto avaliado
- Stack técnica definida (Next.js + NestJS + PostgreSQL + GPT-4o)
- CLAUDE.md, policy-schema.md, scoring-model.md criados
- rag-knowledge-base.md com estratégia ajustada ao perfil real de PDFs
- **Resultado:** Base sólida para migração

### Sessão 002 — Análise do Protótipo e Plano de Migração
- Protótipo analisado (React 18 + Vite + Express + SQLite)
- MIGRATION_PLAN.md gerado com 5 fases
- Identificado: 99% dos componentes UI reutilizáveis
- Bug no server.ts marcado como descartável (reescrita total)
- **Próximo:** Fase 1 — Setup monorepo e banco
