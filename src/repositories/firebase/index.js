import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import {
  APPLICATION_STATUS,
  OPPORTUNITY_STATUS,
  REPOSITORY_ERROR_CODES,
  USER_TYPES,
  canTransitionApplicationStatus,
  calculateAge,
  isMinor,
} from '../../domain/contracts'
import { getFirebaseAuth } from '../../services/firebase/auth'
import { getFirebaseDatabase, getFirebaseStorage } from '../../services/firebase/config'

const USERS_COLLECTION = 'usuarios'
const ATHLETES_COLLECTION = 'atletas'
const PARTNERS_COLLECTION = 'parceiros'
const GUARDIANS_COLLECTION = 'responsaveis'
const GUARDIAN_INVITES_COLLECTION = 'convitesResponsavel'
const OPPORTUNITIES_COLLECTION = 'oportunidades'
const APPLICATIONS_COLLECTION = 'candidaturas'
const APPLICATION_KEYS_COLLECTION = 'chavesCandidatura'

function success(data) {
  return { ok: true, data }
}

function failure(code, message, details) {
  return { ok: false, codigo: code, mensagem: message, ...(details ? { detalhes: details } : {}) }
}

function now() {
  return new Date().toISOString()
}

function mapFirebaseError(error) {
  const code = error?.code ?? ''

  if (code.startsWith('auth/')) {
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'E-mail ou senha inválidos.')
    }

    if (code === 'auth/email-already-in-use') {
      return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Este e-mail já possui uma conta.')
    }

    if (code === 'auth/weak-password') {
      return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'A senha informada não atende aos requisitos mínimos.')
    }

    return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Não foi possível concluir a autenticação.', { firebaseCode: code })
  }

  if (code === 'permission-denied') {
    return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Você não possui permissão para realizar esta operação.')
  }

  return failure(REPOSITORY_ERROR_CODES.NETWORK_ERROR, 'Não foi possível acessar o Firebase. Tente novamente.', { firebaseCode: code || undefined })
}

function normalizeUser(id, data) {
  return { id, ...data }
}

function normalizeDocument(snapshot) {
  return { id: snapshot.id, ...snapshot.data() }
}

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

function normalizeLinkCode(value) {
  return String(value ?? '').trim().toUpperCase()
}

function isActiveGuardianInvite(invitation, referenceDate = now()) {
  const expiration = invitation.expiraEmEpoch ?? new Date(invitation.expiraEm).getTime()
  return invitation.status === 'ativo'
    && Number.isFinite(expiration)
    && expiration > new Date(referenceDate).getTime()
}

function buildRegistrationProfile(type, userId, initialData, createdAt) {
  const profile = initialData.perfil ?? {}
  const base = {
    id: userId,
    usuarioId: userId,
    criadoEm: createdAt,
    atualizadoEm: createdAt,
  }

  if (type === USER_TYPES.ATHLETE) {
    if (!isValidBirthDate(profile.dataNascimento)) {
      return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Informe uma data de nascimento válida para o perfil do atleta.')
    }
    if (isMinor(profile.dataNascimento) && !normalizeLinkCode(profile.codigoResponsavel)) {
      return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Informe o código do responsável legal para cadastrar um atleta menor.')
    }

    return success({
      collection: ATHLETES_COLLECTION,
      data: {
        ...base,
        dataNascimento: profile.dataNascimento,
        modalidade: profile.modalidade?.trim() ?? '',
        perfilCompleto: false,
      },
    })
  }

  if (type === USER_TYPES.TRAINER || type === USER_TYPES.INSTITUTION) {
    const nomeExibicao = profile.nomeExibicao?.trim() || initialData.nome?.trim() || ''
    if (!nomeExibicao) {
      return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Informe o nome do perfil parceiro.')
    }

    return success({
      collection: PARTNERS_COLLECTION,
      data: {
        ...base,
        tipo: type,
        nomeExibicao,
        documento: profile.documento?.trim() || null,
        descricao: profile.descricao?.trim() || null,
        localizacao: profile.localizacao?.trim() || null,
        verificado: false,
      },
    })
  }

  if (type === USER_TYPES.GUARDIAN) {
    const parentesco = profile.parentesco?.trim() ?? ''
    if (!parentesco) {
      return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Informe o parentesco com o atleta.')
    }

    return success({
      collection: GUARDIANS_COLLECTION,
      data: {
        ...base,
        atletasVinculadosIds: [],
        parentesco,
        documento: profile.documento?.trim() || null,
        telefone: profile.telefone?.trim() || initialData.telefone?.trim() || null,
      },
    })
  }

  return success(null)
}

function applicationKey(opportunityId, athleteId) {
  return `${encodeURIComponent(opportunityId)}__${encodeURIComponent(athleteId)}`
}

function newId(database, collectionName) {
  return doc(collection(database, collectionName)).id
}

function filterOpportunities(opportunities, filters = {}) {
  const text = String(filters.texto ?? '').toLowerCase()
  return opportunities.filter((opportunity) => {
    if (text && !`${opportunity.titulo} ${opportunity.descricao}`.toLowerCase().includes(text)) return false
    if (filters.modalidade && opportunity.modalidade !== filters.modalidade) return false
    if (filters.categoria && opportunity.categoria !== filters.categoria) return false
    if (filters.localizacao && opportunity.localizacao !== filters.localizacao) return false
    if (filters.status && opportunity.status !== filters.status) return false
    if (filters.prazoAberto && new Date(opportunity.fimInscricoes) < new Date()) return false
    return true
  })
}

function evaluateEligibility(athlete, opportunity, evaluatedAt = now()) {
  const criteria = opportunity.criteriosElegibilidade ?? []
  const evaluatedCriteria = criteria.map((criterion) => {
    const athleteValue = criterion.codigo === 'perfil-completo'
      ? athlete.perfilCompleto
      : athlete[criterion.codigo]
    const matched = athleteValue === criterion.valor

    return {
      ...criterion,
      atendido: matched,
      ...(matched ? {} : { motivo: `${criterion.nome}: requisito não atendido.` }),
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

function calculateMatchScore(eligibility, calculatedAt = now()) {
  const criteria = eligibility.criterios
  const matched = criteria.filter((criterion) => criterion.atendido).length
  const total = criteria.length

  return {
    percentualTotal: total === 0 ? 100 : Math.round((matched / total) * 100),
    criterios: criteria.map((criterion) => ({
      nome: criterion.nome,
      percentual: criterion.atendido ? 100 : 0,
    })),
    calculadoEm: calculatedAt,
    versaoDoCalculo: 'p0-firebase-v1',
  }
}

export function createFirebaseRepositories() {
  const auth = getFirebaseAuth()
  const database = getFirebaseDatabase()
  const storage = getFirebaseStorage()

  const getUserById = async (id) => {
    try {
      const snapshot = await getDoc(doc(database, USERS_COLLECTION, id))

      if (!snapshot.exists()) {
        return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Perfil do usuário não encontrado.')
      }

      return success(normalizeUser(snapshot.id, snapshot.data()))
    } catch (error) {
      return mapFirebaseError(error)
    }
  }

  const getAthleteById = async (id) => {
    try {
      const snapshot = await getDoc(doc(database, ATHLETES_COLLECTION, id))
      return snapshot.exists()
        ? success(normalizeDocument(snapshot))
        : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Atleta não encontrado.')
    } catch (error) {
      return mapFirebaseError(error)
    }
  }

  const getAthleteByUserId = async (userId) => {
    try {
      const snapshots = await getDocs(query(
        collection(database, ATHLETES_COLLECTION),
        where('usuarioId', '==', userId),
      ))
      const athleteSnapshot = snapshots.docs[0]
      return athleteSnapshot
        ? success(normalizeDocument(athleteSnapshot))
        : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Perfil esportivo não encontrado para este usuário.')
    } catch (error) {
      return mapFirebaseError(error)
    }
  }

  const getPartnerByUserId = async (userId) => {
    try {
      const snapshots = await getDocs(query(
        collection(database, PARTNERS_COLLECTION),
        where('usuarioId', '==', userId),
      ))
      const partnerSnapshot = snapshots.docs[0]
      return partnerSnapshot
        ? success(normalizeDocument(partnerSnapshot))
        : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Perfil parceiro não encontrado para este usuário.')
    } catch (error) {
      return mapFirebaseError(error)
    }
  }

  const getGuardianByUserId = async (userId) => {
    try {
      const snapshots = await getDocs(query(
        collection(database, GUARDIANS_COLLECTION),
        where('usuarioId', '==', userId),
      ))
      const guardianSnapshot = snapshots.docs[0]
      return guardianSnapshot
        ? success(normalizeDocument(guardianSnapshot))
        : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Perfil de responsável não encontrado para este usuário.')
    } catch (error) {
      return mapFirebaseError(error)
    }
  }

  const getOpportunityById = async (id) => {
    try {
      const snapshot = await getDoc(doc(database, OPPORTUNITIES_COLLECTION, id))
      return snapshot.exists()
        ? success(normalizeDocument(snapshot))
        : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Oportunidade não encontrada.')
    } catch (error) {
      return mapFirebaseError(error)
    }
  }

  const getApplicationById = async (id) => {
    try {
      const snapshot = await getDoc(doc(database, APPLICATIONS_COLLECTION, id))
      return snapshot.exists()
        ? success(normalizeDocument(snapshot))
        : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')
    } catch (error) {
      return mapFirebaseError(error)
    }
  }

  const sessionObservers = new Set()
  const incompleteRegistrationIds = new Set()
  let registrationInProgress = false

  const authentication = {
    cadastrar: async (email, password, type, initialData = {}) => {
      if (!email || !password || !Object.values(USER_TYPES).includes(type)) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'E-mail, senha e tipo de usuário são obrigatórios.')
      }

      const createdAt = now()
      const profileValidation = buildRegistrationProfile(type, 'validacao', initialData, createdAt)
      if (!profileValidation.ok) return profileValidation

      let credential
      let user
      try {
        registrationInProgress = true
        credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
        user = {
          id: credential.user.uid,
          email: credential.user.email ?? email.trim(),
          tipo: type,
          nome: initialData.nome?.trim() || initialData.nomeExibicao?.trim() || '',
          telefone: initialData.telefone?.trim() || null,
          fotoUrl: null,
          criadoEm: createdAt,
          atualizadoEm: createdAt,
        }

        const profileResult = buildRegistrationProfile(type, user.id, initialData, createdAt)
        if (!profileResult.ok) {
          await deleteUser(credential.user)
          registrationInProgress = false
          return profileResult
        }

        const minorRegistration = type === USER_TYPES.ATHLETE
          && isMinor(profileResult.data?.data?.dataNascimento)

        if (minorRegistration) {
          const linkCode = normalizeLinkCode(initialData.perfil?.codigoResponsavel)
          const invitationReference = doc(database, GUARDIAN_INVITES_COLLECTION, linkCode)
          const userReference = doc(database, USERS_COLLECTION, user.id)
          const athleteReference = doc(database, ATHLETES_COLLECTION, user.id)

          const linkResult = await runTransaction(database, async (transaction) => {
            const invitationSnapshot = await transaction.get(invitationReference)
            if (!invitationSnapshot.exists()) {
              return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Código de responsável inválido ou expirado.')
            }

            const invitation = normalizeDocument(invitationSnapshot)
            if (!isActiveGuardianInvite(invitation, createdAt)) {
              return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Código de responsável inválido, expirado ou já utilizado.')
            }

            const guardianReference = doc(database, GUARDIANS_COLLECTION, invitation.responsavelId)
            const athlete = {
              ...profileResult.data.data,
              responsavelId: invitation.responsavelId,
              vinculoResponsavelId: linkCode,
            }

            transaction.set(userReference, user)
            transaction.set(athleteReference, athlete)
            transaction.update(guardianReference, {
              atletasVinculadosIds: arrayUnion(user.id),
              atualizadoEm: createdAt,
            })
            transaction.update(invitationReference, {
              status: 'utilizado',
              utilizadoPorAtletaId: user.id,
              utilizadoEm: createdAt,
            })
            return success({ athlete, responsavelId: invitation.responsavelId })
          })

          if (!linkResult.ok) {
            try {
              await deleteUser(credential.user)
            } catch (rollbackError) {
              registrationInProgress = false
              incompleteRegistrationIds.add(credential.user.uid)
              return failure(
                REPOSITORY_ERROR_CODES.NETWORK_ERROR,
                'Não foi possível concluir o vínculo e a conta não pôde ser removida automaticamente. Entre em contato com o suporte.',
                { rollbackCode: rollbackError?.code },
              )
            }
            registrationInProgress = false
            return linkResult
          }
        } else {
          const batch = writeBatch(database)
          batch.set(doc(database, USERS_COLLECTION, user.id), user)
          if (profileResult.data) {
            batch.set(doc(database, profileResult.data.collection, user.id), profileResult.data.data)
          }
          await batch.commit()
        }
      } catch (error) {
        if (credential?.user) {
          try {
            await deleteUser(credential.user)
          } catch (rollbackError) {
            registrationInProgress = false
            incompleteRegistrationIds.add(credential.user.uid)
            return failure(
              REPOSITORY_ERROR_CODES.NETWORK_ERROR,
              'Não foi possível salvar o perfil e a conta não pôde ser removida automaticamente. Entre em contato com o suporte antes de tentar novamente.',
              { firebaseCode: error?.code, rollbackCode: rollbackError?.code },
            )
          }
        }
        registrationInProgress = false
        return mapFirebaseError(error)
      }

      registrationInProgress = false
      sessionObservers.forEach((callback) => callback(user))
      return success(user)
    },

    entrar: async (email, password) => {
      if (!email || !password) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'E-mail e senha são obrigatórios.')
      }

      try {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
        return getUserById(credential.user.uid)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },

    sair: async () => {
      try {
        await signOut(auth)
        return success(null)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },

    recuperarSenha: async (email) => {
      if (!email) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Informe o e-mail para recuperar a senha.')
      }

      try {
        await sendPasswordResetEmail(auth, email.trim())
        return success({ solicitado: true })
      } catch (error) {
        return mapFirebaseError(error)
      }
    },

    obterSessaoAtual: async () => {
      if (!auth.currentUser) return success(null)
      return getUserById(auth.currentUser.uid)
    },

    observarSessao: (callback) => {
      sessionObservers.add(callback)
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (registrationInProgress || (firebaseUser && incompleteRegistrationIds.has(firebaseUser.uid))) return
        if (!firebaseUser) {
          callback(null)
          return
        }

        const result = await getUserById(firebaseUser.uid)
        callback(result.ok ? result.data : null)
      })

      return () => {
        sessionObservers.delete(callback)
        unsubscribe()
      }
    },
  }

  const users = {
    obterUsuario: getUserById,
    obterUsuarioAtual: async () => {
      if (!auth.currentUser) {
        return failure(REPOSITORY_ERROR_CODES.UNAUTHENTICATED, 'Nenhuma sessão ativa.')
      }

      return getUserById(auth.currentUser.uid)
    },
    atualizarUsuario: async (id, data) => {
      try {
        await updateDoc(doc(database, USERS_COLLECTION, id), {
          ...data,
          id,
          atualizadoEm: now(),
        })
        return getUserById(id)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    criarPerfilAtleta: async (userId, data) => {
      const user = await getUserById(userId)
      if (!user.ok) return user

      const existingProfile = await getAthleteByUserId(userId)
      if (existingProfile.ok) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Este usuário já possui um perfil esportivo.')
      }
      if (existingProfile.codigo !== REPOSITORY_ERROR_CODES.NOT_FOUND) return existingProfile

      const athlete = {
        ...data,
        id: data.id ?? userId,
        usuarioId: userId,
        perfilCompleto: Boolean(data.perfilCompleto),
      }
      if (isMinor(athlete.dataNascimento) && !athlete.responsavelId) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Atleta menor de idade exige responsável legal.')
      }

      try {
        await setDoc(doc(database, ATHLETES_COLLECTION, athlete.id), athlete)
        return success(athlete)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    obterPerfilAtleta: getAthleteById,
    obterPerfilAtletaPorUsuario: getAthleteByUserId,
    atualizarPerfilAtleta: async (id, data) => {
      try {
        await updateDoc(doc(database, ATHLETES_COLLECTION, id), { ...data, id })
        return getAthleteById(id)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    criarPerfilParceiro: async (userId, data) => {
      const user = await getUserById(userId)
      if (!user.ok) return user

      const existingProfile = await getPartnerByUserId(userId)
      if (existingProfile.ok) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Este usuário já possui um perfil parceiro.')
      }
      if (existingProfile.codigo !== REPOSITORY_ERROR_CODES.NOT_FOUND) return existingProfile

      const partner = {
        id: newId(database, PARTNERS_COLLECTION),
        usuarioId: userId,
        ...data,
        verificado: Boolean(data.verificado),
      }
      try {
        await setDoc(doc(database, PARTNERS_COLLECTION, partner.id), partner)
        return success(partner)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    obterPerfilParceiro: async (id) => {
      try {
        const snapshot = await getDoc(doc(database, PARTNERS_COLLECTION, id))
        return snapshot.exists()
          ? success(normalizeDocument(snapshot))
          : failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Parceiro não encontrado.')
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    obterPerfilParceiroPorUsuario: getPartnerByUserId,
    atualizarPerfilParceiro: async (id, data) => {
      try {
        await updateDoc(doc(database, PARTNERS_COLLECTION, id), { ...data, id })
        return users.obterPerfilParceiro(id)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    criarResponsavel: async (userId, data) => {
      const user = await getUserById(userId)
      if (!user.ok) return user

      const guardian = {
        id: newId(database, GUARDIANS_COLLECTION),
        usuarioId: userId,
        atletasVinculadosIds: [],
        ...data,
        criadoEm: now(),
        atualizadoEm: now(),
      }
      try {
        await setDoc(doc(database, GUARDIANS_COLLECTION, guardian.id), guardian)
        return success(guardian)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    obterPerfilResponsavelPorUsuario: getGuardianByUserId,
    gerarCodigoVinculoResponsavel: async (guardianId) => {
      if (!auth.currentUser) {
        return failure(REPOSITORY_ERROR_CODES.UNAUTHENTICATED, 'Nenhuma sessão ativa.')
      }

      try {
        const guardianSnapshot = await getDoc(doc(database, GUARDIANS_COLLECTION, guardianId))
        if (!guardianSnapshot.exists()) {
          return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Responsável não encontrado.')
        }

        const guardian = normalizeDocument(guardianSnapshot)
        if (guardian.usuarioId !== auth.currentUser.uid) {
          return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Somente o responsável pode gerar o próprio código de vínculo.')
        }

        const createdAt = now()
        const expiration = Date.now() + (24 * 60 * 60 * 1000)
        const code = newId(database, GUARDIAN_INVITES_COLLECTION)
          .replace(/[^a-z0-9]/gi, '')
          .slice(0, 10)
          .toUpperCase()
        const invitation = {
          id: code,
          codigo: code,
          responsavelId: guardianId,
          status: 'ativo',
          criadoEm: createdAt,
          expiraEm: new Date(expiration).toISOString(),
          expiraEmEpoch: expiration,
        }
        await setDoc(doc(database, GUARDIAN_INVITES_COLLECTION, code), invitation)
        return success(invitation)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    calcularIdade: async (birthDate, referenceDate) => success(calculateAge(birthDate, referenceDate)),
    identificarMenor: async (birthDate, referenceDate) => success(isMinor(birthDate, referenceDate)),
    obterAtletasDoResponsavel: async (guardianId) => {
      try {
        const guardianSnapshot = await getDoc(doc(database, GUARDIANS_COLLECTION, guardianId))
        if (!guardianSnapshot.exists()) {
          return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Responsável não encontrado.')
        }
        const guardian = normalizeDocument(guardianSnapshot)
        const athletes = await Promise.all((guardian.atletasVinculadosIds ?? []).map(async (athleteId) => {
          const result = await getAthleteById(athleteId)
          return result.ok ? result.data : null
        }))
        return success(athletes.filter(Boolean))
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    atualizarAtletaComoResponsavel: async (guardianId, athleteId, data) => {
      const guardianResult = await users.obterAtletasDoResponsavel(guardianId)
      if (!guardianResult.ok) return guardianResult
      if (!guardianResult.data.some((athlete) => athlete.id === athleteId)) {
        return failure(REPOSITORY_ERROR_CODES.FORBIDDEN, 'Responsável não possui vínculo com este atleta.')
      }
      return users.atualizarPerfilAtleta(athleteId, data)
    },
  }

  const opportunities = {
    listarOportunidades: async (filters = {}) => {
      try {
        const snapshots = await getDocs(collection(database, OPPORTUNITIES_COLLECTION))
        return success(filterOpportunities(snapshots.docs.map(normalizeDocument), filters))
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    obterOportunidade: getOpportunityById,
    criarOportunidade: async (data) => {
      const createdAt = now()
      const opportunity = {
        id: newId(database, OPPORTUNITIES_COLLECTION),
        ...data,
        status: data.status ?? OPPORTUNITY_STATUS.DRAFT,
        criadoEm: createdAt,
        atualizadoEm: createdAt,
      }
      try {
        await setDoc(doc(database, OPPORTUNITIES_COLLECTION, opportunity.id), opportunity)
        return success(opportunity)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    atualizarOportunidade: async (id, data) => {
      try {
        await updateDoc(doc(database, OPPORTUNITIES_COLLECTION, id), {
          ...data,
          id,
          atualizadoEm: now(),
        })
        return getOpportunityById(id)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    encerrarOportunidade: async (id) => opportunities.atualizarOportunidade(id, {
      status: OPPORTUNITY_STATUS.CLOSED,
    }),
    listarOportunidadesDoParceiro: async (partnerId, filters = {}) => {
      const result = await opportunities.listarOportunidades(filters)
      return result.ok
        ? success(result.data.filter((opportunity) => opportunity.criadorId === partnerId))
        : result
    },
    listarDocumentosNecessarios: async (id) => {
      const opportunity = await getOpportunityById(id)
      return opportunity.ok
        ? success(opportunity.data.documentosNecessarios ?? [])
        : opportunity
    },
  }

  const match = {
    avaliarElegibilidade: async (athleteId, opportunityId) => {
      const [athleteResult, opportunityResult] = await Promise.all([
        getAthleteById(athleteId),
        getOpportunityById(opportunityId),
      ])

      if (!athleteResult.ok || !opportunityResult.ok) {
        return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Atleta ou oportunidade não encontrado.')
      }

      return success(evaluateEligibility(athleteResult.data, opportunityResult.data))
    },
    calcularMatchScore: async (athleteId, opportunityId) => {
      const eligibility = await match.avaliarElegibilidade(athleteId, opportunityId)
      return eligibility.ok
        ? success(calculateMatchScore(eligibility.data))
        : eligibility
    },
    obterMatchScore: async (athleteId, opportunityId) => match.calcularMatchScore(athleteId, opportunityId),
  }

  const uploadApplicationDocument = async (applicationId, documentData = {}) => {
    const application = await getApplicationById(applicationId)
    if (!application.ok) return application

    const { arquivo, file: sourceFile, ...metadata } = documentData
    if (metadata.arquivoUrl) return success(metadata)

    const source = arquivo ?? sourceFile
    if (!source) {
      return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'Selecione um arquivo antes de enviar o documento.')
    }

    try {
      const file = source.uri
        ? await (await fetch(source.uri)).blob()
        : source
      const documentId = metadata.id ?? newId(database, 'documentosCandidatura')
      const fileName = metadata.nome ?? source.name ?? `${documentId}.bin`
      const storageReference = ref(storage, `candidaturas/${applicationId}/${documentId}-${fileName}`)
      await uploadBytes(storageReference, file, {
        contentType: metadata.tipoMime ?? source.type ?? 'application/octet-stream',
      })
      return success({
        ...metadata,
        id: documentId,
        nome: fileName,
        arquivoUrl: await getDownloadURL(storageReference),
      })
    } catch (error) {
      return mapFirebaseError(error)
    }
  }

  const storageRepository = {
    enviarArquivoCandidatura: uploadApplicationDocument,
  }

  const applications = {
    verificarCandidaturaExistente: async (opportunityId, athleteId) => {
      try {
        const snapshot = await getDoc(doc(
          database,
          APPLICATION_KEYS_COLLECTION,
          applicationKey(opportunityId, athleteId),
        ))
        return success(snapshot.exists())
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    criarCandidatura: async (opportunityId, athleteId, data = {}) => {
      const createdAt = now()
      const applicationReference = doc(collection(database, APPLICATIONS_COLLECTION))
      const keyReference = doc(
        database,
        APPLICATION_KEYS_COLLECTION,
        applicationKey(opportunityId, athleteId),
      )
      const athleteReference = doc(database, ATHLETES_COLLECTION, athleteId)
      const opportunityReference = doc(database, OPPORTUNITIES_COLLECTION, opportunityId)

      try {
        return await runTransaction(database, async (transaction) => {
          const [keySnapshot, athleteSnapshot, opportunitySnapshot] = await Promise.all([
            transaction.get(keyReference),
            transaction.get(athleteReference),
            transaction.get(opportunityReference),
          ])

          if (keySnapshot.exists()) {
            return failure(
              REPOSITORY_ERROR_CODES.DUPLICATE_APPLICATION,
              'Já existe uma candidatura para esta oportunidade.',
            )
          }

          if (!athleteSnapshot.exists() || !opportunitySnapshot.exists()) {
            return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Atleta ou oportunidade não encontrado.')
          }

          const eligibility = evaluateEligibility(
            normalizeDocument(athleteSnapshot),
            normalizeDocument(opportunitySnapshot),
            createdAt,
          )
          if (!eligibility.elegivel) {
            return failure(
              REPOSITORY_ERROR_CODES.INELIGIBLE_ATHLETE,
              'O atleta não atende aos critérios obrigatórios.',
              eligibility,
            )
          }

          const event = {
            id: doc(collection(database, 'eventosCandidatura')).id,
            status: APPLICATION_STATUS.SUBMITTED,
            statusAnterior: null,
            statusNovo: APPLICATION_STATUS.SUBMITTED,
            descricao: 'Candidatura realizada.',
            data: createdAt,
            responsavelId: data.responsavelId ?? athleteId,
          }
          const application = {
            id: applicationReference.id,
            oportunidadeId: opportunityId,
            atletaId: athleteId,
            status: APPLICATION_STATUS.SUBMITTED,
            matchScore: calculateMatchScore(eligibility, createdAt).percentualTotal,
            documentos: data.documentos ?? [],
            historico: [event],
            criadoEm: createdAt,
            atualizadoEm: createdAt,
          }

          transaction.set(applicationReference, application)
          transaction.set(keyReference, {
            candidaturaId: application.id,
            oportunidadeId: opportunityId,
            atletaId: athleteId,
            criadoEm: createdAt,
          })
          return success(application)
        })
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    obterCandidatura: getApplicationById,
    listarCandidaturasDoAtleta: async (athleteId, filters = {}) => {
      try {
        const snapshots = await getDocs(query(
          collection(database, APPLICATIONS_COLLECTION),
          where('atletaId', '==', athleteId),
        ))
        const applicationsForAthlete = snapshots.docs
          .map(normalizeDocument)
          .filter((application) => !filters.status || application.status === filters.status)
        return success(applicationsForAthlete)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    listarCandidatosDaOportunidade: async (opportunityId, filters = {}) => {
      try {
        const snapshots = await getDocs(query(
          collection(database, APPLICATIONS_COLLECTION),
          where('oportunidadeId', '==', opportunityId),
        ))
        const candidates = snapshots.docs
          .map(normalizeDocument)
          .filter((application) => !filters.status || application.status === filters.status)
        return success(candidates)
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    atualizarStatusDaCandidatura: async (id, nextStatus, responsibleId = auth.currentUser?.uid ?? null) => {
      const applicationReference = doc(database, APPLICATIONS_COLLECTION, id)
      const updatedAt = now()

      try {
        return await runTransaction(database, async (transaction) => {
          const snapshot = await transaction.get(applicationReference)
          if (!snapshot.exists()) {
            return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')
          }

          const application = normalizeDocument(snapshot)
          if (!canTransitionApplicationStatus(application.status, nextStatus)) {
            return failure(REPOSITORY_ERROR_CODES.INVALID_TRANSITION, 'Transição de status não permitida.')
          }

          const event = {
            id: doc(collection(database, 'eventosCandidatura')).id,
            status: nextStatus,
            statusAnterior: application.status,
            statusNovo: nextStatus,
            descricao: `${application.status} → ${nextStatus}`,
            data: updatedAt,
            responsavelId: responsibleId,
          }
          const historico = [...(application.historico ?? []), event]
          const updated = {
            ...application,
            status: nextStatus,
            historico,
            atualizadoEm: updatedAt,
          }

          transaction.update(applicationReference, {
            status: updated.status,
            historico: updated.historico,
            atualizadoEm: updated.atualizadoEm,
          })
          return success(updated)
        })
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    enviarDocumento: async (id, documentData) => {
      const applicationReference = doc(database, APPLICATIONS_COLLECTION, id)
      const updatedAt = now()
      const uploadedDocument = await storageRepository.enviarArquivoCandidatura(id, documentData)
      if (!uploadedDocument.ok) return uploadedDocument

      try {
        return await runTransaction(database, async (transaction) => {
          const snapshot = await transaction.get(applicationReference)
          if (!snapshot.exists()) {
            return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')
          }

          const application = normalizeDocument(snapshot)
          const document = {
            ...uploadedDocument.data,
            enviadoEm: uploadedDocument.data.enviadoEm ?? updatedAt,
          }
          const documentos = [...(application.documentos ?? []), document]
          const updated = { ...application, documentos, atualizadoEm: updatedAt }
          transaction.update(applicationReference, { documentos, atualizadoEm: updatedAt })
          return success(updated)
        })
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
    listarHistoricoDaCandidatura: async (id) => {
      const application = await getApplicationById(id)
      return application.ok
        ? success(application.data.historico ?? [])
        : application
    },
    registrarEventoDaCandidatura: async (id, eventData) => {
      const applicationReference = doc(database, APPLICATIONS_COLLECTION, id)
      const createdAt = now()

      try {
        return await runTransaction(database, async (transaction) => {
          const snapshot = await transaction.get(applicationReference)
          if (!snapshot.exists()) {
            return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')
          }

          const application = normalizeDocument(snapshot)
          const event = {
            id: eventData.id ?? doc(collection(database, 'eventosCandidatura')).id,
            ...eventData,
            data: eventData.data ?? createdAt,
          }
          const historico = [...(application.historico ?? []), event]
          transaction.update(applicationReference, { historico, atualizadoEm: createdAt })
          return success(event)
        })
      } catch (error) {
        return mapFirebaseError(error)
      }
    },
  }

  return { authentication, users, opportunities, applications, match, storage: storageRepository }
}
