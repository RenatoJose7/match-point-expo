import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image, Platform, StatusBar as NativeStatusBar } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../components/navigation/BottomNav'
import { BackButton } from '../components/ui/BackButton'
import { assets } from '../theme/assets'
import { withGriffithsWeight } from '../theme/typography'

const BLUE = '#10579b'
const GREEN = '#c4ff32'

const SUPPORT_TYPES = [
  { value: 'bolsa_integral', label: 'Bolsa Integral' },
  { value: 'bolsa_parcial', label: 'Bolsa Parcial' },
  { value: 'apoio_financeiro', label: 'Apoio Financeiro' },
]

export function OperationsScreen({ back, go, repositories, session, routeParams = {} }) {
  const admin = session?.tipo === 'administrador'
  const institution = session?.tipo === 'instituicao'
  const trainer = session?.tipo === 'treinador'
  const partner = institution || trainer
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [athleteId, setAthleteId] = useState(routeParams.athleteId || '')
  const [opportunityId, setOpportunityId] = useState(routeParams.opportunityId || '')
  const [status, setStatus] = useState('')
  const [reports, setReports] = useState([])
  const [accounts, setAccounts] = useState([])
  const [resources, setResources] = useState([])
  const [supportType, setSupportType] = useState('bolsa_integral')
  const [supportValue, setSupportValue] = useState('')
  const [savingSupport, setSavingSupport] = useState(false)

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
    if (savingSupport) return
    if (!routeParams.athleteId) return setStatus('Não foi possível identificar o atleta selecionado.')
    setSavingSupport(true)
    setStatus('')
    try {
      const partnerResult = await repositories.users.obterPerfilParceiroPorUsuario(session.id)
      if (!partnerResult.ok) throw new Error(partnerResult.mensagem)
      const selectedType = SUPPORT_TYPES.find((item) => item.value === supportType)
      const description = supportValue.trim()
        ? `${selectedType?.label || 'Apoio'} no valor de ${supportValue.trim()}`
        : selectedType?.label || 'Apoio esportivo'
      const result = await repositories.support.registrarApoio({
        parceiroId: partnerResult.data.id,
        atletaId: routeParams.athleteId,
        oportunidadeId: routeParams.opportunityId,
        descricao: description,
        tipo: supportType,
        valor: supportValue.trim(),
      })
      if (!result.ok) throw new Error(result.mensagem)
      setStatus('Apoio registrado para o atleta selecionado.')
      setSupportValue('')
    } catch (supportError) {
      setStatus(supportError.message || 'Não foi possível registrar o apoio.')
    } finally {
      setSavingSupport(false)
    }
  }

  const roleNav = session?.tipo === 'treinador' ? 'trainer' : session?.tipo === 'instituicao' ? 'institution' : 'athlete'
  // ── Admin / Relato (funcional, sem redesign) ──────────────────────
  if (admin || !partner) {
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
        <View style={localStyles.headerStripe} />
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={back} style={localStyles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Image source={assets.monogram} style={localStyles.headerMark} resizeMode="contain" />
      </View>

      {/* Painel branco */}
      <View style={localStyles.panel}>
        <ScrollView contentContainerStyle={localStyles.panelContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={localStyles.panelTitle}>Registrar apoio</Text>
          <View style={localStyles.titleRule} />

          {status ? (
            <View style={localStyles.statusBadge}>
              <Text style={localStyles.statusBadgeText}>{status}</Text>
            </View>
          ) : null}

          <Text style={localStyles.fieldLabel}>Atleta selecionado</Text>
          <View style={localStyles.searchField}>
            <Text numberOfLines={1} style={localStyles.selectedAthlete}>
              {String(routeParams.candidateName || 'Atleta selecionado')}
            </Text>
          </View>

          {/* Tipo de apoio */}
          <Text style={localStyles.fieldLabel}>Tipo de apoio</Text>
          <View style={localStyles.radioGroup}>
            {SUPPORT_TYPES.map((type, index) => {
              const selected = supportType === type.value
              return (
                <Pressable
                  key={type.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setSupportType(type.value)}
                  style={[localStyles.radioRow, index === 2 && localStyles.radioRowWide]}
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
        </ScrollView>
        <Pressable
          onPress={support}
          disabled={savingSupport}
          style={({ pressed }) => [localStyles.submitBtn, pressed && localStyles.submitBtnPressed, savingSupport && localStyles.submitBtnDisabled]}
          accessibilityRole="button"
        >
          <Text style={localStyles.submitBtnText}>{savingSupport ? 'Registrando...' : 'Registrar'}</Text>
        </Pressable>
      </View>

      <BottomNav go={go} role={roleNav} active="home" />
    </View>
  )
}

const localStyles = StyleSheet.create(withGriffithsWeight({
  page: { flex: 1, backgroundColor: BLUE },
  header: { height: 272, backgroundColor: BLUE, overflow: 'hidden' },
  headerStripe: { position: 'absolute', left: -173, bottom: 28, width: 390, height: 72, backgroundColor: '#e7e8e9', transform: [{ rotate: '54deg' }] },
  backButton: { position: 'absolute', zIndex: 20, top: Platform.OS === 'web' ? 35 : (NativeStatusBar.currentHeight || 24) + 14, left: 25, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerMark: { position: 'absolute', top: 87, width: 126, height: 126, alignSelf: 'center' },
  panel: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 8, borderTopRightRadius: 8, overflow: 'hidden' },
  panelContent: { paddingHorizontal: 10, paddingTop: 24, paddingBottom: 148, gap: 13 },
  panelTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 22 },
  titleRule: { height: 4, borderRadius: 2, backgroundColor: GREEN, marginTop: -9, marginBottom: 25 },
  fieldLabel: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 20 },
  searchField: { borderWidth: 1, borderColor: '#cfd3d7', borderRadius: 4, backgroundColor: '#fff', paddingHorizontal: 10, height: 42, justifyContent: 'center' },
  selectedAthlete: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, marginBottom: 18 },
  radioRow: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioRowWide: { width: '100%' },
  radioOuter: { width: 17, height: 17, borderRadius: 9, borderWidth: 1, borderColor: '#69717a', alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: '#69717a' },
  radioInner: { width: 13, height: 13, borderRadius: 7, backgroundColor: GREEN },
  radioLabel: { color: '#6d747d', fontFamily: 'Poppins_400Regular', fontSize: 13 },
  valueInput: { borderWidth: 1, borderColor: '#cfd3d7', borderRadius: 4, height: 42, paddingHorizontal: 10, color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  submitBtn: { position: 'absolute', left: 4, right: 4, bottom: 78, height: 42, borderRadius: 22, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#164d34', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
  submitBtnPressed: { transform: [{ scale: 0.98 }] },
  submitBtnDisabled: { opacity: 0.65 },
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
