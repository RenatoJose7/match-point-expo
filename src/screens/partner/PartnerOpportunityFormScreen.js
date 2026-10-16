import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import {
  dateInputValue,
  FeedbackMessage,
  getOwnedOpportunity,
  getPartnerProfile,
  LoadingState,
  partnerColors,
  PartnerHeader,
  partnerStyles,
  toIsoDate,
} from './partnerOpportunityUi'

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

function FormField({ label, value, onChangeText, placeholder, multiline = false, required = false }) {
  return (
    <View style={styles.field}>
      <Text style={partnerStyles.fieldLabel}>{label}{required ? ' *' : ''}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#849188"
        style={[partnerStyles.input, multiline && partnerStyles.multilineInput]}
        multiline={multiline}
        autoCapitalize="sentences"
        textAlignVertical={multiline ? 'top' : 'center'}
      />
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
      status: original?.status === 'encerrada' ? 'encerrada' : form.status,
      ...(original?.criteriosElegibilidade ? { criteriosElegibilidade: original.criteriosElegibilidade } : {}),
    }

    setSaving(true)
    try {
      const result = editing
        ? await repositories.opportunities.atualizarOportunidade(opportunityId, payload)
        : await repositories.opportunities.criarOportunidade({ ...payload, criadorId: partner.id })
      if (!result.ok) throw new Error(result.mensagem || 'Não foi possível salvar a oportunidade.')

      if (editing) {
        go('partnerOpportunityDetail', { opportunityId, flashMessage: 'Alterações salvas com sucesso.' })
      } else {
        go(listRoute, { flashMessage: 'Oportunidade criada com sucesso.' })
      }
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar a oportunidade.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={partnerStyles.page}>
      <PartnerHeader
        title={editing ? 'Editar oportunidade' : 'Nova oportunidade'}
        subtitle={editing ? 'Atualize os dados da publicação' : 'Publique uma oportunidade para atletas'}
        onBack={back}
      />
      {loading ? (
        <LoadingState label="Carregando formulário..." />
      ) : error && !partner ? (
        <View style={styles.loadError}>
          <FeedbackMessage>{error}</FeedbackMessage>
          <Pressable accessibilityRole="button" onPress={() => setRefreshKey((value) => value + 1)} style={partnerStyles.primaryButton}>
            <Ionicons name="refresh" size={16} color={partnerColors.white} />
            <Text style={partnerStyles.primaryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : partner ? (
        <KeyboardAvoidingView style={partnerStyles.scroll} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {error ? <FeedbackMessage>{error}</FeedbackMessage> : null}

            <View style={styles.sectionHead}>
              <Text style={partnerStyles.sectionTitle}>Informações principais</Text>
              <Text style={styles.requiredHint}>* Obrigatório</Text>
            </View>
            <FormField label="Título" value={form.titulo} onChangeText={(value) => change('titulo', value)} placeholder="Ex.: Bolsa para atletas de tênis" required />
            <FormField label="Descrição" value={form.descricao} onChangeText={(value) => change('descricao', value)} placeholder="Descreva a oportunidade, o processo e o que será oferecido" multiline required />
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <FormField label="Modalidade" value={form.modalidade} onChangeText={(value) => change('modalidade', value)} placeholder="Tênis" required />
              </View>
              <View style={styles.column}>
                <FormField label="Categoria" value={form.categoria} onChangeText={(value) => change('categoria', value)} placeholder="Sub-18" required />
              </View>
            </View>
            <FormField label="Localização" value={form.localizacao} onChangeText={(value) => change('localizacao', value)} placeholder="Cidade - UF" required />
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <FormField label="Instituição" value={form.instituicao} onChangeText={(value) => change('instituicao', value)} placeholder="Nome da instituição" />
              </View>
              <View style={styles.column}>
                <FormField label="Benefício" value={form.beneficio} onChangeText={(value) => change('beneficio', value)} placeholder="Bolsa integral" />
              </View>
            </View>

            <View style={styles.sectionHead}>
              <Text style={partnerStyles.sectionTitle}>Inscrições</Text>
            </View>
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <FormField label="Início (opcional)" value={form.inicioInscricoes} onChangeText={(value) => change('inicioInscricoes', value)} placeholder="AAAA-MM-DD" />
              </View>
              <View style={styles.column}>
                <FormField label="Prazo final" value={form.fimInscricoes} onChangeText={(value) => change('fimInscricoes', value)} placeholder="AAAA-MM-DD" required />
              </View>
            </View>

            <View style={styles.sectionHead}>
              <Text style={partnerStyles.sectionTitle}>Requisitos e documentos</Text>
            </View>
            <FormField label="Requisitos" value={form.requisitos} onChangeText={(value) => change('requisitos', value)} placeholder={'Um requisito por linha\nEx.: Perfil esportivo completo'} multiline />
            <FormField label="Documentos necessários" value={form.documentosNecessarios} onChangeText={(value) => change('documentosNecessarios', value)} placeholder={'Um documento por linha\nEx.: Currículo esportivo'} multiline />

            {original?.status === 'encerrada' ? (
              <FeedbackMessage tone="warning">Esta oportunidade está encerrada. O status será mantido ao editar.</FeedbackMessage>
            ) : (
              <View style={styles.statusSection}>
                <Text style={partnerStyles.fieldLabel}>Status de publicação</Text>
                <View style={styles.statusOptions}>
                  {[
                    { value: 'ativa', label: 'Publicar ativa', icon: 'radio-button-on-outline' },
                    { value: 'rascunho', label: 'Salvar rascunho', icon: 'document-outline' },
                    { value: 'em_analise', label: 'Em análise', icon: 'eye-outline' },
                  ].map((option) => {
                    const selected = form.status === option.value
                    return (
                      <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => change('status', option.value)} style={[styles.statusOption, selected && styles.statusOptionSelected]}>
                        <Ionicons name={selected ? 'radio-button-on' : option.icon} size={17} color={selected ? partnerColors.green : partnerColors.muted} />
                        <Text style={[styles.statusOptionText, selected && styles.statusOptionTextSelected]}>{option.label}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )}

            <Pressable accessibilityRole="button" onPress={saveOpportunity} disabled={saving} style={[partnerStyles.primaryButton, styles.submitButton, saving && partnerStyles.primaryButtonDisabled]}>
              {saving ? <Ionicons name="sync" size={17} color={partnerColors.white} /> : <Ionicons name="checkmark" size={18} color={partnerColors.white} />}
              <Text style={partnerStyles.primaryButtonText}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar oportunidade'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={back} disabled={saving} style={styles.cancelButton}>
              <Text style={partnerStyles.secondaryButtonText}>Cancelar</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
      <BottomNav go={go} role={role} active="opportunities" />
    </View>
  )
}

const styles = StyleSheet.create({
  loadError: { flex: 1, justifyContent: 'center', padding: 20, gap: 14 },
  formContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 13 },
  sectionHead: { marginTop: 4, paddingBottom: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  requiredHint: { color: partnerColors.muted, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  field: { gap: 6 },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1, minWidth: 0 },
  statusSection: { gap: 9 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusOption: { minHeight: 42, flex: 1, minWidth: 130, paddingHorizontal: 10, borderWidth: 1, borderColor: partnerColors.border, borderRadius: 7, backgroundColor: partnerColors.white, flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusOptionSelected: { borderColor: partnerColors.green, backgroundColor: '#f0f8f0' },
  statusOptionText: { color: partnerColors.muted, fontSize: 10, fontFamily: 'Poppins_500Medium' },
  statusOptionTextSelected: { color: partnerColors.greenDark },
  submitButton: { marginTop: 7 },
  cancelButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
})