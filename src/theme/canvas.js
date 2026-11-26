import React, { createContext, useContext, useState } from 'react'
import { Platform, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAccessibility } from '../components/accessibility/AccessibilityContext'

// Quadro do app no celular.
// As telas foram desenhadas no Figma para 402x874. Em Android reais (360–412 de largura,
// telas mais baixas e fonte do sistema maior) os textos vazavam, eram cortados ou ficavam
// atrás de outros elementos. Aqui o app é desenhado sempre com pelo menos 402 de largura
// e 780 de altura e depois encaixado na tela, como uma imagem: o layout fica igual ao
// modelo em qualquer aparelho.
export const DESIGN_WIDTH = 402
export const MIN_DESIGN_HEIGHT = 780
const MAX_CANVAS_WIDTH = 480

const CanvasContext = createContext(null)

// Escala usada no celular: largura do modelo, sem deixar a altura útil abaixo do mínimo.
export function getCanvasScale(width, usableHeight) {
  if (!width || !usableHeight) return 1
  return Math.min(width / DESIGN_WIDTH, usableHeight / MIN_DESIGN_HEIGHT)
}

// Dimensões da "janela" que as telas devem usar.
// No celular é o quadro (já em unidades do modelo); na web, a janela real.
export function useAppWindow() {
  const canvas = useContext(CanvasContext)
  const window = useWindowDimensions()
  if (canvas) return { width: canvas.width, height: canvas.height, scale: canvas.scale }
  return { width: window.width, height: window.height, scale: 1 }
}

export function useCanvas() {
  return useContext(CanvasContext)
}

export function AppCanvas({ children }) {
  const window = useWindowDimensions()
  // Alto contraste: reforça o contraste de toda a tela (cores, fotos e bordas), além dos textos.
  const { settings } = useAccessibility()
  const contrastFilter = settings.highContrast ? { filter: [{ contrast: 1.45 }, { saturate: 1.15 }] } : null
  const insets = useSafeAreaInsets()
  const [box, setBox] = useState(null)

  if (Platform.OS === 'web') return children

  // A escala vem da tela inteira (estável); a altura vem do espaço medido, que encolhe
  // quando o teclado abre — assim os formulários continuam rolando até o campo digitado.
  const outerWidth = box?.width ?? window.width
  const outerHeight = box?.height ?? window.height - insets.top - insets.bottom
  const scale = getCanvasScale(outerWidth, window.height - insets.top - insets.bottom)
  // Em tablets o quadro não passa de 480 de largura e fica centralizado.
  const value = { width: Math.min(outerWidth / scale, MAX_CANVAS_WIDTH), height: outerHeight / scale, scale }
  const left = (outerWidth - value.width * scale) / 2

  return (
    <View
      style={{ flex: 1, width: '100%', overflow: 'hidden' }}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout
        if (!box || Math.abs(box.width - width) > 0.5 || Math.abs(box.height - height) > 0.5) setBox({ width, height })
      }}
    >
      {box ? (
        <CanvasContext.Provider value={value}>
          <View
            style={{
              position: 'absolute',
              left,
              top: 0,
              width: value.width,
              height: value.height,
              transformOrigin: 'top left',
              transform: [{ scale }],
              ...contrastFilter,
            }}
          >
            {children}
          </View>
        </CanvasContext.Provider>
      ) : null}
    </View>
  )
}
