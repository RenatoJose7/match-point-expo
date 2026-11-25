export const BLUE = '#10579b'
export const GREEN = '#c4ff32'
export const DARK_GREEN = '#126b35'

// Camada que cobre o pai inteiro (fundos, sombras, véus).
// O React Native 0.86 removeu StyleSheet.absoluteFillObject: no Android ele virava "undefined"
// e essas camadas passavam a ocupar espaço, empurrando o conteúdo para fora da tela.
// Esta constante funciona igual no Android, no iOS e na web.
export const ABSOLUTE_FILL = Object.freeze({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 })
