# MatchPoint

> Olá, professor Washington e professora Juliana! Sejam bem-vindos ao repositório do MatchPoint. Este espaço reúne a aplicação, a documentação e a organização usada pela equipe para desenvolver o projeto.

## Sobre o projeto

O MatchPoint é uma plataforma que aproxima atletas, treinadores e instituições esportivas. A proposta é facilitar a descoberta de oportunidades, a criação de perfis esportivos, o envio de candidaturas e o acompanhamento dos processos seletivos.

Entre os principais recursos planejados estão:

- cadastro e autenticação por tipo de usuário;
- perfil esportivo do atleta;
- fluxo específico para atletas menores e responsáveis legais;
- criação e gerenciamento de oportunidades;
- pesquisa, filtros e detalhes das oportunidades;
- Match Score e verificação de elegibilidade;
- candidaturas, documentos, status e histórico;
- visualização e avaliação de candidatos por treinadores e instituições;
- notificações e futura área administrativa.

O aplicativo utiliza **React Native com Expo e JavaScript**, permitindo execução em Android, iOS e navegador.

## Arquitetura combinada

A arquitetura separa interface, regras de negócio e acesso aos dados. Uma tela nunca deve acessar o Firebase diretamente.

```text
Tela ou componente
        ↓
Hook ou caso de uso
        ↓
Contrato do repositório
        ↓
Implementação em memória ou Firebase
        ↓
Banco de dados e serviços externos
```

Durante o desenvolvimento, um repositório em memória permite que as telas avancem usando os mesmos contratos que serão implementados no Firebase. Isso evita que cada integrante crie um formato diferente de dados.

Estrutura planejada:

```text
src/
  components/       componentes compartilhados
  screens/          telas atuais da aplicação
  domain/           regras, estados e contratos comuns
  repositories/     acesso aos dados por interfaces estáveis
  services/         integrações externas e Firebase
  data/             dados simulados e demonstração
  theme/            identidade visual global
```

### Divisão principal da equipe

| Integrante | Módulo principal | Responsabilidades |
| --- | --- | --- |
| Maria | Acesso e experiência compartilhada | Cadastro, login, menor de idade, responsável legal e componentes globais de interface. |
| Marcelo | Jornada do atleta | Perfil esportivo, oportunidades, candidatura, documentos, status e histórico. |
| Laura | Jornada dos parceiros | Treinadores, instituições, gerenciamento de oportunidades, candidatos e decisões. |
| Renato | Núcleo e integração | Navegação, contratos, repositórios, Firebase, Match Score, elegibilidade, segurança e integração. |

### Organização no GitHub

- `main`: versão estável e pronta para demonstração;
- `develop`: integração das entregas aprovadas;
- branches de tarefa: uma funcionalidade ou correção por branch;
- Pull Requests pequenas, revisadas por outra pessoa;
- `CODEOWNERS` para solicitar as revisões responsáveis;
- GitHub Actions para validar contratos, painel de progresso e exportação web.

Ferramentas de IA devem ler [`AGENTS.md`](AGENTS.md) antes de alterar o projeto. Esse arquivo define limites por área, validações obrigatórias e como pedir alterações em arquivos de outra pessoa.

## Meta da entrega

O documento do projeto possui 30 requisitos funcionais. A meta mínima do ciclo atual é concluir e demonstrar **21 requisitos**, correspondentes a **70%**.

O progresso oficial pode ser acompanhado no [painel automático](docs/PROGRESSO.md). Apenas requisitos integrados, com Pull Request e evidência, avançam a barra.

O painel de atividade da equipe é gerado pelo GitHub Actions a cada integração na `develop`, em atualizações de Pull Request e também pode ser executado manualmente na aba **Actions**. Depois que a automação chegar à branch padrão (`main`), ela também roda a cada quatro horas. O painel mostra commits e Pull Requests no resumo da execução e como artefato por 14 dias, sem confundir atividade com requisito funcional concluído nem criar commits automáticos na `develop`.

## Cronograma resumido

| Dia | Objetivo | Principais entregas | Marco de validação |
| --- | --- | --- | --- |
| Dia 1 | Construir a fundação | Autenticação, contratos, perfis, dados simulados e gerenciamento inicial de oportunidades. | Usuário entra na área correta, perfil é salvo e oportunidade do parceiro aparece para o atleta. |
| Dia 2 | Concluir o fluxo principal | Match Score, elegibilidade, candidatura, documentos, candidatos, decisão e histórico. | Fluxo completo da criação da oportunidade até a atualização do status para o atleta. |
| Dia 3 | Estabilizar e apresentar | Correções P0, responsividade, segurança, testes integrados, evidências e versão final. | 21 requisitos demonstráveis, build aprovado e versão estável integrada à `main`. |

Depois dos requisitos P0, a equipe poderá avançar para verificação de parceiros, avaliações técnicas, notificações, denúncias e portal administrativo.

## Executando o projeto

Requisitos: Node.js e npm.

```bash
npm ci
npm start
```

No Expo, escaneie o QR Code com o Expo Go ou pressione `w` para abrir no navegador.

Validações usadas pela equipe:

```bash
npm run check:contracts
npm run progress -- --check
npm run export:web
```

## Documentação

- [Manual de colaboração](docs/MANUAL_DE_COLABORACAO.md)
- [Manual do projeto e plano de execução de três dias](docs/MANUAL_DO_PROJETO_3_DIAS.md)
- [Checklist de arranque do Dia 1](docs/ARRANQUE_DIA_1.md)
- [Painel de progresso](docs/PROGRESSO.md)
- [Contratos de dados](docs/CONTRATOS_DE_DADOS.md)
- [Registro de decisões técnicas](docs/decisoes/README.md)
