# Modelo de Score Composto

## Definição

Score Final = (SD × 0.5) + (ST × 0.3) + (SH × 0.2)

Onde:
- **SD**: Score Determinístico (regras da policy)
- **ST**: Score Técnico (análise GPT-4o com RAG)
- **SH**: Score Histórico (aprovações/glosas do tenant)

## Decisão Automática

- **≥ 85**: Aprovado automático
- **40–84**: Suspenso (análise manual)
- **< 40**: Recusado automático

## Rastreabilidade

Todo score armazena regras aplicadas, pesos, versão da policy e chunks RAG utilizados.
