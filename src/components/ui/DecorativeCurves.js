import React from 'react'
import { StyleSheet, View } from 'react-native'

// Faixas curvas claras usadas ao fundo das telas azuis (Notificações e Mulheres no Esporte).
// Ficam atrás do conteúdo e não recebem toques.
export function DecorativeCurves({ top = 0 }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { top }]}>
      <View style={[localStyles.band, localStyles.upper]} />
      <View style={[localStyles.band, localStyles.lower]} />
    </View>
  )
}

const localStyles = StyleSheet.create({
  band: {
    position: 'absolute',
    borderColor: 'rgba(229, 230, 231, 0.92)',
    borderWidth: 30,
  },
  upper: {
    left: -1000,
    top: 140,
    width: 1700,
    height: 1700,
    borderRadius: 850,
  },
  lower: {
    left: -700,
    top: 620,
    width: 1760,
    height: 1760,
    borderRadius: 880,
  },
})
