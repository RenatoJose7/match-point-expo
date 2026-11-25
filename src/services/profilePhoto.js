import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

// A foto de perfil fica no próprio registro do usuário no Firestore (o projeto usa o plano
// gratuito, sem Cloud Storage). Fotos de celular têm de 2 a 5 MB e um documento do Firestore
// aceita no máximo 1 MB, então a imagem é reduzida para 480 px de largura em JPEG antes de salvar.
const PHOTO_WIDTH = 480
const PHOTO_QUALITY = 0.7
// Folga para os demais campos do documento (o limite do Firestore é 1 MiB).
export const MAX_PHOTO_DATA_URI_LENGTH = 400 * 1024

export async function compressProfilePhoto(uri) {
  const context = ImageManipulator.manipulate(uri)
  context.resize({ width: PHOTO_WIDTH })
  const image = await context.renderAsync()
  const result = await image.saveAsync({ compress: PHOTO_QUALITY, format: SaveFormat.JPEG, base64: true })
  return `data:image/jpeg;base64,${result.base64}`
}

export function isInlinePhoto(value) {
  return typeof value === 'string' && value.startsWith('data:image/')
}
