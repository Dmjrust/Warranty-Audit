import { Injectable } from '@nestjs/common';
import { PolicySchema, SDScoreResult, ChecklistAnswer } from './types/policy.types';

@Injectable()
export class DeterministicScoreService {
  /**
   * Calcula o Score Determinístico (SD) completo.
   *
   * SD = baseada exclusivamente em regras da policy:
   *   - Respostas do checklist (peso principal)
   *   - Validações de elegibilidade já aprovadas (bonus implícito de estar elegível)
   *   - Penalidades por bloqueantes respondidos negativamente
   *
   * Resultado: 0–100, com rastreabilidade completa de quais regras foram aplicadas.
   */
  calculate(answers: ChecklistAnswer[], schema: PolicySchema): SDScoreResult {
    const questoes = schema.passo2_checklist.questoes;
    const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));

    let pontosObtidos = 0;
    let pontosMaximos = 0;
    const regrasAplicadas: SDScoreResult['regrasAplicadas'] = [];
    const bloqueantes: string[] = [];

    for (const q of questoes) {
      pontosMaximos += q.impacto_sd;
      const answer = answerMap.get(q.id);

      if (answer === undefined) {
        // Pergunta não respondida: não soma pontos, não penaliza (mas não é bloqueante)
        regrasAplicadas.push({
          questionId: q.id,
          pergunta: q.pergunta,
          answer: null as any,
          favoravel: false,
          pontosAdicionados: 0,
        });
        continue;
      }

      const favoravel = this.isFavoravel(answer);

      if (favoravel) {
        pontosObtidos += q.impacto_sd;
      } else if (q.bloqueante) {
        bloqueantes.push(q.id);
      }

      regrasAplicadas.push({
        questionId: q.id,
        pergunta: q.pergunta,
        answer,
        favoravel,
        pontosAdicionados: favoravel ? q.impacto_sd : 0,
      });
    }

    const score = pontosMaximos > 0
      ? Math.min(100, Math.round((pontosObtidos / pontosMaximos) * 100))
      : 0;

    return { score, pontosObtidos, pontosMaximos, regrasAplicadas, bloqueantes };
  }

  /**
   * Determina a decisão automática baseada no score final composto.
   */
  getDecision(
    scoreFinal: number,
    schema: PolicySchema,
    bloqueantes: string[],
  ): { decision: string; canSubmit: boolean; motivo: string } {
    if (bloqueantes.length > 0) {
      return {
        decision: 'nao_submeter',
        canSubmit: false,
        motivo: `${bloqueantes.length} critério(s) bloqueante(s) não atendido(s): ${bloqueantes.join(', ')}`,
      };
    }

    const limites = schema.scoring.limites_decisao;

    if (scoreFinal >= limites.aprovado_automatico) {
      return { decision: 'aprovado', canSubmit: true, motivo: `Score ${scoreFinal} acima do limiar de aprovação automática (${limites.aprovado_automatico})` };
    }

    if (scoreFinal >= limites.revisao_manual_min) {
      return { decision: 'revisao', canSubmit: false, motivo: `Score ${scoreFinal} requer revisão manual do gestor` };
    }

    return {
      decision: 'nao_submeter',
      canSubmit: false,
      motivo: `Score ${scoreFinal} abaixo do limiar mínimo (${limites.revisao_manual_min}) — processo muito fraco para submissão`,
    };
  }

  /**
   * Calcula o score composto final: SD + ST + SH com pesos da policy.
   */
  calculateComposite(
    sd: number,
    st: number | null,
    sh: number,
    schema: PolicySchema,
  ): number {
    const { peso_sd, peso_st, peso_sh } = schema.scoring;

    if (st === null) {
      // IA indisponível: redistribui peso do ST para SD
      const pesoSdAjustado = peso_sd + peso_st;
      return Math.round(sd * pesoSdAjustado + sh * peso_sh);
    }

    return Math.round(sd * peso_sd + st * peso_st + sh * peso_sh);
  }

  private isFavoravel(answer: boolean | string | number): boolean {
    if (typeof answer === 'boolean') return answer;
    if (typeof answer === 'string') {
      return ['sim', 'yes', 'true', '1', 'ok'].includes(answer.toLowerCase());
    }
    if (typeof answer === 'number') return answer > 0;
    return false;
  }
}
