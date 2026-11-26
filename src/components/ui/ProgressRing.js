import React from 'react'
import { View } from 'react-native'

// Anel de progresso sem biblioteca de gráficos. Cada metade da tela (direita e esquerda) recorta
// um semicírculo que gira: a direita preenche de 0 a 50% e a esquerda de 50 a 100%.
// 0% mostra só o trilho; 100% fecha o círculo inteiro.
export function ProgressRing({ percent = 0, size = 84, stroke = 7, color = '#10579b', track = '#dfe8f2', children }) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0))
  const firstHalf = Math.min(value, 50) * 3.6 // 0..180 graus
  const secondHalf = Math.max(value - 50, 0) * 3.6 // 0..180 graus
  const half = size / 2
  const ring = { position: 'absolute', top: 0, width: size, height: size, borderRadius: half, borderWidth: stroke, borderColor: 'transparent' }

  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }} style={{ width: size, height: size }}>
      <View style={[ring, { left: 0, borderColor: track }]} />
      {/* Metade direita: semicírculo esquerdo (bordas esquerda e de baixo, girado 45°) entra girando. */}
      <View style={{ position: 'absolute', top: 0, left: half, width: half, height: size, overflow: 'hidden' }}>
        <View style={[ring, { left: -half, borderLeftColor: color, borderBottomColor: color, transform: [{ rotate: `${45 + firstHalf}deg` }] }]} />
      </View>
      {/* Metade esquerda: semicírculo direito (bordas de cima e direita, girado 45°). */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: half, height: size, overflow: 'hidden' }}>
        <View style={[ring, { left: 0, borderTopColor: color, borderRightColor: color, transform: [{ rotate: `${45 + secondHalf}deg` }] }]} />
      </View>
      <View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  )
}
