export function withGriffithsWeight(styleDefinitions) {
  return Object.fromEntries(
    Object.entries(styleDefinitions).map(([name, style]) => {
      if (style?.fontFamily !== 'Griffiths') return [name, style]

      const {
        fontWeight,
        textShadowColor,
        textShadowOffset,
        textShadowRadius,
        ...cleanStyle
      } = style

      const largeScreenTitles = new Set([
        'title',
        'heading',
        'headerTitle',
        'listTitle',
        'notificationsTitle',
        'womenTitle',
        'opportunityCandidatesTitle',
      ])
      const choiceTitles = new Set(['choiceHeading', 'choiceBrand', 'profileTitle'])
      const formTitles = new Set(['signupTitle', 'areaTitle'])
      const compactCardTitle = /(?:cardScript|cardTitle|bannerTitle|trainerCardTitle|trainerBannerTitle)/i.test(name)
      const minimum = largeScreenTitles.has(name)
        ? 40
        : choiceTitles.has(name)
          ? 32
          : formTitles.has(name)
            ? 40
            : compactCardTitle
              ? 26
              : 25
      const fontSize = compactCardTitle
        ? 26
        : Math.max(Number(style.fontSize ?? minimum), minimum)
      const originalLineHeight = Number(style.lineHeight)

      // A Griffiths é inclinada: a última letra passa da caixa do texto e era cortada
      // ("desempenh", "perfi"). Uma folga à direita mantém a palavra inteira.
      const existingRight = Number(cleanStyle.paddingRight ?? cleanStyle.paddingHorizontal ?? cleanStyle.padding ?? 0) || 0
      const paddingRight = Math.max(existingRight, griffithsOverhang(fontSize))

      return [
        name,
        {
          ...cleanStyle,
          paddingRight,
          fontWeight: '400',
          fontSize,
          ...(compactCardTitle
            ? { lineHeight: 30 }
            : Number.isFinite(originalLineHeight) ? { lineHeight: Math.max(originalLineHeight, fontSize) } : {}),
        },
      ]
    }),
  )
}

// Folga à direita, proporcional ao tamanho, para o traço inclinado final da Griffiths.
export function griffithsOverhang(fontSize) {
  return Math.ceil((Number(fontSize) || 26) * 0.3)
}

// Para estilos Griffiths que não passam por withGriffithsWeight.
export function griffithsSafe(style) {
  const existingRight = Number(style.paddingRight ?? style.paddingHorizontal ?? style.padding ?? 0) || 0
  return { ...style, paddingRight: Math.max(existingRight, griffithsOverhang(style.fontSize)) }
}

// Aplica griffithsSafe a todos os estilos Griffiths de um StyleSheet, sem mudar tamanhos.
export function withGriffithsOverhang(styleDefinitions) {
  return Object.fromEntries(
    Object.entries(styleDefinitions).map(([name, style]) => [
      name,
      style?.fontFamily === 'Griffiths' ? griffithsSafe(style) : style,
    ]),
  )
}

// Tamanho da Griffiths para um texto de uma linha caber em `availableWidth`.
// A largura média de cada caractere fica perto de 0,45 do tamanho da fonte.
export function fitGriffithsSize(text, availableWidth, maxSize, minSize = 22) {
  const characters = Math.max(String(text ?? '').length, 1)
  const fitted = Math.floor(availableWidth / (characters * 0.45))
  return Math.max(minSize, Math.min(maxSize, fitted))
}

// Valores que costumam ser números curtos ("#24", "94%", "3"), mas podem chegar como texto
// livre digitado pelo usuário ("Não possuo ranking", "Ainda não participei").
// Até `fits` caracteres ficam no tamanho do modelo; números maiores ("100%") encolhem na
// proporção; frases usam `textSize` (com quebra de linha) para nunca sair do cartão.
export function isNumericValue(value) {
  return /^[#\d.,%º°\s/-]+$/.test(String(value ?? '').trim())
}

export function fitValue(value, fontSize, { fits = 4, textSize, lineRatio = 1.08 } = {}) {
  const text = String(value ?? '').trim()
  if (text.length <= fits) return { fontSize, lineHeight: Math.round(fontSize * lineRatio) }
  if (isNumericValue(text)) {
    const size = Math.max(Math.round((fontSize * fits) / text.length), Math.round(fontSize * 0.6))
    return { fontSize: size, lineHeight: Math.round(size * lineRatio) }
  }
  const size = textSize ?? Math.max(13, Math.round(fontSize * 0.45))
  return { fontSize: size, lineHeight: Math.round(size * 1.3) }
}
