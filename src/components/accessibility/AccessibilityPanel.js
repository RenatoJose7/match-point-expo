import React from 'react'
import { Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getFrameWidth } from '../../theme/layout'
import { TEXT_SIZES, useAccessibility } from './AccessibilityContext'
import { Text } from './AppText'

const BLUE = '#10579b'
const LIME = '#c4ff32'

function OptionSwitch({ icon, title, description, value, onChange }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
      aria-checked={value}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [styles.option, pressed && styles.pressed]}
    >
      <View style={[styles.optionIcon, value && styles.optionIconOn]}>
        <Ionicons name={icon} size={20} color={BLUE} />
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <View style={[styles.switchTrack, value && styles.switchTrackOn]}>
        <View style={[styles.switchThumb, value && styles.switchThumbOn]} />
      </View>
    </Pressable>
  )
}

// Painel de acessibilidade: abre como uma folha por baixo, por cima de qualquer tela.
export function AccessibilityPanel() {
  const { settings, update, reset, panelOpen, closePanel, screenReaderOn } = useAccessibility()
  const { width, height } = useWindowDimensions()
  const frameWidth = getFrameWidth(width, height)

  return (
    <Modal visible={panelOpen} transparent animationType={settings.reduceMotion ? 'none' : 'slide'} onRequestClose={closePanel} statusBarTranslucent>
      <View style={[styles.backdrop, { width: frameWidth }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar acessibilidade" onPress={closePanel} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerIcon}><Ionicons name="accessibility" size={22} color={BLUE} /></View>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={styles.title}>Acessibilidade</Text>
              <Text style={styles.subtitle}>Ajuste o app do jeito que fica melhor para você.</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" hitSlop={12} onPress={closePanel} style={styles.close}>
              <Ionicons name="close" size={24} color={BLUE} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Tamanho do texto</Text>
            <View accessibilityRole="radiogroup" style={styles.sizes}>
              {TEXT_SIZES.map((item) => {
                const selected = settings.textSize === item.key
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="radio"
                    accessibilityLabel={`Texto ${item.label.toLowerCase()}`}
                    accessibilityState={{ selected, checked: selected }}
                    aria-checked={selected}
                    onPress={() => update({ textSize: item.key }, `Texto ${item.label.toLowerCase()}`)}
                    style={({ pressed }) => [styles.size, selected && styles.sizeSelected, pressed && styles.pressed]}
                  >
                    <Text style={[styles.sizeLetter, { fontSize: 16 * item.scale }, selected && styles.sizeLetterSelected]}>{item.short}</Text>
                    <Text style={[styles.sizeLabel, selected && styles.sizeLetterSelected]}>{item.label}</Text>
                  </Pressable>
                )
              })}
            </View>
            <View style={styles.preview} accessibilityLabel="Prévia do texto">
              <Text style={styles.previewTitle}>Prévia</Text>
              <Text style={styles.previewText}>Sua próxima oportunidade começa aqui.</Text>
            </View>

            <Text accessibilityRole="header" style={styles.sectionTitle}>Leitura e visão</Text>
            <OptionSwitch
              icon="text"
              title="Texto em negrito"
              description="Deixa as letras mais grossas e fáceis de ler."
              value={settings.boldText}
              onChange={(value) => update({ boldText: value }, value ? 'Texto em negrito ativado' : 'Texto em negrito desativado')}
            />
            <OptionSwitch
              icon="contrast"
              title="Alto contraste"
              description="Reforça cores, textos e contornos de botões em todas as telas."
              value={settings.highContrast}
              onChange={(value) => update({ highContrast: value }, value ? 'Alto contraste ativado' : 'Alto contraste desativado')}
            />
            <OptionSwitch
              icon="reorder-four-outline"
              title="Mais espaço entre linhas"
              description="Afasta as linhas dos textos para facilitar a leitura (bom para dislexia)."
              value={settings.lineSpacing}
              onChange={(value) => update({ lineSpacing: value }, value ? 'Espaçamento maior ativado' : 'Espaçamento padrão')}
            />
            <OptionSwitch
              icon="pause-circle-outline"
              title="Reduzir animações"
              description="Remove transições e movimentos da tela."
              value={settings.reduceMotion}
              onChange={(value) => update({ reduceMotion: value }, value ? 'Animações reduzidas' : 'Animações ativadas')}
            />

            <View style={styles.reader}>
              <Ionicons name={Platform.OS === 'web' || screenReaderOn ? 'volume-high' : 'volume-mute-outline'} size={20} color={BLUE} />
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>{Platform.OS === 'web' ? 'Leitor de tela' : `Leitor de tela ${screenReaderOn ? 'ativo' : 'desligado'}`}</Text>
                <Text style={styles.optionDescription}>
                  {Platform.OS === 'web'
                    ? 'O app é compatível com leitores de tela do navegador.'
                    : 'O app funciona com o TalkBack. Para ligar: Configurações › Acessibilidade › TalkBack.'}
                </Text>
              </View>
            </View>

            <Pressable accessibilityRole="button" onPress={reset} style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
              <Ionicons name="refresh" size={18} color={BLUE} />
              <Text style={styles.resetText}>Restaurar padrão</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignSelf: 'center', justifyContent: 'flex-end', backgroundColor: 'rgba(5, 25, 48, .55)' },
  sheet: { maxHeight: '88%', backgroundColor: '#ffffff', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 8 },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#d4dde6', marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e6edf3' },
  headerIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 19, lineHeight: 24 },
  subtitle: { color: '#4a6175', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 17 },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 30, gap: 10 },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 15, lineHeight: 20, marginTop: 6 },
  sizes: { flexDirection: 'row', gap: 8 },
  size: { flex: 1, minHeight: 64, borderRadius: 14, borderWidth: 1.5, borderColor: '#cfdbe6', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, backgroundColor: '#f6f9fc' },
  sizeSelected: { borderColor: BLUE, backgroundColor: BLUE },
  sizeLetter: { color: BLUE, fontFamily: 'Poppins_600SemiBold', lineHeight: 26 },
  sizeLabel: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 11, lineHeight: 14 },
  sizeLetterSelected: { color: '#ffffff' },
  preview: { borderRadius: 14, backgroundColor: '#eef4fa', padding: 12, gap: 2 },
  previewTitle: { color: '#4a6175', fontFamily: 'Poppins_500Medium', fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.6 },
  previewText: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 20 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#f6f9fc' },
  optionIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e3ebf3', alignItems: 'center', justifyContent: 'center' },
  optionIconOn: { backgroundColor: LIME },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 14, lineHeight: 19 },
  optionDescription: { color: '#4a6175', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 16 },
  switchTrack: { width: 46, height: 28, borderRadius: 14, backgroundColor: '#c6d3df', padding: 3, justifyContent: 'center' },
  switchTrackOn: { backgroundColor: BLUE },
  switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#ffffff' },
  switchThumbOn: { alignSelf: 'flex-end', backgroundColor: LIME },
  reader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e1e8ef' },
  reset: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: 23, borderWidth: 1.5, borderColor: BLUE, marginTop: 6 },
  resetText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  pressed: { opacity: 0.8 },
})
