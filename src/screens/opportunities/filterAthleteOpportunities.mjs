function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function filterAthleteOpportunities(opportunities, filters = {}, referenceDate = new Date()) {
  const search = normalize(filters.texto)
  const modality = normalize(filters.modalidade)
  const category = normalize(filters.categoria)
  const location = normalize(filters.localizacao)

  return opportunities.filter(opportunity => {
    if (filters.status && filters.status !== 'todas' && opportunity.status !== filters.status) return false

    if (search && !normalize([
      opportunity.titulo,
      opportunity.descricao,
      opportunity.beneficio,
      opportunity.modalidade,
      opportunity.categoria,
      opportunity.localizacao,
    ].join(' ')).includes(search)) return false

    if (modality && !normalize(opportunity.modalidade).includes(modality)) return false
    if (category && !normalize(opportunity.categoria).includes(category)) return false
    if (location && !normalize(opportunity.localizacao).includes(location)) return false

    if (filters.prazoAberto) {
      if (!opportunity.fimInscricoes) return false
      const deadline = new Date(opportunity.fimInscricoes)
      if (Number.isNaN(deadline.getTime()) || deadline < referenceDate) return false
    }

    return true
  })
}
