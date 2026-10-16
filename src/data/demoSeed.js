import { APPLICATION_STATUS, OPPORTUNITY_STATUS, USER_TYPES } from '../domain/contracts.js'

// Dados inteiramente fictícios. Nenhuma senha é armazenada no repositório.
export const demoUsers = [
  {
    id: 'usuario-atleta-adulto',
    email: 'atleta.adulto@matchpoint.example',
    tipo: USER_TYPES.ATHLETE,
    nome: 'Atleta Demo Adulto',
  },
  {
    id: 'usuario-atleta-menor',
    email: 'atleta.menor@matchpoint.example',
    tipo: USER_TYPES.ATHLETE,
    nome: 'Atleta Demo Menor',
  },
  {
    id: 'usuario-responsavel',
    email: 'responsavel@matchpoint.example',
    tipo: USER_TYPES.GUARDIAN,
    nome: 'Responsável Demo',
  },
  {
    id: 'usuario-treinador',
    email: 'treinador@matchpoint.example',
    tipo: USER_TYPES.TRAINER,
    nome: 'Treinador Demo',
  },
  {
    id: 'usuario-instituicao',
    email: 'instituicao@matchpoint.example',
    tipo: USER_TYPES.INSTITUTION,
    nome: 'Instituição Demo',
  },
]

export const demoAthletes = [
  {
    id: 'atleta-adulto',
    usuarioId: 'usuario-atleta-adulto',
    dataNascimento: '2004-05-14',
    modalidade: 'Tenis',
    categoria: 'Universitario',
    maoDominante: 'Direita',
    equipeAtual: 'Equipe MatchPoint',
    tempoDePratica: '8 anos',
    perfilCompleto: true,
  },
  {
    id: 'atleta-menor',
    usuarioId: 'usuario-atleta-menor',
    responsavelId: 'responsavel-demo',
    dataNascimento: '2011-08-20',
    modalidade: 'Tenis',
    categoria: 'Sub-18',
    maoDominante: 'Direita',
    equipeAtual: 'Equipe Juvenil Demo',
    tempoDePratica: '3 anos',
    perfilCompleto: true,
  },
]

export const demoGuardians = [
  {
    id: 'responsavel-demo',
    usuarioId: 'usuario-responsavel',
    atletasVinculadosIds: ['atleta-menor'],
    parentesco: 'Responsável legal',
    telefone: '(00) 00000-0000',
  },
]

export const demoPartners = [
  {
    id: 'treinador-demo',
    usuarioId: 'usuario-treinador',
    tipo: USER_TYPES.TRAINER,
    nomeExibicao: 'Treinador Demo',
    verificado: true,
  },
  {
    id: 'instituicao-demo',
    usuarioId: 'usuario-instituicao',
    tipo: USER_TYPES.INSTITUTION,
    nomeExibicao: 'Instituição Demo',
    verificado: true,
  },
]

export const demoOpportunities = [
  {
    id: 'oportunidade-bolsa-tenis',
    criadorId: 'instituicao-demo',
    titulo: 'Bolsa de Estudos',
    descricao: 'Bolsa esportiva fictícia preparada para a demonstração do fluxo principal.',
    modalidade: 'Tenis',
    categoria: 'Universitario',
    localizacao: 'Suzano - SP',
    beneficio: 'Bolsa integral',
    requisitos: ['Prática esportiva comprovada', 'Histórico escolar'],
    criteriosElegibilidade: [
      { codigo: 'modalidade', nome: 'Modalidade compatível', obrigatorio: true, valor: 'Tenis' },
      { codigo: 'perfil-completo', nome: 'Perfil completo', obrigatorio: true, valor: true },
    ],
    documentosNecessarios: ['curriculo_esportivo', 'historico_escolar'],
    inicioInscricoes: '2026-10-01T00:00:00.000Z',
    fimInscricoes: '2026-12-20T23:59:59.000Z',
    status: OPPORTUNITY_STATUS.ACTIVE,
  },
  {
    id: 'oportunidade-futebol-incompativel',
    criadorId: 'instituicao-demo',
    titulo: 'Avaliação de Futebol',
    descricao: 'Oportunidade fictícia usada para demonstrar bloqueio por inelegibilidade.',
    modalidade: 'Futebol',
    categoria: 'Sub-18',
    localizacao: 'São Paulo - SP',
    beneficio: 'Avaliação técnica',
    requisitos: ['Modalidade Futebol'],
    criteriosElegibilidade: [
      { codigo: 'modalidade', nome: 'Modalidade compatível', obrigatorio: true, valor: 'Futebol' },
    ],
    documentosNecessarios: ['curriculo_esportivo'],
    inicioInscricoes: '2026-10-01T00:00:00.000Z',
    fimInscricoes: '2026-12-20T23:59:59.000Z',
    status: OPPORTUNITY_STATUS.ACTIVE,
  },
]

export const demoApplications = [
  {
    id: 'candidatura-demo-em-analise',
    oportunidadeId: 'oportunidade-bolsa-tenis',
    atletaId: 'atleta-adulto',
    status: APPLICATION_STATUS.UNDER_REVIEW,
    matchScore: 94,
    documentos: [],
    historico: [
      {
        id: 'evento-demo-inscricao',
        status: APPLICATION_STATUS.SUBMITTED,
        statusAnterior: null,
        statusNovo: APPLICATION_STATUS.SUBMITTED,
        descricao: 'Inscrição de demonstração realizada.',
        data: '2026-10-09T12:00:00.000Z',
        responsavelId: 'usuario-atleta-adulto',
      },
      {
        id: 'evento-demo-analise',
        status: APPLICATION_STATUS.UNDER_REVIEW,
        statusAnterior: APPLICATION_STATUS.SUBMITTED,
        statusNovo: APPLICATION_STATUS.UNDER_REVIEW,
        descricao: 'Candidatura encaminhada para análise.',
        data: '2026-10-09T12:05:00.000Z',
        responsavelId: 'usuario-instituicao',
      },
    ],
  },
]

export const demoSeed = Object.freeze({
  users: demoUsers,
  athletes: demoAthletes,
  guardians: demoGuardians,
  partners: demoPartners,
  opportunities: demoOpportunities,
  applications: demoApplications,
})
