import React, { useEffect, useState } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { BLUE } from '../../theme/colors'

export function ProfilePhotoPicker({ repositories, session, onUpdated, size = 76 }) {
  const [photoUrl, setPhotoUrl] = useState(session?.fotoUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setPhotoUrl(session?.fotoUrl ?? '')
  }, [session?.fotoUrl])

  const choosePhoto = async () => {
    if (uploading || !session?.id) return

    setMessage('')
    const selection = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
      multiple: false,
    })
    if (selection.canceled || !selection.assets?.[0]) return

    setUploading(true)
    const upload = await repositories.storage.enviarFotoPerfil(selection.assets[0])
    if (!upload.ok) {
      setMessage(upload.mensagem || 'Não foi possível enviar a foto.')
      setUploading(false)
      return
    }

    const update = await repositories.users.atualizarUsuario(session.id, {
      fotoUrl: upload.data.fotoUrl,
    })
    if (!update.ok) {
      setMessage(update.mensagem || 'A foto foi enviada, mas o perfil não pôde ser atualizado.')
      setUploading(false)
      return
    }

    setPhotoUrl(update.data.fotoUrl)
    setMessage('Foto atualizada.')
    setUploading(false)
    onUpdated?.(update.data)
  }

  const initials = (session?.nome || 'MP').trim().slice(0, 2).toUpperCase()

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <Text style={styles.initials}>{initials}</Text>
        )}
      </View>
      <Pressable accessibilityRole="button" onPress={choosePhoto} disabled={uploading} style={styles.action}>
        <Text style={styles.actionText}>{uploading ? 'Enviando...' : photoUrl ? 'Alterar foto' : 'Adicionar foto'}</Text>
      </Pressable>
      {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 7, marginBottom: 10 },
  avatar: { backgroundColor: '#eaf0f4', borderColor: '#ffffff', borderWidth: 3, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: '100%' },
  initials: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  action: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 12 },
  actionText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, textDecorationLine: 'underline' },
  message: { color: '#126b35', fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center' },
})
