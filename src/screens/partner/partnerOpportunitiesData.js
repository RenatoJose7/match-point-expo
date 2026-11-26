import { getPartnerProfile } from './partnerOpportunityUi'

// Fonte única das oportunidades do parceiro: a lista e a home do treinador/instituição usam
// esta mesma montagem. Os exemplos de demonstração (pedidos para a apresentação) completam
// a lista até 4 itens e entram também nos números da home, para os dois sempre baterem.

// Datas relativas a hoje: os exemplos nunca aparecem como ativos com prazo vencido.
const daysFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString()

const visualDemoOpportunities = [
  {
    id: 'oportunidade-demo-bolsa-parceiro',
    titulo: 'Bolsa de Estudos',
    modalidade: 'Tênis',
    localizacao: 'Suzano - SP',
    beneficio: 'Bolsa esportiva',
    fimInscricoes: daysFromNow(24),
    status: 'ativa',
    criadoEm: daysFromNow(-20),
    inscricoesExemplo: 4,
  },
  {
    id: 'oportunidade-demo-avaliacao-parceiro',
    titulo: 'Avaliação Técnica',
    modalidade: 'Tênis',
    localizacao: 'São Paulo - SP',
    beneficio: 'Avaliação técnica',
    fimInscricoes: daysFromNow(24),
    status: 'ativa',
    criadoEm: daysFromNow(-21),
    inscricoesExemplo: 3,
  },
  {
    id: 'oportunidade-demo-campeonato-parceiro',
    titulo: 'Campeonato',
    modalidade: 'Tênis',
    localizacao: 'Mogi das Cruzes - SP',
    beneficio: 'Competição regional',
    fimInscricoes: daysFromNow(25),
    status: 'ativa',
    criadoEm: daysFromNow(-22),
    inscricoesExemplo: 3,
  },
  {
    id: 'oportunidade-demo-clinica-parceiro',
    titulo: 'Clínica de Alto Rendimento',
    modalidade: 'Tênis',
    localizacao: 'Itaquaquecetuba - SP',
    beneficio: 'Treinamento técnico',
    fimInscricoes: daysFromNow(26),
    status: 'ativa',
    criadoEm: daysFromNow(-23),
    inscricoesExemplo: 2,
  },
]

export async function loadPartnerOpportunities(repositories, session) {
  let source = repositories
  let partner = await getPartnerProfile(source, session)
  let result = await source.opportunities.listarOportunidadesDoParceiro(partner.id)
  if ((!result.ok || result.data.length === 0) && repositories.demo) {
    source = repositories.demo
    const demoPartner = await source.users.obterPerfilParceiroPorUsuario('usuario-instituicao')
    if (demoPartner.ok) {
      partner = demoPartner.data
      result = await source.opportunities.listarOportunidadesDoParceiro(partner.id)
    }
  }
  if (!result.ok) throw new Error(result.mensagem || 'Não foi possível carregar as oportunidades.')
  const candidateLists = await Promise.all(result.data.map(async (opportunity) => {
    const applications = await source.applications.listarCandidatosDaOportunidade(opportunity.id)
    return [opportunity.id, applications.ok ? applications.data : []]
  }))
  const existingIds = new Set(result.data.map((item) => item.id))
  const items = result.data.length < 4
    ? [...result.data, ...visualDemoOpportunities.filter((item) => !existingIds.has(item.id)).slice(0, 4 - result.data.length)]
    : result.data
  const candidatesById = Object.fromEntries(candidateLists)
  const counts = Object.fromEntries(candidateLists.map(([id, list]) => [id, list.length]))
  return { partner, items, counts, candidatesById }
}

// Números da home calculados da mesma lista exibida em Oportunidades.
export function summarizePartnerOpportunities({ items, candidatesById }) {
  const reviewStatuses = ['inscrita', 'documentos_enviados', 'em_analise']
  const active = items.filter((item) => item.status === 'ativa')
  const countFor = (item) => (candidatesById[item.id] ? candidatesById[item.id].length : item.inscricoesExemplo ?? 0)
  const reviewFor = (item) => (candidatesById[item.id]
    ? candidatesById[item.id].filter((candidate) => reviewStatuses.includes(candidate.status ?? candidate.candidatura?.status)).length
    : item.inscricoesExemplo ?? 0)
  return {
    activeCount: active.length,
    candidateCount: items.reduce((total, item) => total + countFor(item), 0),
    reviewCount: active.reduce((total, item) => total + reviewFor(item), 0),
    waitingCount: active.filter((item) => countFor(item) === 0).length,
  }
}
