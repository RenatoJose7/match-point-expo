import React, { useEffect, useState } from 'react'
import { Image, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BackButton } from '../components/ui/BackButton'
import { BottomNav } from '../components/navigation/BottomNav'
import { Button } from '../components/ui/Button'
import { assets } from '../theme/assets'
import { BLUE } from '../theme/colors'
import { styles } from '../theme/styles'

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
        const result = await repositories.opportunities.obterOportunidade(opportunityId)
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
  return (
    <View style={styles.flowScreen}>
      <View style={styles.flowHeader}>
        <BackButton onPress={back} />
        <Image source={assets.monogram} style={styles.flowHeaderMark} resizeMode="contain" />
      </View>

      <ScrollView style={styles.opportunityDetailScroll} contentContainerStyle={styles.opportunityDetailContent} showsVerticalScrollIndicator={false}>
        {loading ? <Text style={styles.opportunityBodyCopy}>Carregando oportunidade...</Text> : null}
        {!loading && error ? <View style={styles.flowAction}><Text accessibilityRole="alert" style={styles.opportunityBodyCopy}>{error}</Text><Button wide onPress={() => setRetryToken((value) => value + 1)}>Tentar novamente</Button></View> : null}
        {!loading && opportunity ? <>
        <Image source={assets.arenaSuzy} style={styles.opportunityHero} resizeMode="cover" />
        <View style={styles.opportunityIntro}>
          <View style={styles.opportunityHeadingRow}>
            <View>
              <Text style={styles.opportunityDetailTitle}>{opportunity.titulo}</Text>
              <Text style={styles.opportunityDetailSubtitle}>{[opportunity.modalidade, opportunity.categoria].filter(Boolean).join(' · ')}</Text>
            </View>
            <View style={styles.opportunityScore}>
              <Text style={styles.opportunityScoreLabel}>Match{`\n`}Score</Text>
              <Text style={styles.opportunityScoreValue}>{routeParams.matchScore ?? '—'}%</Text>
            </View>
          </View>

          <View style={styles.institutionRow}>
            <Ionicons name="home" size={25} color={BLUE} />
            <View>
              <Text style={styles.opportunityFactLabel}>Instituição</Text>
              <Text style={styles.institutionName}>{opportunity.instituicao || 'Instituição parceira'}</Text>
              <Text style={styles.institutionName}>{opportunity.localizacao || 'Localização não informada'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.opportunityAboutCard}>
          <Text style={styles.opportunitySectionTitle}>Sobre a oportunidade</Text>
          <Text style={styles.opportunityBodyCopy}>{opportunity.descricao || 'Sem descrição disponível.'}</Text>
        </View>

        <View style={styles.opportunityFactsCard}>
          {facts.map(([icon, label, value]) => (
            <View key={label} style={styles.opportunityFact}>
              <Ionicons name={icon} size={22} color={BLUE} />
              <View>
                <Text style={styles.opportunityFactLabel}>{label}</Text>
                <Text style={styles.opportunityFactValue}>{value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.requirementsBlock}>
          <Text style={styles.opportunitySectionTitle}>Requisitos</Text>
          <Text style={styles.opportunityBodyCopy}>{(opportunity.requisitos ?? []).length ? opportunity.requisitos.map((item) => `• ${item}`).join('\n') : 'Nenhum requisito informado.'}</Text>
          <Text style={styles.deadline}>{opportunity.fimInscricoes ? `Inscrições até ${new Date(opportunity.fimInscricoes).toLocaleDateString('pt-BR')}` : 'Prazo não informado'}</Text>
        </View>

        <View style={styles.flowAction}>
          <Button wide onPress={() => go('applicationInfo', { oportunidadeId: opportunityId })}>Quero me candidatar</Button>
        </View>
        </> : null}
      </ScrollView>
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}
