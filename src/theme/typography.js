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

      return [
        name,
        {
          ...cleanStyle,
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
