import { Injectable, Logger } from '@nestjs/common';
import { Gpt4oService, Gpt4oAnalysisResult } from './gpt4o.service';
import { RagEngineService } from './rag-engine.service';

export interface AnalysisRequest {
  montadoraId: string;
  montadoraNome: string;
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
  imageUrls?: string[];
}

export interface AnalysisOutput {
  scoreTecnico: number | null;
  consistencia: string | null;
  pontosFortes: string[];
  lacunas: string[];
  recomendacoes: string[];
  justificativaTecnica: string | null;
  nivelConfianca: string | null;
  ragChunkIds: string[];
  error?: string;
}

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);

  constructor(
    private gpt4o: Gpt4oService,
    private ragEngine: RagEngineService,
  ) {}

  async analyze(req: AnalysisRequest): Promise<AnalysisOutput> {
    let ragChunkIds: string[] = [];
    let ragContext = '';

    try {
      const ragResult = await this.ragEngine.retrieve({
        montadoraId: req.montadoraId,
        sistema: req.sistema,
        sintomas: req.sintomas,
        causaRaiz: req.causaRaiz,
        codigosFalha: req.codigosFalha,
      });
      ragContext = ragResult.context;
      ragChunkIds = ragResult.chunkIds;
    } catch (err: any) {
      this.logger.warn(`RAG step failed: ${err.message}`);
    }

    try {
      const result: Gpt4oAnalysisResult = await this.gpt4o.analyze({
        ragContext,
        processData: {
          montadora: req.montadoraNome,
          modeloVeiculo: req.modeloVeiculo,
          anoFabricacao: req.anoFabricacao,
          hodometro: req.hodometro,
          sistema: req.sistema,
          codigosFalha: req.codigosFalha,
          sintomas: req.sintomas,
          inspecaoInicial: req.inspecaoInicial,
          testesRealizados: req.testesRealizados,
          causaRaiz: req.causaRaiz,
          historicoIntervencoes: req.historicoIntervencoes,
          checklistRespostas: req.checklistRespostas,
        },
        imageUrls: req.imageUrls,
      });

      // ST > 80 requires at least one image — enforce cap
      let scoreTecnico = Math.min(100, Math.max(0, result.score_tecnico ?? 0));
      if (scoreTecnico > 80 && (!req.imageUrls?.length)) {
        scoreTecnico = 80;
      }

      return {
        scoreTecnico,
        consistencia: result.consistencia_diagnostico,
        pontosFortes: result.pontos_fortes ?? [],
        lacunas: result.lacunas_identificadas ?? [],
        recomendacoes: result.recomendacoes ?? [],
        justificativaTecnica: result.justificativa_tecnica,
        nivelConfianca: result.nivel_confianca,
        ragChunkIds,
      };
    } catch (err: any) {
      this.logger.error(`AI analysis failed: ${err.message}`);
      return {
        scoreTecnico: null,
        consistencia: null,
        pontosFortes: [],
        lacunas: [],
        recomendacoes: [],
        justificativaTecnica: null,
        nivelConfianca: null,
        ragChunkIds,
        error: err.message,
      };
    }
  }
}
