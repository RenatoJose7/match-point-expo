import assert from 'node:assert/strict'
import { APPLICATION_STATUS, USER_TYPES, calculateAge, isMinor } from '../src/domain/contracts.js'
import { createMemoryRepositories } from '../src/repositories/memory/index.js'

const repositories = createMemoryRepositories()

assert.equal(calculateAge('2000-10-10', new Date('2026-10-09T12:00:00Z')), 25)
assert.equal(calculateAge('2000-10-09', new Date('2026-10-09T12:00:00Z')), 26)
assert.equal(isMinor('2011-08-20', new Date('2026-10-09T12:00:00Z')), true)

const login = await repositories.authentication.entrar('atleta.menor@matchpoint.example', 'demo-local')
assert.equal(login.ok, true)

const activeOpportunities = await repositories.opportunities.listarOportunidades({ status: 'ativa' })
assert.equal(activeOpportunities.ok, true)
assert.equal(activeOpportunities.data.length, 2)

const eligible = await repositories.match.avaliarElegibilidade('atleta-menor', 'oportunidade-bolsa-tenis')
assert.equal(eligible.ok, true)
assert.equal(eligible.data.elegivel, true)

const ineligible = await repositories.match.avaliarElegibilidade('atleta-menor', 'oportunidade-futebol-incompativel')
assert.equal(ineligible.ok, true)
assert.equal(ineligible.data.elegivel, false)

const application = await repositories.applications.criarCandidatura(
  'oportunidade-bolsa-tenis',
  'atleta-menor',
  { responsavelId: 'usuario-atleta-menor' },
)
assert.equal(application.ok, true)

const duplicate = await repositories.applications.criarCandidatura(
  'oportunidade-bolsa-tenis',
  'atleta-menor',
)
assert.equal(duplicate.ok, false)
assert.equal(duplicate.codigo, 'CANDIDATURA_DUPLICADA')

const underReview = await repositories.applications.atualizarStatusDaCandidatura(
  application.data.id,
  APPLICATION_STATUS.UNDER_REVIEW,
  'usuario-instituicao',
)
assert.equal(underReview.ok, true)

const approved = await repositories.applications.atualizarStatusDaCandidatura(
  application.data.id,
  APPLICATION_STATUS.APPROVED,
  'usuario-instituicao',
)
assert.equal(approved.ok, true)
assert.equal(approved.data.historico.length, 3)

const uploadedDocument = await repositories.storage.enviarArquivoCandidatura(application.data.id, {
  tipo: 'curriculo_esportivo',
  arquivo: { uri: 'memory://curriculo.pdf', name: 'curriculo.pdf', type: 'application/pdf' },
})
assert.equal(uploadedDocument.ok, true)
assert.equal(uploadedDocument.data.arquivoUrl, 'memory://curriculo.pdf')
assert.equal('arquivo' in uploadedDocument.data, false)

const applicationWithDocument = await repositories.applications.enviarDocumento(
  application.data.id,
  uploadedDocument.data,
)
assert.equal(applicationWithDocument.ok, true)
assert.equal(applicationWithDocument.data.documentos.length, 1)
assert.equal(applicationWithDocument.data.documentos[0].arquivoUrl, 'memory://curriculo.pdf')

const signupRepositories = createMemoryRepositories()
let observedSession = null
signupRepositories.authentication.observarSessao((session) => {
  observedSession = session
})

const athleteSignup = await signupRepositories.authentication.cadastrar(
  'novo.atleta@matchpoint.example',
  'demo-local',
  USER_TYPES.ATHLETE,
  { nome: 'Atleta Novo', perfil: { dataNascimento: '2000-10-10', modalidade: '' } },
)
assert.equal(athleteSignup.ok, true)
assert.equal(observedSession.id, athleteSignup.data.id)
const athleteProfile = await signupRepositories.users.obterPerfilAtleta(athleteSignup.data.id)
assert.equal(athleteProfile.ok, true)
assert.equal(athleteProfile.data.dataNascimento, '2000-10-10')
const athleteProfileByUser = await signupRepositories.users.obterPerfilAtletaPorUsuario(athleteSignup.data.id)
assert.equal(athleteProfileByUser.ok, true)
assert.equal(athleteProfileByUser.data.id, athleteProfile.data.id)

const partnerSignup = await signupRepositories.authentication.cadastrar(
  'novo.treinador@matchpoint.example',
  'demo-local',
  USER_TYPES.TRAINER,
  {
    nome: 'Treinador Novo',
    perfil: { nomeExibicao: 'Treinador Novo', documento: '12345678900', verificado: false },
  },
)
assert.equal(partnerSignup.ok, true)
const partnerProfile = await signupRepositories.users.obterPerfilParceiro(partnerSignup.data.id)
assert.equal(partnerProfile.ok, true)
assert.equal(partnerProfile.data.documento, '12345678900')
const partnerProfileByUser = await signupRepositories.users.obterPerfilParceiroPorUsuario(partnerSignup.data.id)
assert.equal(partnerProfileByUser.ok, true)
assert.equal(partnerProfileByUser.data.id, partnerProfile.data.id)

const institutionSignup = await signupRepositories.authentication.cadastrar(
  'nova.instituicao@matchpoint.example',
  'demo-local',
  USER_TYPES.INSTITUTION,
  {
    nome: 'Clube Novo',
    perfil: {
      tipo: USER_TYPES.INSTITUTION,
      nomeExibicao: 'Clube Novo',
      documento: '12345678000100',
      localizacao: 'São Paulo',
    },
  },
)
assert.equal(institutionSignup.ok, true)
const institutionProfile = await signupRepositories.users.obterPerfilParceiro(institutionSignup.data.id)
assert.equal(institutionProfile.ok, true)
assert.equal(institutionProfile.data.localizacao, 'São Paulo')

const guardianSignup = await signupRepositories.authentication.cadastrar(
  'novo.responsavel@matchpoint.example',
  'demo-local',
  USER_TYPES.GUARDIAN,
  {
    nome: 'Responsável Novo',
    perfil: { parentesco: 'Mãe', documento: '98765432100', telefone: '11999999999' },
  },
)
assert.equal(guardianSignup.ok, true)
const guardianProfile = await signupRepositories.users.obterAtletasDoResponsavel(guardianSignup.data.id)
assert.equal(guardianProfile.ok, true)
assert.deepEqual(guardianProfile.data, [])

const minorSignup = await signupRepositories.authentication.cadastrar(
  'novo.menor@matchpoint.example',
  'demo-local',
  USER_TYPES.ATHLETE,
  { nome: 'Atleta Menor', perfil: { dataNascimento: '2010-10-15' } },
)
assert.equal(minorSignup.ok, false)
assert.equal(observedSession.id, guardianSignup.data.id)
const invalidBirthDateSignup = await signupRepositories.authentication.cadastrar(
  'data.invalida@matchpoint.example',
  'demo-local',
  USER_TYPES.ATHLETE,
  { nome: 'Atleta com data inválida', perfil: { dataNascimento: '2010-02-31' } },
)
assert.equal(invalidBirthDateSignup.ok, false)

console.log('Contratos P0 em memória verificados com sucesso.')
