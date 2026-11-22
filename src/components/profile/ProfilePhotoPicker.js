import React, { useEffect, useState } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BLUE } from '../../theme/colors'

export function ProfilePhotoPicker({ repositories, session, onUpdated, size = 76, compact = false }) {
  const [photoUrl, setPhotoUrl] = useState(session?.fotoUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [message, setMessageState] = useState('')
  // No cabeçalho não há espaço para texto: avisos de erro aparecem em um alerta.
  const setMessage = (text) => {
    if (compact) {
      if (text && text !== 'Foto atualizada.') Alert.alert('Foto de perfil', text)
      return
    }
    setMessageState(text)
  }

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

  // Versão do cabeçalho: só a foto, com um selo de câmera; tocar nela troca a foto.
  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={photoUrl ? 'Alterar foto de perfil' : 'Adicionar foto de perfil'}
        onPress={choosePhoto}
        disabled={uploading}
        style={({ pressed }) => [{ width: size, height: size }, pressed && { opacity: 0.85 }]}
      >
        <View style={[styles.avatar, styles.avatarCompact, { width: size, height: size, borderRadius: size / 2 }]}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
          ) : (
            <Text style={[styles.initials, { fontSize: Math.round(size * 0.34) }]}>{uploading ? '…' : initials}</Text>
          )}
        </View>
        <View style={styles.cameraBadge}>
          <Ionicons name="camera" size={11} color={BLUE} />
        </View>
      </Pressable>
    )
  }

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
  initials: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 18 },
  action: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 12 },
  actionText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, textDecorationLine: 'underline' },
  avatarCompact: { backgroundColor: '#ffffff', borderWidth: 0 },
  cameraBadge: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#c4ff32', borderWidth: 2, borderColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  message: { color: '#126b35', fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center' },
})
