# RAG — Knowledge Base e Ingestão

## Visão Geral

RAG transforma GPT-4o genérico em especialista contextualizado.

Pipeline: Dados do processo → Query → Busca vetorial → Reranking → Prompt → GPT-4o

## Fontes de Conhecimento

- Manuais técnicos
- Boletins de serviço (TSB)
- Políticas de garantia
- Casos aprovados (anonimizados)
- Casos glosados (para aprendizado negativo)

## Armazenamento

Usar pgvector (extensão PostgreSQL) — sem dependência de serviço externo.

## Limite de Contexto

Máximo 3.000 tokens de documentos por análise.

## Reranking

Prioridade: TSB > Manuais > Casos > Políticas
