import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native'

const BLUE = '#10579b'

export const SELECT_OPTIONS = Object.freeze({
  modalidades: ['Tênis', 'Beach Tennis', 'Tênis de Mesa', 'Padel', 'Pickleball'],
  categorias: ['Sub-12', 'Sub-14', 'Sub-16', 'Sub-18', 'Adulto', '35+'],
  locais: ['Rio Branco - AC', 'Maceió - AL', 'Macapá - AP', 'Manaus - AM', 'Salvador - BA', 'Fortaleza - CE', 'Brasília - DF', 'Vitória - ES', 'Goiânia - GO', 'São Luís - MA', 'Cuiabá - MT', 'Campo Grande - MS', 'Belo Horizonte - MG', 'Belém - PA', 'João Pessoa - PB', 'Curitiba - PR', 'Recife - PE', 'Teresina - PI', 'Rio de Janeiro - RJ', 'Natal - RN', 'Porto Alegre - RS', 'Porto Velho - RO', 'Boa Vista - RR', 'Florianópolis - SC', 'São Paulo - SP', 'Aracaju - SE', 'Palmas - TO'],
  beneficios: ['Bolsa integral', 'Bolsa parcial', 'Ajuda de custo', 'Treinamentos', 'Equipamentos', 'Hospedagem', 'Transporte'],
  tipoInstituicao: ['Clube esportivo', 'Academia', 'Escola', 'Universidade', 'Empresa', 'Instituto / ONG'],
  parentescos: ['Mãe', 'Pai', 'Avó', 'Avô', 'Irmã / Irmão', 'Tutor(a) legal'],
  maoDominante: ['Destro(a)', 'Canhoto(a)', 'Ambidestro(a)'],
  posicoes: ['Simples', 'Duplas', 'Simples e duplas'],
  tempoDePratica: ['Iniciante', 'Até 1 ano', 'De 1 a 3 anos', 'De 3 a 5 anos', 'Mais de 5 anos'],
  disponibilidade: ['Manhã', 'Tarde', 'Noite', 'Manhã e tarde', 'Tarde e noite', 'Todos os períodos'],
  viagens: ['Sim, sem restrições', 'Sim, dentro do estado', 'Sim, no Brasil', 'Não no momento'],
  distancias: ['Até 10 km', 'Até 30 km', 'Até 50 km', 'Até 100 km', 'Sem limite'],
  notas: ['1', '2', '3', '4', '5'],
})

export function SelectField({ accessibilityLabel, options, placeholder = 'Selecione uma opção', value, onChange, triggerStyle }) {
  const { width, height } = useWindowDimensions()
  const appFrameWidth = width <= 430 ? width : Math.min(height * (402 / 874), 430)
  const [visible, setVisible] = useState(false)
  const [search, setSearch] = useState('')
  const label = accessibilityLabel || placeholder
  const typedValue = search.trim()
  const normalizedSearch = typedValue.toLocaleLowerCase('pt-BR')
  const filteredOptions = options.filter((option) => option.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
  const canUseTypedValue = typedValue.length > 0 && !options.some((option) => option.toLocaleLowerCase('pt-BR') === normalizedSearch)

  const close = () => {
    setSearch('')
    setVisible(false)
  }

  return (
    <>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityHint="Abre as opções disponíveis"
        accessibilityState={{ expanded: visible }}
        onPress={() => setVisible(true)}
        style={[styles.trigger, triggerStyle]}
      >
        <Text numberOfLines={2} style={[styles.triggerText, !value && styles.placeholder]}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={BLUE} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <View style={[styles.backdrop, { width: appFrameWidth }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar opções" onPress={close} style={styles.backdropDismiss} />
          <View accessibilityRole="menu" style={styles.menu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>{label}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={close} hitSlop={10}>
                <Ionicons name="close" size={22} color={BLUE} />
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel={`Pesquisar ou escrever ${label}`}
              value={search}
              onChangeText={setSearch}
              placeholder="Pesquisar ou escrever uma opção"
              placeholderTextColor="#6a7d86"
              style={styles.searchInput}
            />
            <ScrollView contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
              {canUseTypedValue ? <Pressable accessibilityRole="button" onPress={() => { onChange(typedValue); close() }} style={styles.customOption}>
                <Ionicons name="add-circle-outline" size={18} color={BLUE} />
                <Text style={styles.customOptionText}>Usar “{typedValue}”</Text>
              </Pressable> : null}
              {filteredOptions.map((option) => {
                const selected = option === value
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => { onChange(option); close() }}
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
                    {selected ? <Ionicons name="checkmark" size={18} color={BLUE} /> : null}
                  </Pressable>
                )
              })}
              {filteredOptions.length === 0 && !canUseTypedValue ? <Text style={styles.empty}>Nenhuma opção encontrada.</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: { minHeight: 48, borderWidth: 1, borderColor: '#c8d5d8', borderRadius: 8, backgroundColor: '#ffffff', alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  triggerText: { color: '#17313c', flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 13, marginRight: 8 },
  placeholder: { color: '#6a7d86' },
  backdrop: { flex: 1, alignSelf: 'flex-start', backgroundColor: 'rgba(10, 31, 54, .45)', justifyContent: 'flex-end' },
  backdropDismiss: { ...StyleSheet.absoluteFillObject },
  menu: { width: '100%', maxHeight: '70%', backgroundColor: '#ffffff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 28 },
  menuHeader: { alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e1e8eb', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 17 },
  menuTitle: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  searchInput: { height: 46, marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderColor: '#c8d5d8', borderRadius: 9, color: '#17313c', fontFamily: 'Poppins_400Regular', fontSize: 13, paddingHorizontal: 12 },
  options: { padding: 12, gap: 6 },
  customOption: { minHeight: 46, alignItems: 'center', borderRadius: 8, flexDirection: 'row', gap: 8, paddingHorizontal: 13, backgroundColor: '#eaf2fb' },
  customOptionText: { color: BLUE, flex: 1, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  option: { minHeight: 46, alignItems: 'center', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 13 },
  optionSelected: { backgroundColor: '#eaf2fb' },
  optionText: { color: '#344b55', fontFamily: 'Poppins_400Regular', fontSize: 13 },
  optionTextSelected: { color: BLUE, fontFamily: 'Poppins_600SemiBold' },
  empty: { color: '#6a7d86', fontFamily: 'Poppins_400Regular', fontSize: 13, padding: 12, textAlign: 'center' },
})
