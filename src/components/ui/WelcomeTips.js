import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../accessibility/AppText'

const BLUE = '#10579b'
const LIME = '#c4ff32'

// Primeiros passos de cada perfil: aparece no primeiro acesso e some de vez em "Entendi".
const TIPS = {
  atleta: ['Complete seu perfil esportivo: quanto mais completo, mais preciso o Match Score.', 'Veja as oportunidades e por que cada uma combina com você.', 'Candidate-se, envie os documentos e acompanhe o status pelas notificações.'],
  treinador: ['Crie uma oportunidade e publique quando quiser.', 'Abra os candidatos para ver perfil, documentos e Match Score.', 'Responda as avaliações técnicas pedidas pelas instituições no banner da home.'],
  instituicao: ['Publique oportunidades com requisitos e documentos.', 'Analise os candidatos, peça avaliação técnica e decida.', 'Registre o apoio concedido para acompanhar o impacto.'],
  responsavel: ['Gere o código de vínculo e use no cadastro do atleta menor.', 'Acompanhe as candidaturas do atleta vinculado.', 'Você recebe um aviso a cada mudança de status.'],
}

export function WelcomeTips({ role }) {
  const key = `matchpoint.boasVindas.${role}`
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let active = true
    AsyncStorage.getItem(key).then((seen) => { if (active && !seen) setVisible(true) }).catch(() => {})
    return () => { active = false }
  }, [key])

  if (!visible || !TIPS[role]) return null
  const dismiss = () => {
    setVisible(false)
    AsyncStorage.setItem(key, '1').catch(() => {})
  }

  return (
    <View accessibilityRole="summary" style={styles.card}>
      <View style={styles.heading}>
        <Ionicons name="sparkles" size={18} color={BLUE} />
        <Text accessibilityRole="header" style={styles.title}>Primeiros passos</Text>
      </View>
      {TIPS[role].map((tip, index) => (
        <View key={tip} style={styles.row}>
          <View style={styles.number}><Text fixedSize style={styles.numberText}>{index + 1}</Text></View>
          <Text style={styles.tip}>{tip}</Text>
        </View>
      ))}
      <Pressable accessibilityRole="button" accessibilityLabel="Entendi, fechar primeiros passos" onPress={dismiss} style={styles.button}>
        <Text style={styles.buttonText}>Entendi</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { gap: 8, padding: 14, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 2, borderColor: LIME },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  number: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: BLUE },
  numberText: { color: '#ffffff', fontFamily: 'Poppins_600SemiBold', fontSize: 12, lineHeight: 15 },
  tip: { flex: 1, color: '#2b3f48', fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20 },
  button: { alignSelf: 'flex-end', minHeight: 44, minWidth: 96, paddingHorizontal: 18, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: LIME },
  buttonText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
})
