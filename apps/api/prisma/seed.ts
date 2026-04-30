import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed iniciado...');

  // ── Manufacturers ──────────────────────────────────────────────────────────
  const manufacturers = await Promise.all([
    prisma.manufacturer.upsert({
      where: { code: 'VOLVO' },
      update: {},
      create: { code: 'VOLVO', name: 'Volvo Trucks' },
    }),
    prisma.manufacturer.upsert({
      where: { code: 'SCANIA' },
      update: {},
      create: { code: 'SCANIA', name: 'Scania' },
    }),
    prisma.manufacturer.upsert({
      where: { code: 'MERCEDES' },
      update: {},
      create: { code: 'MERCEDES', name: 'Mercedes-Benz' },
    }),
    prisma.manufacturer.upsert({
      where: { code: 'IVECO' },
      update: {},
      create: { code: 'IVECO', name: 'Iveco' },
    }),
    prisma.manufacturer.upsert({
      where: { code: 'MAN' },
      update: {},
      create: { code: 'MAN', name: 'MAN Truck & Bus' },
    }),
    prisma.manufacturer.upsert({
      where: { code: 'DAF' },
      update: {},
      create: { code: 'DAF', name: 'DAF Trucks' },
    }),
  ]);

  const [volvo] = manufacturers;
  console.log(`✅ ${manufacturers.length} montadoras criadas`);

  // ── Policy Template + Version (Volvo mock) ─────────────────────────────────
  const volvoTemplate = await prisma.policyTemplate.upsert({
    where: { code: 'VOLVO_BR_2024' },
    update: {},
    create: {
      code: 'VOLVO_BR_2024',
      name: 'Volvo Brasil — Garantia 2024',
      description: 'Policy base para veículos Volvo no Brasil (2024)',
      manufacturerId: volvo.id,
    },
  });

  const volvoSchema = {
    manufacturer: 'VOLVO',
    policyCode: 'VOLVO_BR_2024',
    version: 'v1.0.0',
    slas: {
      prazo_abertura_dias: 30,
      prazo_analise_dias: 15,
      prazo_submissao_dias: 5,
    },
    passo1_veiculo: {
      campos_obrigatorios: ['vin', 'hodometro', 'modelo', 'sistema_afetado', 'codigo_falha'],
      validacoes: {
        vin_formato: '^[A-HJ-NPR-Z0-9]{17}$',
        hodometro_maximo: 800000,
        modelos_permitidos: ['FH', 'FM', 'FJ', 'FE', 'FL'],
      },
    },
    passo2_checklist: {
      questoes: [
        { id: 'manutencao_em_dia', pergunta: 'Manutenção preventiva em dia conforme manual?', tipo: 'boolean', impacto_sd: 15, bloqueante: false },
        { id: 'uso_autorizado', pergunta: 'Veículo usado dentro das condições de operação autorizadas?', tipo: 'boolean', impacto_sd: 10, bloqueante: false },
        { id: 'sem_modificacoes', pergunta: 'Nenhuma modificação não autorizada realizada?', tipo: 'boolean', impacto_sd: 10, bloqueante: true },
        { id: 'logs_ecu_disponíveis', pergunta: 'Logs de ECU disponíveis para análise?', tipo: 'boolean', impacto_sd: 5, bloqueante: false },
      ],
    },
    passo3_analise_tecnica: {
      campos_obrigatorios: ['sintomas', 'inspecao_inicial', 'causa_raiz', 'testes_realizados'],
      requer_imagem: true,
      sistemas_cobertos: ['motor', 'transmissao', 'suspensao', 'freios', 'eixo', 'eletrico'],
    },
    scoring: {
      peso_sd: 0.5,
      peso_st: 0.3,
      peso_sh: 0.2,
      limites_decisao: {
        aprovado_automatico: 85,
        revisao_manual_min: 40,
        revisao_manual_max: 84,
        recusado_automatico: 39,
      },
    },
  };

  await prisma.policyVersion.upsert({
    where: { id: 'seed-volvo-v1' },
    update: {},
    create: {
      id: 'seed-volvo-v1',
      policyTemplateId: volvoTemplate.id,
      versionCode: 'v1.0.0',
      status: 'ACTIVE',
      effectiveFrom: new Date('2024-01-01'),
      schemaJson: JSON.stringify(volvoSchema),
      publishedAt: new Date('2024-01-01'),
      publishedBy: 'system',
    },
  });

  console.log('✅ Policy Volvo 2024 v1.0.0 criada');

  // ── Tenant de teste ────────────────────────────────────────────────────────
  const testTenant = await prisma.tenant.upsert({
    where: { id: 'seed-tenant-demo' },
    update: {},
    create: {
      id: 'seed-tenant-demo',
      name: 'Concessionária Demo Volvo',
      cnpj: '00.000.000/0001-00',
      manufacturerId: volvo.id,
      activePolicyVersionId: 'seed-volvo-v1',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Tenant de demo criado');

  // ── Admin da plataforma (você) ─────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@warranty-audit.com' },
    update: {},
    create: {
      email: 'admin@warranty-audit.com',
      name: 'Admin Plataforma',
      password: adminPassword,
      role: 'admin_plataforma',
      status: 'ACTIVE',
    },
  });

  // ── Usuários do tenant de teste ────────────────────────────────────────────
  const demoPassword = await bcrypt.hash('demo@123', 12);

  await prisma.user.upsert({
    where: { email: 'gestor@demo.com' },
    update: {},
    create: {
      email: 'gestor@demo.com',
      name: 'Gestor Demo',
      password: demoPassword,
      role: 'gestor_garantia',
      status: 'ACTIVE',
      tenantId: testTenant.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'tecnico@demo.com' },
    update: {},
    create: {
      email: 'tecnico@demo.com',
      name: 'Técnico Demo',
      password: demoPassword,
      role: 'tecnico',
      status: 'ACTIVE',
      tenantId: testTenant.id,
    },
  });

  console.log('✅ Usuários de seed criados:');
  console.log('   admin@warranty-audit.com / admin@123 (admin_plataforma)');
  console.log('   gestor@demo.com / demo@123 (gestor_garantia)');
  console.log('   tecnico@demo.com / demo@123 (tecnico)');
  console.log('🌱 Seed concluído!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
