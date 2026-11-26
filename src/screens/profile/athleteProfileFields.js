import { SELECT_OPTIONS } from '../../components/ui/SelectField'
import { toList } from '../../components/ui/ChoiceChips'
import { toCount } from '../../components/ui/NumberStepper'

// Campos do perfil esportivo do atleta, em blocos. Nada é texto livre sem limite:
// listas fixas (select), múltipla escolha (chips), números (contador) e textos curtos com limite.
export const ATHLETE_SECTIONS = [
  {
    title: 'Esporte',
    fields: [
      { key: 'modalidade', label: 'Modalidade', type: 'select', options: SELECT_OPTIONS.modalidades, required: true },
      { key: 'categoria', label: 'Categoria', type: 'select', options: SELECT_OPTIONS.categorias },
      { key: 'posicao', label: 'Joga em', type: 'select', options: SELECT_OPTIONS.posicoes },
      { key: 'maoDominante', label: 'Mão dominante', type: 'select', options: SELECT_OPTIONS.maoDominante },
      { key: 'tempoDePratica', label: 'Tempo de prática', type: 'select', options: SELECT_OPTIONS.tempoDePratica },
      { key: 'localizacao', label: 'Cidade onde treina', type: 'select', options: SELECT_OPTIONS.locais, allowCustom: true },
      { key: 'equipeAtual', label: 'Equipe ou clube atual (opcional)', type: 'text', maxLength: 60 },
    ],
  },
  {
    title: 'Desempenho',
    fields: [
      { key: 'nivelCompetitivo', label: 'Nível competitivo', type: 'select', options: SELECT_OPTIONS.niveisCompetitivos },
      { key: 'torneiosDisputados', label: 'Torneios disputados', type: 'number' },
      { key: 'vitorias', label: 'Vitórias', type: 'number' },
      { key: 'derrotas', label: 'Derrotas', type: 'number' },
      { key: 'titulos', label: 'Títulos conquistados', type: 'number' },
    ],
  },
  {
    title: 'Sobre você',
    fields: [
      { key: 'biografia', label: 'Apresentação curta', type: 'text', multiline: true, maxLength: 280, placeholder: 'Conte em poucas linhas quem você é no esporte.' },
    ],
  },
  {
    title: 'Objetivos e disponibilidade',
    fields: [
      { key: 'objetivos', label: 'Objetivos', type: 'chips', options: SELECT_OPTIONS.objetivos },
      { key: 'necessidades', label: 'Do que você precisa', type: 'chips', options: SELECT_OPTIONS.necessidades },
      { key: 'disponibilidade', label: 'Dias e períodos disponíveis', type: 'select', options: SELECT_OPTIONS.disponibilidade },
      { key: 'possibilidadeViagem', label: 'Possibilidade de viagem', type: 'select', options: SELECT_OPTIONS.viagens },
      { key: 'distanciaMaxima', label: 'Distância máxima', type: 'select', options: SELECT_OPTIONS.distancias },
    ],
  },
]

export const ATHLETE_FIELDS = ATHLETE_SECTIONS.flatMap((section) => section.fields)

// Valores do formulário a partir do perfil salvo (dados antigos em texto também funcionam).
export function athleteFormValues(profile = {}) {
  return Object.fromEntries(ATHLETE_FIELDS.map((field) => {
    const raw = field.key === 'nivelCompetitivo' ? (profile?.nivelCompetitivo ?? '') : profile?.[field.key]
    if (field.type === 'number') return [field.key, raw === undefined || raw === null || raw === '' ? 0 : toCount(raw)]
    if (field.type === 'chips') return [field.key, toList(raw)]
    return [field.key, String(raw ?? '')]
  }))
}

// Dados para salvar: números como número, múltipla escolha como lista, texto aparado e no limite.
export function athleteSaveData(values) {
  const data = Object.fromEntries(ATHLETE_FIELDS.map((field) => {
    const value = values[field.key]
    if (field.type === 'number') return [field.key, toCount(value)]
    if (field.type === 'chips') return [field.key, toList(value)]
    const text = String(value ?? '').trim()
    return [field.key, field.maxLength ? text.slice(0, field.maxLength) : text]
  }))
  // O nível também vai para "ranking": é o campo que o perfil público do candidato já mostra.
  data.ranking = data.nivelCompetitivo
  return data
}

// Itens que contam para "perfil completo": o que o atleta precisa informar para ser bem avaliado.
const COMPLETION_KEYS = [
  'modalidade', 'categoria', 'posicao', 'maoDominante', 'tempoDePratica', 'localizacao',
  'nivelCompetitivo', 'biografia', 'objetivos', 'necessidades', 'disponibilidade', 'dataNascimento',
]

export function athleteCompletion(profile) {
  if (!profile) return null
  const filled = COMPLETION_KEYS.filter((key) => {
    const value = key === 'nivelCompetitivo' ? (profile.nivelCompetitivo || profile.ranking) : profile[key]
    return Array.isArray(value) ? value.length > 0 : Boolean(String(value ?? '').trim())
  }).length
  return Math.round((filled / COMPLETION_KEYS.length) * 100)
}

// Texto para exibir: listas viram "a, b"; números aparecem como número.
export function displayText(value, emptyText = 'Não informado') {
  if (Array.isArray(value)) return value.length ? value.join(', ') : emptyText
  if (value === null || value === undefined || String(value).trim() === '') return emptyText
  return String(value)
}
