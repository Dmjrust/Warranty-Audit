import { Injectable, Logger } from '@nestjs/common';

export interface Gpt4oAnalysisInput {
  ragContext: string;
  processData: {
    montadora: string;
    modeloVeiculo: string;
    anoFabricacao?: string;
    hodometro?: number;
    sistema: string;
    codigosFalha?: string;
    sintomas: string;
    inspecaoInicial: string;
    testesRealizados?: string;
    causaRaiz: string;
    historicoIntervencoes?: string;
    checklistRespostas?: string;
  };
  imageUrls?: string[];
}

export interface Gpt4oAnalysisResult {
  score_tecnico: number;
  consistencia_diagnostico: 'aprovado' | 'inconsistente' | 'insuficiente';
  pontos_fortes: string[];
  lacunas_identificadas: string[];
  recomendacoes: string[];
  justificativa_tecnica: string;
  nivel_confianca: 'alto' | 'medio' | 'baixo';
  motivo_confianca: string;
}

@Injectable()
export class Gpt4oService {
  private readonly logger = new Logger(Gpt4oService.name);

  async analyze(input: Gpt4oAnalysisInput): Promise<Gpt4oAnalysisResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set — returning null analysis');
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { AI_SYSTEM_PROMPT } = await import('./prompts/system-prompt');
    const userMessage = this.buildUserMessage(input);

    const messages: any[] = [
      { role: 'system', content: AI_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    return JSON.parse(raw) as Gpt4oAnalysisResult;
  }

  private buildUserMessage(input: Gpt4oAnalysisInput): any {
    const { ragContext, processData: d } = input;

    const textContent = `## Documentos técnicos de referência

${ragContext || 'Nenhum documento técnico específico recuperado para este processo.'}

---

## Dados do processo de garantia

- Montadora: ${d.montadora}
- Modelo/aplicação: ${d.modeloVeiculo}
- Ano de fabricação: ${d.anoFabricacao ?? 'não informado'}
- Hodômetro: ${d.hodometro != null ? `${d.hodometro} km` : 'não informado'}
- Sistema afetado: ${d.sistema}
- Código(s) de falha: ${d.codigosFalha ?? 'não informado'}
- Sintomas relatados pelo operador: ${d.sintomas}
- Resultado da inspeção inicial: ${d.inspecaoInicial}
- Testes realizados: ${d.testesRealizados ?? 'não informado'}
- Causa raiz apontada pelo técnico: ${d.causaRaiz}
- Histórico de intervenções anteriores: ${d.historicoIntervencoes ?? 'não informado'}
- Respostas do checklist de elegibilidade: ${d.checklistRespostas ?? 'não disponível'}

## Evidências visuais

${input.imageUrls?.length ? `${input.imageUrls.length} imagem(ns) anexada(s).` : 'Nenhuma imagem de evidência fornecida.'}

---

Analise este processo conforme suas instruções e retorne o JSON de avaliação.`;

    return textContent;
  }
}
