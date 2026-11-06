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
      { codigo: 'modalidade', nome: 'Modalidade compatível', obrigatorio: true, valor: 'Tenis', peso: 40 },
      { codigo: 'perfil-completo', nome: 'Perfil completo', obrigatorio: true, valor: true, peso: 40 },
      { codigo: 'ranking', nome: 'Experiência competitiva', obrigatorio: false, valor: 'alto rendimento', peso: 20, percentualQuandoNaoAtendido: 70 },
    ],
    documentosNecessarios: ['curriculo_esportivo', 'historico_escolar'],
    inicioInscricoes: '2026-10-01T00:00:00.000Z',
    fimInscricoes: '2026-12-20T23:59:59.000Z',
    status: OPPORTUNITY_STATUS.ACTIVE,
  },
  {
    id: 'oportunidade-avaliacao-tecnica',
    criadorId: 'instituicao-demo',
    titulo: 'Avaliação Técnica',
    descricao: 'Avaliação esportiva fictícia preparada para demonstração de compatibilidade.',
    modalidade: 'Tenis',
    categoria: 'Universitario',
    localizacao: 'São Paulo - SP',
    beneficio: 'Avaliação técnica',
    requisitos: ['Perfil esportivo completo'],
    criteriosElegibilidade: [
      { codigo: 'modalidade', nome: 'Modalidade compatível', obrigatorio: true, valor: 'Tenis', peso: 60 },
      { codigo: 'perfil-completo', nome: 'Perfil completo', obrigatorio: true, valor: true, peso: 20 },
      { codigo: 'ranking', nome: 'Desempenho competitivo', obrigatorio: false, valor: 'alto rendimento', peso: 20, percentualQuandoNaoAtendido: 40 },
    ],
    documentosNecessarios: ['curriculo_esportivo'],
    inicioInscricoes: '2026-10-01T00:00:00.000Z',
    fimInscricoes: '2026-12-20T23:59:59.000Z',
    status: OPPORTUNITY_STATUS.ACTIVE,
  },
  {
    id: 'oportunidade-clinica-tenis',
    criadorId: 'treinador-demo',
    titulo: 'Clinica de Alto Rendimento',
    descricao: 'Treinos tecnicos e acompanhamento esportivo para atletas universitarios.',
    modalidade: 'Tenis',
    categoria: 'Universitario',
    localizacao: 'Campinas - SP',
    beneficio: 'Avaliacao tecnica',
    requisitos: ['Perfil esportivo completo', 'Disponibilidade para os treinos'],
    criteriosElegibilidade: [
      { codigo: 'modalidade', nome: 'Modalidade compativel', obrigatorio: true, valor: 'Tenis', peso: 40 },
      { codigo: 'perfil-completo', nome: 'Perfil completo', obrigatorio: true, valor: true, peso: 40 },
      { codigo: 'tempoDePratica', nome: 'Experiência esportiva', obrigatorio: false, valor: '10 anos', peso: 20, percentualQuandoNaoAtendido: 25 },
    ],
    documentosNecessarios: ['curriculo_esportivo', 'video_apresentacao'],
    inicioInscricoes: '2026-10-15T00:00:00.000Z',
    fimInscricoes: '2026-12-28T23:59:59.000Z',
    status: OPPORTUNITY_STATUS.ACTIVE,
  },
  {
    id: 'oportunidade-circuito-tenis',
    criadorId: 'instituicao-demo',
    titulo: 'Circuito Regional de Tenis',
    descricao: 'Competicao regional para atletas em desenvolvimento.',
    modalidade: 'Tenis',
    categoria: 'Universitario',
    localizacao: 'Sao Paulo - SP',
    beneficio: 'Participacao no circuito',
    requisitos: ['Inscricao ativa no torneio'],
    criteriosElegibilidade: [
      { codigo: 'modalidade', nome: 'Modalidade compativel', obrigatorio: true, valor: 'Tenis', peso: 40 },
      { codigo: 'perfil-completo', nome: 'Perfil completo', obrigatorio: true, valor: true, peso: 40 },
      { codigo: 'ranking', nome: 'Ranking competitivo', obrigatorio: false, valor: 'top-20', peso: 20, percentualQuandoNaoAtendido: 0 },
    ],
    documentosNecessarios: ['curriculo_esportivo'],
    inicioInscricoes: '2026-10-20T00:00:00.000Z',
    fimInscricoes: '2026-12-30T23:59:59.000Z',
    status: OPPORTUNITY_STATUS.ACTIVE,
  },
]

const ineligibleDemoOpportunity = {
  id: 'oportunidade-futebol-incompativel',
  criadorId: 'instituicao-demo',
  titulo: 'Avaliação de Futebol',
  descricao: 'Cenário de teste para validar o bloqueio de uma candidatura inelegível.',
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
  status: OPPORTUNITY_STATUS.DRAFT,
}

export const demoApplications = [
  {
    id: 'candidatura-demo-em-analise',
    oportunidadeId: 'oportunidade-bolsa-tenis',
    atletaId: 'atleta-adulto',
    status: APPLICATION_STATUS.UNDER_REVIEW,
    matchScore: 94,
    documentos: [],
    historico: [
      { id: 'evento-demo-inscricao', status: APPLICATION_STATUS.SUBMITTED, data: '2026-10-09T12:00:00.000Z' },
      { id: 'evento-demo-analise', status: APPLICATION_STATUS.UNDER_REVIEW, data: '2026-10-09T12:05:00.000Z' },
    ],
  },
  {
    id: 'candidatura-demo-avaliacao',
    oportunidadeId: 'oportunidade-avaliacao-tecnica',
    atletaId: 'atleta-adulto',
    status: APPLICATION_STATUS.SUBMITTED,
    matchScore: 88,
    criadoEm: '2026-10-12T10:00:00.000Z',
    atualizadoEm: '2026-10-12T10:00:00.000Z',
    documentos: [],
    historico: [{ id: 'evento-demo-avaliacao-inscricao', status: APPLICATION_STATUS.SUBMITTED, data: '2026-10-12T10:00:00.000Z' }],
  },
  {
    id: 'candidatura-demo-documentos',
    oportunidadeId: 'oportunidade-clinica-tenis',
    atletaId: 'atleta-adulto',
    status: APPLICATION_STATUS.DOCUMENTS_SENT,
    matchScore: 85,
    criadoEm: '2026-10-16T12:00:00.000Z',
    atualizadoEm: '2026-10-18T14:00:00.000Z',
    documentos: [{ id: 'curriculo-demo', nome: 'Curriculo esportivo', status: 'enviado' }],
    historico: [
      { id: 'evento-demo-clinica-inscricao', status: APPLICATION_STATUS.SUBMITTED, data: '2026-10-16T12:00:00.000Z' },
      { id: 'evento-demo-clinica-documentos', status: APPLICATION_STATUS.DOCUMENTS_SENT, data: '2026-10-18T14:00:00.000Z' },
    ],
  },
  {
    id: 'candidatura-demo-inscrita',
    oportunidadeId: 'oportunidade-circuito-tenis',
    atletaId: 'atleta-adulto',
    status: APPLICATION_STATUS.SUBMITTED,
    matchScore: 80,
    criadoEm: '2026-10-21T10:00:00.000Z',
    atualizadoEm: '2026-10-21T10:00:00.000Z',
    documentos: [],
    historico: [{ id: 'evento-demo-circuito-inscricao', status: APPLICATION_STATUS.SUBMITTED, data: '2026-10-21T10:00:00.000Z' }],
  },
]

export const demoSeed = Object.freeze({
  users: demoUsers,
  athletes: demoAthletes,
  guardians: demoGuardians,
  partners: demoPartners,
  opportunities: [...demoOpportunities, ineligibleDemoOpportunity],
  applications: demoApplications,
})
