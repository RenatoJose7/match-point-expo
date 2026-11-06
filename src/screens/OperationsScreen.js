import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../components/navigation/BottomNav'
import { assets } from '../theme/assets'
import { BackButton } from '../components/ui/BackButton'
import { withGriffithsWeight } from '../theme/typography'

const BLUE = '#10579b'
const GREEN = '#c4ff32'
const BG = '#f5f8f7'

const SUPPORT_TYPES = [
  { value: 'bolsa_mensal', label: 'Bolsa mensal' },
  { value: 'bolsa_escolar', label: 'Bolsa escolar' },
  { value: 'apoio_viagem', label: 'Apoio à viagem' },
]

export function OperationsScreen({ back, go, repositories, session, routeParams = {} }) {
  const admin = session?.tipo === 'administrador'
  const institution = session?.tipo === 'instituicao'
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [athleteId, setAthleteId] = useState(routeParams.athleteId || '')
  const [opportunityId, setOpportunityId] = useState(routeParams.opportunityId || '')
  const [status, setStatus] = useState('')
  const [reports, setReports] = useState([])
  const [accounts, setAccounts] = useState([])
  const [resources, setResources] = useState([])
  const [supportType, setSupportType] = useState('bolsa_mensal')
  const [supportValue, setSupportValue] = useState('')
  const [athleteSearch, setAthleteSearch] = useState('')

  const load = async () => {
    if (admin) {
      const [reportResult, accountResult, resourceResult] = await Promise.all([
        repositories.administration.listarRelatos(),
        repositories.administration.listarContasParceiras(),
        repositories.administration.listarRecursos(),
      ])
      if (reportResult.ok) setReports(reportResult.data)
      if (accountResult.ok) setAccounts(accountResult.data)
      if (resourceResult.ok) setResources(resourceResult.data)
      return
    }
    const result = await repositories.reports.listarMeusRelatos()
    if (result.ok) setReports(result.data)
  }
  useEffect(() => { load() }, [session?.id])

  const sendReport = async () => {
    const result = await repositories.reports.enviarRelato({ mensagem: message })
    setStatus(result.ok ? 'Relato enviado para acompanhamento.' : result.mensagem)
    if (result.ok) { setMessage(''); load() }
  }

  const saveResource = async () => {
    const result = await repositories.administration.salvarRecurso({ titulo: title, tipo: 'orientacao' })
    setStatus(result.ok ? 'Recurso salvo.' : result.mensagem)
    if (result.ok) { setTitle(''); load() }
  }

  const audit = async () => {
    const result = await repositories.administration.auditarMatchScore(athleteId, opportunityId)
    setStatus(result.ok ? `Auditoria concluída: ${result.data.versao}.` : result.mensagem)
  }

  const decide = async (id, decisao) => {
    const result = await repositories.administration.decidirConta({ tipo: 'parceiro', id, decisao })
    setStatus(result.ok ? 'Decisão administrativa registrada.' : result.mensagem)
    if (result.ok) load()
  }

  const support = async () => {
    const partner = await repositories.users.obterPerfilParceiroPorUsuario(session.id)
    if (!partner.ok) return setStatus(partner.mensagem)
    const result = await repositories.support.registrarApoio({
      instituicaoId: partner.data.id,
      atletaId: routeParams.athleteId,
      oportunidadeId: routeParams.opportunityId,
      descricao: message,
      tipo: supportType,
      valor: supportValue,
    })
    setStatus(result.ok ? 'Apoio registrado.' : result.mensagem)
    if (result.ok) setMessage('')
  }

  const roleNav = session?.tipo === 'treinador' ? 'trainer' : session?.tipo === 'instituicao' ? 'institution' : 'athlete'
  const initials = (session?.nome || 'MP').slice(0, 2)

  // ── Admin / Relato (funcional, sem redesign) ──────────────────────
  if (admin || !institution) {
    return (
      <View style={localStyles.page}>
        <View style={localStyles.simpleHeader}>
          <BackButton onPress={back} />
          <Text style={localStyles.simpleTitle}>{admin ? 'Administração' : 'Enviar relato'}</Text>
        </View>
        <ScrollView contentContainerStyle={localStyles.simpleContent}>
          {status ? <Text style={localStyles.statusMsg}>{status}</Text> : null}
          {admin ? (
            <>
              <Text style={localStyles.label}>Novo recurso da plataforma</Text>
              <TextInput value={title} onChangeText={setTitle} style={localStyles.input} placeholder="Título do recurso" />
              <Pressable onPress={saveResource} style={localStyles.btn}><Text style={localStyles.btnText}>Salvar recurso</Text></Pressable>
              {resources.map((item) => <View key={item.id} style={localStyles.card}><Text>{item.titulo}</Text></View>)}
              <Text style={localStyles.label}>Auditar Match Score</Text>
              <TextInput value={athleteId} onChangeText={setAthleteId} style={localStyles.input} placeholder="ID do atleta" />
              <TextInput value={opportunityId} onChangeText={setOpportunityId} style={localStyles.input} placeholder="ID da oportunidade" />
              <Pressable onPress={audit} style={localStyles.btn}><Text style={localStyles.btnText}>Auditar cálculo</Text></Pressable>
              <Text style={localStyles.label}>Contas parceiras</Text>
              {accounts.map((item) => (
                <View key={item.id} style={localStyles.card}>
                  <Text>{item.nomeExibicao || item.id}</Text>
                  <Text style={localStyles.muted}>{item.statusAdministrativo || 'sem decisão'}</Text>
                  <View style={localStyles.actions}>
                    <Pressable onPress={() => decide(item.id, 'aprovada')}><Text style={localStyles.action}>Aprovar</Text></Pressable>
                    <Pressable onPress={() => decide(item.id, 'suspensa')}><Text style={localStyles.action}>Suspender</Text></Pressable>
                  </View>
                </View>
              ))}
              <Text style={localStyles.label}>Relatos abertos</Text>
              {reports.map((item) => <View key={item.id} style={localStyles.card}><Text>{item.mensagem}</Text><Text style={localStyles.muted}>{item.status}</Text></View>)}
            </>
          ) : (
            <>
              <Text style={localStyles.label}>Descreva o problema ou sugestão</Text>
              <TextInput value={message} onChangeText={setMessage} multiline style={[localStyles.input, localStyles.multilineInput]} placeholder="Escreva aqui" />
              <Pressable onPress={sendReport} style={localStyles.btn}><Text style={localStyles.btnText}>Enviar relato</Text></Pressable>
              {reports.map((item) => <View key={item.id} style={localStyles.card}><Text>{item.mensagem}</Text><Text style={localStyles.muted}>{item.status}</Text></View>)}
            </>
          )}
        </ScrollView>
        <BottomNav go={go} role={roleNav} />
      </View>
    )
  }

  // ── Instituição: Registrar apoio (design de referência) ───────────
  return (
    <View style={localStyles.page}>
      {/* Header azul com monograma */}
      <View style={localStyles.header}>
        <BackButton onPress={back} />
        <Image source={assets.monogram} style={localStyles.headerMark} />
        <View style={localStyles.headerAvatar}>
          <Text style={localStyles.headerAvatarText}>{initials}</Text>
        </View>
      </View>

      {/* Painel branco */}
      <View style={localStyles.panel}>
        <ScrollView contentContainerStyle={localStyles.panelContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={localStyles.panelTitle}>Registrar apoio</Text>

          {status ? (
            <View style={localStyles.statusBadge}>
              <Text style={localStyles.statusBadgeText}>{status}</Text>
            </View>
          ) : null}

          {/* Campo pesquisar atleta */}
          <Text style={localStyles.fieldLabel}>Pesquisar atleta</Text>
          <View style={localStyles.searchField}>
            <Ionicons name="search-outline" size={16} color="#aaa" style={{ marginRight: 6 }} />
            <TextInput
              value={athleteSearch}
              onChangeText={setAthleteSearch}
              placeholder="Pesquisar atleta"
              placeholderTextColor="#aaa"
              style={localStyles.searchInput}
            />
          </View>

          {/* Tipo de apoio */}
          <Text style={localStyles.fieldLabel}>Tipo de apoio</Text>
          <View style={localStyles.radioGroup}>
            {SUPPORT_TYPES.map((type) => {
              const selected = supportType === type.value
              return (
                <Pressable
                  key={type.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setSupportType(type.value)}
                  style={localStyles.radioRow}
                >
                  <View style={[localStyles.radioOuter, selected && localStyles.radioOuterSelected]}>
                    {selected && <View style={localStyles.radioInner} />}
                  </View>
                  <Text style={localStyles.radioLabel}>{type.label}</Text>
                </Pressable>
              )
            })}
          </View>

          {/* Descrição / observação */}
          <Text style={localStyles.fieldLabel}>Observação</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            placeholder="Descreva o apoio concedido ao atleta"
            placeholderTextColor="#aaa"
            style={localStyles.textArea}
          />

          {/* Valor */}
          <Text style={localStyles.fieldLabel}>Valor (se aplicável)</Text>
          <TextInput
            value={supportValue}
            onChangeText={setSupportValue}
            placeholder="R$ 0,00"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            style={localStyles.valueInput}
          />

          {/* Botão Registrar */}
          <Pressable onPress={support} style={localStyles.submitBtn} accessibilityRole="button">
            <Text style={localStyles.submitBtnText}>Registrar</Text>
          </Pressable>
        </ScrollView>
      </View>

      <BottomNav go={go} role={roleNav} active="profile" />
    </View>
  )
}

const localStyles = StyleSheet.create(withGriffithsWeight({
  page: { flex: 1, backgroundColor: BLUE },
  // Header azul
  header: { height: 170, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 16 },
  headerMark: { position: 'absolute', top: 22, width: 51, height: 56, alignSelf: 'center' },
  headerAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontFamily: 'Griffiths', color: '#fff', fontSize: 40, lineHeight: 50 },
  // Painel branco
  panel: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  panelContent: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 100, gap: 12 },
  panelTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginBottom: 8 },
  // Campos
  fieldLabel: { color: '#183126', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  searchField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d4d7da', borderRadius: 22, backgroundColor: '#f8f9fa', paddingHorizontal: 14, height: 44 },
  searchInput: { flex: 1, color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  // Radio
  radioGroup: { gap: 10, marginBottom: 4 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#aaa', alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: BLUE },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE },
  radioLabel: { color: '#333', fontFamily: 'Poppins_400Regular', fontSize: 13 },
  // Texto
  textArea: { borderWidth: 1, borderColor: '#d4d7da', borderRadius: 8, minHeight: 90, paddingHorizontal: 12, paddingTop: 10, color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13, textAlignVertical: 'top' },
  valueInput: { borderWidth: 1, borderColor: '#d4d7da', borderRadius: 8, height: 48, paddingHorizontal: 14, color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  // Botão
  submitBtn: { marginTop: 8, height: 50, borderRadius: 25, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  // Status
  statusBadge: { backgroundColor: '#eaf6ed', borderRadius: 8, padding: 12 },
  statusBadgeText: { color: '#164d34', fontFamily: 'Poppins_500Medium', fontSize: 13 },
  // Admin / simples
  simpleHeader: { paddingTop: 54, paddingHorizontal: 22, paddingBottom: 16, backgroundColor: '#0d4730', gap: 10 },
  simpleTitle: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  simpleContent: { padding: 20, gap: 12 },
  label: { color: '#183126', fontFamily: 'Poppins_600SemiBold' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#cddbd0', borderRadius: 8, padding: 12, backgroundColor: '#fff', color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  multilineInput: { minHeight: 130, textAlignVertical: 'top' },
  btn: { backgroundColor: '#236b46', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  statusMsg: { color: '#164d34', backgroundColor: '#eaf6ed', padding: 12, borderRadius: 8, fontFamily: 'Poppins_500Medium' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, gap: 4, borderWidth: 1, borderColor: '#dce6dd' },
  muted: { color: '#64756b', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  actions: { flexDirection: 'row', gap: 16 },
  action: { color: '#164d34', fontFamily: 'Poppins_600SemiBold' },
}))
