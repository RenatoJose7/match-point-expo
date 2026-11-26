// Trava a escala de fonte do sistema Android dentro do app.
// As telas seguem o modelo do Figma (src/theme/canvas.js); com "fonte grande" no celular
// os textos estouravam botões, cartões e campos e sumiam atrás de outros elementos.
// Quem precisa de letra maior usa o painel de acessibilidade do próprio app.
const { withMainActivity } = require('expo/config-plugins')

const MAX_FONT_SCALE = '1.0f'

const IMPORTS = ['import android.content.Context', 'import android.content.res.Configuration']

const METHOD = `
  // MatchPoint: limita a escala de fonte do sistema (plugins/withFontScaleLimit.js).
  override fun attachBaseContext(newBase: Context) {
    val configuration = Configuration(newBase.resources.configuration)
    if (configuration.fontScale > ${MAX_FONT_SCALE}) {
      configuration.fontScale = ${MAX_FONT_SCALE}
    }
    super.attachBaseContext(newBase.createConfigurationContext(configuration))
  }
`

function addFontScaleLimit(contents) {
  if (contents.includes('MatchPoint: limita a escala de fonte')) return contents
  if (contents.includes('fun attachBaseContext')) {
    throw new Error('withFontScaleLimit: MainActivity já define attachBaseContext; ajuste o plugin manualmente.')
  }

  let next = contents
  const packageLine = next.match(/^package .*$/m)
  if (!packageLine) throw new Error('withFontScaleLimit: não encontrei a linha package da MainActivity.')
  const missingImports = IMPORTS.filter((line) => !next.includes(line))
  if (missingImports.length) {
    next = next.replace(packageLine[0], `${packageLine[0]}\n\n${missingImports.join('\n')}`)
  }

  const classLine = next.match(/class MainActivity\s*:\s*ReactActivity\(\)\s*\{/)
  if (!classLine) throw new Error('withFontScaleLimit: não encontrei a classe MainActivity em Kotlin.')
  return next.replace(classLine[0], `${classLine[0]}${METHOD}`)
}

module.exports = function withFontScaleLimit(config) {
  return withMainActivity(config, (modConfig) => {
    if (modConfig.modResults.language !== 'kt') {
      throw new Error('withFontScaleLimit: esperado MainActivity em Kotlin.')
    }
    modConfig.modResults.contents = addFontScaleLimit(modConfig.modResults.contents)
    return modConfig
  })
}

module.exports.addFontScaleLimit = addFontScaleLimit
