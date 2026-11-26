// Fonte única das candidaturas do atleta: a tela Candidaturas e o cartão da home usam esta
// mesma lista. Assim os exemplos de demonstração (pedidos para a apresentação) aparecem nas
// duas telas e os números da home sempre batem com a lista.

export const sampleExtra = {
  id: 'demonstracao-apoio-financeiro',
  status: 'nao_selecionado',
  demo: true,
  opportunity: {
    titulo: 'Apoio Financeiro',
    modalidade: 'Tênis',
    categoria: 'Universitário',
    instituicao: 'Instituto Atleta do Futuro',
    beneficio: 'Apoio financeiro',
  },
  criadoEm: '2026-08-05T10:00:00.000Z',
  atualizadoEm: '2026-08-05T10:00:00.000Z',
}

const statusText = {
  inscrita: 'Inscrita',
  documentos_enviados: 'Docs enviados',
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  rejeitada: 'Não selecionado',
  nao_selecionado: 'Não selecionado',
}

export function displayStatus(application) {
  return statusText[application.status] || application.status || 'Em análise'
}

export function summarizeApplications(list = []) {
  const labels = list.map((application) => displayStatus(application))
  return {
    total: list.length,
    underReview: labels.filter((label) => label === 'Em análise').length,
    rejected: labels.filter((label) => label === 'Não selecionado').length,
  }
}

export async function loadAthleteApplications(repositories, sessionId) {
  let source = repositories
  let athlete = await source.users.obterPerfilAtletaPorUsuario(sessionId)
  if ((!athlete.ok || !athlete.data) && repositories.demo) {
    source = repositories.demo
    athlete = await source.users.obterPerfilAtletaPorUsuario('usuario-atleta-adulto')
  }
  if (!athlete.ok) throw new Error(athlete.mensagem || 'Não foi possível identificar o atleta.')
  let result = await source.applications.listarCandidaturasDoAtleta(athlete.data.id)
  if ((result.ok && result.data.length === 0) && repositories.demo) {
    source = repositories.demo
    result = await source.applications.listarCandidaturasDoAtleta('atleta-adulto')
  }
  if (!result.ok) throw new Error(result.mensagem || 'Não foi possível carregar suas candidaturas.')
  const resolved = await Promise.all(result.data.map(async (application) => {
    const opportunity = await source.opportunities.obterOportunidade(application.oportunidadeId)
    return { ...application, opportunity: opportunity.ok ? opportunity.data : null, demo: source === repositories.demo }
  }))
  let completeList = resolved
  if (repositories.demo && source !== repositories.demo) {
    const demoResult = await repositories.demo.applications.listarCandidaturasDoAtleta('atleta-adulto')
    if (demoResult.ok) {
      const demoResolved = await Promise.all(demoResult.data.map(async (application) => {
        const opportunity = await repositories.demo.opportunities.obterOportunidade(application.oportunidadeId)
        return { ...application, opportunity: opportunity.ok ? opportunity.data : null, demo: true }
      }))
      // Exemplo com o mesmo nome de uma candidatura real não entra: a lista não pode parecer duplicada.
      const titleKey = (item) => String(item.opportunity?.titulo ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
      const existingOpportunities = new Set(resolved.map((item) => item.oportunidadeId))
      const existingTitles = new Set(resolved.map(titleKey))
      completeList = [...resolved, ...demoResolved.filter((item) => !existingOpportunities.has(item.oportunidadeId) && !existingTitles.has(titleKey(item)))]
    }
  }
  if (completeList.length < 4) completeList = [...completeList, sampleExtra]
  return completeList
}
