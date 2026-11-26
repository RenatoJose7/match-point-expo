import React, { forwardRef } from 'react'
import { Platform, StyleSheet, Text as NativeText, TextInput as NativeTextInput } from 'react-native'
import { useAccessibility } from './AccessibilityContext'

// Text e TextInput do app: aplicam o tamanho de texto, o negrito e o alto contraste
// escolhidos no painel de acessibilidade. Com tudo no padrão, não mudam nada.

const BOLD_FAMILY = 'Poppins_600SemiBold'

// O Android põe um respiro extra acima e abaixo de cada linha (includeFontPadding). Com a Poppins
// isso deixava os textos mais altos que no modelo e cortados em caixas de altura fixa.
const ANDROID_TEXT = { includeFontPadding: false }
// A Griffiths tem traços longos abaixo da linha (j, ç, g): ela mantém o respiro para não ser cortada.
const isGriffiths = (style) => StyleSheet.flatten(style)?.fontFamily === 'Griffiths'
// Griffiths com altura de linha menor que a letra: no Android os traços de baixo (j, ç, g) eram
// cortados. A caixa cresce para baixo e a margem negativa compensa, sem mexer no layout.
function griffithsRoom(style) {
  const flat = StyleSheet.flatten(style) || {}
  const size = typeof flat.fontSize === 'number' ? flat.fontSize : 14
  if (typeof flat.lineHeight !== 'number') return null
  const extra = Math.ceil(size * 1.25 - flat.lineHeight)
  if (extra <= 0) return null
  return { paddingBottom: (flat.paddingBottom || 0) + extra, marginBottom: (flat.marginBottom || 0) - extra }
}
// Antes do estilo da tela (pode ser sobrescrito) e depois dele (precisa valer), respectivamente.
const androidBase = (style) => (Platform.OS === 'android' && !isGriffiths(style) ? ANDROID_TEXT : null)
const androidAfter = (style) => (Platform.OS === 'android' && isGriffiths(style) ? griffithsRoom(style) : null)

// No Android a última letra da Griffiths (inclinada) passa da largura que o sistema reserva e era
// cortada ("Seu perfi", "desempenh"). Um espaço fixo invisível no fim reserva a área do traço.
const GRIFFITHS_TAIL = ' '
function withGriffithsTail(children, style) {
  if (Platform.OS !== 'android' || children === null || children === undefined || children === '' || !isGriffiths(style)) return children
  return Array.isArray(children) ? [...children, GRIFFITHS_TAIL] : [children, GRIFFITHS_TAIL]
}
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
// Alto contraste de verdade: qualquer texto escuro ou médio (cinzas, azuis, verdes) vira
// quase preto; textos claros (branco, verde-limão) ficam como estão, pois estão sobre fundo escuro.
function contrastColor(color) {
  const rgb = parseColor(color)
  if (!rgb) return null
  const light = luminance(rgb)
  if (light < 0.6) return light > 0.012 ? CONTRAST_DARK : null
  return light < 0.85 ? '#ffffff' : null
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
  // Mais espaço entre linhas: altura de linha de pelo menos 1,6× o tamanho da letra.
  if (!decorative && !fixedSize && accessibility.settings.lineSpacing) {
    const size = changes.fontSize ?? flat.fontSize ?? 14
    const current = changes.lineHeight ?? flat.lineHeight ?? size * 1.25
    changes.lineHeight = Math.round(Math.max(current, size * 1.6))
  }
  if (accessibility.settings.boldText && typeof family === 'string' && /^Poppins_(400Regular|500Medium)$/.test(family)) {
    changes.fontFamily = BOLD_FAMILY
  }
  if (accessibility.settings.highContrast) {
    const color = contrastColor(flat.color)
    if (color) changes.color = color
    // Textos sublinhados continuam sublinhados e ganham mais peso.
    if (flat.textDecorationLine === 'underline') changes.fontFamily = BOLD_FAMILY
  }
  return Object.keys(changes).length ? [style, changes] : style
}

// `fixedSize`: para textos dentro de caixas de tamanho fixo (selos numéricos, barra de navegação).
// Eles recebem negrito e contraste, mas não crescem, para não vazar da caixa.
export const Text = forwardRef(function AppText({ style, fixedSize = false, children, ...props }, ref) {
  const accessibility = useAccessibility()
  return <NativeText ref={ref} maxFontSizeMultiplier={1} {...props} style={[androidBase(style), adaptStyle(style, accessibility, fixedSize), androidAfter(style)]}>{withGriffithsTail(children, style)}</NativeText>
})

export const TextInput = forwardRef(function AppTextInput({ style, ...props }, ref) {
  const accessibility = useAccessibility()
  return <NativeTextInput ref={ref} maxFontSizeMultiplier={1} {...props} style={[androidBase(style), adaptStyle(style, accessibility)]} />
})
