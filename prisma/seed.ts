import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed started...');

  // Manufacturers
  const volvo = await prisma.manufacturer.upsert({
    where: { code: 'VOLVO' },
    update: {},
    create: { code: 'VOLVO', name: 'Volvo Trucks' },
  });

  const iveco = await prisma.manufacturer.upsert({
    where: { code: 'IVECO' },
    update: {},
    create: { code: 'IVECO', name: 'Iveco' },
  });

  const daf = await prisma.manufacturer.upsert({
    where: { code: 'DAF' },
    update: {},
    create: { code: 'DAF', name: 'DAF Trucks' },
  });

  // Policy Templates
  const volvoTemplate = await prisma.policyTemplate.upsert({
    where: { code: 'VOLVO_BR_BASE' },
    update: {},
    create: {
      code: 'VOLVO_BR_BASE',
      name: 'Volvo Brasil Base',
      description: 'Política padrão para Volvo no Brasil',
      manufacturerId: volvo.id,
    },
  });

  const ivecoTemplate = await prisma.policyTemplate.upsert({
    where: { code: 'IVECO_BR_BASE' },
    update: {},
    create: {
      code: 'IVECO_BR_BASE',
      name: 'Iveco Brasil Base',
      description: 'Política padrão para Iveco no Brasil',
      manufacturerId: iveco.id,
    },
  });

  const dafTemplate = await prisma.policyTemplate.upsert({
    where: { code: 'DAF_BR_BASE' },
    update: {},
    create: {
      code: 'DAF_BR_BASE',
      name: 'DAF Brasil Base',
      description: 'Política padrão para DAF no Brasil',
      manufacturerId: daf.id,
    },
  });

  // Policy Versions (Active)
  const volvoSchema = {
    manufacturer: "VOLVO",
    policy_code: "VOLVO_BR_BASE",
    version: "v1",
    steps: {
      vehicle: {
        title: "Veículo Volvo",
        fields: [
          { name: "vin", label: "VIN", type: "text", required: true },
          { name: "current_km", label: "Hodômetro", type: "number", required: true },
          { name: "engine_hours", label: "Horas de Motor", type: "number", required: true }
        ]
      },
      checklist: {
        title: "Checklist Volvo",
        questions: [
          { id: "maintenance_up_to_date", label: "Manutenção preventiva em dia?", type: "boolean", required: true },
          { id: "ecu_logs_present", label: "Logs de ECU anexados?", type: "boolean", required: true }
        ]
      },
      audit: {
        title: "Parâmetros de Auditoria",
        scoring: {
          weights: { deterministic: 0.35, technical_ai: 0.45, historical: 0.20 },
          thresholds: { approved: 80, review: 60 }
        }
      }
    }
  };

  const ivecoSchema = { ...volvoSchema, manufacturer: "IVECO", policy_code: "IVECO_BR_BASE", steps: { ...volvoSchema.steps, vehicle: { ...volvoSchema.steps.vehicle, title: "Veículo Iveco", fields: volvoSchema.steps.vehicle.fields.filter(f => f.name !== 'engine_hours') } } };
  const dafSchema = { ...volvoSchema, manufacturer: "DAF", policy_code: "DAF_BR_BASE", steps: { ...volvoSchema.steps, vehicle: { ...volvoSchema.steps.vehicle, title: "Veículo DAF" } } };

  await prisma.policyVersion.create({
    data: {
      policyTemplateId: volvoTemplate.id,
      versionCode: 'v1.0.0',
      status: 'ACTIVE',
      schemaJson: JSON.stringify(volvoSchema),
      effectiveFrom: new Date(),
    }
  });

  await prisma.policyVersion.create({
    data: {
      policyTemplateId: ivecoTemplate.id,
      versionCode: 'v1.0.0',
      status: 'ACTIVE',
      schemaJson: JSON.stringify(ivecoSchema),
      effectiveFrom: new Date(),
    }
  });

  await prisma.policyVersion.create({
    data: {
      policyTemplateId: dafTemplate.id,
      versionCode: 'v1.0.0',
      status: 'ACTIVE',
      schemaJson: JSON.stringify(dafSchema),
      effectiveFrom: new Date(),
    }
  });

  console.log('Seed finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
