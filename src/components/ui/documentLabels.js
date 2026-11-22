// Nomes legíveis para os códigos de documento salvos nas oportunidades.
const DOCUMENT_LABELS = Object.freeze({
  curriculo_esportivo: 'Currículo esportivo',
  historico_escolar: 'Histórico escolar',
  video_apresentacao: 'Vídeo de apresentação',
  comprovante_residencia: 'Comprovante de residência',
  documento_identidade: 'Documento de identidade',
  atestado_medico: 'Atestado médico',
  autorizacao_responsavel: 'Autorização do responsável',
})

export function documentLabel(document) {
  const value = String(document ?? '').trim()
  if (!value) return 'Documento'
  if (DOCUMENT_LABELS[value]) return DOCUMENT_LABELS[value]
  // Códigos desconhecidos no formato "algum_codigo" viram "Algum codigo".
  if (/^[a-z0-9_]+$/.test(value)) {
    const words = value.replaceAll('_', ' ')
    return words.charAt(0).toUpperCase() + words.slice(1)
  }
  return value
}
