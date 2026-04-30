# Arquitetura do Sistema

## Visão Geral

Centrada no Policy Engine que controla dinamicamente todo o comportamento do sistema.

## Três Camadas Principais

- **Policy Engine**: Controla workflow, checklist, validações, versionado
- **Workflow de Auditoria**: 4 Passos gerados dinamicamente pela policy ativa
- **Inteligência**: GPT-4o + RAG (complementar, nunca substitui a policy)

## Modelo de Dados

- **Tenant**: Concessionária isolada
- **Montadora**: Fabricante com múltiplas policies versionadas
- **Policy**: Versão do manual de garantia
- **Warranty Process**: Auditoria de um veículo/falha
- **Score**: Resultado composto (SD + ST + SH)

## Versionamento

Processos históricos referenciam a policy vigente no momento da criação. Mudanças de policy não afetam retroativamente processos antigos.
