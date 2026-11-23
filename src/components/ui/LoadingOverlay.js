import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet } from 'react-native'
import { USE_NATIVE_DRIVER } from '../motion'
import { LoadingScreen } from './LoadingScreen'
import { useReduceMotion } from '../accessibility/AccessibilityContext'

const HOLD_MS = 650
const FADE_MS = 260

// Mostra a bolinha de tênis por um instante ao entrar no cadastro.
// A tela de destino já é montada por baixo, então nada atrasa: a bolinha só some por cima dela.
export function LoadingOverlay({ trigger }) {
  // Com "Reduzir animações" a bolinha não aparece entre as telas.
  const reduceMotion = useReduceMotion()
  // Lido por referência: mudar a opção não deve disparar a bolinha de novo.
  const reduceMotionRef = useRef(reduceMotion)
  reduceMotionRef.current = reduceMotion
  const opacity = useRef(new Animated.Value(0)).current
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!trigger || reduceMotionRef.current) return undefined
    setVisible(true)
    opacity.stopAnimation()
    opacity.setValue(1)
    const animation = Animated.timing(opacity, {
      toValue: 0,
      delay: HOLD_MS,
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: USE_NATIVE_DRIVER,
    })
    animation.start(({ finished }) => {
      if (finished) setVisible(false)
    })
    return () => animation.stop()
  }, [opacity, trigger])

  if (!visible) return null

  return (
    <Animated.View pointerEvents="auto" style={[StyleSheet.absoluteFill, styles.layer, { opacity }]}>
      <LoadingScreen />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  layer: { zIndex: 20, elevation: 20 },
})
