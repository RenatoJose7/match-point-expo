import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BottomNav } from '../components/navigation/BottomNav'

export function OperationsScreen({ back, go, repositories, session, routeParams = {} }) {
  const admin = session?.tipo === 'administrador'
  const institution = session?.tipo === 'instituicao'
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [athleteId, setAthleteId] = useState(routeParams.athleteId || '')
  const [opportunityId, setOpportunityId] = useState(routeParams.opportunityId || '')
  const [status, setStatus] = useState('')
  const [reports, setReports] = useState([])
  const [accounts, setAccounts] = useState([])
  const [resources, setResources] = useState([])

  const load = async () => {
    if (admin) {
      const [reportResult, accountResult, resourceResult] = await Promise.all([repositories.administration.listarRelatos(), repositories.administration.listarContasParceiras(), repositories.administration.listarRecursos()])
      if (reportResult.ok) setReports(reportResult.data)
      if (accountResult.ok) setAccounts(accountResult.data)
      if (resourceResult.ok) setResources(resourceResult.data)
      return
    }
    const result = await repositories.reports.listarMeusRelatos()
    if (result.ok) setReports(result.data)
  }
  useEffect(() => { load() }, [session?.id])

  const sendReport = async () => { const result = await repositories.reports.enviarRelato({ mensagem: message }); setStatus(result.ok ? 'Relato enviado para acompanhamento.' : result.mensagem); if (result.ok) { setMessage(''); load() } }
  const saveResource = async () => { const result = await repositories.administration.salvarRecurso({ titulo: title, tipo: 'orientacao' }); setStatus(result.ok ? 'Recurso salvo.' : result.mensagem); if (result.ok) { setTitle(''); load() } }
  const audit = async () => { const result = await repositories.administration.auditarMatchScore(athleteId, opportunityId); setStatus(result.ok ? `Auditoria concluída: ${result.data.versao}.` : result.mensagem) }
  const decide = async (id, decisao) => { const result = await repositories.administration.decidirConta({ tipo: 'parceiro', id, decisao }); setStatus(result.ok ? 'Decisão administrativa registrada.' : result.mensagem); if (result.ok) load() }
  const support = async () => { const partner = await repositories.users.obterPerfilParceiroPorUsuario(session.id); if (!partner.ok) return setStatus(partner.mensagem); const result = await repositories.support.registrarApoio({ instituicaoId: partner.data.id, atletaId: routeParams.athleteId, oportunidadeId: routeParams.opportunityId, descricao: message }); setStatus(result.ok ? 'Apoio registrado.' : result.mensagem); if (result.ok) setMessage('') }

  return <View style={styles.page}><View style={styles.header}><Pressable onPress={back}><Text style={styles.back}>Voltar</Text></Pressable><Text style={styles.title}>{admin ? 'Administração' : institution ? 'Registrar apoio' : 'Enviar relato'}</Text></View><ScrollView contentContainerStyle={styles.content}>{status ? <Text style={styles.status}>{status}</Text> : null}{admin ? <><Text style={styles.label}>Novo recurso da plataforma</Text><TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Título do recurso" /><Pressable onPress={saveResource} style={styles.button}><Text style={styles.buttonText}>Salvar recurso</Text></Pressable>{resources.map((item) => <View key={item.id} style={styles.card}><Text>{item.titulo}</Text></View>)}<Text style={styles.label}>Auditar Match Score</Text><TextInput value={athleteId} onChangeText={setAthleteId} style={styles.input} placeholder="ID do atleta" /><TextInput value={opportunityId} onChangeText={setOpportunityId} style={styles.input} placeholder="ID da oportunidade" /><Pressable onPress={audit} style={styles.button}><Text style={styles.buttonText}>Auditar cálculo</Text></Pressable><Text style={styles.label}>Contas parceiras</Text>{accounts.map((item) => <View key={item.id} style={styles.card}><Text>{item.nomeExibicao || item.id}</Text><Text style={styles.muted}>{item.statusAdministrativo || 'sem decisão'}</Text><View style={styles.actions}><Pressable onPress={() => decide(item.id, 'aprovada')}><Text style={styles.action}>Aprovar</Text></Pressable><Pressable onPress={() => decide(item.id, 'suspensa')}><Text style={styles.action}>Suspender</Text></Pressable></View></View>)}<Text style={styles.label}>Relatos abertos</Text>{reports.map((item) => <View key={item.id} style={styles.card}><Text>{item.mensagem}</Text><Text style={styles.muted}>{item.status}</Text></View>)}</> : <><Text style={styles.label}>{institution ? 'Descreva o apoio concedido ao atleta' : 'Descreva o problema ou sugestão'}</Text><TextInput value={message} onChangeText={setMessage} multiline style={[styles.input, styles.multiline]} placeholder="Escreva aqui" /><Pressable onPress={institution ? support : sendReport} style={styles.button}><Text style={styles.buttonText}>{institution ? 'Registrar apoio' : 'Enviar relato'}</Text></Pressable>{!institution && reports.map((item) => <View key={item.id} style={styles.card}><Text>{item.mensagem}</Text><Text style={styles.muted}>{item.status}</Text></View>)}</>}</ScrollView><BottomNav go={go} role={session?.tipo === 'treinador' ? 'trainer' : session?.tipo === 'instituicao' ? 'institution' : 'athlete'} /></View>
}
const styles = StyleSheet.create({ page:{flex:1,backgroundColor:'#f5f8f7'},header:{padding:22,gap:10,backgroundColor:'#0d4730'},back:{color:'#c4ff32',fontFamily:'Poppins_600SemiBold'},title:{color:'#fff',fontSize:22,fontFamily:'Poppins_600SemiBold'},content:{padding:20,gap:12},label:{color:'#183126',fontFamily:'Poppins_600SemiBold'},input:{minHeight:48,borderWidth:1,borderColor:'#cddbd0',borderRadius:8,padding:12,backgroundColor:'#fff'},multiline:{minHeight:130,textAlignVertical:'top'},button:{backgroundColor:'#236b46',borderRadius:8,padding:14,alignItems:'center'},buttonText:{color:'#fff',fontFamily:'Poppins_600SemiBold'},status:{color:'#164d34',backgroundColor:'#eaf6ed',padding:12,borderRadius:8},card:{backgroundColor:'#fff',borderRadius:8,padding:12,gap:4},muted:{color:'#64756b',fontSize:12},actions:{flexDirection:'row',gap:16},action:{color:'#164d34',fontFamily:'Poppins_600SemiBold'} })
