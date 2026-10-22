import {
  APPLICATION_STATUS,
  OPPORTUNITY_STATUS,
  REPOSITORY_ERROR_CODES,
  USER_TYPES,
  buildPublicCandidateProfile,
  canTransitionApplicationStatus,
  calculateAge,
  isMinor,
} from '../../domain/contracts.js'
import { demoSeed } from '../../data/demoSeed.js'

const clone = (value) => JSON.parse(JSON.stringify(value))
const success = (data) => ({ ok: true, data: clone(data) })
const failure = (codigo, mensagem, detalhes) => ({ ok: false, codigo, mensagem, detalhes })

function isValidBirthDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '')
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsedDate = new Date(year, month - 1, day)
  return parsedDate.getFullYear() === year
    && parsedDate.getMonth() === month - 1
    && parsedDate.getDate() === day
    && calculateAge(value) !== null
}

export function createMemoryRepositories(initialSeed = demoSeed) {
  let state = clone(initialSeed)
  state.guardianInvites ??= []
  state.notifications ??= []
  state.evaluationRequests ??= []
  state.technicalEvaluations ??= []
  state.reports ??= []
  state.resources ??= []
  state.supports ??= []
  state.matchAudits ??= []
  let currentUserId = null
  let sequence = 1
  const sessionListeners = new Set()

  const now = () => new Date().toISOString()
  const nextId = (prefix) => `${prefix}-${Date.now()}-${sequence++}`
  const findUser = (id) => state.users.find((user) => user.id === id)
  const findAthlete = (id) => state.athletes.find((athlete) => athlete.id === id)
  const findOpportunity = (id) => state.opportunities.find((opportunity) => opportunity.id === id)
  const findApplication = (id) => state.applications.find((application) => application.id === id)
  const findGuardian = (id) => state.guardians.find((guardian) => guardian.id === id)
  const makePublicCandidateSnapshot = (application) => {
    const athlete = findAthlete(application.atletaId)
    const user = athlete ? findUser(athlete.usuarioId) : null
    if (!athlete || !user) return null

    return {
      oportunidadeId: application.oportunidadeId,
      atletaId: application.atletaId,
      candidaturaId: application.id,
      perfilPublico: buildPublicCandidateProfile(user, athlete),
    }
  }
  state.publicCandidateProfiles ??= state.applications
    .map(makePublicCandidateSnapshot)
    .filter(Boolean)
  const normalizeLinkCode = (value) => String(value ?? '').trim().toUpperCase()
  const findActiveGuardianInvite = (code) => state.guardianInvites.find((invitation) => (
    invitation.codigo === normalizeLinkCode(code)
    && invitation.status === 'ativo'
    && (invitation.expiraEmEpoch ?? new Date(invitation.expiraEm).getTime()) > Date.now()
  ))
  const currentSession = () => (currentUserId ? findUser(currentUserId) ?? null : null)

  const emitSession = () => {
    const session = currentSession()
    sessionListeners.forEach((listener) => listener(clone(session)))
  }

  const evaluateEligibility = (athleteId, opportunityId) => {
    const athlete = findAthlete(athleteId)
    const opportunity = findOpportunity(opportunityId)

    if (!athlete || !opportunity) {
      return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Atleta ou oportunidade não encontrado.')
    }

    const criteria = opportunity.criteriosElegibilidade ?? []
    const evaluatedCriteria = criteria.map((criterion) => {
      const athleteValue = criterion.codigo === 'perfil-completo'
        ? athlete.perfilCompleto
        : athlete[criterion.codigo]
      const matched = athleteValue === criterion.valor

      return {
        ...criterion,
        atendido: matched,
        motivo: matched ? undefined : `${criterion.nome}: requisito não atendido.`,
      }
    })
    const blockingCriteria = evaluatedCriteria.filter((criterion) => criterion.obrigatorio && !criterion.atendido)

    return success({
      elegivel: blockingCriteria.length === 0,
      criterios: evaluatedCriteria,
      motivosBloqueio: blockingCriteria.map((criterion) => criterion.motivo),
      avaliadoEm: now(),
    })
  }

  const authentication = {
    cadastrar: async (email, password, type, initialData = {}) => {
      if (!email || !password || !Object.values(USER_TYPES).includes(type)) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'E-mail, senha e tipo de usuário são obrigatórios.')
      }

      if (state.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Já existe uma conta com este e-mail.')
      }

      const user = {
        id: nextId('usuario'),
        email,
        tipo: type,
        nome: initialData.nome ?? '',
        telefone: initialData.telefone,
        criadoEm: now(),
        atualizadoEm: now(),
      }
      state.users.push(user)

      const createdAt = user.criadoEm
      const profile = initialData.perfil ?? {}
      let profileResult = success(null)
      let guardianInvitation = null
      if (type === USER_TYPES.ATHLETE) {
        if (!isValidBirthDate(profile.dataNascimento)) {
          state.users = state.users.filter((item) => item.id !== user.id)
          return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Informe uma data de nascimento válida para o perfil do atleta.')
        }
        if (isMinor(profile.dataNascimento)) {
          guardianInvitation = findActiveGuardianInvite(profile.codigoResponsavel)
          if (!guardianInvitation || !findGuardian(guardianInvitation.responsavelId)) {
            state.users = state.users.filter((item) => item.id !== user.id)
            return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Informe um código ativo de responsável legal.')
          }
        }
        profileResult = await users.criarPerfilAtleta(user.id, {
          id: user.id,
          dataNascimento: profile.dataNascimento,
          modalidade: profile.modalidade ?? '',
          responsavelId: guardianInvitation?.responsavelId,
          vinculoResponsavelId: guardianInvitation?.codigo,
          perfilCompleto: false,
          criadoEm: createdAt,
          atualizadoEm: createdAt,
        })
      } else if (type === USER_TYPES.TRAINER || type === USER_TYPES.INSTITUTION) {
        profileResult = await users.criarPerfilParceiro(user.id, {
          id: user.id,
          tipo: type,
          nomeExibicao: profile.nomeExibicao?.trim() || user.nome,
          documento: profile.documento?.trim() || undefined,
          descricao: profile.descricao?.trim() || undefined,
          localizacao: profile.localizacao?.trim() || undefined,
          verificado: false,
          criadoEm: createdAt,
          atualizadoEm: createdAt,
        })
      } else if (type === USER_TYPES.GUARDIAN) {
        if (!profile.parentesco?.trim()) {
          state.users = state.users.filter((item) => item.id !== user.id)
          return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Informe o parentesco com o atleta.')
        }
        profileResult = await users.criarResponsavel(user.id, {
          id: user.id,
          parentesco: profile.parentesco.trim(),
          documento: profile.documento?.trim() || undefined,
          telefone: profile.telefone?.trim() || user.telefone,
          criadoEm: createdAt,
          atualizadoEm: createdAt,
        })
      }

      if (!profileResult.ok) {
        state.users = state.users.filter((item) => item.id !== user.id)
        return profileResult
      }

      if (guardianInvitation) {
        Object.assign(guardianInvitation, {
          status: 'utilizado',
          utilizadoPorAtletaId: user.id,
          utilizadoEm: now(),
        })
      }

      currentUserId = user.id
      emitSession()
      return success(user)
    },
    entrar: async (email, password) => {
      if (!email || !password) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'E-mail e senha são obrigatórios.')
      }

      const user = state.users.find((item) => item.email.toLowerCase() === email.toLowerCase())
      if (!user) {
        return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Conta de demonstração não encontrada.')
      }

      // O adaptador em memória não armazena senhas. Qualquer valor não vazio é aceito apenas no modo demo.
      currentUserId = user.id
      emitSession()
      return success(user)
    },
    sair: async () => {
      currentUserId = null
      emitSession()
      return success(null)
    },
    recuperarSenha: async () => success({ solicitado: true }),
    obterSessaoAtual: async () => success(currentSession()),
    observarSessao: (callback) => {
      sessionListeners.add(callback)
      callback(clone(currentSession()))
      return () => sessionListeners.delete(callback)
    },
  }

  const users = {
    obterUsuario: async (id) => {
      const user = findUser(id)
      return user ? success(user) : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Usuário não encontrado.')
    },
    obterUsuarioAtual: async () => {
      const user = currentSession()
      return user ? success(user) : failure(REPOSITORY_ERROR_CODES.UNAUTHENTICATED, 'Nenhuma sessão ativa.')
    },
    atualizarUsuario: async (id, data) => {
      const user = findUser(id)
      if (!user) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Usuário não encontrado.')
      Object.assign(user, data, { id, atualizadoEm: now() })
      return success(user)
    },
    criarPerfilAtleta: async (userId, data) => {
      if (!findUser(userId)) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Usuário não encontrado.')
      if (state.athletes.some((athlete) => athlete.usuarioId === userId)) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Este usuário já possui um perfil esportivo.')
      }
      const athlete = {
        ...data,
        id: data.id ?? userId,
        usuarioId: userId,
        perfilCompleto: Boolean(data.perfilCompleto),
      }
      if (isMinor(athlete.dataNascimento) && !athlete.responsavelId) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Atleta menor de idade exige responsável legal.')
      }
      const guardian = athlete.responsavelId
        ? state.guardians.find((item) => item.id === athlete.responsavelId)
        : null
      if (athlete.responsavelId && !guardian) {
        return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Responsável legal não encontrado.')
      }
      state.athletes.push(athlete)
      if (guardian && !guardian.atletasVinculadosIds.includes(athlete.id)) {
        guardian.atletasVinculadosIds.push(athlete.id)
      }
      return success(athlete)
    },
    obterPerfilAtleta: async (id) => {
      const athlete = findAthlete(id)
      return athlete ? success(athlete) : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Atleta não encontrado.')
    },
    obterPerfilAtletaPorUsuario: async (userId) => {
      const athlete = state.athletes.find((item) => item.usuarioId === userId)
      return athlete
        ? success(athlete)
        : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Perfil esportivo não encontrado para este usuário.')
    },
    atualizarPerfilAtleta: async (id, data) => {
      const athlete = findAthlete(id)
      if (!athlete) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Atleta não encontrado.')
      Object.assign(athlete, data, { id })
      return success(athlete)
    },
    criarPerfilParceiro: async (userId, data) => {
      if (!findUser(userId)) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Usuário não encontrado.')
      if (state.partners.some((partner) => partner.usuarioId === userId)) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Este usuário já possui um perfil parceiro.')
      }
      const partner = {
        id: nextId('parceiro'),
        usuarioId: userId,
        ...data,
        verificado: Boolean(data.verificado),
      }
      state.partners.push(partner)
      return success(partner)
    },
    obterPerfilParceiro: async (id) => {
      const partner = state.partners.find((item) => item.id === id)
      return partner ? success(partner) : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Parceiro não encontrado.')
    },
    obterPerfilParceiroPorUsuario: async (userId) => {
      const partner = state.partners.find((item) => item.usuarioId === userId)
      return partner
        ? success(partner)
        : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Perfil parceiro não encontrado para este usuário.')
    },
    listarParceiros: async (filters = {}) => success(state.partners.filter((partner) => (
      (!filters.tipo || partner.tipo === filters.tipo)
      && (!filters.verificado || partner.verificado === true)
    ))),
    atualizarPerfilParceiro: async (id, data) => {
      const partner = state.partners.find((item) => item.id === id)
      if (!partner) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Parceiro não encontrado.')
      Object.assign(partner, data, { id })
      return success(partner)
    },
    criarResponsavel: async (userId, data) => {
      if (!findUser(userId)) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Usuário não encontrado.')
      const guardian = {
        id: nextId('responsavel'),
        usuarioId: userId,
        atletasVinculadosIds: [],
        ...data,
      }
      state.guardians.push(guardian)
      return success(guardian)
    },
    obterPerfilResponsavelPorUsuario: async (userId) => {
      const guardian = state.guardians.find((item) => item.usuarioId === userId)
      return guardian
        ? success(guardian)
        : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Perfil de responsável não encontrado para este usuário.')
    },
    gerarCodigoVinculoResponsavel: async (guardianId) => {
      const guardian = findGuardian(guardianId)
      if (!currentUserId) {
        return failure(REPOSITORY_ERROR_CODES.UNAUTHENTICATED, 'Nenhuma sessão ativa.')
      }
      if (!guardian) {
        return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Responsável não encontrado.')
      }
      if (guardian.usuarioId !== currentUserId) {
        return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Somente o responsável pode gerar o próprio código de vínculo.')
      }

      const createdAt = now()
      const expiration = Date.now() + (24 * 60 * 60 * 1000)
      const invitation = {
        id: nextId('convite-responsavel'),
        codigo: `MP${String(sequence++).padStart(6, '0')}`,
        responsavelId: guardianId,
        status: 'ativo',
        criadoEm: createdAt,
        expiraEm: new Date(expiration).toISOString(),
        expiraEmEpoch: expiration,
      }
      state.guardianInvites.push(invitation)
      return success(invitation)
    },
    calcularIdade: async (birthDate, referenceDate) => success(calculateAge(birthDate, referenceDate)),
    identificarMenor: async (birthDate, referenceDate) => success(isMinor(birthDate, referenceDate)),
    obterAtletasDoResponsavel: async (guardianId) => {
      const guardian = state.guardians.find((item) => item.id === guardianId)
      if (!guardian) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Responsável não encontrado.')
      return success(guardian.atletasVinculadosIds.map(findAthlete).filter(Boolean))
    },
    atualizarAtletaComoResponsavel: async (guardianId, athleteId, data) => {
      const guardian = state.guardians.find((item) => item.id === guardianId)
      if (!guardian?.atletasVinculadosIds.includes(athleteId)) {
        return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Responsável não possui vínculo com este atleta.')
      }
      return users.atualizarPerfilAtleta(athleteId, data)
    },
  }

  const opportunities = {
    listarOportunidades: async (filters = {}) => {
      const text = String(filters.texto ?? '').toLowerCase()
      const list = state.opportunities.filter((opportunity) => {
        if (text && !`${opportunity.titulo} ${opportunity.descricao}`.toLowerCase().includes(text)) return false
        if (filters.modalidade && opportunity.modalidade !== filters.modalidade) return false
        if (filters.categoria && opportunity.categoria !== filters.categoria) return false
        if (filters.localizacao && opportunity.localizacao !== filters.localizacao) return false
        if (filters.status && opportunity.status !== filters.status) return false
        if (filters.prazoAberto && new Date(opportunity.fimInscricoes) < new Date()) return false
        return true
      })
      return success(list)
    },
    obterOportunidade: async (id) => {
      const opportunity = findOpportunity(id)
      return opportunity ? success(opportunity) : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Oportunidade não encontrada.')
    },
    criarOportunidade: async (data) => {
      const status = data.status ?? OPPORTUNITY_STATUS.DRAFT
      const partner = state.partners.find((item) => item.id === data.criadorId)
      if (status === OPPORTUNITY_STATUS.ACTIVE && !partner?.verificado) {
        return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Seu perfil de parceiro ainda não foi verificado. Salve a oportunidade como rascunho.')
      }
      const opportunity = {
        id: nextId('oportunidade'),
        ...data,
        status,
        criadoEm: now(),
        atualizadoEm: now(),
      }
      state.opportunities.push(opportunity)
      return success(opportunity)
    },
    atualizarOportunidade: async (id, data) => {
      const opportunity = findOpportunity(id)
      if (!opportunity) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Oportunidade não encontrada.')
      const status = data.status ?? opportunity.status
      const partner = state.partners.find((item) => item.id === opportunity.criadorId)
      if (status === OPPORTUNITY_STATUS.ACTIVE && !partner?.verificado) {
        return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Seu perfil de parceiro ainda não foi verificado. O rascunho foi mantido.')
      }
      Object.assign(opportunity, data, { id, atualizadoEm: now() })
      return success(opportunity)
    },
    encerrarOportunidade: async (id) => opportunities.atualizarOportunidade(id, { status: OPPORTUNITY_STATUS.CLOSED }),
    listarOportunidadesDoParceiro: async (partnerId, filters = {}) => {
      const result = await opportunities.listarOportunidades(filters)
      return success(result.data.filter((opportunity) => opportunity.criadorId === partnerId))
    },
    listarDocumentosNecessarios: async (id) => {
      const opportunity = findOpportunity(id)
      return opportunity
        ? success(opportunity.documentosNecessarios ?? [])
        : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Oportunidade não encontrada.')
    },
  }

  const match = {
    avaliarElegibilidade: async (athleteId, opportunityId) => evaluateEligibility(athleteId, opportunityId),
    calcularMatchScore: async (athleteId, opportunityId) => {
      const eligibility = evaluateEligibility(athleteId, opportunityId)
      if (!eligibility.ok) return eligibility
      const criteria = eligibility.data.criterios
      const matched = criteria.filter((criterion) => criterion.atendido).length
      const total = criteria.length
      return success({
        percentualTotal: total === 0 ? 100 : Math.round((matched / total) * 100),
        criterios: criteria.map((criterion) => ({ nome: criterion.nome, percentual: criterion.atendido ? 100 : 0 })),
        calculadoEm: now(),
        versaoDoCalculo: 'p0-memory-v1',
      })
    },
    obterMatchScore: async (athleteId, opportunityId) => match.calcularMatchScore(athleteId, opportunityId),
  }

  const storage = {
    enviarArquivoCandidatura: async (applicationId, documentData = {}) => {
      if (!findApplication(applicationId)) {
        return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')
      }

      const { arquivo, file: sourceFile, ...metadata } = documentData
      if (metadata.arquivoUrl) return success(metadata)

      const source = arquivo ?? sourceFile
      if (!source) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Selecione um arquivo antes de enviar o documento.')
      }

      const documentId = metadata.id ?? nextId('documento')
      const fileName = metadata.nome ?? source.name ?? `${documentId}.bin`
      return success({
        ...metadata,
        id: documentId,
        nome: fileName,
        arquivoUrl: source.uri ?? `memory://candidaturas/${applicationId}/${documentId}-${fileName}`,
      })
    },
  }

  const applications = {
    verificarCandidaturaExistente: async (opportunityId, athleteId) => success(
      state.applications.some((application) => (
        application.oportunidadeId === opportunityId && application.atletaId === athleteId
      )),
    ),
    criarCandidatura: async (opportunityId, athleteId, data = {}) => {
      const duplicate = state.applications.some((application) => (
        application.oportunidadeId === opportunityId && application.atletaId === athleteId
      ))
      if (duplicate) {
        return failure(REPOSITORY_ERROR_CODES.DUPLICATE_APPLICATION, 'Já existe uma candidatura para esta oportunidade.')
      }

      const eligibility = evaluateEligibility(athleteId, opportunityId)
      if (!eligibility.ok) return eligibility
      if (!eligibility.data.elegivel) {
        return failure(
          REPOSITORY_ERROR_CODES.INELIGIBLE_ATHLETE,
          'O atleta não atende aos critérios obrigatórios.',
          eligibility.data,
        )
      }

      const athlete = findAthlete(athleteId)
      if (!athlete || !findUser(athlete.usuarioId)) {
        return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Dados públicos do atleta não encontrados.')
      }

      const application = {
        id: nextId('candidatura'),
        oportunidadeId: opportunityId,
        atletaId: athleteId,
        status: APPLICATION_STATUS.SUBMITTED,
        documentos: data.documentos ?? [],
        historico: [],
        criadoEm: now(),
        atualizadoEm: now(),
      }
      application.historico.push({
        id: nextId('evento'),
        status: application.status,
        statusAnterior: null,
        statusNovo: application.status,
        descricao: 'Candidatura realizada.',
        data: application.criadoEm,
        responsavelId: data.responsavelId ?? athleteId,
      })
      state.applications.push(application)
      const publicCandidateSnapshot = makePublicCandidateSnapshot(application)
      state.publicCandidateProfiles.push(publicCandidateSnapshot)
      return success(application)
    },
    obterCandidatura: async (id) => {
      const application = findApplication(id)
      return application ? success(application) : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')
    },
    listarCandidaturasDoAtleta: async (athleteId, filters = {}) => success(
      state.applications.filter((application) => (
        application.atletaId === athleteId && (!filters.status || application.status === filters.status)
      )),
    ),
    listarCandidatosDaOportunidade: async (opportunityId, filters = {}) => success(
      state.applications.filter((application) => (
        application.oportunidadeId === opportunityId && (!filters.status || application.status === filters.status)
      )),
    ),
    obterPerfilPublicoCandidato: async (opportunityId, athleteId) => {
      const user = currentSession()
      if (!user) {
        return failure(REPOSITORY_ERROR_CODES.UNAUTHENTICATED, 'Nenhuma sessão ativa.')
      }
      if (![USER_TYPES.TRAINER, USER_TYPES.INSTITUTION].includes(user.tipo)) {
        return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Somente parceiros podem consultar o perfil público de candidatos.')
      }

      const partner = state.partners.find((item) => item.usuarioId === user.id)
      const opportunity = findOpportunity(opportunityId)
      const application = state.applications.find((item) => (
        item.oportunidadeId === opportunityId && item.atletaId === athleteId
      ))
      const candidateSnapshot = state.publicCandidateProfiles.find((item) => (
        item.oportunidadeId === opportunityId
        && item.atletaId === athleteId
        && item.candidaturaId === application?.id
      ))

      if (!partner || !opportunity || opportunity.criadorId !== partner.id || !application || !candidateSnapshot) {
        return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Perfil público do candidato não encontrado para esta oportunidade.')
      }

      return success(candidateSnapshot.perfilPublico)
    },
    atualizarStatusDaCandidatura: async (id, nextStatus) => {
      const user = currentSession()
      if (!user) return failure(REPOSITORY_ERROR_CODES.UNAUTHENTICATED, 'Nenhuma sessão ativa.')
      const application = findApplication(id)
      if (!application) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')
      if (!canTransitionApplicationStatus(application.status, nextStatus)) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_TRANSITION, 'Transição de status não permitida.')
      }
      const opportunity = findOpportunity(application.oportunidadeId)
      const partner = state.partners.find((item) => item.usuarioId === user.id)
      if (!partner || opportunity?.criadorId !== partner.id) {
        return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Somente o parceiro responsável pode atualizar este status.')
      }
      const previousStatus = application.status
      application.status = nextStatus
      application.atualizadoEm = now()
      application.historico.push({
        id: nextId('evento'),
        status: nextStatus,
        statusAnterior: previousStatus,
        statusNovo: nextStatus,
        descricao: `${previousStatus} → ${nextStatus}`,
        data: application.atualizadoEm,
        responsavelId: user.id,
      })
      if ([APPLICATION_STATUS.APPROVED, APPLICATION_STATUS.REJECTED].includes(nextStatus)) {
        const athlete = findAthlete(application.atletaId)
        if (athlete?.usuarioId) {
          state.notifications.push({
            id: nextId('notificacao'),
            usuarioId: athlete.usuarioId,
            candidaturaId: application.id,
            oportunidadeId: application.oportunidadeId,
            titulo: nextStatus === APPLICATION_STATUS.APPROVED ? 'Candidatura aprovada' : 'Atualização da candidatura',
            mensagem: nextStatus === APPLICATION_STATUS.APPROVED ? 'Sua candidatura foi aprovada pela instituição.' : 'Sua candidatura recebeu uma atualização da instituição.',
            lida: false,
            criadoEm: application.atualizadoEm,
          })
        }
      }
      return success(application)
    },
    enviarDocumento: async (id, documentData) => {
      const user = currentSession()
      if (!user) return failure(REPOSITORY_ERROR_CODES.UNAUTHENTICATED, 'Nenhuma sessão ativa.')
      const application = findApplication(id)
      if (!application) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')
      const athlete = findAthlete(application.atletaId)
      if (!athlete || athlete.usuarioId !== user.id) {
        return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Somente o atleta responsável pode enviar documentos.')
      }

      const uploadedDocument = await storage.enviarArquivoCandidatura(id, documentData)
      if (!uploadedDocument.ok) return uploadedDocument

      application.documentos.push({ ...uploadedDocument.data, enviadoEm: uploadedDocument.data.enviadoEm ?? now() })
      application.atualizadoEm = now()
      const opportunity = findOpportunity(application.oportunidadeId)
      const requiredDocuments = opportunity?.documentosNecessarios ?? []
      const allRequiredDocumentsSent = requiredDocuments.length > 0
        && requiredDocuments.every((type) => application.documentos.some((item) => item.tipo === type))
      if (application.status === APPLICATION_STATUS.SUBMITTED && allRequiredDocumentsSent) {
        const previousStatus = application.status
        application.status = APPLICATION_STATUS.DOCUMENTS_SENT
        application.historico.push({
          id: nextId('evento'),
          status: application.status,
          statusAnterior: previousStatus,
          statusNovo: application.status,
          descricao: `${previousStatus} → ${application.status}`,
          data: application.atualizadoEm,
          responsavelId: user.id,
        })
      }
      return success(application)
    },
    listarHistoricoDaCandidatura: async (id) => {
      const application = findApplication(id)
      return application
        ? success(application.historico)
        : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')
    },
    registrarEventoDaCandidatura: async (id, event) => {
      const application = findApplication(id)
      if (!application) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')
      application.historico.push({ id: nextId('evento'), ...event, data: event.data ?? now() })
      return success(application.historico.at(-1))
    },
  }

  const notifications = {
    listarNotificacoesDoUsuario: async (userId) => {
      if (currentUserId !== userId) return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Você não possui permissão para consultar estas notificações.')
      return success(state.notifications
        .filter((notification) => notification.usuarioId === userId)
        .sort((first, second) => new Date(second.criadoEm) - new Date(first.criadoEm)))
    },
    marcarComoLida: async (id) => {
      const notification = state.notifications.find((item) => item.id === id)
      if (!notification) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Notificação não encontrada.')
      if (notification.usuarioId !== currentUserId) return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Você não possui permissão para atualizar esta notificação.')
      notification.lida = true
      notification.lidaEm = now()
      return success(notification)
    },
  }

  const evaluations = {
    listarSolicitacoesDoTreinador: async (trainerId) => {
      const user = currentSession()
      const trainer = state.partners.find((partner) => partner.id === trainerId)
      if (!user || trainer?.usuarioId !== user.id) return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Você não possui permissão para consultar estas solicitações.')
      return success(state.evaluationRequests.filter((request) => request.treinadorId === trainerId))
    },
    solicitarAvaliacao: async (data) => {
      const user = currentSession()
      const institution = state.partners.find((partner) => partner.id === data.instituicaoId)
      const trainer = state.partners.find((partner) => partner.id === data.treinadorId)
      if (!user || institution?.usuarioId !== user.id || institution.tipo !== USER_TYPES.INSTITUTION) {
        return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Somente a instituição responsável pode solicitar uma avaliação.')
      }
      if (!institution.verificado || trainer?.tipo !== USER_TYPES.TRAINER || !trainer.verificado || !findAthlete(data.atletaId)) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Escolha um treinador verificado e um atleta válido.')
      }
      const existing = state.evaluationRequests.find((request) => request.instituicaoId === data.instituicaoId && request.treinadorId === data.treinadorId && request.atletaId === data.atletaId && request.status === 'pendente')
      if (existing) return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Já existe uma solicitação pendente para este treinador e atleta.')
      const request = { id: nextId('solicitacao-avaliacao'), ...data, status: 'pendente', criadoEm: now(), atualizadoEm: now() }
      state.evaluationRequests.push(request)
      return success(request)
    },
    registrarAvaliacao: async (data) => {
      const user = currentSession()
      const trainer = state.partners.find((partner) => partner.id === data.treinadorId)
      const request = state.evaluationRequests.find((item) => item.id === data.solicitacaoId)
      const scores = ['notaTecnica', 'notaFisica', 'notaTatica'].map((key) => Number(data[key]))
      if (!user || trainer?.usuarioId !== user.id || trainer.tipo !== USER_TYPES.TRAINER || !trainer.verificado) {
        return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Somente o treinador verificado designado pode registrar a avaliação.')
      }
      if (!request || request.treinadorId !== trainer.id || request.status !== 'pendente' || scores.some((score) => !Number.isInteger(score) || score < 1 || score > 5) || !String(data.parecer ?? '').trim()) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Preencha as notas de 1 a 5 e o parecer da avaliação.')
      }
      const evaluation = { id: nextId('avaliacao-tecnica'), ...data, atletaId: request.atletaId, instituicaoId: request.instituicaoId, criadoEm: now() }
      state.technicalEvaluations.push(evaluation)
      request.status = 'concluida'
      request.avaliacaoId = evaluation.id
      request.atualizadoEm = evaluation.criadoEm
      return success(evaluation)
    },
  }

  const reports = {
    enviarRelato: async (data) => {
      const user = currentSession()
      if (!user || !String(data.mensagem ?? '').trim()) return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Descreva o relato antes de enviar.')
      const report = { id: nextId('relato'), autorId: user.id, alvoTipo: data.alvoTipo ?? 'plataforma', alvoId: data.alvoId ?? null, mensagem: data.mensagem.trim(), status: 'aberto', criadoEm: now() }
      state.reports.push(report); return success(report)
    },
    listarMeusRelatos: async () => { const user = currentSession(); return user ? success(state.reports.filter((item) => item.autorId === user.id)) : failure(REPOSITORY_ERROR_CODES.UNAUTHENTICATED, 'Nenhuma sessão ativa.') },
  }
  const support = {
    registrarApoio: async (data) => {
      const user = currentSession(); const institution = state.partners.find((item) => item.id === data.instituicaoId)
      if (!user || institution?.usuarioId !== user.id || !institution.verificado || !findAthlete(data.atletaId) || !String(data.descricao ?? '').trim()) return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Informe um apoio válido em nome de uma instituição verificada.')
      const item = { id: nextId('apoio'), ...data, descricao: data.descricao.trim(), criadoEm: now() }; state.supports.push(item); return success(item)
    },
  }
  const administration = {
    listarRecursos: async () => success(state.resources),
    salvarRecurso: async (data) => { const user = currentSession(); if (user?.tipo !== USER_TYPES.ADMIN || !String(data.titulo ?? '').trim()) return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Somente a administração pode gerenciar recursos.'); const item = { id: data.id ?? nextId('recurso'), ...data, titulo: data.titulo.trim(), ativo: data.ativo !== false, atualizadoEm: now() }; const index = state.resources.findIndex((resource) => resource.id === item.id); if (index >= 0) state.resources[index] = item; else state.resources.push(item); return success(item) },
    listarRelatos: async () => { const user = currentSession(); return user?.tipo === USER_TYPES.ADMIN ? success(state.reports) : failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Somente a administração pode consultar relatos.') },
    decidirConta: async (data) => { const user = currentSession(); if (user?.tipo !== USER_TYPES.ADMIN || !['aprovada', 'corrigida', 'rejeitada', 'suspensa'].includes(data.decisao)) return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Decisão administrativa inválida.'); const target = data.tipo === 'parceiro' ? state.partners.find((item) => item.id === data.id) : findAthlete(data.id); if (!target) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Conta não encontrada.'); target.statusAdministrativo = data.decisao; target.atualizadoEm = now(); return success(target) },
    auditarMatchScore: async (athleteId, opportunityId) => { const user = currentSession(); if (user?.tipo !== USER_TYPES.ADMIN) return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Somente a administração pode auditar o Match Score.'); const result = await match.calcularMatchScore(athleteId, opportunityId); if (!result.ok) return result; const audit = { id: nextId('auditoria-match'), atletaId: athleteId, oportunidadeId: opportunityId, resultado: result.data, criterios: result.data.criterios, versao: result.data.versaoDoCalculo, criadoEm: now() }; state.matchAudits.push(audit); return success(audit) },
  }

  return {
    authentication,
    users,
    opportunities,
    applications,
    notifications,
    evaluations,
    reports,
    support,
    administration,
    match,
    storage,
    snapshot: () => clone(state),
    reset: () => {
      state = clone(initialSeed)
      currentUserId = null
      sequence = 1
      emitSession()
    },
  }
}
