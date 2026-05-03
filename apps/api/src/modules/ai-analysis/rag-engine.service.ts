import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

export interface RagQuery {
  montadoraId: string;
  sistema: string;
  sintomas: string;
  causaRaiz: string;
  codigosFalha?: string;
}

interface RagChunk {
  id: string;
  titulo: string;
  conteudo: string;
  fonte: string;
  sistema: string;
  similarity: number;
}

const FONTE_PRIORITY: Record<string, number> = {
  boletim_servico: 1,
  manual_tecnico: 2,
  caso_aprovado: 3,
  caso_glosado: 4,
  policy: 5,
};

const MAX_CONTEXT_CHARS = 12000;

@Injectable()
export class RagEngineService {
  private readonly logger = new Logger(RagEngineService.name);

  constructor(
    private prisma: PrismaService,
    private embedding: EmbeddingService,
  ) {}

  async retrieve(query: RagQuery): Promise<{ context: string; chunkIds: string[] }> {
    try {
      const queryText = `${query.sistema} ${query.sintomas} ${query.causaRaiz} ${query.codigosFalha ?? ''}`.trim();
      const vector = await this.embedding.embed(queryText);
      const vectorStr = this.embedding.formatForPgvector(vector);

      const chunks = await this.prisma.$queryRaw<RagChunk[]>`
        SELECT
          id,
          titulo,
          conteudo,
          fonte,
          sistema,
          1 - (embedding <=> ${vectorStr}::vector) AS similarity
        FROM rag_documents
        WHERE
          "manufacturerId" = ${query.montadoraId}
          AND embedding IS NOT NULL
          AND ("vigenteAte" IS NULL OR "vigenteAte" > now())
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT 15
      `;

      const reranked = this.rerank(chunks);
      const trimmed = this.trimToLimit(reranked);

      const context = trimmed
        .map((c) => `### ${c.titulo} (${c.fonte})\n${c.conteudo}`)
        .join('\n\n---\n\n');

      return { context, chunkIds: trimmed.map((c) => c.id) };
    } catch (err: any) {
      this.logger.warn(`RAG retrieval failed: ${err.message} — proceeding without context`);
      return { context: '', chunkIds: [] };
    }
  }

  private rerank(chunks: RagChunk[]): RagChunk[] {
    return [...chunks].sort((a, b) => {
      const pa = FONTE_PRIORITY[a.fonte] ?? 99;
      const pb = FONTE_PRIORITY[b.fonte] ?? 99;
      if (pa !== pb) return pa - pb;
      return b.similarity - a.similarity;
    });
  }

  private trimToLimit(chunks: RagChunk[]): RagChunk[] {
    const result: RagChunk[] = [];
    let total = 0;
    for (const chunk of chunks) {
      if (total + chunk.conteudo.length > MAX_CONTEXT_CHARS) break;
      result.push(chunk);
      total += chunk.conteudo.length;
    }
    return result;
  }
}
