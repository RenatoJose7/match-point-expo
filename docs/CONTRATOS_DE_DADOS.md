# Contratos de dados — MatchPoint

Status: **versão P0 congelada em 2026-10-09** para o ciclo de três dias.

Qualquer mudança incompatível precisa de aprovação de Renato e dos responsáveis pelas telas consumidoras. Campos opcionais podem ser acrescentados sem remover ou renomear os existentes.

## Objetivo

Este documento define a linguagem comum entre as telas e o futuro banco de dados. Ele evita que componentes dependam diretamente de nomes de coleções, consultas ou detalhes do Firebase.

As interfaces definitivas deverão ser implementadas em `src/domain/` e consumidas por repositórios. Até o banco estar pronto, os mesmos contratos podem ser atendidos por dados simulados.

## Regras

- IDs são strings geradas pelo serviço de dados;
- datas circulam na aplicação em formato ISO 8601 e são formatadas apenas na interface;
- campos obrigatórios e opcionais devem ser validados antes da gravação;
- telas não conhecem nomes de coleções do Firebase;
- nenhuma senha é armazenada nos documentos de usuário;
- dados pessoais só podem ser acessados por perfis autorizados;
- alterações incompatíveis exigem registro de decisão e aprovação das áreas consumidoras.

## Entidades iniciais

### Usuário

```text
id
email
tipo: atleta | treinador | instituicao | responsavel | administrador
nome
telefone?
fotoUrl?
criadoEm
atualizadoEm
```

### Atleta

```text
id
usuarioId
responsavelId?
vinculoResponsavelId?
dataNascimento
cpf?
localizacao?
biografia?
modalidade
categoria?
posicao?
maoDominante?
equipeAtual?
tempoDePratica?
ranking?
torneiosDisputados?
titulos?
perfilCompleto
```

### Responsável legal

```text
id
usuarioId
atletasVinculadosIds[]
parentesco
documento?
telefone
criadoEm
atualizadoEm
```

Regras P0:

- a idade é calculada a partir de `dataNascimento`, nunca informada manualmente;
- atleta com menos de 18 anos exige `responsavelId` válido;
- o responsável consulta e altera somente atletas presentes em `atletasVinculadosIds`;
- o vínculo deve ser validado dos dois lados antes de concluir o cadastro.

### Código de vínculo do responsável

```text
id
codigo
responsavelId
status: ativo | utilizado
criadoEm
expiraEm
expiraEmEpoch
utilizadoPorAtletaId?
utilizadoEm?
```

O código não contém dados pessoais, expira em 24 horas e pode ser consumido
uma única vez. Depois do consumo, seu identificador permanece no perfil do
atleta como prova técnica do vínculo, sem conceder novo acesso.

### Parceiro

Representa treinador ou instituição.

```text
id
usuarioId
tipo: treinador | instituicao
nomeExibicao
documento?
descricao?
localizacao?
verificado
```

### Solicitação de avaliação técnica (P1)

```text
id
instituicaoId
treinadorId
atletaId
oportunidadeId?
candidaturaId?
status: pendente | concluida
avaliacaoId?
criadoEm
atualizadoEm
```

Somente uma instituição verificada pode solicitar a avaliação de um atleta a um
treinador verificado. A solicitação não revela dados pessoais além do contexto
da candidatura autorizada.

### Avaliação técnica (P1)

```text
id
solicitacaoId
treinadorId
instituicaoId
atletaId
notaTecnica: 1..5
notaFisica: 1..5
notaTatica: 1..5
parecer
recomendacao
criadoEm
```

O treinador indicado registra uma única avaliação estruturada para cada
solicitação pendente; o resultado fica visível apenas à instituição solicitante
e ao próprio treinador.

### Operações P2

```text
Relato: id, autorId, alvoTipo, alvoId?, mensagem, status, criadoEm
Recurso: id, titulo, tipo, ativo, atualizadoEm
Apoio: id, instituicaoId, atletaId, oportunidadeId?, descricao, criadoEm
Auditoria Match: id, atletaId, oportunidadeId, resultado, criterios, versao, criadoEm
```

Relatos podem ser enviados e acompanhados pelo autor. Recursos, decisões de
conta e auditorias são exclusivos da administração. Instituições verificadas
registram apoios concedidos; a auditoria guarda a versão e os critérios usados
no Match Score para permitir conferência posterior.

### Oportunidade

```text
id
criadorId
titulo
descricao
modalidade
categoria
localizacao
instituicao?
beneficio?
requisitos[]
criteriosElegibilidade[]
documentosNecessarios[]
inicioInscricoes?
fimInscricoes
status: rascunho | ativa | encerrada | em_analise
criadoEm
atualizadoEm
```

### Candidatura

```text
id
oportunidadeId
atletaId
status: iniciada | inscrita | documentos_enviados | em_analise | aprovada | rejeitada
matchScore?
documentos[]
historico[]
motivoBloqueio?
criadoEm
atualizadoEm
```

Existe no máximo uma candidatura por combinação de `oportunidadeId` e `atletaId`.

### Documento da candidatura

```text
id
tipo
nome
arquivoUrl
status: pendente | enviado | validado | rejeitado
enviadoEm?
```

### Evento do histórico

```text
id
status
statusAnterior?
statusNovo?
descricao?
data
responsavelId?
```

Eventos de transição preenchem `statusAnterior` e `statusNovo`. Eventos antigos
sem esses campos continuam válidos e podem usar `status` como estado resultante.

### Match Score

```text
percentualTotal
criterios[]:
  nome
  percentual
calculadoEm
versaoDoCalculo
```

### Resultado de elegibilidade

```text
elegivel
criterios[]:
  codigo
  nome
  obrigatorio
  atendido
  motivo?
motivosBloqueio[]
avaliadoEm
```

## Interfaces esperadas dos repositórios

### Autenticação

```text
cadastrar(email, senha, tipo, dadosIniciais)
entrar(email, senha)
sair()
recuperarSenha(email)
obterSessaoAtual()
observarSessao(callback)
```

`dadosIniciais` pode conter `nome`, `telefone` e o perfil inicial associado ao
tipo da conta:

```text
atleta:      { dataNascimento, modalidade?, codigoResponsavel? }
treinador:   { nomeExibicao, documento?, descricao?, localizacao? }
instituicao: { nomeExibicao, documento?, descricao?, localizacao? }
responsavel: { parentesco, documento?, telefone? }
```

O cadastro grava o usuário e seu perfil inicial de forma atômica, usando o mesmo
ID nos dois registros. A sessão só é publicada depois que ambos forem salvos.
Atletas menores não podem concluir esse cadastro antes da confirmação do
vínculo do responsável legal.

### Usuários e perfis

```text
obterUsuario(id)
obterUsuarioAtual()
atualizarUsuario(id, dados)
criarPerfilAtleta(usuarioId, dados)
obterPerfilAtleta(id)
obterPerfilAtletaPorUsuario(usuarioId)
atualizarPerfilAtleta(id, dados)
criarPerfilParceiro(usuarioId, dados)
obterPerfilParceiro(id)
obterPerfilParceiroPorUsuario(usuarioId)
atualizarPerfilParceiro(id, dados)
criarResponsavel(usuarioId, dados)
obterPerfilResponsavelPorUsuario(usuarioId)
gerarCodigoVinculoResponsavel(responsavelId)
calcularIdade(dataNascimento, dataReferencia?)
identificarMenor(dataNascimento, dataReferencia?)
obterAtletasDoResponsavel(responsavelId)
atualizarAtletaComoResponsavel(responsavelId, atletaId, dados)
```

O responsável autenticado gera um código de vínculo com validade de 24 horas.
O código é de uso único e deve ser informado em `codigoResponsavel` durante o
cadastro de um atleta menor. O cadastro consome o código e atualiza atleta e
responsável na mesma operação; códigos inválidos, expirados ou já utilizados
não criam a conta do atleta.

Não existe operação de vínculo direto por IDs. Todo novo vínculo deve nascer
do consumo do código durante o cadastro do atleta menor.

### Oportunidades

```text
listarOportunidades(filtros)
obterOportunidade(id)
criarOportunidade(dados)
atualizarOportunidade(id, dados)
encerrarOportunidade(id)
listarOportunidadesDoParceiro(parceiroId, filtros)
listarDocumentosNecessarios(oportunidadeId)
```

Filtros P0: texto, modalidade, categoria, localização, status e prazo aberto.

### Candidaturas

```text
criarCandidatura(oportunidadeId, atletaId, dados)
obterCandidatura(id)
listarCandidaturasDoAtleta(atletaId, filtros)
listarCandidatosDaOportunidade(oportunidadeId, filtros)
obterPerfilPublicoCandidato(oportunidadeId, atletaId)
atualizarStatusDaCandidatura(id, status)
enviarDocumento(candidaturaId, documento)
verificarCandidaturaExistente(oportunidadeId, atletaId)
listarHistoricoDaCandidatura(candidaturaId)
registrarEventoDaCandidatura(candidaturaId, evento)
```

`obterPerfilPublicoCandidato` só retorna dados quando o usuário autenticado é
treinador/instituição responsável pela oportunidade e o atleta possui uma
candidatura nela. O resultado é um retrato capturado no momento da candidatura:

```text
nome
fotoUrl?
modalidade
categoria?
posicao?
maoDominante?
equipeAtual?
tempoDePratica?
ranking?
torneiosDisputados?
titulos?
perfilCompleto
```

E-mail, telefone, data de nascimento, CPF, localização e dados de responsável
legal não fazem parte do resultado. No Firebase, o retrato fica em
`oportunidades/{oportunidadeId}/perfisCandidatos/{atletaId}` e somente o
responsável pela oportunidade pode lê-lo. O documento é criado atomicamente
com a candidatura e suas regras só aceitam os campos públicos derivados dos
documentos do próprio atleta e usuário. Candidaturas existentes antes dessa
operação exigem migração aprovada para gerar os retratos correspondentes.

### Arquivos de candidatura

```text
storage.enviarArquivoCandidatura(candidaturaId, documento)
```

`documento` aceita `arquivo` (um `File`/`Blob` no navegador ou um objeto com
`uri`, `name` e `type` no aplicativo), além de `nome`, `tipo` e `tipoMime`. A
operação retorna os metadados sem o conteúdo bruto e inclui `id`, `nome` e
`arquivoUrl`.

`applications.enviarDocumento(candidaturaId, documento)` é o fluxo completo:
faz o upload quando necessário e associa o resultado à candidatura. Também
aceita os metadados já retornados por `storage.enviarArquivoCandidatura`. Quando
todos os documentos exigidos pela oportunidade forem anexados, a candidatura
avança de `inscrita` para `documentos_enviados` e registra o evento com o
atleta autenticado como responsável.

### Match Score

```text
calcularMatchScore(atletaId, oportunidadeId)
obterMatchScore(atletaId, oportunidadeId)
avaliarElegibilidade(atletaId, oportunidadeId)
```

## Transições P0 da candidatura

```text
iniciada → inscrita
inscrita → documentos_enviados
inscrita → em_analise
documentos_enviados → em_analise
em_analise → aprovada
em_analise → rejeitada
```

`aprovada` e `rejeitada` são estados finais durante o P0. Toda transição registra data, responsável, estado anterior e novo estado. Uma transição fora dessa lista deve falhar sem alterar os dados.
O responsável do evento é sempre extraído da sessão autenticada: não é aceito como dado enviado pela tela.

## Respostas padronizadas

Operações dos repositórios retornam:

```text
sucesso:
  ok: true
  data

falha:
  ok: false
  codigo
  mensagem
  detalhes?
```

Códigos mínimos P0:

```text
NAO_AUTENTICADO
SEM_PERMISSAO
DADOS_INVALIDOS
NAO_ENCONTRADO
CANDIDATURA_DUPLICADA
ATLETA_INELEGIVEL
TRANSICAO_INVALIDA
ERRO_DE_REDE
```

## Estados obrigatórios para a interface

Toda operação assíncrona deve permitir que a tela trate:

```text
carregando
sucesso com dados
sucesso sem dados
erro recuperável
erro de permissão
```

## Próximas decisões

Antes da implementação do Firebase, a equipe deve aprovar:

- campos obrigatórios de cada tipo de cadastro;
- relação entre atleta menor de idade e responsável;
- permissões de treinador e instituição;
- documentos aceitos e regras de armazenamento;
- transições válidas de status de candidatura;
- fórmula e versionamento do Match Score;
- política de exclusão e retenção de dados;
- necessidade de perfil administrativo.

Os itens administrativos, avaliações técnicas e notificações permanecem fora do contrato congelado P0 e serão acrescentados de forma compatível na próxima versão.

## Extensão P1 — Notificações

```text
notifications.listarNotificacoesDoUsuario(usuarioId)
notifications.marcarComoLida(notificacaoId)
```

Cada notificação contém `id`, `usuarioId`, `titulo`, `mensagem`, `lida`,
`criadoEm` e, quando vier de uma candidatura, `candidaturaId` e
`oportunidadeId`. Decisões finais de aprovação ou rejeição criam uma
notificação para o atleta. Somente o próprio usuário pode listar ou marcar
como lidas as suas notificações.
