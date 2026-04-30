# Migration Plan — Protótipo → Target

Baseado na análise comparativa do protótipo (esboço Google Studio) versus o CLAUDE.md.

---

## Estado Atual do Protótipo

| Aspecto | Status |
|---|---|
| Frontend | React 18 + Vite + HashRouter — **funciona, mas precisa migrar** |
| Backend | Express 5 — **funciona, mas será reescrito em NestJS** |
| Banco | SQLite (dev) — **OK, migrar para PostgreSQL + pgvector** |
| Auth | Mock hardcoded — **será substituído por NextAuth.js + JWT** |
| IA | Google Gemini — **será migrado para GPT-4o com RAG** |
| Componentes UI | ProcessWizard, Dashboard, ProcessList — **99% reutilizável** |
| Schema Prisma | Estrutura correta, apenas banco diferente — **100% reutilizável** |

---

## O que Reusar (sem reescrita)

### 1. Schema Prisma (`prisma/schema.prisma`)
**O que:** Estrutura de entidades (Tenant, Process, User, etc.)
**Mudança necessária:** `provider = "sqlite"` → `provider = "postgresql"`, adicionar extensão pgvector

```prisma
// Antes
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Depois
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model RagDocument {
  id              String    @id @default(cuid())
  montadoraId     String
  fonte           String    // manual_garantia | boletim_servico | caso_aprovado | caso_glosado
  sistema         String
  titulo          String
  conteudo        String
  embedding       String    // pgvector vector(1536) — serializado como JSON no Prisma
  metadados       Json
  criadoEm        DateTime  @default(now())
  vigenteAte      DateTime?
}
```

**Esforço:** 30 minutos (mudança de driver + adicionar 3 tabelas novas)

---

### 2. Seed Data (`prisma/seed.ts`)

**O que reusar:**
- Manufacturers: Volvo, Iveco, DAF, Scania, Mercedes
- Mock Policies com os dados básicos

**O que mudar:**
- Policies mock → seed da policy real VW (baseada em `docs/policy-schema.md`)
- Adicionar campos de versão e `vigenteDe` / `vigentAte`

**Esforço:** 2 horas (reescrever seed para match CLAUDE.md)

---

### 3. Types & Enums (`types.ts` ou equivalente)

**O que reusar:**
```typescript
enum ProcessStatus {
  DRAFT = "draft",
  CHECKLIST_PENDING = "checklist_pending",
  ANALYSIS_PENDING = "analysis_pending",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  REJECTED = "rejected",
  SUBMITTED = "submitted"
}

enum ValidationSeverity {
  ERROR = "error",
  WARNING = "warning",
  INFO = "info"
}
```

**O que adicionar:**
- `AuditDecision` enum (aprovado | revisao | alto_risco | nao_submeter)
- `ChecklistItemType` (boolean | select | number | text)
- `SLAStatus` (amarelo | laranja | vermelho)

**Esforço:** 1 hora (adicionar tipos faltantes)

---

### 4. Componentes React (`components/`)

| Componente | Reutilizável? | Ação |
|---|---|---|
| `ProcessWizard.tsx` | ✅ 95% | Portar para Next.js, mudar dados mock → React Query |
| `Dashboard.tsx` | ✅ 90% | Trocar dados hardcoded → API real, manter Recharts |
| `ProcessList.tsx` | ✅ 95% | Portar, integrar com API |
| `SetupPage.tsx` | ✅ 80% | Portar para `app/setup`, simplificar (onboarding será via back-office) |
| `Sidebar.tsx` | ✅ 100% | Reaproveitar, adicionar menu RBAC |
| Estilos Tailwind | ✅ 100% | Manter, adaptar para shadcn/ui se necessário |

**Esforço:** 8 horas (porta para Next.js App Router + integração com API)

---

### 5. Lógica de Gemini (`services/gemini.ts` ou equivalente)

**O que reusar:** Estrutura da resposta
```typescript
interface AIFailureGuidance {
  score: number
  analysis: string
  recommendations: string[]
}
```

**O que mudar:** Trocar Gemini por GPT-4o, mover para NestJS (`ai-analysis.service.ts`), adicionar RAG pipeline

**Esforço:** Descartável — será implementado novo em NestJS

---

## O que Reescrever do Zero

### 1. Backend Inteiro (Express → NestJS)

**Escopo:** 
- Todos os controllers
- Todos os services (exceto estrutura)
- Roteamento
- Middlewares

**Por quê:** Express é frágil em escala, NestJS traz estrutura, injeção de dependência e guards de autenticação.

**Esforço:** 40 horas

**Estrutura alvo:**
```
apps/api/src/
├── modules/
│   ├── auth/
│   ├── policy-engine/
│   ├── warranty-process/
│   ├── scoring/
│   ├── ai-analysis/
│   ├── notifications/
│   └── admin/
├── shared/
├── main.ts
└── app.module.ts
```

---

### 2. Roteamento Frontend (HashRouter → Next.js App Router)

**Antes (Vite + React Router):**
```typescript
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/setup" element={<SetupPage />} />
  </Routes>
</BrowserRouter>
```

**Depois (Next.js 14):**
```
app/
├── (authenticated)/
│   ├── page.tsx            (Dashboard)
│   ├── process/
│   │   └── [id]/page.tsx
│   └── history/page.tsx
├── (onboarding)/
│   └── setup/page.tsx
└── auth/
    └── login/page.tsx
```

**Esforço:** 16 horas

---

### 3. Autenticação (Mock → NextAuth.js + JWT)

**Remove:** Mock hardcoded de login
**Implementa:** 
- NextAuth.js no frontend (credentials provider)
- JWT no NestJS com Guards
- RBAC com 5 perfis (tecnico, gestor_garantia, auditor, admin_tenant, admin_plataforma)

**Esforço:** 12 horas

---

### 4. Policy Engine (novo)

**Input:** `docs/policy-schema.md`
**Módulo:** `apps/api/src/modules/policy-engine/`

**Responsabilidades:**
- Carregar policy JSON da base
- Validar schema
- Gerar checklist dinâmico
- Validar elegibilidade (VIN, km, cobertura)
- Calcular SD

**Esforço:** 24 horas

---

### 5. Scoring (novo)

**Módulo:** `apps/api/src/modules/scoring/`

**Responsabilidades:**
- Calcular SD (determinístico, baseado em policy)
- Persistir ST (vem do GPT-4o via ai-analysis)
- Calcular SH (histórico estatístico)
- Combinar em score final com pesos ajustáveis

**Referência:** `docs/scoring-model.md`

**Esforço:** 16 horas

---

### 6. IA + RAG Pipeline (novo)

**Módulo:** `apps/api/src/modules/ai-analysis/`

**Componentes:**
- `rag-engine.service.ts` — busca vetorial, reranking
- `gpt4o.service.ts` — chamada à API com system prompt
- `embedding.service.ts` — gera embeddings via text-embedding-3-small
- Integração com pgvector

**Referência:** `docs/rag-knowledge-base.md`

**Esforço:** 32 horas

---

### 7. Notificações + SLA (novo)

**Módulo:** `apps/api/src/modules/notifications/`

**Stack:** BullMQ + Redis

**Responsabilidades:**
- Job que roda periodicamente (5 min)
- Verifica SLAs de processos abertos
- Enfileira alertas (Amarelo, Laranja, Vermelho)
- Envia para frontend via WebSocket ou polling

**Esforço:** 12 horas

---

## Cronograma em 5 Fases

### Fase 1 — Fundação (Semana 1)
**Objetivo:** Monorepo + banco + auth básica funcionando

**Tasks:**
- [ ] Setup monorepo: `apps/web` (Next.js 14) + `apps/api` (NestJS)
- [ ] docker-compose.yml com PostgreSQL + Redis
- [ ] Migrar schema Prisma (SQLite → PostgreSQL + pgvector)
- [ ] Auth NestJS: JWT + RBAC Guards
- [ ] NextAuth.js no frontend
- [ ] Seed data (Manufacturers + mock Policies)

**Tempo:** 40 horas
**Blocker:** Nenhum

---

### Fase 2 — Policy Engine (Semana 2)
**Objetivo:** Motor de regras funcionando

**Tasks:**
- [ ] Módulo policy-engine no NestJS
- [ ] PolicyService (carregar, versionar, validar)
- [ ] Avaliador de checklist dinâmico
- [ ] Calculador de SD
- [ ] Endpoint GET /api/policy/:id/schema
- [ ] Testes unitários

**Tempo:** 24 horas
**Blocker:** Fase 1 concluída

---

### Fase 3 — Workflow de Auditoria (Semana 3)
**Objetivo:** 4 passos funcionando end-to-end

**Tasks:**
- [ ] Portar ProcessWizard para Next.js App Router
- [ ] Integrar frontend com API (Zustand → React Query)
- [ ] Passo 1: Veículo + validação de elegibilidade
- [ ] Passo 2: Checklist dinâmico
- [ ] Passo 3: Análise técnica + upload de imagens (R2)
- [ ] Passo 4: Veredito com SD
- [ ] Testes end-to-end

**Tempo:** 32 horas
**Blocker:** Fase 2 concluída

---

### Fase 4 — IA + Scoring Completo (Semana 4)
**Objetivo:** GPT-4o + RAG + score final

**Tasks:**
- [ ] Módulo ai-analysis (GPT-4o + system prompt)
- [ ] Pipeline RAG (ingestão, busca, reranking)
- [ ] Módulo scoring (SD + ST + SH)
- [ ] Módulo history-score (cálculo de SH)
- [ ] Integrar IA com Passo 3
- [ ] Testes com dados reais

**Tempo:** 48 horas
**Blocker:** Fase 3 concluída

---

### Fase 5 — Dashboard + Notificações (Semana 5)
**Objetivo:** KPIs reais e alertas

**Tasks:**
- [ ] Dashboard com dados reais
- [ ] HistoryPage com filtros
- [ ] BullMQ + Redis para SLAs
- [ ] Notificações (Amarelo, Laranja, Vermelho)
- [ ] Testes de carga

**Tempo:** 24 horas
**Blocker:** Fase 4 concluída

---

## Checklist de Pré-Início

Antes de o Claude Code começar, **certifique-se de:**

- [ ] Protótipo clonado localmente
- [ ] CLAUDE.md, docs/policy-schema.md, docs/scoring-model.md na pasta `docs/`
- [ ] Este arquivo (MIGRATION_PLAN.md) na raiz
- [ ] Node.js 18+ instalado
- [ ] Docker instalado (para PostgreSQL + Redis)
- [ ] Chaves de API preparadas:
  - [ ] OpenAI (GPT-4o + embeddings)
  - [ ] Cloudflare R2 (se usar, ou S3 local)

---

## Comandos Para Iniciar

```bash
# Clone do repo existente
git clone https://github.com/Dmjrust/Warranty-Audit.git
cd Warranty-Audit

# Adicione os arquivos de documentação
mkdir -p docs
# Copie: CLAUDE.md, policy-schema.md, scoring-model.md, rag-knowledge-base.md, progress.md, MIGRATION_PLAN.md

# Instale dependências atuais
npm install

# Inicie o Claude Code
claude code
```

---

## Estrutura Final do Repositório

```
Warranty-Audit/
├── CLAUDE.md
├── MIGRATION_PLAN.md
├── docker-compose.yml
├── .env.example
├── package.json (monorepo root)
├── tsconfig.json
├── .gitignore
│
├── docs/
│   ├── architecture.md
│   ├── policy-schema.md
│   ├── scoring-model.md
│   ├── rag-knowledge-base.md
│   └── progress.md
│
├── apps/
│   ├── web/                     (Next.js 14)
│   │   ├── app/
│   │   ├── components/          (reutilizar do protótipo)
│   │   ├── lib/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                     (NestJS)
│       ├── src/
│       │   ├── modules/
│       │   ├── shared/
│       │   ├── main.ts
│       │   └── app.module.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── package.json
│       └── tsconfig.json
│
└── rag-sources/                 (ignorado no git)
    └── (PDFs de manuais de montadoras)
```

---

## Notas Importantes

**1. NestJS vs Express:** A reescrita em NestJS é justificada por:
   - Estrutura modular nativa
   - Injeção de dependência
   - Guards de autenticação built-in
   - Melhor manutenibilidade em longo prazo

**2. Componentes UI:** 99% dos componentes React podem ser portados. A mudança é apenas de bundler (Vite → Next.js), não de lógica.

**3. Banco de dados:** Migrar SQLite → PostgreSQL é trivial (1 linha no Prisma). O pgvector é apenas uma extensão PostgreSQL.

**4. IA:** Trocar Gemini por GPT-4o é recomendado porque:
   - GPT-4o tem visão multimodal nativa
   - Melhor integração com RAG
   - Mais confiável para análise técnica

**5. RAG:** Será implementado com pdfplumber (gratuito) + pgvector (no mesmo PostgreSQL), sem serviço externo.

---

## Próximo Passo

Com este plano em mãos, **abra o Claude Code e cole:**

```
Leia CLAUDE.md, docs/progress.md e MIGRATION_PLAN.md.

Vou começar pela Fase 1 (Fundação). 
Preciso que você:
1. Configure o monorepo (apps/web + apps/api)
2. Setup docker-compose com PostgreSQL + pgvector + Redis
3. Migre o schema Prisma
4. Implemente auth básica (JWT no NestJS, NextAuth.js no frontend)

Comece pelo passo a passo. Estou pronto para executar comandos.
```

Claude Code vai fazer o resto.
