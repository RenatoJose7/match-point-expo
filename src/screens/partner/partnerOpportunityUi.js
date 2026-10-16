import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export const partnerColors = {
  ink: '#183126',
  muted: '#64756b',
  green: '#236b46',
  greenDark: '#164d34',
  lime: '#c4ff32',
  border: '#dce6dd',
  canvas: '#f5f8f4',
  white: '#ffffff',
  red: '#a33831',
  redLight: '#fff0ee',
  amber: '#8c5b11',
  amberLight: '#fff5dc',
  greenLight: '#eaf6ed',
}

export const partnerStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: partnerColors.canvas },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 28 },
  header: { minHeight: 86, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: partnerColors.white, borderWidth: 1, borderColor: partnerColors.border, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  eyebrow: { color: partnerColors.green, fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase' },
  pageTitle: { color: partnerColors.ink, fontSize: 21, lineHeight: 27, fontFamily: 'Poppins_600SemiBold' },
  subtitle: { color: partnerColors.muted, fontSize: 12, lineHeight: 18, fontFamily: 'Poppins_400Regular' },
  headerAction: { width: 44, height: 44, borderRadius: 14, backgroundColor: partnerColors.green, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: partnerColors.ink, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  body: { color: partnerColors.ink, fontSize: 13, lineHeight: 21, fontFamily: 'Poppins_400Regular' },
  card: { backgroundColor: partnerColors.white, borderRadius: 8, borderWidth: 1, borderColor: partnerColors.border, padding: 16 },
  feedback: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', borderRadius: 8, padding: 12, borderWidth: 1 },
  feedbackText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: 'Poppins_500Medium' },
  fieldGroup: { gap: 6 },
  fieldLabel: { color: partnerColors.ink, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  input: { minHeight: 48, borderWidth: 1, borderColor: partnerColors.border, borderRadius: 7, backgroundColor: partnerColors.white, paddingHorizontal: 12, color: partnerColors.ink, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  multilineInput: { minHeight: 104, paddingTop: 11, textAlignVertical: 'top' },
  primaryButton: { minHeight: 48, paddingHorizontal: 16, borderRadius: 7, backgroundColor: partnerColors.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonDisabled: { opacity: 0.55 },
  primaryButtonText: { color: partnerColors.white, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  secondaryButton: { minHeight: 44, paddingHorizontal: 14, borderRadius: 7, borderWidth: 1, borderColor: partnerColors.border, backgroundColor: partnerColors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryButtonText: { color: partnerColors.ink, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  divider: { height: 1, backgroundColor: partnerColors.border },
  stateWrap: { flex: 1, minHeight: 230, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  stateTitle: { textAlign: 'center', color: partnerColors.ink, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  stateBody: { textAlign: 'center', color: partnerColors.muted, fontSize: 12, lineHeight: 19, fontFamily: 'Poppins_400Regular' },
})

export function PartnerHeader({ title, subtitle, onBack, action }) {
  return (
    <View style={partnerStyles.header}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} style={partnerStyles.backButton}>
          <Ionicons name="arrow-back" size={20} color={partnerColors.ink} />
        </Pressable>
      ) : null}
      <View style={partnerStyles.headerCopy}>
        <Text style={partnerStyles.eyebrow}>MatchPoint · Parceiros</Text>
        <Text style={partnerStyles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={partnerStyles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ?? null}
    </View>
  )
}

export function FeedbackMessage({ tone = 'error', children }) {
  const palette = tone === 'success'
    ? { backgroundColor: partnerColors.greenLight, borderColor: '#c7e4cd', color: partnerColors.greenDark, icon: 'checkmark-circle' }
    : tone === 'warning'
      ? { backgroundColor: partnerColors.amberLight, borderColor: '#efdda9', color: partnerColors.amber, icon: 'alert-circle' }
      : { backgroundColor: partnerColors.redLight, borderColor: '#f1cfca', color: partnerColors.red, icon: 'alert-circle' }

  return (
    <View style={[partnerStyles.feedback, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }]}>
      <Ionicons name={palette.icon} size={17} color={palette.color} />
      <Text accessibilityRole="alert" style={[partnerStyles.feedbackText, { color: palette.color }]}>{children}</Text>
    </View>
  )
}

export function LoadingState({ label = 'Carregando...' }) {
  return (
    <View style={partnerStyles.stateWrap}>
      <ActivityIndicator size="large" color={partnerColors.green} />
      <Text style={partnerStyles.stateBody}>{label}</Text>
    </View>
  )
}

export function EmptyState({ icon = 'file-tray-outline', title, description, action }) {
  return (
    <View style={partnerStyles.stateWrap}>
      <Ionicons name={icon} size={36} color={partnerColors.green} />
      <Text style={partnerStyles.stateTitle}>{title}</Text>
      <Text style={partnerStyles.stateBody}>{description}</Text>
      {action ?? null}
    </View>
  )
}

export async function getPartnerProfile(repositories, session) {
  if (!session?.id || !['treinador', 'instituicao'].includes(session.tipo)) {
    throw new Error('Entre com uma conta de treinador ou instituição para gerenciar oportunidades.')
  }

  const result = await repositories.users.obterPerfilParceiroPorUsuario(session.id)
  if (!result.ok) throw new Error(result.mensagem || 'Não foi possível carregar o perfil do parceiro.')
  return result.data
}

export async function getOwnedOpportunity(repositories, partnerId, opportunityId) {
  const result = await repositories.opportunities.obterOportunidade(opportunityId)
  if (!result.ok) throw new Error(result.mensagem || 'Não foi possível carregar a oportunidade.')
  if (result.data.criadorId !== partnerId) {
    throw new Error('Esta oportunidade não pertence ao parceiro conectado.')
  }
  return result.data
}

export function formatOpportunityDate(value) {
  if (!value) return 'Não informado'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data inválida'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
}

export function opportunityStatus(status) {
  const values = {
    ativa: { label: 'Ativa', backgroundColor: partnerColors.greenLight, color: partnerColors.greenDark },
    rascunho: { label: 'Rascunho', backgroundColor: '#eef1ed', color: partnerColors.muted },
    encerrada: { label: 'Encerrada', backgroundColor: partnerColors.redLight, color: partnerColors.red },
    em_analise: { label: 'Em análise', backgroundColor: partnerColors.amberLight, color: partnerColors.amber },
  }
  return values[status] ?? { label: status || 'Sem status', backgroundColor: '#eef1ed', color: partnerColors.muted }
}

export function toIsoDate(value, endOfDay = false) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '')
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  if (endOfDay) date.setUTCHours(23, 59, 59, 999)
  return date.toISOString()
}

export function dateInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}