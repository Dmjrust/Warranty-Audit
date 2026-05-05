# Progress Log — Warranty Audit AI

Atualizar ao final de cada sessao de desenvolvimento.
O Claude Code le este arquivo ao iniciar cada nova sessao para recuperar o contexto.

---

## Estado Atual

**Fase:** Fase 5 (Dashboard + Notificacoes) -- CONCLUIDA
**Data:** 2026-05-05
**Proxima fase:** Fase 6 -- Deploy MVP (Railway/Render) + testes E2E

---

## Fases Concluidas

### Fase 1 -- Fundacao
- Monorepo: apps/web (Next.js 14) + apps/api (NestJS)
- docker-compose.yml -- PostgreSQL 16 + pgvector + Redis
- Schema Prisma: User, Tenant, Manufacturer, PolicyTemplate, PolicyVersion, ProcessInstance, Score, RagDocument
- Auth NestJS: JWT + Guards (AuthGuard, RoleGuard, TenantGuard)
- NextAuth.js no frontend -- login page funcional
- Seed: 6 manufacturers + Volvo policy v1.0.0 + 3 usuarios de teste

### Fase 2 -- Policy Engine
- PolicyEngineService: carrega policy, valida elegibilidade, gera checklist, calcula SLA
- DeterministicScoreService: calcula SD + score composto SD+ST+SH + decisao
- 9 endpoints REST (validate-eligibility, checklist, evaluate-checklist, etc.)
- ManufacturersModule: CRUD de montadoras + historico de policy versions

### Fase 3 -- Workflow de Auditoria
- WarrantyProcessService: CRUD + 4 step handlers com SLA
- StorageService: R2 upload com fallback local para dev
- 8 endpoints REST (create, list, get, vehicle, checklist, analysis, verdict, images)
- ProcessWizard frontend: 4 steps (Step1Vehicle, Step2Checklist, Step3Analysis, Step4Verdict)
- ProcessList: tabela com status, SLA badges, score
- Rotas: /processes, /processes/new, /processes/:id

### Fase 4 -- IA + Scoring
- AiAnalysisModule: GPT-4o + system prompt fixo + pipeline RAG
- EmbeddingService: text-embedding-3-small (OpenAI)
- RagEngineService: busca pgvector coseno + reranking por prioridade de fonte
- Gpt4oService: temperatura 0.2 fixo, response_format json_object
- HistoryScoreService: aprovacoes / total ultimos 12 meses (min 20, max 95)
- Schema: embedding vector(1536) no rag_documents + ivfflat index
- saveAnalysisStep: chama IA, armazena aiResult no analysisDataJson
- saveVerdictStep: usa ST da IA automaticamente; SH calculado por HistoryScoreService
- GET /api/processes/history-score
- Step3Analysis: exibe resultado IA (score, consistencia, lacunas, justificativa)
- Step4Verdict: busca SH automatico; exibe ST real; formula correta no resultado

### Fase 5 -- Dashboard + Notificacoes
- Schema: modelo Notification (tenantId, processId, type, message, read)
- DashboardModule: GET /api/dashboard -- KPIs agregados (totalAbertos, scoreMedio,
  taxaAprovacao, slaEmRisco, tendenciaMensal 6 meses, processosRecentes 5)
- NotificationsModule: GET /api/notifications, GET /api/notifications/count,
  PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all
- SlaModule: BullMQ queue (sla-check) + @nestjs/schedule cron a cada 10 min
  - SlaScheduler: escaneia processos abertos com slaDeadline e enfileira jobs
  - SlaProcessor: recalcula slaStatus, detecta transicoes e cria Notification
- PrismaModule (@Global): exporta PrismaService para todos os modulos sem redundancia
- Dashboard page: KPI cards + distribuicao por status + grafico de barras mensal + tabela recentes
- NotificationBell: component cliente com polling 30s, dropdown, marcar como lida/todas lidas
- Layout atenticado: topbar com NotificationBell + badge de contagem + role do usuario no sidebar

## Usuarios de teste

| Email | Senha | Perfil |
|---|---|---|
| admin@warranty-audit.com | admin@123 | admin_plataforma |
| gestor@demo.com | demo@123 | gestor_garantia |
| tecnico@demo.com | demo@123 | tecnico |

---

## Fase 6 -- Deploy MVP (proxima)

Tasks:
- [ ] Variáveis de ambiente para Railway/Render (.env.production)
- [ ] Dockerfile para apps/api
- [ ] Dockerfile para apps/web
- [ ] docker-compose.prod.yml (sem volumes locais, secrets via env)
- [ ] Prisma migrations em producao (prisma migrate deploy)
- [ ] Health check endpoints (/api/health)
- [ ] Testes E2E basicos (Playwright) no fluxo de auditoria
