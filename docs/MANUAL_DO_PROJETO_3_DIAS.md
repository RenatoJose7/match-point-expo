# Manual do projeto e plano de execução de 3 dias — MatchPoint

## 1. Objetivo da entrega

A equipe possui três dias de produção com quatro integrantes para implementar e demonstrar pelo menos 70% dos requisitos funcionais do MatchPoint.

O documento de requisitos possui 30 requisitos funcionais. Portanto, a meta mínima objetiva desta entrega é:

```text
21 requisitos funcionais concluídos e demonstráveis de 30 = 70%
```

Não serão contabilizados como concluídos requisitos que possuam apenas uma tela estática, botão sem ação, navegação simulada ou dados fixos sem comportamento correspondente.

### Fluxo principal da demonstração

```text
Cadastro/login
      ↓
Identificação do perfil
      ↓
Perfil esportivo do atleta
      ↓
Criação e consulta de oportunidade
      ↓
Match Score e elegibilidade
      ↓
Candidatura e documentos
      ↓
Visualização e decisão do parceiro
      ↓
Status e histórico para o atleta
```

O trabalho administrativo completo, denúncias e auditoria avançada ficam fora da meta mínima desta etapa.

---

## 2. Estratégia de escopo

### P0 — Meta obrigatória de 70%

Os seguintes 21 requisitos precisam estar concluídos antes de iniciar funções extras:

```text
RF01, RF02, RF03, RF04, RF05, RF06, RF07,
RF09, RF10, RF11, RF12, RF13, RF14, RF15,
RF16, RF17, RF18, RF21, RF22, RF24 e RF25
```

### P1 — Extensão, somente depois de P0 estável

```text
RF08  - verificação de treinadores e instituições
RF19  - avaliação técnica do atleta
RF20  - solicitação de avaliação técnica
RF23  - notificações
```

Se P0 e P1 forem concluídos, a cobertura chegará a 25 de 30 requisitos funcionais, aproximadamente 83%.

### P2 — Próxima etapa

```text
RF26  - denúncias
RF27  - portal administrativo
RF28  - moderação administrativa
RF29  - registro de apoios concedidos
RF30  - auditoria do Match Score
```

Esses requisitos não devem consumir tempo durante os três dias enquanto algum item P0 estiver incompleto.

---

## 3. Módulos de produção

Os módulos foram definidos para permitir trabalho simultâneo sem concentrar todas as tarefas em uma pessoa.

### Módulo A — Identidade, cadastro e experiência compartilhada

Responsável: **Maria**

Requisitos P0 principais:

```text
RF01, RF04, RF05, RF06, RF07, RF24 e RF25
```

Entregas:

- formulários de cadastro e login conectados ao contrato de autenticação;
- cálculo da idade a partir da data de nascimento;
- identificação de atleta menor de idade;
- cadastro e vínculo do responsável legal;
- possibilidade de o responsável administrar o perfil vinculado;
- componentes compartilhados de carregamento, erro, sucesso, confirmação e estado vazio;
- validações visíveis nos formulários;
- consistência visual e responsividade básica.

Limites:

- Maria não implementa o Firebase diretamente;
- o contrato de autenticação e persistência é entregue por Renato;
- redirecionamento de rotas continua sob responsabilidade de Renato;
- estilos específicos de telas de outras áreas não são alterados.

Branches sugeridas:

```text
feat/acesso-autenticacao
feat/acesso-menor-responsavel
ui/estados-compartilhados
```

### Módulo B — Jornada do atleta

Responsável: **Marcelo**

Requisitos P0 principais:

```text
RF03, RF10, RF11, RF15, RF16 e RF17
```

Entregas:

- criação e edição do perfil esportivo;
- pesquisa e filtro de oportunidades;
- detalhes completos da oportunidade;
- início e confirmação da candidatura;
- envio ou registro dos documentos necessários;
- listagem das candidaturas do atleta;
- status e histórico da candidatura;
- tratamento dos estados fornecidos pelos componentes de Maria.

Limites:

- Marcelo não consulta Firebase diretamente;
- regras de Match Score e elegibilidade vêm do módulo de Renato;
- dados da oportunidade seguem o contrato integrado com Laura e Renato;
- componentes globais são solicitados à Maria.

Branches sugeridas:

```text
feat/atleta-perfil
feat/atleta-oportunidades
feat/atleta-candidatura
```

### Módulo C — Oportunidades e seleção de candidatos

Responsável: **Laura**

Requisitos P0 principais:

```text
RF09, RF18 e RF21
```

Entregas:

- criação, edição, encerramento e listagem de oportunidades do parceiro;
- definição dos requisitos e documentos exigidos;
- visualização dos candidatos por oportunidade;
- acesso ao perfil esportivo do candidato;
- alteração para aprovado, rejeitado ou em análise;
- uso das mesmas entidades consumidas pela jornada do atleta;
- validação das telas de treinador e instituição.

Embora o módulo possua menos números de requisitos, cada requisito envolve operações completas de gerenciamento e várias telas. Por isso, a carga é equivalente aos demais módulos.

Limites:

- Laura não modifica telas internas do atleta;
- mudanças de status usam as transições definidas por Renato;
- componentes globais são solicitados à Maria;
- novas rotas são solicitadas ao Renato.

Branches sugeridas:

```text
feat/parceiros-oportunidades
feat/parceiros-candidatos
feat/parceiros-decisao
```

### Módulo D — Núcleo, dados, regras e integração

Responsável: **Renato**

Requisitos P0 principais:

```text
RF02, RF12, RF13, RF14 e RF22
```

Entregas:

- configuração do Firebase e das variáveis de ambiente;
- autenticação, sessão e identificação do perfil;
- redirecionamento para a área correta;
- entidades e interfaces dos repositórios;
- implementações de autenticação, usuários, oportunidades e candidaturas;
- cálculo do Match Score;
- verificação dos critérios de elegibilidade;
- bloqueio justificado de candidatura inelegível;
- registro imutável dos eventos de histórico;
- regras de acesso e integração das Pull Requests;
- dados simulados com a mesma interface enquanto uma integração real estiver indisponível.

Limites:

- Renato não assume a construção visual das outras áreas;
- mudanças de contrato são comunicadas antes da implementação;
- nenhuma chave do Firebase é enviada ao Git;
- toda integração deve preservar as telas existentes.

Branches sugeridas:

```text
infra/firebase-base
feat/core-autenticacao
feat/core-match-elegibilidade
feat/core-historico
```

---

## 4. Matriz dos requisitos funcionais

| RF | Resumo | Prioridade | Responsável principal | Resultado exigido |
| --- | --- | --- | --- | --- |
| RF01 | Cadastro e login | P0 | Maria, com contrato de Renato | Usuário consegue criar conta e iniciar sessão. |
| RF02 | Direcionamento por perfil | P0 | Renato | Sessão abre a área correta do usuário. |
| RF03 | Perfil esportivo | P0 | Marcelo | Atleta cria, consulta e edita o próprio perfil. |
| RF04 | Cálculo de idade | P0 | Maria | Idade é calculada pela data, sem campo manual. |
| RF05 | Identificação de menor | P0 | Maria | Menor de 18 anos ativa automaticamente o fluxo responsável. |
| RF06 | Cadastro e vínculo do responsável | P0 | Maria, com persistência de Renato | Menor não conclui cadastro sem responsável vinculado. |
| RF07 | Responsável administra atleta | P0 | Maria | Responsável autenticado altera somente o atleta vinculado. |
| RF08 | Verificação de parceiros | P1 | Laura, com regras de Renato | Parceiro possui estado de verificação e somente verificados publicam. |
| RF09 | Gerenciar oportunidades | P0 | Laura | Parceiro cria, edita, lista e encerra oportunidades. |
| RF10 | Pesquisar e filtrar | P0 | Marcelo | Atleta encontra oportunidades por busca e filtros relevantes. |
| RF11 | Detalhes da oportunidade | P0 | Marcelo | Requisitos, benefício, localização, documentos e prazo são exibidos. |
| RF12 | Compatibilidade | P0 | Renato, apresentação de Marcelo | Percentual e critérios do Match Score são apresentados. |
| RF13 | Elegibilidade | P0 | Renato | Critérios obrigatórios são avaliados individualmente. |
| RF14 | Bloqueio da candidatura | P0 | Renato | Candidatura inelegível é impedida com explicação. |
| RF15 | Realizar candidatura | P0 | Marcelo | Atleta elegível cria uma única candidatura por oportunidade. |
| RF16 | Enviar documentos | P0 | Marcelo, armazenamento de Renato | Documento exigido pode ser associado à candidatura. |
| RF17 | Status e histórico do atleta | P0 | Marcelo | Atleta acompanha o estado e a linha do tempo. |
| RF18 | Visualizar candidatos | P0 | Laura | Parceiro lista candidatos somente de suas oportunidades. |
| RF19 | Avaliação técnica | P1 | Laura | Treinador registra avaliação estruturada do atleta. |
| RF20 | Solicitar avaliação | P1 | Laura | Instituição solicita avaliação a treinador autorizado. |
| RF21 | Decisão institucional | P0 | Laura | Candidato pode ficar em análise, ser aprovado ou rejeitado. |
| RF22 | Histórico das alterações | P0 | Renato | Mudanças importantes geram eventos com data e responsável. |
| RF23 | Notificações | P1 | Marcelo, com eventos de Renato | Usuário recebe e marca notificações relevantes como lidas. |
| RF24 | Mensagens operacionais | P0 | Maria | Operações exibem carregamento, confirmação, sucesso e erro. |
| RF25 | Estados vazios | P0 | Maria | Listas sem dados possuem orientação clara. |
| RF26 | Denúncias | P2 | Futuro módulo administrativo | Usuário envia e acompanha denúncia. |
| RF27 | Portal administrativo | P2 | Futuro módulo administrativo | Administrador gerencia os recursos previstos. |
| RF28 | Moderação | P2 | Futuro módulo administrativo | Administrador aprova, corrige, rejeita ou suspende itens. |
| RF29 | Apoios concedidos | P2 | Futuro módulo institucional | Instituição registra o apoio concedido ao atleta. |
| RF30 | Auditoria do Match Score | P2 | Futuro módulo administrativo | Administrador consulta cálculo, critérios e versão usados. |

---

## 5. Requisitos não funcionais durante os três dias

Os requisitos não funcionais não entram no cálculo de 21/30, mas são condições para considerar os requisitos funcionais concluídos.

| RNF | Tema | Aplicação nesta entrega | Responsável pela verificação |
| --- | --- | --- | --- |
| RNF01 | Clareza da interface | Ação principal identificável e fluxo compreensível. | Maria e responsável da tela |
| RNF02 | Consistência visual | Cores, tipografia, botões e navegação compartilhados. | Maria |
| RNF03 | Responsividade | Teste em largura móvel e navegador desktop. | Maria e Marcelo |
| RNF04 | Tempo de resposta | Operações assíncronas não congelam a interface e exibem carregamento. | Renato |
| RNF05 | Prioridade móvel do atleta | Fluxo do atleta validado primeiro em viewport móvel. | Marcelo |
| RNF06 | Proteção de dados | Sem segredos no Git; mínimo de dados pessoais expostos. | Renato |
| RNF07 | Segurança de menores | Responsável vinculado e regras específicas de acesso. | Maria e Renato |
| RNF08 | Acesso por perfil | Rotas e consultas restringidas pelo tipo de usuário. | Renato |
| RNF09 | Administração separada | Fora de P0; nenhuma rota administrativa improvisada. | Renato |
| RNF10 | Legibilidade | Textos sem corte, contraste e hierarquia verificados. | Maria |
| RNF11 | Manutenção | Telas não acessam Firebase diretamente; contratos preservados. | Renato |
| RNF12 | Organização de dados | IDs, datas, estados e relações seguem contrato único. | Renato |
| RNF13 | Hierarquia de navegação | Navegação inferior e retornos seguem padrão por perfil. | Maria e Renato |
| RNF14 | Integridade | Validação de campos, transições de status e duplicidade de candidatura. | Renato |

---

## 6. Cronograma de produção

### Ritual diário

```text
08:30 - alinhamento de 15 minutos
08:45 - primeiro bloco de produção
11:30 - publicação das dependências que bloqueiam outras pessoas
12:00 - atualização rápida do quadro
13:00 - segundo bloco de produção
16:00 - abertura das Pull Requests do dia
16:30 - revisão cruzada e integração em develop
17:30 - teste do fluxo completo e registro dos bloqueios
```

Cada pessoa mantém no máximo **uma tarefa em andamento**. Uma segunda tarefa só começa depois que a primeira estiver em revisão ou formalmente bloqueada.

### Dia 1 — Fundação funcional

Objetivo: permitir que todos trabalhem sobre contratos estáveis e que os primeiros dados atravessem o sistema.

#### Maria

- finalizar cadastro e login na interface;
- implementar validações básicas dos formulários;
- criar componentes de carregamento, erro, sucesso e vazio;
- iniciar fluxo de data de nascimento e responsável legal.

#### Marcelo

- conectar criação e edição do perfil esportivo ao contrato;
- conectar listagem, busca e filtro de oportunidades;
- exibir todos os detalhes definidos em RF11.

#### Laura

- conectar criação e listagem das oportunidades do parceiro;
- implementar edição e encerramento;
- preencher requisitos e documentos necessários.

#### Renato

- congelar a primeira versão dos contratos;
- configurar autenticação, sessão e repositórios;
- fornecer operações de usuário, atleta e oportunidade;
- implementar direcionamento por perfil;
- entregar `.env.example` sem valores secretos;
- publicar mocks compatíveis quando o Firebase bloquear uma tela.

#### Marco de encerramento do Dia 1

- cadastro e login percorrem o contrato;
- perfil do usuário direciona para a área correta;
- perfil esportivo pode ser salvo e relido;
- uma oportunidade criada pelo parceiro aparece na consulta do atleta;
- `npm run export:web` passa em `develop`.

### Dia 2 — Fluxo principal ponta a ponta

Objetivo: concluir uma candidatura desde a oportunidade até a decisão do parceiro.

#### Maria

- concluir cálculo de idade e identificação de menor;
- concluir vínculo e administração pelo responsável;
- aplicar estados de interface nos fluxos P0;
- apoiar correções globais sem assumir telas alheias.

#### Marcelo

- concluir candidatura;
- registrar documentos obrigatórios;
- implementar lista, status e histórico das candidaturas;
- consumir a resposta de elegibilidade antes de confirmar.

#### Laura

- implementar candidatos por oportunidade;
- abrir perfil esportivo do candidato;
- implementar em análise, aprovado e rejeitado;
- validar que o parceiro acessa somente suas oportunidades.

#### Renato

- implementar Match Score e critérios exibíveis;
- implementar elegibilidade e bloqueio justificado;
- impedir candidatura duplicada;
- registrar eventos de histórico;
- concluir regras mínimas de acesso e integridade.

#### Marco de encerramento do Dia 2

O seguinte roteiro deve funcionar sem alteração manual de dados:

1. parceiro cria oportunidade;
2. atleta encontra e abre a oportunidade;
3. sistema calcula compatibilidade e elegibilidade;
4. atleta elegível envia candidatura e documento;
5. parceiro visualiza o candidato e muda a situação;
6. atleta visualiza o novo status e o histórico;
7. atleta inelegível recebe o motivo do bloqueio;
8. `npm run export:web` passa em `develop`.

### Dia 3 — Estabilização, evidências e entrega

Objetivo: comprovar os 21 requisitos P0 e preparar uma versão demonstrável.

#### Até 12:00

- corrigir somente falhas de P0;
- concluir integrações ainda simuladas que impedem a demonstração;
- validar acesso por perfil e dados de menores;
- executar o roteiro ponta a ponta em viewport móvel e desktop;
- atualizar a matriz de progresso.

#### Depois de 12:00

- congelar novas funcionalidades P0;
- corrigir bugs encontrados nos testes integrados;
- registrar capturas e evidências;
- preparar dados seguros de demonstração;
- escrever limitações conhecidas;
- iniciar P1 apenas se todos os 21 requisitos estiverem verdes.

#### Distribuição final

- Maria: consistência, estados, responsividade e fluxo de responsável;
- Marcelo: teste integral da jornada do atleta e, se liberado, RF23;
- Laura: teste integral da jornada do parceiro e, se liberado, RF08, RF19 e RF20;
- Renato: integridade dos dados, segurança, build, integração e versão final.

#### Marco de encerramento do Dia 3

- 21 requisitos P0 marcados como demonstráveis;
- nenhuma falha bloqueadora no fluxo principal;
- validação automatizada aprovada;
- Pull Requests integradas em `develop`;
- versão validada integrada à `main`;
- evidências e limitações registradas.

---

## 7. Ordem obrigatória das dependências

### Dependências que Renato deve liberar primeiro

Até o meio do Dia 1:

```text
Contrato de autenticação
Contrato de usuário e perfis
Contrato de oportunidade
Contrato de candidatura
Formato de resultado do Match Score
Transições aceitas de status
Mocks compatíveis com esses contratos
```

As telas podem iniciar com mocks, mas não podem alterar o formato dos contratos localmente.

### Dependências entre módulos

| Origem | Destino | Entrega necessária |
| --- | --- | --- |
| Renato | Maria | autenticação, sessão, perfil e vínculo de responsável |
| Renato | Marcelo | repositórios, elegibilidade, Match Score e candidatura |
| Renato | Laura | oportunidades, candidatos e transições de status |
| Maria | Todos | componentes de carregamento, erro, sucesso e vazio |
| Laura | Marcelo | campos finais de oportunidade e documentos exigidos |
| Marcelo | Laura | campos de perfil esportivo que serão exibidos ao parceiro |

Se uma dependência atrasar, o consumidor continua com o mock oficial e abre uma Issue `blocked`. Não cria uma segunda estrutura de dados.

---

## 8. Política de integração acelerada

Para três dias, a equipe usará Pull Requests pequenas e frequentes.

Regras:

- uma branch por entrega listada neste manual;
- não manter uma alteração local importante até o fim do dia;
- dependências compartilhadas devem ser publicadas até 11:30;
- Pull Requests do dia devem ser abertas até 16:00;
- revisão inicial em até 30 minutos durante a janela de integração;
- conflitos em `App.js`, índices, contratos ou tema são resolvidos pelo responsável do arquivo;
- nenhuma Pull Request mistura implementação P0 com refatoração estética ampla;
- commits quebrados não entram em `develop`;
- mudanças urgentes depois do congelamento precisam da aprovação de Renato e do dono da área afetada.

### Revisões cruzadas

```text
Maria revisa Marcelo
Marcelo revisa Laura
Laura revisa Renato
Renato revisa Maria e arquivos controlados
```

Quando a Pull Request afetar outra área, o dono da área também revisa.

---

## 9. Uso da IA durante o ciclo de três dias

Cada integrante deve começar sua conversa com a IA informando módulo, requisito e arquivos autorizados.

Modelo:

```text
Projeto MatchPoint - Dia [1/2/3].
Responsável humano: [nome].
Módulo: [A/B/C/D].
Requisitos desta tarefa: [RFs].
Arquivos autorizados: [lista].
Arquivos proibidos: App.js, package.json, package-lock.json e áreas de outras pessoas, salvo autorização registrada.
Leia AGENTS.md, o manual de colaboração e o manual de três dias antes de alterar arquivos.
Implemente somente os critérios de aceitação descritos na Issue.
Se precisar ultrapassar o escopo, pare e informe a dependência.
Ao terminar, revise o diff e execute npm run export:web.
```

É responsabilidade da pessoa:

- revisar todo código gerado;
- impedir que a IA reestruture o projeto sem autorização;
- não aceitar funções inventadas fora dos requisitos;
- conferir se o código usa o contrato oficial;
- validar a funcionalidade manualmente;
- incluir no PR o que foi produzido ou auxiliado por IA.

---

## 10. Quando um requisito pode ser marcado como concluído

Um requisito recebe estado **Concluído** somente se:

- possui comportamento funcional, não apenas interface;
- usa os dados e contratos oficiais;
- persiste ou recupera informações quando o requisito exigir;
- possui validação de entrada;
- apresenta carregamento, erro e vazio quando aplicável;
- respeita o perfil autenticado;
- foi validado funcionalmente pelo responsável.

Estados permitidos na matriz:

```text
Não iniciado
Em andamento
Bloqueado
Em revisão
Simulado
Concluído
```

`Simulado` não entra no cálculo dos 70%.

### Painel automático

O acompanhamento oficial fica em `docs/PROGRESSO.md`. Cada IA atualiza o requisito pelo comando `npm run progress -- set ...`; as regras completas estão em `AGENTS.md`.

O painel apresenta:

- barra P0, usada para a meta de 70%;
- barras P1, P2 e total;
- progresso individual de Maria, Marcelo, Laura e Renato;
- requisitos em andamento e bloqueados;
- validação funcional de cada requisito concluído; PR e evidências podem ser adicionados para rastreabilidade.

Os arquivos de origem ficam separados por responsável em `docs/progresso/`, evitando que todos editem o mesmo arquivo manualmente.

---

## 11. Roteiros mínimos de teste

### Roteiro 1 — Atleta maior de idade

1. criar conta de atleta maior;
2. autenticar e confirmar redirecionamento;
3. preencher e editar perfil esportivo;
4. buscar e filtrar oportunidade;
5. abrir detalhes e verificar Match Score;
6. realizar candidatura elegível;
7. anexar ou registrar documento;
8. acompanhar status e histórico.

### Roteiro 2 — Atleta menor de idade

1. informar data de nascimento de menor;
2. confirmar identificação automática;
3. tentar avançar sem responsável e verificar bloqueio;
4. cadastrar e vincular responsável;
5. autenticar no fluxo definido;
6. responsável consulta e administra apenas o atleta vinculado.

### Roteiro 3 — Treinador ou instituição

1. autenticar como parceiro;
2. criar oportunidade com requisitos e documentos;
3. editar e listar a oportunidade;
4. visualizar candidatos relacionados;
5. abrir perfil esportivo;
6. manter em análise, aprovar ou rejeitar;
7. confirmar registro no histórico.

### Roteiro 4 — Elegibilidade

1. usar atleta compatível e confirmar candidatura liberada;
2. usar atleta que não atende critério obrigatório;
3. confirmar bloqueio e explicação;
4. verificar que nenhuma candidatura foi gravada no caso bloqueado.

### Roteiro 5 — Qualidade mínima

1. executar em viewport móvel;
2. executar no navegador desktop;
3. testar listas vazias;
4. testar falha de operação;
5. atualizar a página e confirmar persistência;
6. executar `npm run export:web`.

---

## 12. Matriz diária de acompanhamento

Copiar esta tabela para a Issue de acompanhamento ou GitHub Project e atualizar nos alinhamentos.

| Requisito | Responsável | Estado | PR | Evidência | Bloqueio |
| --- | --- | --- | --- | --- | --- |
| RF01 | Maria/Renato | Não iniciado |  |  |  |
| RF02 | Renato | Não iniciado |  |  |  |
| RF03 | Marcelo | Não iniciado |  |  |  |
| RF04 | Maria | Não iniciado |  |  |  |
| RF05 | Maria | Não iniciado |  |  |  |
| RF06 | Maria/Renato | Não iniciado |  |  |  |
| RF07 | Maria | Não iniciado |  |  |  |
| RF09 | Laura | Não iniciado |  |  |  |
| RF10 | Marcelo | Não iniciado |  |  |  |
| RF11 | Marcelo | Não iniciado |  |  |  |
| RF12 | Renato/Marcelo | Não iniciado |  |  |  |
| RF13 | Renato | Não iniciado |  |  |  |
| RF14 | Renato | Não iniciado |  |  |  |
| RF15 | Marcelo | Não iniciado |  |  |  |
| RF16 | Marcelo/Renato | Não iniciado |  |  |  |
| RF17 | Marcelo | Não iniciado |  |  |  |
| RF18 | Laura | Não iniciado |  |  |  |
| RF21 | Laura | Não iniciado |  |  |  |
| RF22 | Renato | Não iniciado |  |  |  |
| RF24 | Maria | Não iniciado |  |  |  |
| RF25 | Maria | Não iniciado |  |  |  |

Progresso calculado:

```text
Cobertura P0 = requisitos Concluídos / 21
Cobertura total = requisitos funcionais Concluídos / 30
```

---

## 13. Regras de corte para evitar sobrecarga

- nenhuma pessoa trabalha em mais de um item ativo ao mesmo tempo;
- não fazer refatoração de pastas durante os três dias;
- não buscar perfeição visual antes do fluxo funcionar;
- não iniciar P1 com qualquer P0 bloqueado por código;
- não iniciar P2 nesta entrega;
- usar dados de demonstração seguros e pequenos;
- se uma integração consumir mais de 45 minutos, registrar o bloqueio e voltar ao último contrato estável;
- problemas cosméticos sem impacto no fluxo entram no backlog posterior;
- o Dia 3 é de estabilização, não de aumento de escopo;
- horas extras não substituem redução consciente de escopo.

---

## 14. Critério final de sucesso

A entrega de três dias será considerada bem-sucedida quando:

```text
21 de 30 requisitos funcionais estiverem Concluídos
+
fluxo principal puder ser demonstrado de ponta a ponta
+
build web estiver aprovado
+
nenhum dado sensível estiver versionado
+
limitações restantes estiverem documentadas
```

Se os 21 itens não estiverem funcionais, a equipe não deve declarar 70% apenas com base na quantidade de telas. A porcentagem deve ser sustentada por comportamento demonstrável e evidência de teste.
