# Fluxo Operacional — Setup de Concessionárias

Definição de quem faz o quê e em que momento no processo de onboarding.

---

## Cenário: Você é o Proprietário do Sistema

**Contexto:** Você é o fundador/dono da plataforma SaaS. Múltiplas concessionárias (Tenants) vão se cadastrar. Cada uma vê apenas seus próprios dados, sua policy ativa, seus processos.

**Pergunta-chave:** Você quer gerenciar tudo manualmente ou criar um self-service para que as concessionárias se cadastrem sozinhas?

---

## Opção A — Full Self-Service (Recomendado para escala)

### Fluxo
```
Concessionária acessa app → Clica "Criar Conta" 
  → Preenche: nome, CNPJ, email de admin
  → Sistema cria Tenant automaticamente
  → Seleciona montadora (Volvo, Scania, etc.)
  → Sistema vincula policy ativa da montadora
  → Convida usuários (técnicos, gestores)
  → Pronto — começa a usar
```

### O que você (proprietário) faz
- ✅ Gerenciar montadoras (criar Volvo, Scania, Mercedes, etc.)
- ✅ Versionar policies (quando houver novo manual de garantia)
- ✅ Monitorar saúde da plataforma (dashboard global)
- ✅ Resolver problemas técnicos ou escalações
- ❌ Não cria tenant manualmente para cada concessionária

### Vantagens
- Escalável infinitamente (não depende de você)
- Concessionária é dona de suas credenciais
- Onboarding rápido (minutos)
- Você tem tempo para refinar policies e features

### Desvantagens
- Requer self-service UI robusto (precisa testar bem)
- Suporte inicial pode ter dúvidas
- Precisa de verificação de identidade/CNPJ

---

## Opção B — Onboarding Manual (Recomendado para B2B close)

### Fluxo
```
Concessionária compra plano → Envia contato
  → Você cria Tenant no back-office
  → Define montadora (Volvo, Scania, etc.)
  → Gera link de convite único
  → Envia para concessionária: "Clique aqui, crie sua senha"
  → Concessionária cria conta + convida equipe
  → Você ativa o acesso (última etapa)
```

### O que você (proprietário) faz
- ✅ Criar tenant no back-office para cada nova concessionária
- ✅ Vinc ular à montadora correta
- ✅ Gerar links de convite
- ✅ Ativar/desativar acesso
- ✅ Gerenciar policies
- ✅ Monitorar todos os tenants

### Vantagens
- Controle total sobre quem entra
- Fácil verificação (você confirma CNPJ/contrato)
- Relacionamento mais próximo
- Casos de uso complexos têm suporte direto

### Desvantagens
- Não escala bem (você é o bottleneck)
- Cada novo cliente = trabalho manual
- Suporte manual para reset de senha

---

## Recomendação Híbrida (A + B)

**No MVP:** Use **Opção B** (manual) — você tem poucos clientes, controla tudo, aprende o fluxo.

**Em escala (depois):** Evolua para **Opção A** (self-service) — conforme cresce, você cria um portal de cadastro.

---

## Seu Perfil no Sistema (Opção B — Manual, Recomendado)

Você precisa de um perfil especial: **`admin_plataforma_super`** ou **`platform_admin`**

```typescript
enum UserRole {
  // Concessionária (Tenant)
  TECNICO = "tecnico",                    // cria/preenche processos
  GESTOR_GARANTIA = "gestor_garantia",    // aprova processos
  AUDITOR = "auditor",                     // leitura
  ADMIN_TENANT = "admin_tenant",          // gerencia usuários do tenant

  // Sistema (Plataforma)
  ADMIN_PLATAFORMA = "admin_plataforma"   // SÓ VOCÊ tem este
}
```

### Permissões de `admin_plataforma` (você)

| Recurso | Ação | Permitido? |
|---|---|---|
| Tenants | Criar novo tenant | ✅ Você cria |
| Tenants | Listar todos | ✅ Ver todos |
| Tenants | Ativar/desativar | ✅ Você controla acesso |
| Manufacturers | Criar (Volvo, Scania, etc.) | ✅ Você gerencia |
| Manufacturers | Editar | ✅ Você controla |
| Policies | Criar nova versão | ✅ Você versioná |
| Policies | Publicar (vigente) | ✅ Você libera |
| Policies | Arquivar | ✅ Você descontinua |
| Users | Criar global | ❌ (concessionária cria seus usuários) |
| Users | Listar (global) | ✅ Ver todos os usuários de todos os tenants |
| Users | Reset senha | ✅ Suporte emergencial |
| Audit Log | Acessar | ✅ Ver tudo (compliance) |
| Analytics | Dashboard global | ✅ Saúde da plataforma |
| Webhooks | Configurar | ✅ Integrações externas (futuro) |

---

## Fluxo Operacional Detalhado (Opção B Recomendada)

### Dia 1 — Concessionária assina contrato

```
Cliente: "Queremos usar seu sistema para auditoria de garantias Volvo"
Você: "Perfeito! Vou criar sua conta"
```

### Dia 2 — Você cria o tenant

**Lugar:** Portal administrativo privado (`/admin/tenants/new`)

```typescript
// Você preenche:
{
  nome: "Concessionária XYZ Ltda",
  cnpj: "12.345.678/0001-90",
  montadora_id: "uuid-volvo",          // seleciona Volvo
  email_admin: "admin@xyz.com.br",
  plano: "premium",                     // Define tier de serviço
  status: "pending_verification"
}
```

Sistema gera automaticamente:
- `tenant_id` (UUID)
- `invite_token` único e com expiração (24h)

### Dia 2 (continua) — Você envia convite

**Email automático para `admin@xyz.com.br`:**

```
Bem-vindo à Warranty Audit AI!

Sua conta foi criada. Clique no link abaixo para completar o setup:

https://warranty-audit.com/onboard/verify?token=abc123def456

Este link expira em 24 horas.

Seus detalhes:
- Tenant: Concessionária XYZ Ltda
- Montadora: Volvo
- Grupo de montanha: Rodoviário (padrão)
```

### Dia 2 — Admin da concessionária clica no link

Fluxo no frontend:
1. Valida o token
2. Pede: nome completo, e-mail, senha
3. Cria o usuário `admin_tenant` para o tenant
4. Redireciona para dashboard
5. Status muda para `active`

### Dia 3 — Concessionária convida equipe

**Admin da concessionária (dentro do sistema):**
- Vai em `/settings/usuarios`
- Clica "Convidar usuário"
- Seleciona perfil: `tecnico`, `gestor_garantia` ou `auditor`
- Insere email
- Sistema envia convite

### Você acompanha tudo

**Dashboard `/admin` (seu acesso):**

```
Tenants Ativos: 15
├─ Concessionária XYZ (Volvo) — ✅ Active — 3 usuários
├─ Concessionária ABC (Scania) — ✅ Active — 5 usuários
└─ Concessionária DEF (Mercedes) — ⏳ Pending — aguardando admin

Policies Vigentes:
├─ Volvo Delivery 2024 (v2.1) — usado por 5 tenants
├─ Scania P-series 2023 (v1.8) — usado por 3 tenants
└─ [Criar nova política]

Últimos Processos (toda plataforma):
├─ Processo #4521 (XYZ) — Análise de motor — ⏳ Aguardando decisão
├─ Processo #4520 (ABC) — Freio — ✅ Aprovado
└─ [Ver todos]
```

---

## Fluxo de Setup Após Tenant Criado

### Momento 1 — Admin da concessionária loga

```
1. Dashboard vazio (nenhum processo ainda)
2. Notificação: "Complete seu setup"
3. Checklist:
   - [ ] Selecione seu grupo de aplicação (I, II, III, IV)
   - [ ] Convide seus técnicos e gestores
   - [ ] Confirme a montadora (Volvo) — já selecionada
   - [ ] Leia o manual de garantia (download PDF ou link)
```

### Momento 2 — Admin convida equipe

```
Admin da concessionária:
Vai em /settings/team

├─ Convidar Técnico
│  ├─ Email: tecnico1@xyz.com
│  ├─ Perfil: Técnico (cria/preenche processos)
│  └─ [Enviar convite]
│
├─ Convidar Gestor
│  ├─ Email: gestor@xyz.com
│  ├─ Perfil: Gestor de Garantia (aprova)
│  └─ [Enviar convite]
│
└─ Convidar Auditor
   ├─ Email: auditor@xyz.com
   ├─ Perfil: Auditor (lê tudo, não mexe)
   └─ [Enviar convite]
```

Cada convidado recebe email com link de aceitação (válido 7 dias).

### Momento 3 — Técnico cria primeiro processo

```
Técnico clica: "Novo Processo de Auditoria"
  ├─ Passo 1: Identificação do Veículo (VIN, km, modelo)
  ├─ Passo 2: Checklist de Elegibilidade
  ├─ Passo 3: Análise Técnica
  └─ Passo 4: Veredito

Sistema aplica policy Volvo automaticamente — campos, validações, checklist.
```

---

## Sua Interface Administrativa (`/admin`)

### Menu lateral (você vê)

```
├─ 📊 Dashboard
│  ├─ KPIs globais (tenants ativos, processos/dia, taxa aprovação)
│  ├─ Últimos eventos
│  └─ Saúde do sistema
│
├─ 🏢 Tenants
│  ├─ Listar todos
│  ├─ Criar novo
│  ├─ Ver detalhes (usuários, processos, quotas)
│  ├─ Ativar/desativar
│  └─ Reset password (suporte)
│
├─ 🚗 Manufacturers
│  ├─ Gerenciar (Volvo, Scania, Mercedes, MAN, DAF, Iveco)
│  ├─ Ver policies vigentes
│  └─ [Criar nova montadora]
│
├─ 📋 Policies
│  ├─ Listar todas (com versão, status)
│  ├─ Criar nova versão (upload JSON)
│  ├─ Publicar (marcar como "vigente")
│  ├─ Arquivar (descontinuar)
│  └─ Ver histórico de mudanças
│
├─ 📈 Analytics
│  ├─ Taxa de aprovação (global)
│  ├─ Processos por montadora
│  ├─ Uso por tenant (heatmap)
│  └─ Alertas de SLA (global)
│
├─ 🔐 Audit Log
│  ├─ Todos os acessos
│  ├─ Mudanças em policies
│  ├─ Ativações/desativações de tenant
│  └─ Filtro por data/usuário/tenant
│
├─ ⚙️ Configurações
│  ├─ Chave API OpenAI (seus limites)
│  ├─ Credenciais Cloudflare R2
│  ├─ Redis (status)
│  ├─ PostgreSQL (status)
│  └─ Email (SMTP settings para convites)
│
└─ 📞 Suporte
   ├─ Tickets de suporte (concessionárias)
   ├─ Chat em tempo real
   └─ Knowledge base
```

---

## Tabela de Acesso por Perfil

```
┌──────────────────────┬────────┬──────────┬────────┬───────────────┬──────────────────┐
│ Recurso              │ Técnico │ Gestor   │ Auditor│ Admin Tenant  │ Admin Plataforma │
├──────────────────────┼────────┼──────────┼────────┼───────────────┼──────────────────┤
│ Criar processo       │   ✅   │    ❌    │   ❌   │      ❌       │        ❌        │
│ Preencher processo   │   ✅   │    ✅    │   ❌   │      ❌       │        ❌        │
│ Aprovar processo     │   ❌   │    ✅    │   ❌   │      ❌       │        ❌        │
│ Ver processo (próprio│   ✅   │    ✅    │   ✅   │      ✅       │        ✅        │
│ Ver todo processo    │   ✅   │    ✅    │   ✅   │      ✅       │        ✅        │
│ Convidar usuários    │   ❌   │    ❌    │   ❌   │      ✅       │        ❌        │
│ Gerenciar equipe     │   ❌   │    ❌    │   ❌   │      ✅       │        ❌        │
│ Ver config tenant    │   ❌   │    ❌    │   ❌   │      ✅       │        ✅        │
│ Mudar política       │   ❌   │    ❌    │   ❌   │      ❌       │        ✅        │
│ Criar tenant         │   ❌   │    ❌    │   ❌   │      ❌       │        ✅        │
│ Ver todos tenants    │   ❌   │    ❌    │   ❌   │      ❌       │        ✅        │
│ Dashboard global     │   ❌   │    ❌    │   ❌   │      ❌       │        ✅        │
│ Audit log global     │   ❌   │    ❌    │   ❌   │      ❌       │        ✅        │
└──────────────────────┴────────┴──────────┴────────┴───────────────┴──────────────────┘
```

---

## Implementação Técnica (NestJS)

### Guards de autenticação

```typescript
// auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.user; // Valida JWT
  }
}

// role.guard.ts
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true; // Sem requisito = acessível

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.includes(user.role);
  }
}

// tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantIdFromRoute = request.params.tenantId;

    // Usuário de plataforma pode ver qualquer tenant
    if (user.role === 'admin_plataforma') return true;

    // Usuário de tenant só vê seu próprio
    return user.tenantId === tenantIdFromRoute;
  }
}
```

### Decoradores de permissão

```typescript
// controllers/tenant.controller.ts
@Controller('/tenants')
export class TenantController {
  // Criar tenant: só admin_plataforma
  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('admin_plataforma')
  createTenant(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  // Listar: admin_plataforma vê todos, admin_tenant vê só seu
  @Get()
  @UseGuards(AuthGuard)
  listTenants(@Request() req) {
    if (req.user.role === 'admin_plataforma') {
      return this.tenantService.findAll();
    }
    return this.tenantService.findById(req.user.tenantId);
  }
}
```

---

## Checklist de Setup Inicial (para você)

Antes de aceitar primeiro cliente:

- [ ] Criar conta super-admin com seu email
- [ ] Seed de 6 manufacturers (Volvo, Scania, Mercedes, MAN, DAF, Iveco)
- [ ] Policy VW Delivery 2024 (v1.0) publicada e vigente
- [ ] SMTP configurado (para enviar emails de convite)
- [ ] Chaves OpenAI + Cloudflare R2 configuradas
- [ ] Dashboard `/admin` testado (você vê tudo)
- [ ] Criar teste tenant (seu nome)
- [ ] Convidar 1 técnico de teste, 1 gestor de teste
- [ ] Criar 1 processo de teste end-to-end
- [ ] Revisar logs de auditoria (`/admin/audit-log`)

---

## Em Resumo — Seu Fluxo Diário

```
Manhã:
  → Verificar /admin dashboard (tudo ok?)
  → Ver se há novos tenants aguardando setup
  → Responder suporte de clientes (se houver escalações)

Quando cliente novo assina:
  → Ir em /admin/tenants/new
  → Preencher: nome, CNPJ, montadora, email admin
  → Sistema gera token
  → Você copia/cola no email e envia (ou sistema automatiza)
  → Pronto — concessionária faz onboarding sozinha

Quando há novo manual de garantia:
  → Ir em /admin/policies
  → Upload JSON da policy
  → Testar (versão draft)
  → Publicar (marcar vigente)
  → Novos tenants usam automaticamente

Quando há escalação técnica:
  → Você tem acesso a QUALQUER tenant (debug)
  → Pode reset de senha se necessário
  → Pode desativar acesso se houver problema de segurança
```

---

## Conclusão

**Recomendação final:**

Use a **Opção B (Manual + Admin Plataforma)** no MVP porque:

1. **Você tem controle:** Cada novo cliente = fácil verificação
2. **Simples de implementar:** Apenas 1 novo perfil (`admin_plataforma`)
3. **Segurança:** Você aprova quem entra
4. **Suporte:** Relacionamento mais próximo

**Depois (em 6-12 meses):** Evolua para self-service quando tiver 50+ clientes e processos de onboarding bem documentados.

