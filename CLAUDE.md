# Warranty Audit AI — Guia de Desenvolvimento

## Visão do Produto

Sistema SaaS de auditoria preventiva de garantias para concessionárias de veículos pesados
(caminhões e ônibus). O objetivo central é reduzir glosas — recusas de pagamento pela montadora.

O sistema funciona como **simulador de análise prévia**: a concessionária audita internamente
antes de submeter o processo no sistema oficial da montadora. Não há integração direta com
sistemas externos neste momento.

Diferencial central: **Policy Engine** — motor de regras que replica os manuais reais de garantia
de cada montadora, controlando todo o comportamento do sistema dinamicamente.

---

## Stack Técnica

```
Frontend:   Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
Backend:    NestJS (Node.js) + TypeScript
ORM:        Prisma
Banco:      PostgreSQL + pgvector (extensão para RAG)
IA:         GPT-4o (OpenAI) — análise multimodal + RAG
Embeddings: text-embedding-3-small (OpenAI)
Auth:       NextAuth.js (frontend) + JWT + RBAC (backend)
Fila:       BullMQ + Redis (notificações assíncronas de SLA)
Infra:      Docker Compose (dev) → Railway ou Render (produção MVP)
Storage:    Cloudflare R2 (imagens de evidência dos processos)
```

**Racional das decisões:**
- Next.js + NestJS: TypeScript ponta a ponta, ecossistema amplo, fácil contratar no Brasil
- Prisma: migrations versionadas, type-safety, essencial para multi-tenancy seguro
- pgvector: RAG no mesmo PostgreSQL — sem serviço externo adicional no MVP
- BullMQ + Redis: filas para processar alertas de SLA sem bloquear a API principal
- Railway/Render: deploy simples para MVP, migrar para AWS/GCP quando necessário
- Cloudflare R2: storage de imagens sem egress fee, API compatível com S3 SDK

---

## Convenções de Desenvolvimento

### Nomenclatura

- Arquivos: `kebab-case` (ex: `policy-engine.service.ts`)
- Classes/tipos: `PascalCase` (ex: `WarrantyProcess`)
- Variáveis/funções: `camelCase` (ex: `calculateCompositeScore`)
- Constantes: `UPPER_SNAKE_CASE` (ex: `MAX_SCORE_VALUE`)
- Tabelas do banco: `snake_case` plural (ex: `warranty_processes`)

### Regras obrigatórias

- **Nunca hardcode regras de montadora** no código da aplicação — toda regra de negócio
  de garantia vive na policy, carregada dinamicamente
- **Toda decisão de score é explicável** — o sistema deve armazenar quais regras foram
  aplicadas e qual peso cada uma teve no resultado final
- **Multi-tenancy obrigatório** — nenhuma query pode retornar dados de outro tenant
- **Versionamento de policy** — processos históricos sempre referenciam a policy
  vigente no momento da criação, nunca a policy atual

---

## Documentos de Referência

Antes de trabalhar em módulos específicos, consulte os arquivos em `docs/`:

- `@docs/architecture.md` — decisões arquiteturais detalhadas
- `@docs/policy-schema.md` — schema completo de uma policy de montadora
- `@docs/scoring-model.md` — modelo de cálculo do score composto
- `@docs/rag-knowledge-base.md` — catálogo de fontes, processo de ingestão e curadoria de documentos
- `@docs/progress.md` — estado atual do desenvolvimento (atualizar ao final de cada sessão)

---

## Ao Iniciar uma Nova Sessão

1. Ler `docs/progress.md` para recuperar o estado atual
2. Verificar qual módulo está em desenvolvimento
3. Confirmar a policy ativa para o contexto de teste
4. Ao encerrar: atualizar `docs/progress.md` com o que foi feito e o próximo passo

