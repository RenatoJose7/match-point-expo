import { registerRootComponent } from 'expo'
import { Text, TextInput } from 'react-native'
import App from './App'

// Garantia de legibilidade para qualquer texto que não tenha um estilo local.
Text.defaultProps = Text.defaultProps || {}
Text.defaultProps.style = [{ fontFamily: 'Poppins_400Regular', fontSize: 13 }, Text.defaultProps.style]

TextInput.defaultProps = TextInput.defaultProps || {}
TextInput.defaultProps.style = [{ fontFamily: 'Poppins_400Regular', fontSize: 13 }, TextInput.defaultProps.style]

registerRootComponent(App)
