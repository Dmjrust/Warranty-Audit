import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.get("/api/manufacturers", async (req, res) => {
  const manufacturers = await prisma.manufacturer.findMany({
    where: { status: "ACTIVE" }
  });
  res.json(manufacturers);
});

app.get("/api/policy-templates", async (req, res) => {
  const { manufacturer_id } = req.query;
  const templates = await prisma.policyTemplate.findMany({
    where: { 
      status: "ACTIVE",
      ...(manufacturer_id ? { manufacturerId: String(manufacturer_id) } : {})
    }
  });
  res.json(templates);
});

app.get("/api/policy-versions/:id", async (req, res) => {
  const version = await prisma.policyVersion.findUnique({
    where: { id: req.params.id },
    include: { template: true }
  });
  if (!version) return res.status(404).json({ error: "Policy version not found" });
  res.json({ ...version, schemaJson: JSON.parse(version.schemaJson) });
});

app.get("/api/manufacturers/:id/active-policy", async (req, res) => {
  const template = await prisma.policyTemplate.findFirst({
    where: { manufacturerId: req.params.id, status: "ACTIVE" }
  });
  if (!template) return res.status(404).json({ error: "No active policy template found" });
  
  const version = await prisma.policyVersion.findFirst({
    where: { policyTemplateId: template.id, status: "ACTIVE" },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!version) return res.status(404).json({ error: "No active policy version found" });
  res.json({ ...version, schemaJson: JSON.parse(version.schemaJson) });
});

app.post("/api/tenants", async (req, res) => {
  const { name } = req.body;
  const tenant = await prisma.tenant.create({
    data: { name }
  });
  res.json(tenant);
});

app.get("/api/tenants/:id", async (req, res) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.params.id },
    include: { manufacturer: true }
  });
  res.json(tenant);
});

app.patch("/api/tenants/:id/setup", async (req, res) => {
  const { manufacturerId } = req.body;
  
  // Find active policy for this manufacturer
  const template = await prisma.policyTemplate.findFirst({
    where: { manufacturerId, status: "ACTIVE" }
  });
  
  if (!template) return res.status(400).json({ error: "No active policy template for this manufacturer" });
  
  const version = await prisma.policyVersion.findFirst({
    where: { policyTemplateId: template.id, status: "ACTIVE" },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!version) return res.status(400).json({ error: "No active policy version for this template" });
  
  const tenant = await prisma.tenant.update({
    where: { id: req.params.id },
    data: {
      manufacturerId,
      activePolicyTemplateId: template.id,
      activePolicyVersionId: version.id
    }
  });
  
  res.json(tenant);
});

app.get("/api/processes", async (req, res) => {
  const processes = await prisma.processInstance.findMany({
    include: {
      policyVersion: {
        include: {
          template: {
            include: {
              manufacturer: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(processes);
});

app.get("/api/stats/historical-score", async (req, res) => {
  const { manufacturer, category, component } = req.query;
  
  if (!manufacturer) return res.status(400).json({ error: "Manufacturer is required" });

  const allProcesses = await prisma.processInstance.findMany({
    where: { status: "PRONTO_SUBMISSAO" }, // Or approved/rejected if we had those statuses set
    include: {
      policyVersion: {
        include: {
          template: {
            include: {
              manufacturer: true
            }
          }
        }
      }
    }
  });

  const parsedProcesses = allProcesses.map(p => ({
    ...p,
    vehicleData: p.vehicleDataJson ? JSON.parse(p.vehicleDataJson) : {},
    scoringResult: p.scoringResultJson ? JSON.parse(p.scoringResultJson) : {}
  }));

  let filtered = parsedProcesses.filter(p => 
    p.policyVersion.template.manufacturer.name === manufacturer &&
    p.vehicleData.naturezaFalha === category &&
    p.vehicleData.componentePrincipal === component
  );

  let count = filtered.length;
  let fallbackUsed = false;

  if (count < 5) { // Lower threshold for demo purposes
    filtered = parsedProcesses.filter(p => 
      p.policyVersion.template.manufacturer.name === manufacturer &&
      p.vehicleData.naturezaFalha === category
    );
    count = filtered.length;
    fallbackUsed = true;
  }

  // Calculate probability based on points/score in scoringResultJson if available
  // For now, let's simulate a success rate or use a default if count is low
  let probability = 0.75; // Default "Optimistic" for new systems
  if (count > 0) {
    const totalScore = filtered.reduce((acc, p) => acc + (p.scoringResult.confidence || 70), 0);
    probability = (totalScore / count) / 100;
  }

  res.json({
    probability,
    count,
    fallbackUsed,
    insufficient: count < 3
  });
});

app.get("/api/processes", async (req, res) => {
  const processes = await prisma.processInstance.findMany({
    include: {
      policyVersion: {
        include: {
          template: {
            include: {
              manufacturer: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(processes);
});

app.get("/api/stats/historical-score", async (req, res) => {
  const { manufacturer, category, component } = req.query;
  
  if (!manufacturer) return res.status(400).json({ error: "Manufacturer is required" });

  const allProcesses = await prisma.processInstance.findMany({
    where: { status: "PRONTO_SUBMISSAO" }, // Or approved/rejected if we had those statuses set
    include: {
      policyVersion: {
        include: {
          template: {
            include: {
              manufacturer: true
            }
          }
        }
      }
    }
  });

  const parsedProcesses = allProcesses.map(p => ({
    ...p,
    vehicleData: p.vehicleDataJson ? JSON.parse(p.vehicleDataJson) : {},
    scoringResult: p.scoringResultJson ? JSON.parse(p.scoringResultJson) : {}
  }));

  let filtered = parsedProcesses.filter(p => 
    p.policyVersion.template.manufacturer.name === manufacturer &&
    p.vehicleData.naturezaFalha === category &&
    p.vehicleData.componentePrincipal === component
  );

  let count = filtered.length;
  let fallbackUsed = false;

  if (count < 5) { // Lower threshold for demo purposes
    filtered = parsedProcesses.filter(p => 
      p.policyVersion.template.manufacturer.name === manufacturer &&
      p.vehicleData.naturezaFalha === category
    );
    count = filtered.length;
    fallbackUsed = true;
  }

  // Calculate probability based on points/score in scoringResultJson if available
  // For now, let's simulate a success rate or use a default if count is low
  let probability = 0.75; // Default "Optimistic" for new systems
  if (count > 0) {
    const totalScore = filtered.reduce((acc, p) => acc + (p.scoringResult.confidence || 70), 0);
    probability = (totalScore / count) / 100;
  }

  res.json({
    probability,
    count,
    fallbackUsed,
    insufficient: count < 3
  });
});

app.post("/api/processes", async (req, res) => {
  const { tenantId } = req.body;
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });
  
  if (!tenant || !tenant.activePolicyVersionId) {
    return res.status(400).json({ error: "Tenant not set up with an active policy" });
  }
  
  const process = await prisma.processInstance.create({
    data: {
      tenantId,
      policyVersionId: tenant.activePolicyVersionId,
      status: "DRAFT",
      currentStep: "VEHICLE"
    }
  });
  
  res.json(process);
});

app.get("/api/processes/:id", async (req, res) => {
  const process = await prisma.processInstance.findUnique({
    where: { id: req.params.id },
    include: { policyVersion: true }
  });
  
  if (!process) return res.status(404).json({ error: "Process not found" });
  
  res.json({
    ...process,
    policyVersion: {
      ...process.policyVersion,
      schemaJson: JSON.parse(process.policyVersion.schemaJson)
    }
  });
});

app.patch("/api/processes/:id", async (req, res) => {
  const { 
    status, 
    currentStep, 
    vehicleDataJson, 
    checklistDataJson, 
    analysisDataJson, 
    scoringResultJson, 
    decisionResultJson 
  } = req.body;
  
  const process = await prisma.processInstance.update({
    where: { id: req.params.id },
    data: {
      status,
      currentStep,
      vehicleDataJson: vehicleDataJson ? JSON.stringify(vehicleDataJson) : undefined,
      checklistDataJson: checklistDataJson ? JSON.stringify(checklistDataJson) : undefined,
      analysisDataJson: analysisDataJson ? JSON.stringify(analysisDataJson) : undefined,
      scoringResultJson: scoringResultJson ? JSON.stringify(scoringResultJson) : undefined,
      decisionResultJson: decisionResultJson ? JSON.stringify(decisionResultJson) : undefined,
    }
  });
  
  res.json(process);
});

app.patch("/api/processes/:id", async (req, res) => {
  const { 
    status, 
    currentStep, 
    vehicleDataJson, 
    checklistDataJson, 
    analysisDataJson, 
    scoringResultJson, 
    decisionResultJson 
  } = req.body;
  
  const process = await prisma.processInstance.update({
    where: { id: req.params.id },
    data: {
      status,
      currentStep,
      vehicleDataJson: vehicleDataJson ? JSON.stringify(vehicleDataJson) : undefined,
      checklistDataJson: checklistDataJson ? JSON.stringify(checklistDataJson) : undefined,
      analysisDataJson: analysisDataJson ? JSON.stringify(analysisDataJson) : undefined,
      scoringResultJson: scoringResultJson ? JSON.stringify(scoringResultJson) : undefined,
      decisionResultJson: decisionResultJson ? JSON.stringify(decisionResultJson) : undefined,
    }
  });
  
  res.json(process);
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
