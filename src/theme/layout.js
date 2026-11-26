import { Platform, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCanvas } from './canvas'

// Largura máxima do app no celular. Em tablets e telas largas o app fica
// centralizado com essa largura, em vez de esticar os layouts feitos para celular.
export const MAX_NATIVE_FRAME_WIDTH = 480

// Largura real do quadro do app, igual à usada pelo App.js.
// Na web, o quadro imita um celular de 402x874 dentro do navegador.
export function getFrameWidth(width, height) {
  if (Platform.OS !== 'web') return Math.min(width, MAX_NATIVE_FRAME_WIDTH)
  return width <= 430 ? width : Math.min(height * (402 / 874), 430)
}

// Tamanho útil do quadro do app (sem as barras do sistema no celular).
// Usado pelas telas que encolhem proporcionalmente em celulares pequenos.
export function useFrameSize() {
  const canvas = useCanvas()
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  // No celular as telas vivem dentro do quadro em escala (src/theme/canvas.js).
  if (canvas) return { width: canvas.width, height: canvas.height }
  const frameWidth = getFrameWidth(width, height)
  const frameHeight = Platform.OS === 'web'
    ? (width <= 430 ? height : frameWidth * (874 / 402))
    : height - insets.top - insets.bottom
  return { width: frameWidth, height: frameHeight }
}

// Escala em relação ao modelo de 402x874: 1 no tamanho do modelo ou maior,
// menor (até `min`) em celulares estreitos ou baixos.
export function frameScale({ width, height }, min = 0.6) {
  return Math.max(min, Math.min(1, width / 402, height / 874))
}

// Em telas um pouco mais baixas que o modelo, espaços extras cedem até `reduction`
// pixels (proporcional à diferença de altura) para evitar rolagem à toa.
export function useHeightFit(range = 40) {
  const frame = useFrameSize()
  const squeeze = Math.min(1, Math.max(0, 874 - frame.height) / range)
  return (value, reduction) => Math.round(value - reduction * squeeze)
}
