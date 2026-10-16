# Plano de trabalho — área da Maria

Este documento registra o planejamento, as decisões alinhadas e o andamento do
trabalho da área da Maria no MatchPoint. Será atualizado durante a execução.

## Escopo

Responsável: **Maria — Identidade, cadastro e experiência compartilhada**.

Requisitos atribuídos à Maria no ciclo P0:

| Requisito | Entrega |
| --- | --- |
| RF01 | Cadastro, login e recuperação de senha integrados ao contrato de autenticação. |
| RF04 | Idade calculada a partir da data de nascimento, sem campo manual de idade. |
| RF05 | Identificação automática de atleta menor de 18 anos. |
| RF06 | Cadastro e vínculo autorizado de responsável legal para atleta menor. |
| RF07 | Responsável administra somente os atletas vinculados a ele. |
| RF24 | Operações comunicam carregamento, confirmação, sucesso e erro. |
| RF25 | Listas sem resultados apresentam orientação clara. |

Também fazem parte da área os componentes reutilizáveis, tema e consistência
visual, respeitando os limites para estilos locais de outras áreas.

## Decisões alinhadas

- O responsável cria a própria conta antes do cadastro do atleta.
- O responsável gera um convite/código; o atleta informa esse código para
  solicitar o vínculo.
- Em `src/screens/athlete-area/**`, Maria cuida do fluxo de cadastro. Marcelo
  define e implementa os dados e o comportamento do perfil esportivo associado
  ao RF03.

## Estado observado

- As telas de login e cadastro ainda não chamam autenticação. A recuperação de
  senha agora consome o contrato do repositório e exibe carregamento e erro.
- Já existem componentes básicos de botão, campo e estrutura de tela em
  `src/components/ui/`.
- O repositório em memória já expõe operações de idade, identificação de menor,
  vínculo e atualização como responsável.
- O mecanismo de convite/código ainda não está definido no contrato nem na
  implementação observada.
- Em `develop`, o repositório Firebase e a seleção por
  `EXPO_PUBLIC_DATA_PROVIDER` já estão implementados. O adaptador oferece
  cadastro, login, logout, recuperação de senha e leitura/observação da sessão.
- As telas de cadastro e login ainda não chamam essas operações; a recuperação
  de senha já chama `authentication.recuperarSenha`.
- O fluxo de cadastro não persiste ainda a data de nascimento nem o perfil do
  atleta; o RF03 e os campos do perfil esportivo são responsabilidade do
  Marcelo.
- Não foi localizada uma tela própria para o responsável consultar e administrar
  os atletas vinculados.
- A tela de recuperação agora possui estados reais de carregamento, erro e
  confirmação de envio. `OperationFeedback` e `EmptyState` estão disponíveis
  como componentes reutilizáveis; o estado vazio ainda precisa ser aplicado a
  uma lista de uma área autorizada.

## Plano de execução

1. **Alinhar dependências com Renato**
   - Definir contrato e implementação do convite/código: emissão, validação,
     uso único ou validade, erros e confirmação do vínculo.
   - Definir o acesso/rota para a área de administração do responsável.
   - Combinar a integração do login bem-sucedido ao direcionamento por perfil
     (RF02), sem Maria alterar `App.js` ou assumir a navegação geral.
   - Não alterar contratos, Firebase, rotas ou arquivos controlados sem o
     alinhamento e a autorização do responsável.
2. **Implementar RF01**
   - Tornar funcionais cadastro, login e recuperação de senha consumindo
     `authentication.cadastrar`, `entrar` e `recuperarSenha`.
   - Validar os campos e apresentar carregamento, resultado e erros do contrato.
3. **Implementar RF04 e RF05**
   - Reutilizar as operações de idade existentes e determinar automaticamente
     se o atleta é menor.
   - Bloquear a conclusão do cadastro de menor até haver vínculo válido.
4. **Implementar RF06**
   - Permitir que o atleta menor informe o código gerado pelo responsável e
     concluir somente após a confirmação do vínculo.
   - Apresentar erros recuperáveis para código inválido ou vínculo recusado.
5. **Implementar RF07**
   - Exibir ao responsável somente atletas vinculados e permitir as ações
     autorizadas pelo contrato.
   - Garantir autorização no serviço/repositório, não apenas ocultando ações na
     interface.
6. **Implementar RF24 e RF25**
   - Criar ou completar componentes compartilhados de carregamento, sucesso,
     erro, confirmação e estado vazio.
   - Aplicá-los primeiro aos fluxos da área da Maria e disponibilizá-los às
     outras áreas conforme combinado.
7. **Validar**
   - Testar cadastro adulto, cadastro de menor, código inválido, vínculo
     confirmado e tentativa de acesso a atleta não vinculado.
   - Executar `npm run check:contracts`, `npm run progress -- --check` e
     `npm run export:web`.

## Limites de arquivos

Áreas sob responsabilidade da Maria, conforme o manual:

```text
assets/**
src/components/**
src/theme/**
src/screens/OpeningScreen.js
src/screens/LoginScreen.js
src/screens/ProfileChoiceScreen.js
src/screens/Recovery*.js
src/screens/signup/**
src/screens/athlete-area/**
```

`App.js`, `src/screens/index.js`, `src/data/**`, dependências e
`src/theme/styles.js` são controlados. Qualquer mudança necessária nesses
arquivos deve seguir o processo de autorização do projeto. O trabalho não deve
assumir a implementação do Firebase ou de rotas pertencentes ao Renato.

## Registro de andamento

### 2026-10-15 — Planejamento inicial

- Lidos `AGENTS.md`, o manual de colaboração, o manual do projeto de três dias,
  os contratos de dados e o painel de progresso.
- Conferidos os arquivos de login, cadastro, área inicial do atleta, recuperação
  de senha, componentes de interface e repositório em memória.
- Alinhados o cadastro prévio do responsável, o convite/código e a divisão da
  tela `athlete-area` entre o fluxo de cadastro da Maria e os dados do perfil
  esportivo do Marcelo.
- Criado este documento a pedido do usuário.
- Nenhum código funcional foi alterado. Os requisitos de Maria permanecem
  `não_iniciado` no painel de progresso.
- Próxima ação: resolver com Renato as dependências de contrato, autenticação e
  acesso à administração antes de iniciar RF06/RF07.

### 2026-10-15 — Verificação das dependências de Renato

- O painel `docs/PROGRESSO.md` continua marcando RF02, RF12, RF13, RF14 e RF22
  de Renato como `Não iniciado`.
- `src/repositories/index.js` continua sem adaptador Firebase; com
  `EXPO_PUBLIC_DATA_PROVIDER=firebase`, `createRepositories` lança erro.
- Conclusão: Maria pode iniciar trabalho de interface e validação independente
  do Firebase usando o adaptador em memória, desde que a inicialização local não
  dependa da variável `firebase`. A integração real de RF01 e os fluxos de
  vínculo/administração de RF06/RF07 ainda dependem do alinhamento e das
  entregas de Renato.
- A verificação não altera o status dos requisitos; todos continuam
  `não_iniciado`.

### 2026-10-15 — Nova checagem após implementação reportada

> A observação abaixo foi feita inicialmente na branch errada e está superada
> pelas verificações seguintes de `origin/develop`.

- Conferidos o estado do Git, os commits recentes, o painel individual de
  Renato, `src/repositories/index.js` e as pastas de repositórios e serviços.
- Não há implementação Firebase visível nesta cópia/branch: só existem a
  fábrica e o adaptador em memória, e os requisitos de Renato continuam
  `não_iniciado`.
- Com `EXPO_PUBLIC_DATA_PROVIDER=firebase`, `createRepositories()` ainda lança
  `Provedor de dados ainda não configurado: firebase`.
- Isso indica que a implementação reportada pode ainda não ter sido integrada
  ou atualizada nesta cópia do projeto; não confirma que o trabalho de Renato
  não exista em outra branch ou ambiente.

> **Correção:** a revisão de `main` acima não refletia `develop`. A branch oficial
> já contém a implementação Firebase descrita no registro abaixo.

### 2026-10-15 — Revisão da base oficial e trabalho independente

- Confirmada `origin/develop` como base oficial; os commits da Maria são
  preparados em branches separadas com destino de PR para `develop`.
- A idade foi implementada no formulário de atleta e validada no navegador.
- O commit `deea4ac` foi publicado em
  `feat/maria-calculo-idade-menor`, com destino à base `develop`. A PR não pôde
  ser aberta pelas ferramentas disponíveis; o link de comparação foi gerado
  pelo push e precisa ser usado para solicitar revisão.
- No branch atual, RF24 tem `OperationFeedback` para estados de carregamento,
  confirmação, sucesso e erro. RF25 tem o componente `EmptyState`, sem alterar
  listas pertencentes às áreas de Marcelo ou Laura.
- A tela de recuperação consome `authentication.recuperarSenha` e só avança
  para confirmação quando a operação retorna sucesso; falhas aparecem na tela.
- RF25 permanece em andamento até um consumidor autorizado aplicar o componente
  a uma lista real. RF24 permanece em andamento até validação visual e PR.
- Validações desta branch:
  - `npm run check:contracts` — passou.
  - `npm run progress -- --check` — passou.
  - `npm run export:web` — passou.
  - Verificação no navegador com e-mail inválido exibiu a mensagem de erro sem
    navegar para a confirmação; nenhuma mensagem foi enviada a uma conta real.
- As alterações de RF24/RF25 estão em `feat/maria-estados-compartilhados`, criada
  diretamente a partir de `origin/develop`; precisam de PR para integração.
- Ambas as branches alteram o painel e este documento. Para evitar que uma PR
  sobrescreva o progresso da outra, integrar primeiro a PR de idade e atualizar
  `feat/maria-estados-compartilhados` a partir do `develop` resultante antes de
  integrar a segunda PR.
- As branches foram enviadas ao remoto, mas as PRs não puderam ser abertas pelas
  ferramentas disponíveis nesta sessão. Não foi feito push direto para
  `develop`.

### 2026-10-15 — Correção da base e integração

- A checagem inicial foi feita na branch `main`, não em `develop`; essa
  conclusão não deve ser usada para avaliar o que foi integrado em `develop`.

### 2026-10-15 — Revisão de `origin/develop`

- Revisado o branch remoto `origin/develop`, sem trocar a branch de trabalho.
- `develop` contém a dependência `firebase` e o merge da PR #3 de infraestrutura
  Firebase, além de marcar RF02 como `em_andamento`.
- O merge adiciona o SDK e inicia RF02, mas não inclui uma implementação do
  adaptador Firebase: `src/repositories/index.js` ainda só cria o adaptador
  `memory` e lança `Provedor de dados ainda não configurado: firebase` para
  qualquer outro provedor.
- Não foram encontradas implementações Firebase nas pastas de repositório ou
  serviços em `develop`; RF12, RF13, RF14 e RF22 permanecem `não_iniciado`.
- Assim, a base de SDK foi integrada, mas autenticação, persistência Firebase e
  demais entregas de dados ainda não estão concluídas em `develop`. O erro
  acontece quando `createRepositories()` é chamado com o provedor `firebase`;
  a busca no código não encontrou chamadas atuais à fábrica, então isso não
  prova que a tela inicial falhe ao abrir.

> **Correção posterior:** a avaliação acima refletia um estado anterior de
> `develop`. O adaptador Firebase e a fábrica que o seleciona já estão presentes
> na base atual; as telas ainda precisam consumir as operações.

### 2026-10-15 — Base de trabalho corrigida

- Seguidas as instruções de usar `develop` como base oficial, não `main`.
- Executado `git fetch origin --prune`; como não havia branch local `develop`,
  criada `docs/plano-trabalho-maria` diretamente de `origin/develop`, que aponta
  para o merge da PR #6.
- O documento local foi preservado durante a troca e permanece como alteração
  de trabalho nesta branch.

### 2026-10-15 — Início de RF04 e RF05

- RF04 e RF05 marcados como `em_andamento` pelo comando oficial de progresso.
- `src/screens/signup/SignupForm.js` agora formata a data de nascimento como
  `DD/MM/AAAA`, rejeita datas impossíveis e futuras, calcula a idade usando
  `calculateAge` do domínio e identifica automaticamente menores com `isMinor`.
- O formulário mostra a idade calculada e informa quando será necessário
  vincular responsável legal; impede avançar sem uma data válida.
- Validação no navegador: `15/10/2010` exibiu 16 anos e o aviso de menor;
  `31/02/2010` exibiu erro de data inválida; `15/10/2008` exibiu 18 anos sem
  aviso de menor.
- `npm run check:contracts` passou.
- `npm run progress -- --check` passou.
- `npm run export:web` passou depois de restaurar dependências do lockfile com
  `npm ci`; a primeira tentativa falhou porque `firebase/auth` não estava
  instalado localmente. A exportação registrou aviso de cache Metro e depois
  concluiu com recompilação completa.
- RF04 continua em andamento até revisão/PR e evidência formal.
- RF05 está bloqueado no painel: a identificação visual está implementada, mas
  o fluxo de menor não pode ser ativado com segurança até existir uma operação
  de convite/código e vínculo autorizado no contrato/repositório.
- Pedido pendente para Renato: disponibilizar, pelo contrato comum de
  repositórios, operações para o responsável autenticado gerar um convite/código
  e para o atleta validar esse convite e concluir o vínculo dos dois lados.
  A validação deve falhar explicitamente para convite inválido, expirado ou já
  usado, e a leitura/alteração de atletas deve continuar restrita aos vínculos
  autorizados. A interface aguardará o contrato e o mock/implementação
  correspondentes; não foi criado um fluxo local alternativo.
- Não há outra sessão de trabalho do Renato disponível neste projeto para
  encaminhar a mensagem diretamente. O pedido permanece registrado aqui e no
  bloqueio do RF05 para encaminhamento pela equipe.

### 2026-10-15 — Situação atual e próximos passos

- Reconfirmada a base de trabalho em `develop`: existem
  `src/repositories/firebase/index.js`, configuração de Firebase, adaptadores de
  autenticação para web/nativo e seleção `firebase` na fábrica de repositórios.
- O repositório já fornece as operações de cadastro, login e recuperação de
  senha. Portanto, RF01 pode avançar na camada de interface, respeitando o
  contrato existente e alinhando o pós-login com Renato/RF02.
- RF04 calcula e apresenta idade no cadastro, mas ainda precisa ser conectado
  ao fluxo de gravação do perfil; a persistência de campos do perfil esportivo
  deve ser coordenada com Marcelo/RF03.
- RF05 permanece bloqueado até o repositório oferecer o fluxo autorizado de
  convite/código e vínculo.
- RF24 e RF25 podem avançar independentemente: criar componentes compartilhados
  de feedback e estado vazio e aplicá-los nas telas da área da Maria.
- Próxima sequência sugerida: RF24/RF25 e integração de RF01; retomar RF04 após
  definir como transportar a data até a gravação do perfil. RF06/RF07 aguardam
  operações de convite/vínculo e acesso administrativo.

### Atualização — implementação de RF01

- O trabalho foi integrado em `develop` pela PR #16.
- Login e cadastro agora usam o contrato `repositories.authentication`,
  apresentam erros e estado de envio e validam os campos antes de chamar o
  repositório. A recuperação de senha funcional já está registrada na PR #13.
- Formulários de atleta, treinador, instituição e responsável usam campos
  controlados. A chamada de cadastro envia os dados do perfil correspondente.
- Com autorização explícita da usuária, `src/repositories/firebase/index.js`
  agora grava usuário e perfil inicial juntos em lote; em memória, o perfil é
  salvo antes de publicar a sessão. Isso inclui data de nascimento do atleta,
  documento/localização do parceiro e parentesco/documento/telefone do
  responsável.
- O perfil esportivo do atleta nasce como incompleto (`perfilCompleto: false`);
  modalidade e demais dados esportivos continuam dependentes do fluxo RF03 do
  Marcelo.
- O fluxo de atleta menor identifica a idade, mas bloqueia a criação da conta
  até haver vínculo confirmado do responsável. Isso preserva RF05 bloqueado
  sem criar uma sessão de menor sem autorização.
- Testes manuais com o provedor `memory`: login de atleta, cadastro de treinador
  e de atleta adulto, rejeição de senhas divergentes, bloqueio de atleta menor
  e ocultação de ambas as senhas. A verificação automatizada também cobre a
  criação dos quatro tipos de perfil e rejeita data inválida/menor sem vínculo.
  Nenhuma conta real foi criada nem operação Firebase executada.
- Validações: `npm run check:contracts`, `npm run progress -- --check`,
  `npm run export:web` e `git diff --check` passaram.
- RF04 está `concluido` com evidência da PR #9 integrada em `develop`. RF01
  permanece `em_andamento` até confirmar as regras do Firebase antes de
  habilitar cadastros reais.
- A PR #16 de RF01 já foi integrada. A modalidade e os demais dados esportivos
  continuam dependentes do fluxo RF03, sob responsabilidade do Marcelo.
- As regras de segurança do Firestore não estão versionadas neste repositório;
  o acesso de cada usuário à criação do próprio perfil precisa ser confirmado no
  projeto Firebase antes de habilitar cadastros reais.
- RF05, RF06 e RF07 continuam dependendo do contrato e das operações de convite,
  vínculo e administração; não foram alteradas telas de outras áreas.

### 2026-10-16 — Retomada de RF24 e RF25

- A PR #13 contém `OperationFeedback`, que comunica carregamento, confirmação,
  sucesso e erro, e `EmptyState`, componente compartilhado para listas vazias.
- A branch da PR #13 foi sincronizada localmente com a `develop` que recebeu a
  PR #16. `Field.js` preserva tanto os campos controlados da PR #13 quanto a
  opção `autoCapitalize` da PR #16.
- A tela de recuperação agora consome o repositório recebido por props, valida
  o e-mail e impede envios repetidos enquanto a operação estiver em andamento.
- Teste manual no navegador com o provedor `memory`: e-mail malformado exibiu
  erro e permaneceu na tela; e-mail de demonstração válido exibiu a confirmação.
  Nenhuma solicitação foi enviada ao Firebase.
- RF25 permanece sem consumidor de lista no escopo autorizado da Maria; a
  aplicação em telas de Marcelo ou Laura depende de autorização entre áreas.
- `npm run check:contracts`, `npm run progress -- --check`, `npm run export:web`
  e `git diff --check` passaram após a sincronização.
