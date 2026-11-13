import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BackButton } from '../components/ui/BackButton'
import { BottomNav } from '../components/navigation/BottomNav'
import { BLUE, GREEN } from '../theme/colors'

const timeline = [
  ['Inscrição realizada', '12/06/2026', true],
  ['Documentos enviados', '12/06/2026', true],
  ['Em análise', 'Desde 16/06/2026', true],
  ['Resultado final', 'Aguardando', false],
]

const documents = ['Currículo esportivo', 'Histórico escolar', 'Vídeo de apresentação', 'Comprovante de residência']

export function ApplicationStatusScreen({ go, back }) {
  return (
    <View style={localStyles.screen}>
      <BackButton onPress={back} />
      <View style={localStyles.header}>
        <View style={localStyles.headerCopy}>
          <Text style={localStyles.opportunityTitle}>Bolsa de Estudos</Text>
          <Text style={localStyles.opportunitySubtitle}>Tênis - Nível Universitário</Text>
        </View>
        <View style={localStyles.badge}>
          <Text style={localStyles.badgeText}>Em análise</Text>
        </View>
      </View>

      <ScrollView style={localStyles.body} contentContainerStyle={localStyles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={localStyles.timelineCard}>
          <Text style={localStyles.sectionTitle}>Status da candidatura</Text>
          {timeline.map(([label, date, done], index) => (
            <View key={label} style={[localStyles.step, index === timeline.length - 1 && localStyles.lastStep]}>
              {index < timeline.length - 1 && <View style={localStyles.stepLine} />}
              <View style={[localStyles.stepIcon, !done && localStyles.stepIconPending]}>
                {done && <Ionicons name="checkmark" size={15} color={BLUE} />}
              </View>
              <Text style={[localStyles.stepLabel, index === 2 && localStyles.stepCurrent]}>{label}</Text>
              <Text style={localStyles.stepDate}>{date}</Text>
            </View>
          ))}
        </View>

        <Text style={localStyles.documentsTitle}>Documentos enviados</Text>
        <View style={localStyles.documentsList}>
          {documents.map(item => <Text key={item} style={localStyles.document}>{item}</Text>)}
        </View>

        <Pressable accessibilityRole="button" onPress={() => go('opportunitiesAthlete')} style={localStyles.action}>
          <Text style={localStyles.actionText}>Ver oportunidades</Text>
        </Pressable>
      </ScrollView>
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE },
  header: { height: 149, backgroundColor: BLUE, justifyContent: 'flex-end', paddingBottom: 22, paddingHorizontal: 20 },
  headerCopy: { paddingRight: 132 },
  opportunityTitle: { color: '#ffffff', fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 23 },
  opportunitySubtitle: { color: '#ffffff', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 19, marginTop: 2 },
  badge: { position: 'absolute', right: 10, bottom: 42, minWidth: 142, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN, borderRadius: 8, paddingHorizontal: 14 },
  badgeText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  body: { position: 'absolute', top: 139, bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  bodyContent: { flexGrow: 1, paddingBottom: 124 },
  timelineCard: { marginHorizontal: 7, minHeight: 352, borderRadius: 17, backgroundColor: '#ffffff', paddingHorizontal: 13, paddingTop: 20, paddingBottom: 12, shadowColor: '#10284a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 6, elevation: 3 },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 22, marginBottom: 19 },
  step: { minHeight: 76, flexDirection: 'row', alignItems: 'flex-start' },
  lastStep: { minHeight: 58 },
  stepLine: { position: 'absolute', zIndex: 0, left: 9, top: 18, width: 2, height: 60, backgroundColor: '#e1e4e5' },
  stepIcon: { zIndex: 1, width: 19, height: 19, borderRadius: 10, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepIconPending: { backgroundColor: '#ffffff', borderColor: '#dfe2e4', borderWidth: 2 },
  stepLabel: { flex: 1, color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 19 },
  stepCurrent: { fontFamily: 'Poppins_600SemiBold' },
  stepDate: { color: '#767676', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 19, marginLeft: 7, textAlign: 'right' },
  documentsTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 23, marginTop: 24, marginLeft: 20, marginBottom: 18 },
  documentsList: { gap: 20, paddingHorizontal: 20 },
  document: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 21 },
  action: { height: 54, marginHorizontal: 8, marginTop: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e3f95', borderRadius: 10 },
  actionText: { color: '#ffffff', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
})
