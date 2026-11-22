// Cálculo do Match Score compartilhado pelos repositórios (memória e Firebase)
// e pelas telas que precisam calcular a compatibilidade do próprio atleta.
//
// Regras:
// - cada critério tem peso; atendido vale 100%, não atendido vale
//   `percentualQuandoNaoAtendido` (ou uma nota parcial calculada, quando faz sentido);
// - critérios obrigatórios não atendidos bloqueiam a candidatura;
// - textos são comparados sem acento e sem diferença de maiúsculas ("Tênis" = "Tenis");
// - oportunidades sem critérios próprios recebem critérios padrão a partir dos
//   próprios campos (modalidade, categoria, localização), para o score ter sentido.

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim()
}

// "8 anos" -> 8, "Mais de 5 anos" -> 6, "De 3 a 5 anos" -> 4, "Até 1 ano" -> 1, "Iniciante" -> 0
export function practiceYears(value) {
  const text = normalizeText(value)
  if (!text) return null
  if (text.includes('iniciante')) return 0
  const numbers = (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((item) => Number(item.replace(',', '.')))
  if (numbers.length === 0) return null
  if (text.startsWith('mais de')) return numbers[0] + 1
  if (text.startsWith('ate')) return numbers[0]
  if (numbers.length >= 2) return (numbers[0] + numbers[1]) / 2
  return numbers[0]
}

function rankingPosition(value) {
  const match = String(value ?? '').match(/\d+/)
  return match ? Number(match[0]) : null
}

function stateOf(location) {
  const match = String(location ?? '').match(/-\s*([A-Za-z]{2})\s*$/)
  return match ? match[1].toUpperCase() : null
}

const CATEGORY_ORDER = ['sub-12', 'sub-14', 'sub-16', 'sub-18', 'universitario', 'adulto', '35+']

function categoryDistance(a, b) {
  const first = CATEGORY_ORDER.indexOf(normalizeText(a))
  const second = CATEGORY_ORDER.indexOf(normalizeText(b))
  if (first < 0 || second < 0) return null
  return Math.abs(first - second)
}

function criterionMet(athlete, criterion) {
  const code = criterion.codigo
  if (code === 'perfil-completo') return athlete.perfilCompleto === true

  const athleteValue = athlete[code]
  if (code === 'ranking') {
    const position = rankingPosition(athleteValue)
    if (position === null) return false
    const required = normalizeText(criterion.valor)
    const top = required.match(/top-?\s*(\d+)/)
    if (top) return position <= Number(top[1])
    if (required.includes('alto rendimento')) return position <= 50
    return normalizeText(athleteValue) === required
  }
  if (code === 'tempoDePratica') {
    const years = practiceYears(athleteValue)
    const required = practiceYears(criterion.valor)
    if (years === null || required === null) return false
    return years >= required
  }
  if (typeof criterion.valor === 'boolean') return athleteValue === criterion.valor
  if (athleteValue === undefined || athleteValue === null || athleteValue === '') return false
  return normalizeText(athleteValue) === normalizeText(criterion.valor)
}

// Nota parcial para critérios não atendidos que admitem proximidade.
function partialScore(athlete, criterion) {
  const configured = Math.max(0, Math.min(100, Number(criterion.percentualQuandoNaoAtendido) || 0))
  if (criterion.codigo === 'localizacao') {
    const sameState = stateOf(athlete.localizacao) && stateOf(athlete.localizacao) === stateOf(criterion.valor)
    return Math.max(configured, sameState ? 75 : athlete.localizacao ? 40 : 0)
  }
  if (criterion.codigo === 'categoria') {
    const distance = categoryDistance(athlete.categoria, criterion.valor)
    if (distance === 1) return Math.max(configured, 70)
    if (distance === 2) return Math.max(configured, 40)
  }
  return configured
}

const MOTIVE_BY_CODE = {
  modalidade: (criterion) => `Esta oportunidade é para ${criterion.valor}.`,
  'perfil-completo': () => 'Complete seu perfil esportivo para se candidatar.',
  categoria: (criterion) => `Categoria esperada: ${criterion.valor}.`,
  localizacao: (criterion) => `Oportunidade em ${criterion.valor}.`,
  tempoDePratica: (criterion) => `Pede ${criterion.valor} de prática.`,
  ranking: (criterion) => `Pede ranking ${String(criterion.valor).replace('-', ' ')}. Informe seu ranking no perfil.`,
}

// Critérios padrão para oportunidades criadas sem critérios próprios.
export function defaultCriteriaFor(opportunity = {}) {
  const criteria = []
  if (opportunity.modalidade) {
    criteria.push({ codigo: 'modalidade', nome: 'Modalidade compatível', obrigatorio: true, valor: opportunity.modalidade, peso: 40 })
  }
  criteria.push({ codigo: 'perfil-completo', nome: 'Perfil completo', obrigatorio: true, valor: true, peso: 20 })
  if (opportunity.categoria) {
    criteria.push({ codigo: 'categoria', nome: 'Categoria', obrigatorio: false, valor: opportunity.categoria, peso: 20, percentualQuandoNaoAtendido: 20 })
  }
  if (opportunity.localizacao) {
    criteria.push({ codigo: 'localizacao', nome: 'Localização', obrigatorio: false, valor: opportunity.localizacao, peso: 20, percentualQuandoNaoAtendido: 30 })
  }
  return criteria
}

export function criteriaFor(opportunity = {}) {
  const own = opportunity.criteriosElegibilidade ?? []
  return own.length > 0 ? own : defaultCriteriaFor(opportunity)
}

export function evaluateMatchEligibility(athlete = {}, opportunity = {}, evaluatedAt = new Date().toISOString()) {
  const evaluatedCriteria = criteriaFor(opportunity).map((criterion) => {
    const matched = criterionMet(athlete, criterion)
    const motive = MOTIVE_BY_CODE[criterion.codigo]?.(criterion) ?? `${criterion.nome}: requisito não atendido.`
    return {
      ...criterion,
      atendido: matched,
      ...(matched ? {} : { motivo: motive }),
    }
  })
  const blockingCriteria = evaluatedCriteria.filter((criterion) => criterion.obrigatorio && !criterion.atendido)

  return {
    elegivel: blockingCriteria.length === 0,
    criterios: evaluatedCriteria,
    motivosBloqueio: blockingCriteria.map((criterion) => criterion.motivo),
    avaliadoEm: evaluatedAt,
  }
}

export function scoreFromEligibility(eligibility, athlete = {}, calculatedAt = new Date().toISOString(), version = 'p0-v3') {
  const weightedCriteria = eligibility.criterios.map((criterion) => {
    const weight = Number(criterion.peso)
    const percentual = criterion.atendido ? 100 : partialScore(athlete, criterion)
    return { criterion, percentual, weight: Number.isFinite(weight) && weight > 0 ? weight : 1 }
  })
  const totalWeight = weightedCriteria.reduce((total, item) => total + item.weight, 0)
  const totalScore = weightedCriteria.reduce((total, item) => total + (item.percentual * item.weight), 0)

  return {
    percentualTotal: totalWeight === 0 ? 100 : Math.round(totalScore / totalWeight),
    criterios: weightedCriteria.map(({ criterion, percentual }) => ({
      codigo: criterion.codigo,
      nome: criterion.nome,
      percentual,
      atendido: Boolean(criterion.atendido),
    })),
    calculadoEm: calculatedAt,
    versaoDoCalculo: version,
  }
}

export function computeMatchScore(athlete, opportunity, calculatedAt, version) {
  const eligibility = evaluateMatchEligibility(athlete, opportunity, calculatedAt)
  return scoreFromEligibility(eligibility, athlete, calculatedAt, version)
}
