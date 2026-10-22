import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/ui/Button'

export function ResponsibleHomeScreen({ go, repositories, session }) {
  const [guardian, setGuardian] = useState(null)
  const [athletes, setAthletes] = useState([])
  const [linkCode, setLinkCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creatingCode, setCreatingCode] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const guardianResult = await repositories.users.obterPerfilResponsavelPorUsuario(session?.id)
        if (!guardianResult.ok) throw new Error(guardianResult.mensagem || 'Não foi possível carregar o perfil do responsável.')

        const athletesResult = await repositories.users.obterAtletasDoResponsavel(guardianResult.data.id)
        if (!athletesResult.ok) throw new Error(athletesResult.mensagem || 'Não foi possível carregar os atletas vinculados.')

        if (active) {
          setGuardian(guardianResult.data)
          setAthletes(athletesResult.data)
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Não foi possível carregar sua área.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [repositories, session?.id, refreshKey])

  const generateLinkCode = async () => {
    if (!guardian || creatingCode) return
    setCreatingCode(true)
    setError('')
    try {
      const result = await repositories.users.gerarCodigoVinculoResponsavel(guardian.id)
      if (!result.ok) throw new Error(result.mensagem || 'Não foi possível gerar o código.')
      setLinkCode(result.data)
    } catch (codeError) {
      setError(codeError.message || 'Não foi possível gerar o código.')
    } finally {
      setCreatingCode(false)
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>MatchPoint · Responsável</Text>
        <Text style={styles.title}>Olá, {session?.nome || 'responsável'}.</Text>
        <Text style={styles.subtitle}>Gerencie somente os perfis esportivos vinculados à sua conta.</Text>

        {loading ? (
          <View style={styles.state}><ActivityIndicator color="#126b35" /><Text style={styles.stateText}>Carregando vínculos...</Text></View>
        ) : error && !guardian ? (
          <View style={styles.state}>
            <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
            <Button wide onPress={() => setRefreshKey((value) => value + 1)}>Tentar novamente</Button>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Vincular atleta menor</Text>
              <Text style={styles.cardCopy}>Gere um código de uso único. Ele expira em 24 horas e deve ser informado no cadastro do atleta.</Text>
              {linkCode ? (
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>Código ativo</Text>
                  <Text selectable style={styles.code}>{linkCode.codigo}</Text>
                  <Text style={styles.codeHint}>Expira em {new Date(linkCode.expiraEm).toLocaleString('pt-BR')}.</Text>
                </View>
              ) : null}
              <Button wide disabled={creatingCode} onPress={generateLinkCode}>
                {creatingCode ? 'Gerando código...' : 'Gerar código de vínculo'}
              </Button>
            </View>

            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Atletas vinculados</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Atualizar atletas vinculados" onPress={() => setRefreshKey((value) => value + 1)}>
                <Text style={styles.refresh}>Atualizar</Text>
              </Pressable>
            </View>

            {athletes.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Nenhum atleta vinculado</Text>
                <Text style={styles.emptyCopy}>Gere o código acima e use-o durante o cadastro de um atleta menor de idade.</Text>
              </View>
            ) : athletes.map((athlete) => (
              <Pressable
                key={athlete.id}
                accessibilityRole="button"
                accessibilityLabel={`Editar perfil de ${athlete.modalidade || 'atleta vinculado'}`}
                onPress={() => go('responsibleAthleteProfile', { athleteId: athlete.id })}
                style={styles.athleteCard}
              >
                <View style={styles.avatar}><Text style={styles.avatarText}>{(athlete.modalidade || 'A').slice(0, 1).toUpperCase()}</Text></View>
                <View style={styles.athleteCopy}>
                  <Text style={styles.athleteTitle}>{athlete.modalidade || 'Perfil esportivo'}</Text>
                  <Text style={styles.athleteMeta}>{athlete.categoria || 'Categoria não informada'} · {athlete.perfilCompleto ? 'Perfil completo' : 'Perfil em preenchimento'}</Text>
                </View>
                <Text style={styles.edit}>Editar</Text>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f8f7' },
  content: { padding: 20, paddingBottom: 32, gap: 14 },
  eyebrow: { color: '#126b35', fontFamily: 'Poppins_600SemiBold', fontSize: 11, textTransform: 'uppercase' },
  title: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 24 },
  subtitle: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20 },
  card: { gap: 12, padding: 16, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d9e4df' },
  cardTitle: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  cardCopy: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18 },
  codeBox: { gap: 4, padding: 14, borderRadius: 8, backgroundColor: '#eaf6ed' },
  codeLabel: { color: '#126b35', fontFamily: 'Poppins_500Medium', fontSize: 11 },
  code: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 23, letterSpacing: 2 },
  codeHint: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  refresh: { color: '#126b35', fontFamily: 'Poppins_500Medium', fontSize: 12 },
  empty: { gap: 6, padding: 18, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d9e4df' },
  emptyTitle: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  emptyCopy: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18 },
  athleteCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d9e4df' },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaf6ed' },
  avatarText: { color: '#126b35', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  athleteCopy: { flex: 1, gap: 2 },
  athleteTitle: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  athleteMeta: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 11 },
  edit: { color: '#126b35', fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  state: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateText: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 13 },
  error: { color: '#8c2721', fontFamily: 'Poppins_500Medium', fontSize: 12, lineHeight: 18 },
})
