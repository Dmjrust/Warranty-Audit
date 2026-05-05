# Progress Log — Warranty Audit AI

Atualizar ao final de cada sessao de desenvolvimento.
O Claude Code le este arquivo ao iniciar cada nova sessao para recuperar o contexto.

---

## Estado Atual

**Fase:** Fase 6 (Deploy MVP) -- CONCLUIDA
**Data:** 2026-05-05
**Status do projeto:** MVP completo — pronto para deploy

---

## Fases Concluidas

### Fase 1 -- Fundacao
- Monorepo npm workspaces: apps/web (Next.js 14) + apps/api (NestJS)
- docker-compose.yml: PostgreSQL 16 + pgvector + Redis
- Schema Prisma: User, Tenant, Manufacturer, PolicyTemplate, PolicyVersion, ProcessInstance, Score, RagDocument, Notification
- Auth NestJS: JWT + Guards (AuthGuard, RoleGuard, TenantGuard)
- NextAuth.js frontend + login page
- Seed: 6 manufacturers + Volvo policy v1.0.0 + 3 usuarios de teste

### Fase 2 -- Policy Engine
- PolicyEngineService: carrega policy, valida elegibilidade, gera checklist, calcula SLA
- DeterministicScoreService: calcula SD + score composto SD+ST+SH + decisao
- 9 endpoints REST
- ManufacturersModule: CRUD + historico de policy versions

### Fase 3 -- Workflow de Auditoria
- WarrantyProcessService: CRUD + 4 step handlers com SLA
- StorageService: R2 upload com fallback local
- 8 endpoints REST
- ProcessWizard: 4 steps client-side (Vehicle, Checklist, Analysis, Verdict)
- ProcessList: tabela com status, SLA badges, score
- Rotas: /processes, /processes/new, /processes/:id

### Fase 4 -- IA + Scoring
- AiAnalysisModule: GPT-4o temperatura 0.2, system prompt fixo, pipeline RAG
- EmbeddingService: text-embedding-3-small
- RagEngineService: pgvector coseno + reranking por fonte
- HistoryScoreService: SH estatistico por tenant (12 meses, clamp 20-95)
- Schema: embedding vector(1536) + ivfflat index
- Step3Analysis: exibe resultado IA (score, lacunas, justificativa)
- Step4Verdict: SH automatico + ST real da IA

### Fase 5 -- Dashboard + Notificacoes
- DashboardModule: KPIs agregados (totalAbertos, scoreMedio, taxaAprovacao, slaEmRisco), tendencia mensal 6 meses, ultimos 5 processos
- NotificationsModule: listar, contar, marcar lida/todas
- SlaModule: BullMQ + cron a cada 10 min (SlaScheduler + SlaProcessor) -- transicoes green->yellow->orange->red com notificacao
- PrismaModule @Global
- Dashboard page: KPI cards + distribuicao por status + grafico barras mensal + tabela recentes
- NotificationBell: polling 30s, dropdown, badge contagem

### Fase 6 -- Deploy MVP
- GET /api/health: verifica DB + uptime (sem autenticacao, para load balancers)
- next.config.ts: output standalone para Docker minimal
- apps/api/Dockerfile: multi-stage node:20-alpine, prisma migrate deploy no CMD
- apps/web/Dockerfile: multi-stage node:20-alpine, Next.js standalone
- apps/api/.dockerignore / apps/web/.dockerignore
- docker-compose.prod.yml: todos os 4 servicos (postgres, redis, api, web) com healthchecks, variaveis de ambiente por ${VAR}
- .env.example: adicionados REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, NEXT_PUBLIC_API_URL, POSTGRES_*
- Playwright E2E: playwright.config.ts + e2e/helpers.ts + auth.spec.ts + dashboard.spec.ts + audit-flow.spec.ts (cobre login, dashboard KPIs, passo 1-3 do fluxo, health check API)
- apps/api/railway.toml + apps/web/railway.toml: deploy Railway 1-click por Dockerfile
- render.yaml: deploy Render com PostgreSQL managed + Redis managed + 2 web services

## Usuarios de teste

| Email | Senha | Perfil |
|---|---|---|
| admin@warranty-audit.com | admin@123 | admin_plataforma |
| gestor@demo.com | demo@123 | gestor_garantia |
| tecnico@demo.com | demo@123 | tecnico |

## Para rodar localmente

```bash
# 1. Subir infra
docker compose up -d

# 2. Copiar e editar variaveis
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# 3. Instalar dependencias
npm install

# 4. Aplicar migrations + seed
npm run db:migrate --workspace=@warranty-audit/api
npm run db:seed --workspace=@warranty-audit/api

# 5. Dev
npm run dev
```

## Para rodar testes E2E

```bash
# Instalar browsers Playwright (1x)
npx playwright install chromium --with-deps

# Rodar testes (necessita API + banco rodando)
npm run test:e2e --workspace=@warranty-audit/web
```

## Deploy Railway

1. Criar projeto Railway
2. Adicionar PostgreSQL + Redis via plugins
3. Conectar repo e apontar Root Directory para apps/api (servico da API)
4. Criar segundo servico apontando para apps/web
5. Configurar variaveis de ambiente conforme .env.example

## Deploy Render

```bash
# 1-click a partir do repositorio com render.yaml
# Render detecta o arquivo automaticamente
```
