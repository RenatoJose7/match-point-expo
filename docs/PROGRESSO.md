# Progresso de implementação — MatchPoint

> Arquivo gerado por `npm run progress`. Não edite esta página manualmente.

Última atualização registrada: 2026-10-16T19:52:09.745Z

## Barras de progresso

- **P0:** `█░░░░░░░░░░░░░░░░░░░ 5% (1/21)`
- **P1:** `░░░░░░░░░░░░░░░░░░░░ 0% (0/4)`
- **P2:** `░░░░░░░░░░░░░░░░░░░░ 0% (0/5)`
- **Total:** `█░░░░░░░░░░░░░░░░░░░ 3% (1/30)`

Somente requisitos `Concluídos`, com PR e evidência, avançam as barras. Itens simulados não contam para os 70%.

## Progresso por pessoa

| Responsável | P0 concluído | Total concluído | Em andamento | Bloqueado |
| --- | --- | --- | --- | --- |
| Maria | 1/7 | 1/7 | 0 | 2 |
| Marcelo | 0/6 | 0/7 | 3 | 3 |
| Laura | 0/3 | 0/6 | 0 | 0 |
| Renato | 0/5 | 0/5 | 1 | 1 |

## Requisitos

| RF | Prioridade | Responsável | Status | PR | Evidência ou bloqueio |
| --- | --- | --- | --- | --- | --- |
| RF01 — Cadastro e login | P0 | Maria | Em revisão | #29 | — |
| RF02 — Direcionamento por perfil | P0 | Renato | Bloqueado | — | Aguardando a tela inicial do responsável da área da Maria para concluir o direcionamento do tipo responsavel. |
| RF03 — Perfil esportivo | P0 | Marcelo | Em andamento | — | — |
| RF04 — Cálculo de idade | P0 | Maria | Concluído | #9 | PR #9 integrada em develop; formato DD/MM/AAAA, validação, cálculo automático de idade e identificação de menor verificados no navegador. |
| RF05 — Identificação de menor | P0 | Maria | Bloqueado | — | Aguardando contrato e operação de convite/código e vínculo do responsável no repositório; sem isso não é possível ativar o fluxo de menor de forma segura. |
| RF06 — Vínculo do responsável | P0 | Maria | Não iniciado | — | — |
| RF07 — Responsável administra atleta | P0 | Maria | Não iniciado | — | — |
| RF08 — Verificação de parceiros | P1 | Laura | Não iniciado | — | — |
| RF09 — Gerenciar oportunidades | P0 | Laura | Em revisão | #30 | — |
| RF10 — Pesquisa e filtros | P0 | Marcelo | Em andamento | — | — |
| RF11 — Detalhes da oportunidade | P0 | Marcelo | Bloqueado | — | Aguardando rota com routeParams e operação Firebase para obter oportunidade por ID |
| RF12 — Compatibilidade | P0 | Renato | Em andamento | — | — |
| RF13 — Elegibilidade | P0 | Renato | Em revisão | #26 | — |
| RF14 — Bloqueio da candidatura | P0 | Renato | Em revisão | #26 | — |
| RF15 — Realizar candidatura | P0 | Marcelo | Em andamento | — | ApplicationInfoScreen identifica o perfil pela sessão, aceita oportunidadeId/atletaId em routeParams ou lista oportunidades abertas quando o ID falta, verifica duplicidade e elegibilidade e cria candidatura pelo repositório; sucesso mostra o ID gerado. Validado em memória para sucesso, duplicidade e inelegibilidade; fluxo visual com usuário fictício confirmou seletor e bloqueio de duplicata; check:contracts, progress e export:web passaram. Firebase real ainda não validado. |
| RF16 — Enviar documentos | P0 | Marcelo | Bloqueado | — | Aguardando consulta do perfil esportivo, routeParams funcional e contrato de upload para arquivo real |
| RF17 — Status e histórico do atleta | P0 | Marcelo | Bloqueado | — | Aguardando consulta do perfil esportivo pelo usuário autenticado e vínculo entre candidatura e oportunidade |
| RF18 — Visualizar candidatos | P0 | Laura | Em revisão | #35 | Lista e retrato público do candidato em revisão; integração das rotas centrais pendente com Renato. |
| RF19 — Avaliação técnica | P1 | Laura | Não iniciado | — | — |
| RF20 — Solicitar avaliação | P1 | Laura | Não iniciado | — | — |
| RF21 — Decisão institucional | P0 | Laura | Não iniciado | — | — |
| RF22 — Histórico das alterações | P0 | Renato | Em revisão | #26 | — |
| RF23 — Notificações | P1 | Marcelo | Não iniciado | — | — |
| RF24 — Mensagens operacionais | P0 | Maria | Bloqueado | — | A tela de redefinição ainda precisa de operação no contrato para validar o link/token e atualizar a senha. A etapa aguarda alinhamento e implementação de Renato. |
| RF25 — Estados vazios | P0 | Maria | Não iniciado | — | — |
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
