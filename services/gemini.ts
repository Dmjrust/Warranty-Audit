
import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. AI features will be disabled.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
  }
  return aiInstance;
};

export interface AIAuditFeedback {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestions: string[];
  rejectionReasonProbability: string;
  visualCheck?: string;
}

export interface AIFailureGuidance {
  sintomasSugeridos: string;
  causaRaizProvavel: string;
  testesRecomendados: string;
  scoreAprovação: number;
  statusRisco: 'BAIXO RISCO' | 'MÉDIO RISCO' | 'ALTA PROBABILIDADE DE RECUSA';
  pontosDeAtencao: {
    tipo: 'CRÍTICO' | 'ALERTA';
    titulo: string;
    descricao: string;
    impacto: number;
    acaoCorretiva: string;
  }[];
}

export const preAnalyzeFailureImage = async (
  evidence: { 
    images: string[], 
    ecuData?: string | null, 
    dtcCodes?: string,
    verbalization?: string,
    sintomas?: string
  },
  policySchema?: any
): Promise<AIFailureGuidance> => {
  try {
    const parts: any[] = [];
    
    // Policy context
    let policyPrompt = "";
    if (policySchema) {
      policyPrompt = `
        Considere a seguinte política técnica do fabricante (${policySchema.manufacturer}):
        ${JSON.stringify(policySchema.audit?.pode_ser_omitido || "Sem restrições específicas")}.
        Verifique se as evidências enviadas (fotos, logs) são suficientes conforme esta política.
      `;
    }

    const textPart = {
      text: `
        Você é um auditor sênior de garantia automotiva. 
        Analise as evidências fornecidas desta falha (fotos, logs de ECU, DTCs).
        
        CONTEXTO ADICIONAL:
        - Verbalização do Cliente: ${evidence.verbalization || "N/A"}
        - Sintomas na Oficina: ${evidence.sintomas || "N/A"}
        - Códigos de Falha (DTC): ${evidence.dtcCodes || "N/A"}
        ${policyPrompt}

        Determine: 
        1. Sintomas sugeridos para o laudo.
        2. Causa raiz provável baseada na evidência visual e técnica.
        3. Testes adicionais recomendados para confirmar a falha.
        4. Score de aprovação técnica (0-100) - quão sólida é a evidência para garantia.
        5. Status de risco.
        6. Pontos de atenção detalhados (Alerta ou Crítico), com impacto no score e ação corretiva.
        
        Se a imagem parecer ser de uma peça com dano externo, negligência ou desgaste natural, penalize no score.
        Responda obrigatoriamente em JSON em português.
      `
    };
    parts.push(textPart);

    // Add images
    evidence.images.forEach(img => {
      const base64Data = img.split(',')[1] || img;
      parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
    });

    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sintomasSugeridos: { type: Type.STRING },
            causaRaizProvavel: { type: Type.STRING },
            testesRecomendados: { type: Type.STRING },
            scoreAprovação: { type: Type.NUMBER },
            statusRisco: { type: Type.STRING },
            pontosDeAtencao: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tipo: { type: Type.STRING },
                  titulo: { type: Type.STRING },
                  descricao: { type: Type.STRING },
                  impacto: { type: Type.NUMBER },
                  acaoCorretiva: { type: Type.STRING }
                }
              }
            }
          },
          required: ["sintomasSugeridos", "causaRaizProvavel", "testesRecomendados", "scoreAprovação", "statusRisco", "pontosDeAtencao"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Pre-analysis failed:", error);
    throw error;
  }
};

export const analyzeTechnicalDescription = async (
  sintomas: string, 
  causaRaiz: string, 
  testes: string,
  imagePath?: string // base64 encoded string
): Promise<AIAuditFeedback> => {
  try {
    const promptText = `
      Você é um engenheiro sênior de garantia de caminhões. 
      Analise o seguinte diagnóstico:
      - SINTOMAS: ${sintomas}
      - CAUSA RAIZ: ${causaRaiz}
      - TESTES: ${testes}
      
      Avalie se o diagnóstico é plausível. Se houver uma imagem anexa, verifique se o dano visual condiz com a causa raiz descrita.
      Retorne sugestões para evitar a rejeição pela montadora.
    `;

    const parts: any[] = [{ text: promptText }];

    if (imagePath) {
      const base64Data = imagePath.split(',')[1] || imagePath;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      });
    }

    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, description: "LOW, MEDIUM, or HIGH" },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            rejectionReasonProbability: { type: Type.STRING },
            visualCheck: { type: Type.STRING, description: "Breve análise do que foi visto na imagem, se fornecida." }
          },
          required: ["riskLevel", "suggestions", "rejectionReasonProbability"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      riskLevel: 'MEDIUM',
      suggestions: ["Erro ao processar análise técnica. Verifique a conexão."],
      rejectionReasonProbability: "Não foi possível validar os dados técnicos no momento."
    };
  }
};
