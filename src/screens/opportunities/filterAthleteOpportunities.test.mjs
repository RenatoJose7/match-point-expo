import assert from 'node:assert/strict'
import test from 'node:test'
import { filterAthleteOpportunities } from './filterAthleteOpportunities.mjs'

const referenceDate = new Date('2026-10-15T12:00:00.000Z')
const opportunities = [
  {
    id: 'tennis-scholarship',
    titulo: 'Bolsa de Estudos',
    descricao: 'Programa para atletas de tênis',
    beneficio: 'Bolsa integral',
    modalidade: 'Tênis',
    categoria: 'Universitário',
    localizacao: 'Suzano - SP',
    fimInscricoes: '2026-12-20T23:59:59.000Z',
    status: 'ativa',
  },
  {
    id: 'football-evaluation',
    titulo: 'Avaliação de Futebol',
    modalidade: 'Futebol',
    categoria: 'Sub-18',
    localizacao: 'São Paulo - SP',
    fimInscricoes: '2026-10-01T00:00:00.000Z',
    status: 'encerrada',
  },
  {
    id: 'missing-deadline',
    titulo: 'Treino aberto',
    modalidade: 'Tênis',
    categoria: 'Sub-18',
    localizacao: 'Suzano - SP',
    fimInscricoes: 'data-inválida',
    status: 'ativa',
  },
]

test('search matches text without accent sensitivity', () => {
  const result = filterAthleteOpportunities(opportunities, { texto: 'tenis', status: 'todas' }, referenceDate)

  assert.deepEqual(result.map(item => item.id), ['tennis-scholarship', 'missing-deadline'])
})

test('combines text, modality, category, location and status filters', () => {
  const result = filterAthleteOpportunities(opportunities, {
    texto: 'bolsa',
    modalidade: 'tenis',
    categoria: 'universitario',
    localizacao: 'suzano',
    status: 'ativa',
  }, referenceDate)

  assert.deepEqual(result.map(item => item.id), ['tennis-scholarship'])
})

test('includes active and closed opportunities when status is all', () => {
  const result = filterAthleteOpportunities(opportunities, { status: 'todas' }, referenceDate)

  assert.deepEqual(result.map(item => item.id), ['tennis-scholarship', 'football-evaluation', 'missing-deadline'])
})

test('open-deadline filter excludes expired and invalid deadlines', () => {
  const result = filterAthleteOpportunities(opportunities, { status: 'todas', prazoAberto: true }, referenceDate)

  assert.deepEqual(result.map(item => item.id), ['tennis-scholarship'])
})