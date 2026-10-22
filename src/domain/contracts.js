export const USER_TYPES = Object.freeze({
  ATHLETE: 'atleta',
  TRAINER: 'treinador',
  INSTITUTION: 'instituicao',
  GUARDIAN: 'responsavel',
  ADMIN: 'administrador',
})

export const OPPORTUNITY_STATUS = Object.freeze({
  DRAFT: 'rascunho',
  ACTIVE: 'ativa',
  CLOSED: 'encerrada',
  UNDER_REVIEW: 'em_analise',
})

export const APPLICATION_STATUS = Object.freeze({
  STARTED: 'iniciada',
  SUBMITTED: 'inscrita',
  DOCUMENTS_SENT: 'documentos_enviados',
  UNDER_REVIEW: 'em_analise',
  APPROVED: 'aprovada',
  REJECTED: 'rejeitada',
})

export const DOCUMENT_STATUS = Object.freeze({
  PENDING: 'pendente',
  SENT: 'enviado',
  VALIDATED: 'validado',
  REJECTED: 'rejeitado',
})

export const REPOSITORY_ERROR_CODES = Object.freeze({
  UNAUTHENTICATED: 'NAO_AUTENTICADO',
  FORBIDDEN: 'SEM_PERMISSAO',
  INVALID_DATA: 'DADOS_INVALIDOS',
  NOT_FOUND: 'NAO_ENCONTRADO',
  DUPLICATE_APPLICATION: 'CANDIDATURA_DUPLICADA',
  INELIGIBLE_ATHLETE: 'ATLETA_INELEGIVEL',
  INVALID_TRANSITION: 'TRANSICAO_INVALIDA',
  NETWORK_ERROR: 'ERRO_DE_REDE',
  PROFILE_REQUIRED: 'PERFIL_PENDENTE',
})

export const APPLICATION_TRANSITIONS = Object.freeze({
  [APPLICATION_STATUS.STARTED]: Object.freeze([APPLICATION_STATUS.SUBMITTED]),
  [APPLICATION_STATUS.SUBMITTED]: Object.freeze([
    APPLICATION_STATUS.DOCUMENTS_SENT,
    APPLICATION_STATUS.UNDER_REVIEW,
  ]),
  [APPLICATION_STATUS.DOCUMENTS_SENT]: Object.freeze([APPLICATION_STATUS.UNDER_REVIEW]),
  [APPLICATION_STATUS.UNDER_REVIEW]: Object.freeze([
    APPLICATION_STATUS.APPROVED,
    APPLICATION_STATUS.REJECTED,
  ]),
  [APPLICATION_STATUS.APPROVED]: Object.freeze([]),
  [APPLICATION_STATUS.REJECTED]: Object.freeze([]),
})

export function buildPublicCandidateProfile(user, athlete) {
  return {
    nome: user?.nome ?? '',
    fotoUrl: user?.fotoUrl ?? null,
    modalidade: athlete?.modalidade ?? '',
    categoria: athlete?.categoria ?? null,
    posicao: athlete?.posicao ?? null,
    maoDominante: athlete?.maoDominante ?? null,
    equipeAtual: athlete?.equipeAtual ?? null,
    tempoDePratica: athlete?.tempoDePratica ?? null,
    ranking: athlete?.ranking ?? null,
    torneiosDisputados: athlete?.torneiosDisputados ?? null,
    titulos: athlete?.titulos ?? null,
    perfilCompleto: Boolean(athlete?.perfilCompleto),
  }
}

export function calculateAge(birthDate, referenceDate = new Date()) {
  const birth = new Date(`${birthDate}T00:00:00`)
  const reference = new Date(referenceDate)

  if (Number.isNaN(birth.getTime()) || Number.isNaN(reference.getTime())) {
    return null
  }

  let age = reference.getFullYear() - birth.getFullYear()
  const monthDifference = reference.getMonth() - birth.getMonth()

  if (monthDifference < 0 || (monthDifference === 0 && reference.getDate() < birth.getDate())) {
    age -= 1
  }

  return age >= 0 ? age : null
}

export function isMinor(birthDate, referenceDate = new Date()) {
  const age = calculateAge(birthDate, referenceDate)
  return age !== null && age < 18
}

export function canTransitionApplicationStatus(currentStatus, nextStatus) {
  return APPLICATION_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false
}
