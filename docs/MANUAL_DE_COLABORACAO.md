# Manual de colaboração — MatchPoint

## 1. Objetivo

Este manual organiza o desenvolvimento do MatchPoint entre quatro pessoas usando IA assistida e GitHub.

Os objetivos são:

- permitir que todos trabalhem ao mesmo tempo com o mínimo de conflito;
- definir claramente quem é responsável por cada parte do sistema;
- impedir que uma pessoa altere a área de outra sem alinhamento;
- estabelecer como solicitar mudanças entre áreas;
- definir quando aguardar um commit e como continuar o trabalho depois dele;
- manter decisões técnicas, banco de dados e integrações consistentes.

Este documento organiza o trabalho a partir da estrutura atual do projeto. Ele não exige uma refatoração imediata.

---

## 2. Regras fundamentais

1. Cada tarefa deve ter uma pessoa responsável, uma Issue e uma branch própria.
2. Cada pessoa altera somente os arquivos de sua área.
3. Arquivos compartilhados possuem controle especial e não podem ser alterados livremente.
4. Mudanças em outra área exigem um pedido registrado e autorização do responsável.
5. Nenhum código gerado por IA entra no projeto sem revisão humana.
6. Não devem existir dois trabalhos simultâneos sobre o mesmo arquivo compartilhado.
7. Quem inicia uma tarefa informa antes quais arquivos pretende alterar.
8. Uma entrega só está concluída quando foi testada, revisada e integrada à `develop`; versões estáveis seguem para a `main`.

---

## 3. Divisão da equipe

Responsáveis definidos: Maria (Pessoa 1), Marcelo (Pessoa 2), Laura (Pessoa 3) e Renato (Pessoa 4). Os usuários do GitHub deverão ser adicionados posteriormente ao arquivo `CODEOWNERS`.

### Maria — Pessoa 1 — Acesso, cadastro e interface compartilhada

Responsabilidades:

- abertura, login e recuperação de senha;
- escolha e cadastro de perfil;
- cadastro esportivo do atleta;
- componentes visuais reutilizáveis;
- tema, cores, imagens, tokens e padrões globais de interface;
- consistência visual entre as telas.

Arquivos sob sua responsabilidade:

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

Limites:

- não altera os fluxos internos do atleta ou do parceiro sem solicitação;
- não modifica rotas em `App.js` diretamente;
- não instala bibliotecas sem aprovação do Renato;
- alterações globais em componentes ou tema devem ser comunicadas, pois podem afetar todas as telas.
- não precisa implementar os estilos internos das telas de Marcelo ou Laura: cada responsável cuida do visual de sua própria feature usando estilos locais;
- estilos só devem entrar em `src/theme/styles.js` quando forem realmente compartilhados por mais de uma área.

### Marcelo — Pessoa 2 — Jornada do atleta

Responsabilidades:

- início do atleta;
- oportunidades disponíveis para o atleta;
- Match Score;
- detalhes da oportunidade;
- candidatura, informações e acompanhamento da situação;
- perfil do atleta;
- notificações e conteúdos da área do atleta.

Arquivos sob sua responsabilidade:

```text
src/screens/AthleteHomeScreen.js
src/screens/AthleteOpportunitiesScreen.js
src/screens/MatchScoreScreen.js
src/screens/OpportunityDetailScreen.js
src/screens/ApplicationsScreen.js
src/screens/ApplicationDetailScreen.js
src/screens/ApplicationInfoScreen.js
src/screens/ApplicationStatusScreen.js
src/screens/AthleteProfileScreen.js
src/screens/NotificationsScreen.js
src/screens/WomenInSportScreen.js
```

Limites:

- não altera telas do treinador ou da instituição;
- não acessa Firebase ou outro banco diretamente nas telas;
- solicita novas rotas ao Renato;
- solicita mudanças em componentes compartilhados à Maria.

### Laura — Pessoa 3 — Jornada do treinador e da instituição

Responsabilidades:

- início do treinador e da instituição;
- criação, listagem e acompanhamento de oportunidades;
- oportunidades criadas;
- candidatos de cada oportunidade;
- visualização do perfil do atleta por técnicos e instituições;
- perfis de treinador e instituição.

Arquivos sob sua responsabilidade:

```text
src/screens/partner/**
```

Limites:

- não altera telas da jornada do atleta;
- não acessa Firebase ou outro banco diretamente nas telas;
- solicita novas rotas ao Renato;
- solicita mudanças em componentes compartilhados à Maria.

### Renato — Pessoa 4 — Núcleo, dados, banco e integração

Responsabilidades:

- navegação geral e composição das rotas;
- integração entre as áreas;
- configuração do projeto e dependências;
- contratos de dados;
- banco de dados e autenticação;
- segurança, regras de acesso e variáveis de ambiente;
- revisão de mudanças em arquivos compartilhados;
- integração final das Pull Requests.

Laura atua como revisora substituta de integração quando Renato estiver indisponível. Ela pode validar builds e integrar mudanças rotineiras já aprovadas, mas não pode aprovar a própria Pull Request nem alterar contratos, dependências ou segurança sem o Renato.

Arquivos atuais sob sua responsabilidade:

```text
App.js
index.js
app.json
package.json
package-lock.json
src/screens/index.js
src/data/**
```

Pastas futuras recomendadas para esta área:

```text
src/core/**
src/config/**
src/domain/**
src/services/**
src/repositories/**
src/security/**
```

Limites:

- não corrige visual ou conteúdo de uma tela de outra área sem solicitação;
- ao alterar um contrato de dados, comunica os responsáveis pelas telas afetadas;
- deve fornecer interfaces e dados simulados para que as demais áreas não dependam do banco pronto.

---

## 4. Arquivos compartilhados e controlados

Os seguintes arquivos têm grande risco de conflito ou impacto geral:

| Arquivo ou pasta | Responsável principal | Regra |
| --- | --- | --- |
| `App.js` | Renato | Somente uma alteração por vez; rotas são adicionadas pelo Renato. |
| `src/screens/index.js` | Renato | Exportações novas devem ser solicitadas ou entregues em commit separado. |
| `src/data/content.js` | Renato | Mudanças precisam manter o contrato consumido pelas telas. |
| `src/theme/styles.js` | Maria | Não adicionar estilos de uma feature sem alinhamento. |
| `src/theme/**` | Maria | Alterações globais devem ser avisadas às áreas afetadas. |
| `src/components/**` | Maria | Uma mudança de API exige aprovação de quem usa o componente. |
| `package.json` e `package-lock.json` | Renato | Somente o Renato instala, remove ou atualiza dependências. |
| `app.json` e `index.js` | Renato | Alterações somente com Issue aprovada. |

### Regra de bloqueio temporário

Antes de editar um arquivo controlado, o responsável comenta na Issue ou no canal da equipe:

```text
LOCK: App.js
Responsável: Renato
Motivo: adicionar rota da tela X
Previsão de liberação: PR #00 ou commit abc1234
```

Enquanto o bloqueio estiver ativo, ninguém mais altera o arquivo. O bloqueio termina quando o commit é publicado ou a Pull Request é aberta.

### Evitar concentração de trabalho

- Renato define contratos, arquitetura e integração, mas não deve implementar todas as tarefas que conectam áreas;
- o responsável de cada feature implementa sua adaptação ao contrato aprovado;
- Maria mantém os elementos globais, mas cada pessoa implementa o layout e os estilos locais de suas telas;
- revisões simples podem ser distribuídas, desde que ninguém aprove a própria Pull Request;
- qualquer ausência prolongada deve ter um substituto definido na Issue correspondente.

---

## 5. Fluxo de trabalho no GitHub

### 5.1 Antes de começar

1. Criar ou assumir uma Issue.
2. Informar a área, o resultado esperado e os arquivos que serão alterados.
3. Conferir se nenhum desses arquivos está bloqueado.
4. Atualizar a branch `develop` local com `git fetch origin --prune`, `git switch develop` e `git pull --ff-only origin develop`.
5. Conferir que o painel e os contratos consultados pertencem à `develop`, não à `main` ou a uma branch pessoal.
6. Criar uma branch exclusiva para a tarefa a partir da `develop` atualizada.

Exemplos de branches:

```text
feat/atleta-editar-perfil
feat/parceiros-lista-candidatos
feat/acesso-recuperar-senha
infra/firebase-autenticacao
ui/componente-cartao
fix/atleta-status-candidatura
docs/manual-equipe
```

Não usar uma única branch para várias tarefas não relacionadas.

### 5.2 Durante o desenvolvimento

- fazer commits pequenos e relacionados a uma única intenção;
- revisar o diff antes de cada commit;
- não incluir arquivos gerados, temporários ou mudanças acidentais;
- não reformatar arquivos de outra área;
- avisar imediatamente se a tarefa começar a exigir arquivos não declarados;
- registrar dependências entre Issues.

### 5.3 Padrão de commits

Formato:

```text
tipo(área): descrição curta
```

Exemplos:

```text
feat(atleta): adiciona edição do perfil
fix(parceiros): corrige filtro de oportunidades criadas
feat(acesso): adiciona confirmação de recuperação de senha
ui(componentes): adiciona estado de carregamento ao botão
infra(firebase): configura autenticação do usuário
refactor(dados): cria repositório de oportunidades
docs(equipe): define regras de colaboração
```

Tipos recomendados: `feat`, `fix`, `ui`, `infra`, `refactor`, `test`, `docs` e `chore`.

### 5.4 Pull Request

Toda Pull Request deve informar:

- Issue relacionada;
- área responsável;
- resumo da alteração;
- arquivos principais alterados;
- como foi testada;
- capturas de tela, quando houver mudança visual;
- dependências de outras Pull Requests;
- contrato de dados alterado, se houver;
- pessoa que precisa revisar.

Depois que a branch de tarefa estiver validada e publicada, a IA responsável deve abrir automaticamente a Pull Request com destino em `develop`. Se o ambiente não estiver autenticado no GitHub, ela deve informar o link direto de criação da Pull Request; nesse caso, a pessoa responsável apenas cria ou integra a solicitação. A IA não deve aguardar uma instrução adicional para preparar a PR.

Uma Pull Request que toca duas áreas deve ser aprovada pelos dois responsáveis. Uma Pull Request que altera arquivo controlado também precisa da aprovação do Renato ou da Maria, conforme a tabela anterior.

### 5.5 Integração

Fluxo preferido:

1. Pull Request aprovada.
2. Verificações concluídas.
3. Integração na branch `develop`.
4. Demais pessoas atualizam suas branches.
5. Os fluxos completos são validados em conjunto.
6. A versão estável de `develop` é integrada à `main`.
7. A Issue é movida para “Concluído”.

Sempre que possível, usar **Squash and merge** para manter um histórico objetivo por tarefa.

### 5.6 Estratégia de branches

```text
branch da tarefa → develop → validação integrada → main
```

- `main` representa a versão estável e apresentável do projeto;
- `develop` recebe as entregas aprovadas durante o desenvolvimento;
- branches de tarefa nascem da `develop` atualizada;
- correções urgentes da versão estável usam `hotfix/...` e depois retornam também para `develop`;
- `main` e `develop` devem ser protegidas contra envio direto.

### 5.7 Fonte de verdade e recuperação de divergência

Durante o desenvolvimento, a `develop` é a fonte de verdade para código integrado, contratos e `docs/PROGRESSO.md`. A `main` não deve ser usada como ponto de partida de uma tarefa, mesmo que tenha commits mais recentes.

Antes de abrir uma branch, cada pessoa executa:

```text
git fetch origin --prune
git switch develop
git pull --ff-only origin develop
git status --short --branch
```

O resultado deve indicar uma `develop` atualizada e sem alterações locais. Só então a pessoa cria a branch da tarefa.

Se um commit entrar acidentalmente na `main`, não se deve enviar mudanças diretamente para `develop`, copiar arquivos, usar `reset` ou aplicar `cherry-pick` sem alinhamento. O Renato cria uma branch de sincronização a partir da `develop`, integra a `main` nessa branch e abre uma Pull Request com destino em `develop`. Em conflitos, a versão integrada mais nova da `develop` prevalece para dados de progresso, contratos e dependências; qualquer exceção deve ser revisada explicitamente.

Depois do merge dessa Pull Request, toda a equipe atualiza a `develop` antes de continuar. A `main` só volta a receber alterações quando a versão da `develop` estiver validada como estável.

---

## 6. Pedido para alterar a área de outra pessoa

Ninguém altera diretamente a área de outra pessoa apenas porque a mudança parece pequena.

O solicitante abre uma Issue ou comentário com a etiqueta `cross-area` usando este modelo:

```text
PEDIDO ENTRE ÁREAS

Solicitante:
Responsável da área:
Issue de origem:
Área afetada:
Arquivos envolvidos:
Mudança necessária:
Motivo:
Contrato esperado:
Prazo ou bloqueio causado:
Branch/PR dependente:
```

O responsável pela área escolhe uma das opções:

1. faz a mudança e entrega um commit/PR;
2. autoriza o solicitante a editar arquivos específicos;
3. realiza a mudança em conjunto com o solicitante;
4. propõe uma solução que não invade sua área.

A autorização deve ser explícita e registrar:

```text
AUTORIZADO
Pessoa autorizada:
Arquivos permitidos:
Mudança permitida:
Limites:
Revisor obrigatório:
```

Autorizar um arquivo não autoriza mudanças adicionais em toda a pasta.

---

## 7. Quando uma tarefa depende do commit de outra pessoa

### Procedimento

1. A pessoa dependente marca sua Issue como `blocked`.
2. Registra qual Issue, Pull Request ou contrato está aguardando.
3. Continua apenas nas partes que podem usar dados simulados ou interfaces já aprovadas.
4. A pessoa responsável pela dependência informa o commit ou a Pull Request assim que publicar.
5. Preferencialmente, a dependência é integrada à branch `develop` antes de a tarefa bloqueada continuar.
6. A pessoa dependente atualiza sua branch e remove a etiqueta `blocked`.

Modelo de entrega:

```text
DEPENDÊNCIA ENTREGUE

Issue atendida:
Commit:
Pull Request:
Arquivos alterados:
Contrato disponibilizado:
Possíveis impactos:
Já integrado à `develop`: sim/não
```

### Regras importantes

- não copiar e colar manualmente código de uma branch para outra;
- não criar uma segunda implementação provisória sem combinar com o responsável;
- evitar `cherry-pick` de um commit que depois também será integrado pela Pull Request, pois isso pode duplicar mudanças e gerar conflitos;
- Pull Requests encadeadas só devem ser usadas quando a equipe combinar previamente a ordem de integração;
- se a espera for apenas pelo banco, usar uma implementação simulada atrás do mesmo contrato.

---

## 8. Regras para uso de IA assistida

Cada pessoa continua responsável pelo código produzido com IA.

Todo pedido à IA deve informar:

- objetivo da tarefa;
- arquivos que ela pode alterar;
- arquivos que não pode alterar;
- área responsável;
- comportamento esperado;
- comandos de validação;
- que mudanças fora do escopo devem ser apenas relatadas.

Modelo de instrução:

```text
Implemente a Issue #00 somente na área [área].
Você pode alterar: [lista de arquivos/pastas].
Não altere: App.js, package.json, package-lock.json, src/theme e áreas de outros responsáveis.
Se precisar de uma mudança fora desses limites, pare e explique a dependência.
Antes de concluir, revise o diff e execute as validações do projeto.
```

É proibido pedir à IA para:

- “corrigir todo o projeto” sem escopo;
- renomear ou reorganizar pastas em massa sem decisão da equipe;
- instalar dependências por conta própria;
- editar simultaneamente arquivos de várias áreas sem autorização;
- apagar código que pareça não utilizado sem confirmar quem é o responsável;
- inserir chaves, senhas, tokens ou dados pessoais em prompts, código ou commits.

Antes do commit, a pessoa deve conferir:

```text
git status
git diff
```

Ela deve entender e conseguir explicar tudo o que será enviado.

---

## 9. Arquitetura para banco de dados e integrações

Quando o banco for adicionado, as telas não devem importar o SDK do Firebase ou de outro provedor diretamente.

Fluxo esperado:

```text
Tela/componente
      ↓
Hook ou caso de uso
      ↓
Interface do repositório
      ↓
Implementação do repositório
      ↓
Firebase/API
```

Exemplo de separação futura:

```text
src/
  domain/
    entities/
    repositories/
  repositories/
    firebase/
  services/
    firebase/
  features/
    access/
    athlete/
    partners/
    admin/
  shared/
    components/
    theme/
```

### Responsabilidades do Renato no banco

- configurar o provedor e as variáveis de ambiente;
- documentar coleções, campos, relacionamentos e índices;
- criar interfaces de repositório;
- implementar autenticação e autorização;
- escrever regras de segurança;
- fornecer mocks com a mesma interface usada pelo banco real;
- revisar qualquer mudança de contrato.

### Responsabilidades das demais pessoas

- consumir somente funções e contratos aprovados;
- não consultar coleções diretamente dentro das telas;
- não depender de nomes internos do banco na interface;
- solicitar novos campos ou operações por Issue;
- tratar carregamento, sucesso, vazio e erro nas telas de sua área.

Mudanças incompatíveis em um contrato de dados exigem aprovação das pessoas que consomem esse contrato.

Os contratos iniciais e as operações esperadas estão registrados em `docs/CONTRATOS_DE_DADOS.md`. Esse documento deve ser aprovado antes da implementação do Firebase.

### Migração da estrutura atual

A organização futura por funcionalidades deve ser feita gradualmente:

```text
src/
  core/                  # navegação, configuração e inicialização
  shared/                # componentes, tema e utilitários reutilizáveis
  features/
    access/              # abertura, login, recuperação e cadastros
    athlete/             # jornada do atleta
    partners/            # treinador e instituição
    admin/               # administração futura
  domain/                # entidades e interfaces independentes do Firebase
  services/              # integração técnica com serviços externos
  repositories/          # implementação dos contratos de dados
```

Regras para a migração:

- nenhuma pessoa move arquivos de outra área isoladamente;
- cada mudança estrutural deve ter uma Issue própria;
- a migração deve preservar comportamento e navegação;
- imports e rotas são atualizados na mesma Pull Request;
- uma feature por vez é migrada e validada;
- não misturar uma reorganização ampla com a criação de uma funcionalidade.

---

## 10. Organização das tarefas

Quadro recomendado no GitHub Projects:

```text
Backlog → Pronto → Em andamento → Bloqueado → Em revisão → Concluído
```

Etiquetas recomendadas:

```text
area:acesso-ui
area:atleta
area:parceiros
area:core-dados
cross-area
blocked
bug
feature
database
security
documentation
```

Cada Issue deve conter:

- descrição do problema ou funcionalidade;
- critérios de aceitação;
- área e responsável;
- arquivos previstos;
- dependências;
- evidências necessárias para aprovação.

### Reunião de integração

A equipe deve reservar um horário fixo semanal para:

- revisar Pull Requests abertas;
- integrar mudanças aprovadas em `develop`;
- testar os principais fluxos de ponta a ponta;
- remover ou renegociar bloqueios;
- revisar decisões arquiteturais e contratos;
- escolher o que estará estável para a próxima apresentação;
- atualizar o quadro do projeto.

Essa reunião não substitui os pedidos entre áreas: dependências urgentes continuam sendo registradas no momento em que aparecem.

---

## 11. Definição de pronto

Uma tarefa somente está pronta quando:

- atende aos critérios de aceitação;
- altera somente os arquivos autorizados;
- não contém dados sensíveis;
- não quebra outras jornadas;
- estados de carregamento, vazio e erro foram considerados quando aplicável;
- a validação do projeto foi executada;
- mudanças visuais possuem captura de tela;
- mudanças de dados possuem contrato documentado;
- a Pull Request foi revisada pelo responsável da área;
- conflitos foram resolvidos conscientemente;
- a alteração foi integrada à `develop` e, quando estável, à `main`.

Validação atual mínima do projeto:

```text
npm run export:web
```

Testes adicionais devem ser incluídos conforme o projeto evoluir.

---

## 12. Configuração inicial do GitHub

No momento da criação deste manual, a pasta local do projeto ainda não estava inicializada como repositório Git. A equipe deve escolher o repositório remoto antes de iniciar essa configuração.

Essa configuração deve ser feita uma única vez pelo Renato:

1. criar o repositório no GitHub;
2. inicializar o Git localmente;
3. conferir o `.gitignore`;
4. criar o primeiro commit aprovado pela equipe;
5. conectar o repositório remoto;
6. publicar a branch principal;
7. criar e publicar a branch `develop`;
8. proteger `main` e `develop`;
9. exigir Pull Request e pelo menos uma aprovação;
10. exigir que a validação automática esteja concluída;
11. impedir que uma pessoa aprove a própria Pull Request;
12. impedir envio direto para `main` e `develop`;
13. configurar o GitHub Projects e as etiquetas deste manual.

Quando os usuários do GitHub forem definidos, criar `.github/CODEOWNERS` para solicitar automaticamente a revisão correta. Exemplo a ser adaptado:

```text
/src/components/            @usuario-da-maria
/src/theme/                 @usuario-da-maria
/src/screens/signup/        @usuario-da-maria
/src/screens/athlete-area/  @usuario-da-maria
/src/screens/Athlete*       @usuario-do-marcelo
/src/screens/Application*   @usuario-do-marcelo
/src/screens/partner/       @usuario-da-laura
/src/data/                  @usuario-do-renato
/App.js                     @usuario-do-renato
/package.json               @usuario-do-renato
/package-lock.json          @usuario-do-renato
```

O arquivo `CODEOWNERS` não substitui os limites deste manual; ele apenas automatiza pedidos de revisão.

O repositório já contém modelos em `.github/` para Pull Requests, tarefas, pedidos entre áreas e validação automática. Eles passam a funcionar quando o projeto for publicado no GitHub.

---

## 13. Registro de decisões técnicas

Decisões que afetem mais de uma área devem ser registradas em `docs/decisoes/` usando o modelo disponível nessa pasta.

Cada registro deve informar:

- contexto e problema;
- decisão adotada;
- alternativas consideradas;
- consequências positivas e negativas;
- pessoas que aprovaram;
- data e situação da decisão.

Depois que uma decisão for aceita, uma IA ou integrante não deve revertê-la silenciosamente. Uma mudança exige um novo registro que substitua formalmente o anterior.

---

## 14. Decisões que exigem aprovação dos quatro integrantes

- troca da tecnologia principal;
- mudança estrutural de pastas;
- substituição do banco de dados;
- alteração do modelo principal de usuários, oportunidades ou candidaturas;
- inclusão de biblioteca que afete várias áreas;
- mudança ampla na navegação;
- mudança de identidade visual global;
- remoção de funcionalidade prevista nos requisitos;
- mudança das responsabilidades definidas neste manual.

Toda decisão desse tipo deve ficar registrada em uma Issue ou documento de decisão técnica.

---

## 15. Resumo operacional

Antes de trabalhar:

```text
Issue → responsável → arquivos declarados → branch própria
```

Se precisar de outra área:

```text
Pedido cross-area → autorização ou commit do responsável → atualização da branch
```

Antes de entregar:

```text
revisar diff → validar projeto → commit pequeno → Pull Request → revisão → integração
```

Regra principal: se uma tarefa exigir ultrapassar o limite da sua área, não faça a alteração silenciosamente. Registre a necessidade, combine a solução e espere a autorização ou o commit correspondente.
