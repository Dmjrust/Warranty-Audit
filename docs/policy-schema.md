# Policy — Schema Completo

## Estrutura JSON

Policy define dinamicamente:
- Campos obrigatórios de cada passo
- Checklist e validações
- SLAs (prazos)
- Critérios de decisão (scoring)
- Regras de negócio por montadora

## Exemplo

```json
{
  "versao": "2024.1",
  "ativa": true,
  "slas": {
    "prazo_abertura_dias": 30,
    "prazo_analise_dias": 15
  },
  "scoring": {
    "peso_sd": 0.5,
    "peso_st": 0.3,
    "peso_sh": 0.2
  }
}
```

A política é imutável após publicação — mudanças criam nova versão.
