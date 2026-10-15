import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import {
  APPLICATION_STATUS,
  REPOSITORY_ERROR_CODES,
  USER_TYPES,
  canTransitionApplicationStatus,
} from '../../domain/contracts'
import { getFirebaseAuth } from '../../services/firebase/auth'
import { getFirebaseDatabase } from '../../services/firebase/config'

const USERS_COLLECTION = 'usuarios'
const ATHLETES_COLLECTION = 'atletas'
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

function applicationKey(opportunityId, athleteId) {
  return `${encodeURIComponent(opportunityId)}__${encodeURIComponent(athleteId)}`
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

  const authentication = {
    cadastrar: async (email, password, type, initialData = {}) => {
      if (!email || !password || !Object.values(USER_TYPES).includes(type)) {
        return failure(REPOSITORY_ERROR_CODES.INVALID_DATA, 'E-mail, senha e tipo de usuário são obrigatórios.')
      }

      try {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
        const user = {
          id: credential.user.uid,
          email: credential.user.email ?? email.trim(),
          tipo: type,
          nome: initialData.nome?.trim() || initialData.nomeExibicao?.trim() || '',
          telefone: initialData.telefone?.trim() || null,
          fotoUrl: null,
          criadoEm: now(),
          atualizadoEm: now(),
        }

        await setDoc(doc(database, USERS_COLLECTION, credential.user.uid), user)
        return success(user)
      } catch (error) {
        return mapFirebaseError(error)
      }
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

    observarSessao: (callback) => onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null)
        return
      }

      const result = await getUserById(firebaseUser.uid)
      callback(result.ok ? result.data : null)
    }),
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

      try {
        return await runTransaction(database, async (transaction) => {
          const snapshot = await transaction.get(applicationReference)
          if (!snapshot.exists()) {
            return failure(REPOSITORY_ERROR_CODES.NOT_FOUND, 'Candidatura não encontrada.')
          }

          const application = normalizeDocument(snapshot)
          const document = {
            id: documentData.id ?? doc(collection(database, 'documentosCandidatura')).id,
            ...documentData,
            enviadoEm: documentData.enviadoEm ?? updatedAt,
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

  return { authentication, users, applications, match }
}
