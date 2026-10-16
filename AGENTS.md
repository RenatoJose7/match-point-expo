# Instruções obrigatórias para IAs — MatchPoint

Estas regras se aplicam a qualquer IA que leia, analise ou altere este repositório.

## Antes de fazer qualquer alteração

1. Leia integralmente `docs/MANUAL_DE_COLABORACAO.md`.
2. Durante o ciclo intensivo de três dias, leia também `docs/MANUAL_DO_PROJETO_3_DIAS.md` e identifique a prioridade P0, P1 ou P2.
3. Se a tarefa envolver dados, autenticação, API ou banco, leia também `docs/CONTRATOS_DE_DADOS.md`.
4. Identifique a área responsável e os arquivos autorizados pela solicitação.
5. Verifique o estado atual dos arquivos antes de editar e preserve mudanças existentes.
6. Declare quais arquivos pretende alterar quando o trabalho ultrapassar uma única tela ou componente.
7. Antes de iniciar um requisito, atualize seu status no painel de progresso; antes de entregar, atualize novamente com PR e evidência.

Se a solicitação conflitar com este documento, siga a solicitação explícita do usuário, mas informe claramente o conflito e o impacto.

## Responsáveis e limites

| Responsável | Área | Escopo principal |
| --- | --- | --- |
| Maria | Acesso e interface compartilhada | `assets/**`, `src/components/**`, `src/theme/**`, acesso, cadastro e área esportiva inicial |
| Marcelo | Jornada do atleta | telas do atleta, oportunidades, candidaturas, Match Score, perfil e notificações |
| Laura | Jornada dos parceiros | `src/screens/partner/**`, treinador, instituição, oportunidades e candidatos |
| Renato | Núcleo e dados | `App.js`, configuração, dependências, navegação, contratos, banco, segurança e integração |

O mapeamento completo de arquivos está no manual.

## Arquivos controlados

Não altere estes arquivos sem autorização explícita na tarefa:

```text
App.js
index.js
app.json
package.json
package-lock.json
src/screens/index.js
src/data/**
src/theme/styles.js
```

Não instale, remova ou atualize dependências sem autorização do Renato.

## Conduta obrigatória

- altere somente os arquivos necessários para a tarefa;
- durante os três dias, não implemente P1 enquanto algum P0 estiver bloqueado por código e não implemente P2;
- não faça refatorações, renomeações ou formatações em massa;
- não mova arquivos de outra área;
- não apague código aparentemente sem uso sem confirmar sua finalidade;
- estilos específicos devem ficar próximos da feature; estilos globais pertencem à Maria;
- telas nunca devem importar diretamente o SDK do Firebase;
- integrações de dados devem passar por contratos e repositórios;
- nunca exponha chaves, senhas, tokens ou dados pessoais;
- não sobrescreva mudanças locais de outra pessoa;
- se precisar ultrapassar os limites da área, pare e registre a dependência ou o pedido entre áreas;
- quando houver ambiguidade relevante, explique o bloqueio em vez de assumir uma alteração ampla.

## Painel obrigatório de progresso

O painel visível fica em `docs/PROGRESSO.md` e é gerado a partir dos arquivos individuais em `docs/progresso/`.

Cada IA deve:

1. alterar somente o requisito em que está trabalhando;
2. usar `npm run progress -- set RFXX em_andamento` antes de começar;
3. usar `bloqueado` com `--blocker` se ficar impedida de continuar;
4. usar `em_revisao` com `--pr` ao abrir a Pull Request;
5. usar `concluido` somente com `--pr` e `--evidence`, depois dos critérios de pronto;
6. incluir no commit tanto o JSON do responsável quanto `docs/PROGRESSO.md`;
7. nunca editar `docs/PROGRESSO.md` manualmente.

Exemplos:

```text
npm run progress -- set RF09 em_andamento
npm run progress -- set RF09 bloqueado --blocker "Aguardando contrato"
npm run progress -- set RF09 em_revisao --pr "#12"
npm run progress -- set RF09 concluido --pr "#12" --evidence "Roteiro 3 aprovado"
```

Itens `simulado` não avançam a barra. O estado `concluido` exige PR e evidência.

## Uso de Git e GitHub

- uma tarefa por branch;
- branches de tarefa partem de `develop`;
- não faça commit diretamente em `main` ou `develop`;
- use os padrões de branch e commit definidos no manual;
- depois de validar e publicar uma tarefa, abra automaticamente uma Pull Request para `develop`; se a autenticação do GitHub impedir essa ação, informe o link direto para criá-la;
- não use comandos destrutivos para descartar trabalho existente;
- não copie código manualmente entre branches quando a dependência deve chegar por Pull Request;
- revise `git status` e `git diff` antes de entregar.

## Base obrigatória de trabalho

`develop` é a fonte única de trabalho da equipe. O painel de progresso, os contratos e as dependências a serem consumidas devem ser conferidos nessa branch, nunca na `main` ou em uma branch pessoal.

| Branch | Uso permitido |
| --- | --- |
| `main` | Somente versão estável, demonstrável e já validada em `develop`. Nunca é base de uma tarefa. |
| `develop` | Integração diária e ponto de partida obrigatório de toda tarefa. |
| `codex/*`, `feat/*`, `fix/*`, `infra/*`, `docs/*` | Uma tarefa isolada, criada a partir de `develop`. |

Antes de qualquer IA ou integrante iniciar uma tarefa, executar e conferir:

```text
git fetch origin --prune
git switch develop
git pull --ff-only origin develop
git status --short --branch
git switch -c tipo/area-descricao
```

Só comece se `git status --short --branch` confirmar a branch de tarefa e não mostrar alterações herdadas de outra pessoa. Nunca use `main` como base para uma feature, mesmo que ela pareça mais atual.

### Quando `main` e `develop` divergirem

Se um commit entrar por engano na `main`, não faça push direto, cópia manual, `reset` ou `cherry-pick` para "corrigir". Registre a divergência e o Renato deve:

1. criar uma branch de sincronização a partir de `origin/develop`;
2. integrar `origin/main` nessa branch, preservando os dados mais novos da `develop` em caso de conflito;
3. abrir uma Pull Request com destino em `develop`;
4. pedir revisão e só então fazer o merge;
5. avisar a equipe para atualizar a `develop` antes de abrir novas branches.

Enquanto a sincronização não for integrada, ninguém deve iniciar uma tarefa que dependa dos commits ausentes. O estado oficial de cada RF é sempre o arquivo `docs/PROGRESSO.md` presente na `develop`.

## Validação mínima

Depois de alterar código executável, rode:

```text
npm run check:contracts
npm run progress -- --check
npm run export:web
```

Se a validação não puder ser executada ou falhar, informe o comando, a falha e os arquivos afetados. Mudanças apenas em documentação não exigem exportação do aplicativo.

## Entrega da IA

Ao concluir, informe:

- resultado alcançado;
- arquivos alterados;
- validações executadas;
- limitações ou dependências restantes;
- qualquer mudança que precise da aprovação de outra área.
