# Progresso de implementação — MatchPoint

> Arquivo gerado por `npm run progress`. Não edite esta página manualmente.

Última atualização registrada: 2026-10-16T16:18:58.215Z

## Barras de progresso

- **P0:** `█░░░░░░░░░░░░░░░░░░░ 5% (1/21)`
- **P1:** `░░░░░░░░░░░░░░░░░░░░ 0% (0/4)`
- **P2:** `░░░░░░░░░░░░░░░░░░░░ 0% (0/5)`
- **Total:** `█░░░░░░░░░░░░░░░░░░░ 3% (1/30)`

Somente requisitos `Concluídos`, com PR e evidência, avançam as barras. Itens simulados não contam para os 70%.

## Progresso por pessoa

| Responsável | P0 concluído | Total concluído | Em andamento | Bloqueado |
| --- | --- | --- | --- | --- |
| Maria | 1/7 | 1/7 | 1 | 2 |
| Marcelo | 0/6 | 0/7 | 0 | 0 |
| Laura | 0/3 | 0/6 | 0 | 0 |
| Renato | 0/5 | 0/5 | 5 | 0 |

## Requisitos

| RF | Prioridade | Responsável | Status | PR | Evidência ou bloqueio |
| --- | --- | --- | --- | --- | --- |
| RF01 — Cadastro e login | P0 | Maria | Em andamento | — | — |
| RF02 — Direcionamento por perfil | P0 | Renato | Em andamento | — | — |
| RF03 — Perfil esportivo | P0 | Marcelo | Não iniciado | — | — |
| RF04 — Cálculo de idade | P0 | Maria | Concluído | #9 | PR #9 integrada em develop; formato DD/MM/AAAA, validação, cálculo automático de idade e identificação de menor verificados no navegador. |
| RF05 — Identificação de menor | P0 | Maria | Bloqueado | — | Aguardando contrato e operação de convite/código e vínculo do responsável no repositório; sem isso não é possível ativar o fluxo de menor de forma segura. |
| RF06 — Vínculo do responsável | P0 | Maria | Não iniciado | — | — |
| RF07 — Responsável administra atleta | P0 | Maria | Não iniciado | — | — |
| RF08 — Verificação de parceiros | P1 | Laura | Não iniciado | — | — |
| RF09 — Gerenciar oportunidades | P0 | Laura | Não iniciado | — | — |
| RF10 — Pesquisa e filtros | P0 | Marcelo | Não iniciado | — | — |
| RF11 — Detalhes da oportunidade | P0 | Marcelo | Não iniciado | — | — |
| RF12 — Compatibilidade | P0 | Renato | Em andamento | — | — |
| RF13 — Elegibilidade | P0 | Renato | Em andamento | — | — |
| RF14 — Bloqueio da candidatura | P0 | Renato | Em andamento | — | — |
| RF15 — Realizar candidatura | P0 | Marcelo | Não iniciado | — | — |
| RF16 — Enviar documentos | P0 | Marcelo | Não iniciado | — | — |
| RF17 — Status e histórico do atleta | P0 | Marcelo | Não iniciado | — | — |
| RF18 — Visualizar candidatos | P0 | Laura | Não iniciado | — | — |
| RF19 — Avaliação técnica | P1 | Laura | Não iniciado | — | — |
| RF20 — Solicitar avaliação | P1 | Laura | Não iniciado | — | — |
| RF21 — Decisão institucional | P0 | Laura | Não iniciado | — | — |
| RF22 — Histórico das alterações | P0 | Renato | Em andamento | — | — |
| RF23 — Notificações | P1 | Marcelo | Não iniciado | — | — |
| RF24 — Mensagens operacionais | P0 | Maria | Em revisão | #13 | — |
| RF25 — Estados vazios | P0 | Maria | Bloqueado | — | EmptyState está pronto em componente compartilhado, mas ainda não foi aplicado a uma lista real; as telas de listas pertencem a Marcelo ou Laura e a alteração aguarda pedido/autorização entre áreas. |
| RF26 — Denúncias | P2 | Backlog futuro | Não iniciado | — | — |
| RF27 — Portal administrativo | P2 | Backlog futuro | Não iniciado | — | — |
| RF28 — Moderação | P2 | Backlog futuro | Não iniciado | — | — |
| RF29 — Apoios concedidos | P2 | Backlog futuro | Não iniciado | — | — |
| RF30 — Auditoria do Match Score | P2 | Backlog futuro | Não iniciado | — | — |

## Como atualizar

```text
npm run progress -- set RF09 em_andamento
npm run progress -- set RF09 bloqueado --blocker "Aguardando contrato de oportunidade"
npm run progress -- set RF09 em_revisao --pr "#12"
npm run progress -- set RF09 concluido --pr "#12" --evidence "Vídeo e roteiro 3 aprovados"
```

Estados permitidos: `nao_iniciado`, `em_andamento`, `bloqueado`, `em_revisao`, `simulado` e `concluido`.
