import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BackButton } from '../components/ui/BackButton'
import { BottomNav } from '../components/navigation/BottomNav'
import { Button } from '../components/ui/Button'
import { assets } from '../theme/assets'
import { BLUE } from '../theme/colors'
import { styles } from '../theme/styles'

function formatDate(value) {
  if (!value) return 'Prazo não informado'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Prazo não informado' : date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function displayItem(item) {
  if (typeof item === 'string') return item.replaceAll('_', ' ')
  return item?.nome ?? item?.descricao ?? item?.titulo ?? ''
}

export function OpportunityDetailScreen({ go, back, repositories, routeParams = {} }) {
  const { oportunidadeId } = routeParams
  const [opportunity, setOpportunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let active = true

    const loadOpportunity = async () => {
      setLoading(true)
      setError('')

      if (!oportunidadeId) {
        setError('O identificador da oportunidade não foi informado.')
        setLoading(false)
        return
      }

      try {
        const result = await repositories.opportunities.obterOportunidade(oportunidadeId)
        if (!active) return
        if (!result.ok) {
          setError(result.mensagem || 'Não foi possível carregar esta oportunidade.')
          return
        }
        setOpportunity(result.data)
      } catch {
        if (active) setError('Não foi possível carregar esta oportunidade. Tente novamente.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOpportunity()
    return () => { active = false }
  }, [oportunidadeId, repositories, retryToken])

  const requirements = (opportunity?.requisitos ?? []).map(displayItem).filter(Boolean)
  const documents = (opportunity?.documentosNecessarios ?? []).map(displayItem).filter(Boolean)
  const routeParamsWithOpportunity = {
    ...routeParams,
    oportunidadeId,
  }

  return (
    <View style={styles.flowScreen}>
      <View style={styles.flowHeader}>
        <BackButton onPress={back} />
        <Image source={assets.monogram} style={styles.flowHeaderMark} resizeMode="contain" />
      </View>

      <ScrollView style={styles.opportunityDetailScroll} contentContainerStyle={styles.opportunityDetailContent} showsVerticalScrollIndicator={false}>
        {loading ? <Text style={styles.opportunityBodyCopy}>Carregando oportunidade...</Text> : null}
        {!loading && error ? (
          <View style={styles.flowAction}>
            <Text accessibilityRole="alert" style={styles.opportunityBodyCopy}>{error}</Text>
            <Button wide onPress={() => setRetryToken(value => value + 1)}>Tentar novamente</Button>
            <Pressable accessibilityRole="button" onPress={back}>
              <Text style={styles.opportunityBodyCopy}>Voltar para oportunidades</Text>
            </Pressable>
          </View>
        ) : null}
        {!loading && opportunity ? (
          <>
            <Image source={assets.arenaSuzy} style={styles.opportunityHero} resizeMode="cover" />
            <View style={styles.opportunityIntro}>
              <View style={styles.opportunityHeadingRow}>
                <View>
                  <Text style={styles.opportunityDetailTitle}>{opportunity.titulo}</Text>
                  <Text style={styles.opportunityDetailSubtitle}>{[opportunity.modalidade, opportunity.categoria].filter(Boolean).join(' · ')}</Text>
                </View>
                {Number.isFinite(routeParams.matchScore) && (
                  <View style={[styles.opportunityScore, localStyles.scoreCard]}>
                    <Text style={styles.opportunityScoreLabel}>Match{`\n`}Score</Text>
                    <Text numberOfLines={1} style={[styles.opportunityScoreValue, localStyles.scoreValue]}>{routeParams.matchScore}%</Text>
                  </View>
                )}
              </View>

              <View style={styles.institutionRow}>
                <Ionicons name="home" size={25} color={BLUE} />
                <View>
                  <Text style={styles.opportunityFactLabel}>Instituição</Text>
                  <Text style={styles.institutionName}>{opportunity.instituicao || 'Instituição participante'}</Text>
                  <Text style={styles.institutionName}>{opportunity.localizacao || 'Localização não informada'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.opportunityAboutCard}>
              <Text style={styles.opportunitySectionTitle}>Sobre a oportunidade</Text>
              <Text style={styles.opportunityBodyCopy}>{opportunity.descricao || 'Descrição não informada.'}</Text>
            </View>

            <View style={styles.opportunityFactsCard}>
              <View style={styles.opportunityFact}>
                <Ionicons name="school-outline" size={22} color={BLUE} />
                <View>
                  <Text style={styles.opportunityFactLabel}>Categoria</Text>
                  <Text style={styles.opportunityFactValue}>{opportunity.categoria || 'Não informada'}</Text>
                </View>
              </View>
              <View style={styles.opportunityFact}>
                <Ionicons name="briefcase-outline" size={22} color={BLUE} />
                <View>
                  <Text style={styles.opportunityFactLabel}>Benefício</Text>
                  <Text style={styles.opportunityFactValue}>{opportunity.beneficio || 'Não informado'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.requirementsBlock}>
              <Text style={styles.opportunitySectionTitle}>Requisitos</Text>
              <Text style={styles.opportunityBodyCopy}>
                {requirements.length ? requirements.map(item => `• ${item}`).join('\n') : 'Não há requisitos adicionais informados.'}
              </Text>
              <Text style={styles.deadline}>Inscrições até {formatDate(opportunity.fimInscricoes)}</Text>
            </View>

            <View style={styles.requirementsBlock}>
              <Text style={styles.opportunitySectionTitle}>Documentos necessários</Text>
              <Text style={styles.opportunityBodyCopy}>
                {documents.length ? documents.map(item => `• ${item}`).join('\n') : 'Nenhum documento especificado.'}
              </Text>
            </View>

            <View style={styles.flowAction}>
              <Button wide onPress={() => go('applicationInfo', routeParamsWithOpportunity)}>Quero me candidatar</Button>
            </View>
          </>
        ) : null}
      </ScrollView>
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  scoreCard: { width: 92, minWidth: 92, paddingHorizontal: 6, alignItems: 'center', flexShrink: 0 },
  scoreValue: { fontSize: 22, lineHeight: 24 },
})
