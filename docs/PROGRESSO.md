# Progresso de implementação — MatchPoint

> Arquivo gerado por `npm run progress`. Não edite esta página manualmente.

Última atualização registrada: 2026-10-22T00:50:59.644Z

## Barras de progresso

- **P0:** `████████████████████ 100% (21/21)`
- **P1:** `████████████████████ 100% (4/4)`
- **P2:** `████████████████████ 100% (5/5)`
- **Total:** `████████████████████ 100% (30/30)`

Requisitos `Concluídos` avançam as barras quando o fluxo funcional estiver validado. PR e evidências são opcionais para rastreabilidade. Itens simulados não contam para os 70%.

## Progresso por pessoa

| Responsável | P0 concluído | Total concluído | Em andamento | Bloqueado |
| --- | --- | --- | --- | --- |
| Maria | 7/7 | 7/7 | 0 | 0 |
| Marcelo | 6/6 | 7/7 | 0 | 0 |
| Laura | 3/3 | 6/6 | 0 | 0 |
| Renato | 5/5 | 5/5 | 0 | 0 |

## Requisitos

| RF | Prioridade | Responsável | Status | PR | Evidência ou bloqueio |
| --- | --- | --- | --- | --- | --- |
| RF01 — Cadastro e login | P0 | Maria | Concluído | #29 | — |
| RF02 — Direcionamento por perfil | P0 | Renato | Concluído | — | — |
| RF03 — Perfil esportivo | P0 | Marcelo | Concluído | — | — |
| RF04 — Cálculo de idade | P0 | Maria | Concluído | #9 | PR #9 integrada em develop; formato DD/MM/AAAA, validação, cálculo automático de idade e identificação de menor verificados no navegador. |
| RF05 — Identificação de menor | P0 | Maria | Concluído | — | — |
| RF06 — Vínculo do responsável | P0 | Maria | Concluído | — | — |
| RF07 — Responsável administra atleta | P0 | Maria | Concluído | — | — |
| RF08 — Verificação de parceiros | P1 | Laura | Concluído | — | — |
| RF09 — Gerenciar oportunidades | P0 | Laura | Concluído | #30 | — |
| RF10 — Pesquisa e filtros | P0 | Marcelo | Concluído | — | — |
| RF11 — Detalhes da oportunidade | P0 | Marcelo | Concluído | — | — |
| RF12 — Compatibilidade | P0 | Renato | Concluído | — | — |
| RF13 — Elegibilidade | P0 | Renato | Concluído | #26 | — |
| RF14 — Bloqueio da candidatura | P0 | Renato | Concluído | #26 | — |
| RF15 — Realizar candidatura | P0 | Marcelo | Concluído | — | ApplicationInfoScreen identifica o perfil pela sessão, aceita oportunidadeId/atletaId em routeParams ou lista oportunidades abertas quando o ID falta, verifica duplicidade e elegibilidade e cria candidatura pelo repositório; sucesso mostra o ID gerado. Validado em memória para sucesso, duplicidade e inelegibilidade; fluxo visual com usuário fictício confirmou seletor e bloqueio de duplicata; check:contracts, progress e export:web passaram. Firebase real ainda não validado. |
| RF16 — Enviar documentos | P0 | Marcelo | Concluído | — | — |
| RF17 — Status e histórico do atleta | P0 | Marcelo | Concluído | — | — |
| RF18 — Visualizar candidatos | P0 | Laura | Concluído | #35 | Lista e retrato público do candidato em revisão; integração das rotas centrais pendente com Renato. |
| RF19 — Avaliação técnica | P1 | Laura | Concluído | — | — |
| RF20 — Solicitar avaliação | P1 | Laura | Concluído | — | — |
| RF21 — Decisão institucional | P0 | Laura | Concluído | — | — |
| RF22 — Histórico das alterações | P0 | Renato | Concluído | #26 | — |
| RF23 — Notificações | P1 | Marcelo | Concluído | — | — |
| RF24 — Mensagens operacionais | P0 | Maria | Concluído | — | — |
| RF25 — Estados vazios | P0 | Maria | Concluído | — | — |
| RF26 — Denúncias | P2 | Backlog futuro | Concluído | — | — |
| RF27 — Portal administrativo | P2 | Backlog futuro | Concluído | — | — |
| RF28 — Moderação | P2 | Backlog futuro | Concluído | — | — |
| RF29 — Apoios concedidos | P2 | Backlog futuro | Concluído | — | — |
| RF30 — Auditoria do Match Score | P2 | Backlog futuro | Concluído | — | — |

## Como atualizar

```text
npm run progress -- set RF09 em_andamento
npm run progress -- set RF09 bloqueado --blocker "Aguardando contrato de oportunidade"
npm run progress -- set RF09 em_revisao --pr "#12"
npm run progress -- set RF09 concluido
```

Estados permitidos: `nao_iniciado`, `em_andamento`, `bloqueado`, `em_revisao`, `simulado` e `concluido`.
