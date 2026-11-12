import React, { useEffect, useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { assets } from '../../theme/assets'
import { BackButton } from '../../components/ui/BackButton'
import { SelectField, SELECT_OPTIONS } from '../../components/ui/SelectField'
import {
  FeedbackMessage,
  getOwnedOpportunity,
  getPartnerProfile,
  LoadingState,
  partnerColors,
  partnerStyles,
  dateInputValue,
  toIsoDate,
} from './partnerOpportunityUi'

const BLUE = '#10579b'
const GREEN = '#c4ff32'

const emptyForm = {
  titulo: '',
  descricao: '',
  modalidade: '',
  categoria: '',
  localizacao: '',
  instituicao: '',
  beneficio: '',
  inicioInscricoes: '',
  fimInscricoes: '',
  requisitos: '',
  documentosNecessarios: '',
  status: 'ativa',
}

function formFromOpportunity(opportunity) {
  return {
    titulo: opportunity.titulo ?? '',
    descricao: opportunity.descricao ?? '',
    modalidade: opportunity.modalidade ?? '',
    categoria: opportunity.categoria ?? '',
    localizacao: opportunity.localizacao ?? '',
    instituicao: opportunity.instituicao ?? '',
    beneficio: opportunity.beneficio ?? '',
    inicioInscricoes: dateInputValue(opportunity.inicioInscricoes),
    fimInscricoes: dateInputValue(opportunity.fimInscricoes),
    requisitos: (opportunity.requisitos ?? []).join('\n'),
    documentosNecessarios: (opportunity.documentosNecessarios ?? []).join('\n'),
    status: opportunity.status ?? 'ativa',
  }
}

function splitLines(value) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean)
}

function FormField({ label, value, onChangeText, placeholder, multiline = false, options, required = false }) {
  return (
    <View style={localStyles.field}>
      <Text style={localStyles.fieldLabel}>{label}{required ? ' *' : ''}</Text>
      {options ? (
        <SelectField accessibilityLabel={label} options={options} value={value} onChange={onChangeText} placeholder={placeholder} />
      ) : (
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#849188"
          style={[localStyles.input, multiline && localStyles.multilineInput]}
          multiline={multiline}
          autoCapitalize="sentences"
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      )}
    </View>
  )
}

export function PartnerOpportunityFormScreen({ go, back, repositories, session, routeParams = {} }) {
  const role = session?.tipo === 'treinador' ? 'trainer' : 'institution'
  const listRoute = role === 'trainer' ? 'opportunitiesTrainer' : 'opportunitiesInstitution'
  const opportunityId = routeParams.opportunityId
  const editing = Boolean(opportunityId)
  const [partner, setPartner] = useState(null)
  const [original, setOriginal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setPartner(null)
    setForm(emptyForm)
    setOriginal(null)
    Promise.resolve()
      .then(async () => {
        const partnerProfile = await getPartnerProfile(repositories, session)
        let opportunity = null
        if (opportunityId) opportunity = await getOwnedOpportunity(repositories, partnerProfile.id, opportunityId)
        if (active) {
          setPartner(partnerProfile)
          setOriginal(opportunity)
          if (opportunity) setForm(formFromOpportunity(opportunity))
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Não foi possível carregar os dados do formulário.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [repositories, session, opportunityId, refreshKey])

  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const saveOpportunity = async () => {
    if (saving || !partner) return
    if (editing && !original) {
      setError('Não foi possível confirmar que esta oportunidade pertence à sua conta.')
      return
    }
    setError('')

    const title = form.titulo.trim()
    const description = form.descricao.trim()
    const modality = form.modalidade.trim()
    const endDate = toIsoDate(form.fimInscricoes, true)
    const startDate = form.inicioInscricoes.trim() ? toIsoDate(form.inicioInscricoes) : null

    if (!title || !description || !modality || !form.categoria.trim() || !form.localizacao.trim()) {
      setError('Preencha título, descrição, modalidade, categoria e localização.')
      return
    }
    if (!endDate) {
      setError('Informe um prazo final válido no formato AAAA-MM-DD.')
      return
    }
    if (form.inicioInscricoes.trim() && !startDate) {
      setError('Informe uma data inicial válida no formato AAAA-MM-DD.')
      return
    }
    if (startDate && new Date(startDate) > new Date(endDate)) {
      setError('A data inicial das inscrições deve ser anterior ao prazo final.')
      return
    }

    const publicationStatus = original?.status === 'encerrada'
      ? 'encerrada'
      : partner.verificado ? form.status : 'rascunho'
    const payload = {
      titulo: title,
      descricao: description,
      modalidade: modality,
      categoria: form.categoria.trim(),
      localizacao: form.localizacao.trim(),
      instituicao: form.instituicao.trim() || undefined,
      beneficio: form.beneficio.trim() || undefined,
      inicioInscricoes: startDate || undefined,
      fimInscricoes: endDate,
      requisitos: splitLines(form.requisitos),
      documentosNecessarios: splitLines(form.documentosNecessarios),
      status: publicationStatus,
      ...(original?.criteriosElegibilidade ? { criteriosElegibilidade: original.criteriosElegibilidade } : {}),
    }

    setSaving(true)
    try {
      const result = editing
        ? await repositories.opportunities.atualizarOportunidade(opportunityId, payload)
        : await repositories.opportunities.criarOportunidade({ ...payload, criadorId: partner.id })
      if (!result.ok) throw new Error(result.mensagem || 'Não foi possível salvar a oportunidade.')

      const successMessage = partner.verificado
        ? 'Alterações salvas com sucesso.'
        : 'Seu perfil aguarda verificação. A oportunidade foi salva como rascunho.'
      if (editing) {
        go('partnerOpportunityDetail', { opportunityId, flashMessage: successMessage })
      } else {
        go(listRoute, { flashMessage: partner.verificado ? 'Oportunidade criada com sucesso.' : successMessage })
      }
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar a oportunidade.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={localStyles.page}>
      {/* Header azul com faixa curva e monograma */}
      <View style={localStyles.header}>
        <View style={localStyles.headerStripe} />
        <BackButton onPress={back} />
        <Image source={assets.monogram} style={localStyles.headerMark} resizeMode="contain" />
      </View>

      {/* Painel branco com formulário */}
      <View style={localStyles.panel}>
        <View style={localStyles.headerTextBlock}>
          <Text style={localStyles.headerTitle}>
            {editing ? 'Editar oportunidade' : 'Criar oportunidade'}
          </Text>
          <Text style={localStyles.headerSubtitle}>Informações</Text>
        </View>
        {loading ? (
          <LoadingState label="Carregando formulário..." />
        ) : error && !partner ? (
          <View style={localStyles.loadError}>
            <FeedbackMessage>{error}</FeedbackMessage>
            <Pressable accessibilityRole="button" onPress={() => setRefreshKey((value) => value + 1)} style={localStyles.submitBtn}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={localStyles.submitBtnText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : partner ? (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={localStyles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {error ? <FeedbackMessage>{error}</FeedbackMessage> : null}
              {!partner.verificado ? <FeedbackMessage tone="warning">Seu perfil está aguardando verificação. Você pode salvar esta oportunidade como rascunho, mas só poderá publicá-la após a aprovação.</FeedbackMessage> : null}

              <View style={localStyles.sectionHead}>
                <Text style={localStyles.sectionTitle}>Informações principais</Text>
                <Text style={localStyles.requiredHint}>* Obrigatório</Text>
              </View>
              <FormField label="Título da oportunidade" value={form.titulo} onChangeText={(value) => change('titulo', value)} placeholder="Ex.: Bolsa para atletas de tênis" required />
              <FormField label="Modalidade" value={form.modalidade} onChangeText={(value) => change('modalidade', value)} options={SELECT_OPTIONS.modalidades} placeholder="Selecione a modalidade" required />
              <FormField label="Categoria" value={form.categoria} onChangeText={(value) => change('categoria', value)} options={SELECT_OPTIONS.categorias} placeholder="Selecione a categoria" required />
              <FormField label="Localização" value={form.localizacao} onChangeText={(value) => change('localizacao', value)} options={SELECT_OPTIONS.locais} placeholder="Selecione a cidade" required />
              <FormField label="Descrição" value={form.descricao} onChangeText={(value) => change('descricao', value)} placeholder="Descreva a oportunidade, o processo e o que será oferecido" multiline required />

              <View style={localStyles.twoColumns}>
                <View style={localStyles.column}>
                  <FormField label="Instituição" value={form.instituicao} onChangeText={(value) => change('instituicao', value)} placeholder="Nome da instituição" />
                </View>
                <View style={localStyles.column}>
                  <FormField label="Benefício" value={form.beneficio} onChangeText={(value) => change('beneficio', value)} options={SELECT_OPTIONS.beneficios} placeholder="Selecione o benefício" />
                </View>
              </View>

              <View style={localStyles.sectionHead}>
                <Text style={localStyles.sectionTitle}>Inscrições</Text>
              </View>
              <View style={localStyles.twoColumns}>
                <View style={localStyles.column}>
                  <FormField label="Início (opcional)" value={form.inicioInscricoes} onChangeText={(value) => change('inicioInscricoes', value)} placeholder="AAAA-MM-DD" />
                </View>
                <View style={localStyles.column}>
                  <FormField label="Prazo final" value={form.fimInscricoes} onChangeText={(value) => change('fimInscricoes', value)} placeholder="AAAA-MM-DD" required />
                </View>
              </View>

              <View style={localStyles.sectionHead}>
                <Text style={localStyles.sectionTitle}>Requisitos e documentos</Text>
              </View>
              <FormField label="Requisitos" value={form.requisitos} onChangeText={(value) => change('requisitos', value)} placeholder={'Um requisito por linha\nEx.: Perfil esportivo completo'} multiline />
              <FormField label="Documentos necessários" value={form.documentosNecessarios} onChangeText={(value) => change('documentosNecessarios', value)} placeholder={'Um documento por linha\nEx.: Currículo esportivo'} multiline />

              {original?.status === 'encerrada' ? (
                <FeedbackMessage tone="warning">Esta oportunidade está encerrada. O status será mantido ao editar.</FeedbackMessage>
              ) : (
                <View style={localStyles.statusSection}>
                  <Text style={localStyles.fieldLabel}>Status de publicação</Text>
                  <View style={localStyles.statusOptions}>
                    {[
                      { value: 'ativa', label: 'Publicar ativa', icon: 'radio-button-on-outline' },
                      { value: 'rascunho', label: 'Salvar rascunho', icon: 'document-outline' },
                      { value: 'em_analise', label: 'Em análise', icon: 'eye-outline' },
                    ].map((option) => {
                      const selected = form.status === option.value
                      return (
                        <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => change('status', option.value)} style={[localStyles.statusOption, selected && localStyles.statusOptionSelected]}>
                          <Ionicons name={selected ? 'radio-button-on' : option.icon} size={17} color={selected ? BLUE : '#64756b'} />
                          <Text style={[localStyles.statusOptionText, selected && localStyles.statusOptionTextSelected]}>{option.label}</Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              )}

              <Pressable accessibilityRole="button" onPress={saveOpportunity} disabled={saving} style={[localStyles.submitBtn, saving && localStyles.submitBtnDisabled]}>
                {saving ? <Ionicons name="sync" size={17} color="#fff" /> : null}
                <Text style={localStyles.submitBtnText}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar Oportunidade'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={back} disabled={saving} style={localStyles.cancelButton}>
                <Text style={localStyles.cancelText}>Cancelar</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        ) : null}
      </View>

      <BottomNav go={go} role={role} active="opportunities" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: BLUE },
  // Header
  header: { height: 273, backgroundColor: BLUE, overflow: 'hidden' },
  headerStripe: { position: 'absolute', left: -126, bottom: -15, width: 348, height: 70, backgroundColor: '#e4e7e8', transform: [{ rotate: '55deg' }] },
  headerMark: { width: 57, height: 63, alignSelf: 'center', marginTop: 87 },
  headerTextBlock: { paddingHorizontal: 21, paddingTop: 27, paddingBottom: 16 },
  headerTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 25 },
  headerSubtitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 18, marginTop: 2 },
  // Painel branco
  panel: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  loadError: { flex: 1, justifyContent: 'center', padding: 20, gap: 14 },
  // Formulário
  formContent: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 100, gap: 13 },
  sectionHead: { marginTop: 4, paddingBottom: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: BLUE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  requiredHint: { color: '#64756b', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  field: { gap: 6 },
  fieldLabel: { color: '#183126', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#d4d7da', borderRadius: 7, backgroundColor: '#fff', paddingHorizontal: 12, color: BLUE, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  multilineInput: { minHeight: 104, paddingTop: 11, textAlignVertical: 'top' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1, minWidth: 0 },
  statusSection: { gap: 9 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusOption: { minHeight: 42, flex: 1, minWidth: 130, paddingHorizontal: 10, borderWidth: 1, borderColor: '#dce6dd', borderRadius: 7, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusOptionSelected: { borderColor: BLUE, backgroundColor: '#eaf2fb' },
  statusOptionText: { color: '#64756b', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  statusOptionTextSelected: { color: BLUE },
  // Botão principal verde-limão
  submitBtn: { marginTop: 7, minHeight: 50, borderRadius: 25, backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnDisabled: { opacity: 0.55 },
  submitBtnText: { color: BLUE, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  cancelButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#64756b', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
})
