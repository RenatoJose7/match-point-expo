import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../components/navigation/BottomNav'
import { assets } from '../theme/assets'
import { getOpportunityImage } from '../theme/opportunityImages'

const BLUE = '#10579b'
const LIME = '#c4ff32'

export function OpportunityDetailScreen({ go, back, repositories, routeParams = {} }) {
  const opportunityId = routeParams.opportunityId
  const [opportunity, setOpportunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        if (!opportunityId) throw new Error('Escolha uma oportunidade antes de consultar os detalhes.')
        let result = await repositories.opportunities.obterOportunidade(opportunityId)
        if (!result.ok && repositories.demo) result = await repositories.demo.opportunities.obterOportunidade(opportunityId)
        if (!result.ok) throw new Error(result.mensagem || 'Oportunidade não encontrada.')
        if (active) setOpportunity(result.data)
      } catch (loadError) {
        if (active) setError(loadError.message || 'Não foi possível carregar a oportunidade.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [opportunityId, repositories, retryToken])

  const facts = opportunity ? [
    ['school-outline', 'Categoria', opportunity.categoria || 'Não informada'],
    ['briefcase-outline', 'Benefício', opportunity.beneficio || 'Não informado'],
    ['location-outline', 'Localização', opportunity.localizacao || 'Não informada'],
  ] : []
  const score = routeParams.matchScore ?? 100

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={back} style={styles.back}><Ionicons name="arrow-back" size={21} color="#fff" /></Pressable>
        <Image source={assets.monogram} style={styles.mark} resizeMode="contain" />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? <State label="Carregando oportunidade..." /> : null}
        {!loading && error ? <State label={error} retry={() => setRetryToken((value) => value + 1)} /> : null}
        {!loading && opportunity ? <>
          <Image source={getOpportunityImage(opportunity)} style={styles.hero} resizeMode="cover" />
          <View style={styles.intro}>
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Text numberOfLines={2} style={styles.title}>{opportunity.titulo}</Text>
                <Text style={styles.subtitle}>{[opportunity.modalidade, opportunity.categoria].filter(Boolean).join(' · ')}</Text>
              </View>
              <View style={styles.score}><Text style={styles.scoreLabel}>Match{`\n`}Score</Text><Text style={styles.scoreValue}>{score}%</Text></View>
            </View>
            <View style={styles.institution}>
              <Ionicons name="home" size={28} color={BLUE} />
              <View><Text style={styles.institutionLabel}>Instituição</Text><Text style={styles.institutionName}>{opportunity.instituicao || 'Mireva Design'}</Text><Text style={styles.institutionLocation}>{opportunity.localizacao || 'São Paulo'}</Text></View>
            </View>
          </View>
          <View style={styles.aboutCard}><Text style={styles.sectionTitle}>Sobre a oportunidade</Text><Text style={styles.body}>{opportunity.descricao || 'Sem descrição disponível.'}</Text></View>
          <View style={styles.factsCard}>{facts.map(([icon, label, value]) => <View key={label} style={styles.fact}><Ionicons name={icon} size={24} color={BLUE} /><View style={styles.factCopy}><Text style={styles.factLabel}>{label}</Text><Text numberOfLines={2} style={styles.factValue}>{value}</Text></View></View>)}</View>
          <View style={styles.requirements}>
            <Text style={styles.sectionTitle}>Requisitos</Text><BulletList items={opportunity.requisitos} empty="Nenhum requisito informado." />
            <Text style={styles.sectionTitle}>Documentos necessários</Text><BulletList items={opportunity.documentosNecessarios} empty="Nenhum documento exigido." />
            <Text style={styles.deadline}>{opportunity.fimInscricoes ? `Inscrições até ${new Date(opportunity.fimInscricoes).toLocaleDateString('pt-BR')}` : 'Prazo não informado'}</Text>
          </View>
        </> : null}
      </ScrollView>
      {!loading && opportunity ? <Pressable accessibilityRole="button" accessibilityLabel="Quero me candidatar" onPress={() => go('applicationInfo', { oportunidadeId: opportunityId })} style={styles.applyButton}><Text style={styles.applyText}>Quero me candidatar</Text></Pressable> : null}
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}

function BulletList({ items = [], empty }) {
  return <Text style={styles.body}>{items.length ? items.map((item) => `• ${item}`).join('\n') : empty}</Text>
}

function State({ label, retry }) {
  return <View style={styles.state}><Text style={styles.stateText}>{label}</Text>{retry ? <Pressable onPress={retry}><Text style={styles.retry}>Tentar novamente</Text></Pressable> : null}</View>
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  header: { height: 76, backgroundColor: BLUE },
  back: { position: 'absolute', left: 12, top: 24, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  mark: { position: 'absolute', top: 16, alignSelf: 'center', width: 56, height: 60 },
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 188 },
  hero: { width: '100%', height: 142 },
  intro: { paddingHorizontal: 18, paddingTop: 17, paddingBottom: 12 },
  headingRow: { minHeight: 72, flexDirection: 'row', alignItems: 'flex-start' },
  headingCopy: { flex: 1, minWidth: 0, paddingRight: 12 },
  title: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 25 },
  subtitle: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 18, marginTop: 2 },
  score: { width: 72, minHeight: 97, marginTop: -17, marginRight: -18, alignItems: 'center', paddingTop: 8, backgroundColor: LIME, borderBottomLeftRadius: 11 },
  scoreLabel: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 22, textAlign: 'center' },
  scoreValue: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 34 },
  institution: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  institutionLabel: { color: '#77808a', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 22 },
  institutionName: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 22 },
  institutionLocation: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 22 },
  aboutCard: { marginHorizontal: 7, marginTop: 4, padding: 15, borderRadius: 18, backgroundColor: '#fff', ...require('react-native').Platform.select({ web: { boxShadow: '0 2px 8px rgba(20, 49, 83, .14)' }, default: { elevation: 3 } }) },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 21, marginBottom: 6 },
  body: { color: '#586b7d', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 18 },
  factsCard: { marginHorizontal: 7, marginTop: 11, minHeight: 174, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, backgroundColor: '#fff', gap: 12, ...require('react-native').Platform.select({ web: { boxShadow: '0 2px 8px rgba(20, 49, 83, .14)' }, default: { elevation: 3 } }) },
  fact: { width: '100%', minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 9 },
  factCopy: { flex: 1, minWidth: 0 },
  factLabel: { color: '#77808a', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 22 },
  factValue: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 22 },
  requirements: { paddingHorizontal: 19, paddingTop: 18, gap: 4 },
  deadline: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, marginTop: 12 },
  applyButton: { position: 'absolute', left: 12, right: 12, bottom: 110, height: 54, borderRadius: 27, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  applyText: { color: '#0b5b26', fontFamily: 'Poppins_500Medium', fontSize: 13 },
  state: { padding: 28, alignItems: 'center', gap: 12 },
  stateText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, textAlign: 'center' },
  retry: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
})
