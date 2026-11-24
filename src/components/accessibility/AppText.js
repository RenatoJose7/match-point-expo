import React, { forwardRef } from 'react'
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput } from 'react-native'
import { useAccessibility } from './AccessibilityContext'

// Text e TextInput do app: aplicam o tamanho de texto, o negrito e o alto contraste
// escolhidos no painel de acessibilidade. Com tudo no padrão, não mudam nada.

const BOLD_FAMILY = 'Poppins_600SemiBold'
const CONTRAST_DARK = '#0b2540'

function parseColor(value) {
  if (typeof value !== 'string') return null
  const hex = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1]
    return [0, 2, 4].map((index) => parseInt(digits.slice(index, index + 2), 16))
  }
  const rgb = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null
}

function luminance([r, g, b]) {
  const channel = (value) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

// Cinzas e azuis acinzentados de baixo contraste viram um azul-escuro bem legível.
// Branco, verde-limão e o azul da marca ficam como estão.
function contrastColor(color) {
  const rgb = parseColor(color)
  if (!rgb) return null
  const light = luminance(rgb)
  const saturation = Math.max(...rgb) - Math.min(...rgb)
  if (light > 0.08 && light < 0.6 && saturation < 90) return CONTRAST_DARK
  return null
}

function adaptStyle(style, accessibility, fixedSize = false) {
  if (!accessibility.active) return style
  const flat = StyleSheet.flatten(style) || {}
  const changes = {}
  const family = flat.fontFamily
  // A Griffiths é decorativa (títulos grandes): manter o tamanho evita títulos cortados.
  const decorative = family === 'Griffiths'

  if (!decorative && !fixedSize && accessibility.textScale !== 1 && typeof flat.fontSize === 'number') {
    changes.fontSize = Math.round(flat.fontSize * accessibility.textScale * 10) / 10
    if (typeof flat.lineHeight === 'number') changes.lineHeight = Math.round(flat.lineHeight * accessibility.textScale)
  }
  if (accessibility.settings.boldText && typeof family === 'string' && /^Poppins_(400Regular|500Medium)$/.test(family)) {
    changes.fontFamily = BOLD_FAMILY
  }
  if (accessibility.settings.highContrast) {
    const color = contrastColor(flat.color)
    if (color) changes.color = color
  }
  return Object.keys(changes).length ? [style, changes] : style
}

// `fixedSize`: para textos dentro de caixas de tamanho fixo (selos numéricos, barra de navegação).
// Eles recebem negrito e contraste, mas não crescem, para não vazar da caixa.
export const Text = forwardRef(function AppText({ style, fixedSize = false, ...props }, ref) {
  const accessibility = useAccessibility()
  return <NativeText ref={ref} maxFontSizeMultiplier={1} {...props} style={adaptStyle(style, accessibility, fixedSize)} />
})

export const TextInput = forwardRef(function AppTextInput({ style, ...props }, ref) {
  const accessibility = useAccessibility()
  return <NativeTextInput ref={ref} maxFontSizeMultiplier={1} {...props} style={adaptStyle(style, accessibility)} />
})
