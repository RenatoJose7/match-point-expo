import {
  APPLICATION_STATUS,
  OPPORTUNITY_STATUS,
  REPOSITORY_ERROR_CODES,
  USER_TYPES,
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
      const opportunity = {
        id: nextId('oportunidade'),
        ...data,
        status: data.status ?? OPPORTUNITY_STATUS.DRAFT,
        criadoEm: now(),
        atualizadoEm: now(),
      }
      state.opportunities.push(opportunity)
      return success(opportunity)
    },
    atualizarOportunidade: async (id, data) => {
      const opportunity = findOpportunity(id)
      if (!opportunity) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Oportunidade não encontrada.')
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
    atualizarStatusDaCandidatura: async (id, nextStatus, responsibleId = currentUserId) => {
      const application = findApplication(id)
      if (!application) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')
      if (!canTransitionApplicationStatus(application.status, nextStatus)) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_TRANSITION, 'Transição de status não permitida.')
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
        responsavelId: responsibleId,
      })
      return success(application)
    },
    enviarDocumento: async (id, documentData) => {
      const application = findApplication(id)
      if (!application) return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')

      const uploadedDocument = await storage.enviarArquivoCandidatura(id, documentData)
      if (!uploadedDocument.ok) return uploadedDocument

      application.documentos.push({ ...uploadedDocument.data, enviadoEm: uploadedDocument.data.enviadoEm ?? now() })
      application.atualizadoEm = now()
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

  return {
    authentication,
    users,
    opportunities,
    applications,
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
