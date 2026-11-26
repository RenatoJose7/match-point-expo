import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler, KeyboardAvoidingView, Platform, View, useWindowDimensions } from 'react-native'
import { Text } from './src/components/accessibility/AppText'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import { ScreenTransition } from './src/components/motion'
import { LoadingScreen } from './src/components/ui/LoadingScreen'
import { LoadingOverlay } from './src/components/ui/LoadingOverlay'
import { AccessibilityProvider } from './src/components/accessibility/AccessibilityContext'
import { AccessibilityPanel } from './src/components/accessibility/AccessibilityPanel'
import { getHomeRouteForUser } from './src/core/session'
import { createRepositories } from './src/repositories'
import {
  ApplicationDetailScreen,
  ApplicationInfoScreen,
  ApplicationStatusScreen,
  ApplicationsScreen,
  AthleteAreaStepOneScreen,
  AthleteAreaStepTwoScreen,
  AthleteDetailScreen,
  AthleteHomeScreen,
  AthleteOpportunitiesScreen,
  AthleteProfileScreen,
  AthleteSignupScreen,
  CandidatesScreen,
  CreatedOpportunitiesScreen,
  InstitutionHomeScreen,
  InstitutionProfileScreen,
  InstitutionSignupScreen,
  LoginScreen,
  MatchScoreScreen,
  NotificationsScreen,
  OperationsScreen,
  OpeningScreen,
  OpportunityDetailScreen,
  PartnerCandidateProfileScreen,
  PartnerOpportunityCandidatesScreen,
  PartnerOpportunityDetailScreen,
  PartnerOpportunityFormScreen,
  PartnerOpportunitiesScreen,
  ProfileChoiceScreen,
  RecoveryEmailScreen,
  RecoveryInboxScreen,
  RecoveryResetScreen,
  ResponsibleAthleteProfileScreen,
  ResponsibleHomeScreen,
  ResponsibleSignupScreen,
  TrainerHomeScreen,
  TrainerProfileScreen,
  TechnicalEvaluationsScreen,
  TrainerSignupScreen,
  TelaPerfilAtletaTecnico,
  WomenInSportScreen,
} from './src/screens'
import { styles } from './src/theme/styles'
import { getFrameWidth } from './src/theme/layout'
import { AppCanvas } from './src/theme/canvas'

// Na versão web o app imita a tela do celular: sem barras de rolagem do navegador
// e sem o "puxa e volta" que não existe no aplicativo.
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('matchpoint-app-chrome')) {
  const appChrome = document.createElement('style')
  appChrome.id = 'matchpoint-app-chrome'
  appChrome.textContent = [
    '* { scrollbar-width: none; -ms-overflow-style: none; -webkit-tap-highlight-color: transparent; }',
    '*::-webkit-scrollbar { display: none; width: 0; height: 0; }',
    'html, body { overscroll-behavior: none; }',
  ].join('\n')
  document.head.appendChild(appChrome)
}

const KEYBOARD_AREA = { flex: 1, width: '100%' }
// Com internet ruim, a consulta do perfil na abertura não pode prender a tela de carregamento.
const withTimeout = (promise, ms = 5000) => Promise.race([
  promise,
  new Promise((resolve) => setTimeout(() => resolve({ ok: false, timeout: true }), ms)),
])

// Fora do quadro do app (tablets e telas largas) aparece o azul da marca.
const ROOT_STYLE = Platform.OS === 'web' ? undefined : { flex: 1, backgroundColor: '#0d4a85' }

// Ao abrir a escolha de perfil e os cadastros, a bolinha de tênis aparece por um instante.
const LOADER_ROUTES = new Set(['choice', 'signupAthlete', 'signupTrainer', 'signupInstitution', 'signupResponsible'])

const ROUTES = {
  opening: OpeningScreen,
  login: LoginScreen,
  choice: ProfileChoiceScreen,
  recovery1: RecoveryEmailScreen,
  recovery2: RecoveryInboxScreen,
  recovery3: RecoveryResetScreen,
  signupAthlete: AthleteSignupScreen,
  signupTrainer: TrainerSignupScreen,
  signupInstitution: InstitutionSignupScreen,
  signupResponsible: ResponsibleSignupScreen,
  athleteArea1: AthleteAreaStepOneScreen,
  athleteArea2: AthleteAreaStepTwoScreen,
  homeAthlete: AthleteHomeScreen,
  homeTrainer: TrainerHomeScreen,
  homeInstitution: InstitutionHomeScreen,
  homeResponsible: ResponsibleHomeScreen,
  notifications: NotificationsScreen,
  operations: OperationsScreen,
  administration: OperationsScreen,
  women: WomenInSportScreen,
  opportunitiesAthlete: AthleteOpportunitiesScreen,
  opportunitiesTrainer: PartnerOpportunitiesScreen,
  opportunitiesInstitution: PartnerOpportunitiesScreen,
  opportunitiesCreated: CreatedOpportunitiesScreen,
  candidates: CandidatesScreen,
  profileAthlete: AthleteProfileScreen,
  profileTrainer: TrainerProfileScreen,
  profileInstitution: InstitutionProfileScreen,
  applications: ApplicationsScreen,
  applicationDetail: ApplicationDetailScreen,
  matchScore: MatchScoreScreen,
  opportunityDetail: OpportunityDetailScreen,
  partnerOpportunityCandidates: PartnerOpportunityCandidatesScreen,
  partnerOpportunityDetail: PartnerOpportunityDetailScreen,
  partnerOpportunityForm: PartnerOpportunityFormScreen,
  partnerCandidateProfile: PartnerCandidateProfileScreen,
  technicalEvaluations: TechnicalEvaluationsScreen,
  responsibleAthleteProfile: ResponsibleAthleteProfileScreen,
  applicationInfo: ApplicationInfoScreen,
  applicationStatus: ApplicationStatusScreen,
  athleteDetail: AthleteDetailScreen,
  criarOportunidadeTecnico: PartnerOpportunityFormScreen,
  criarOportunidadeInicioTecnico: PartnerOpportunityFormScreen,
  oportunidadesCriadasTecnico: PartnerOpportunitiesScreen,
  perfilAtletaTecnico: TelaPerfilAtletaTecnico,
}

const HISTORY = {
  login: 'opening',
  choice: 'opening',
  recovery1: 'login',
  recovery2: 'recovery1',
  recovery3: 'recovery2',
  signupAthlete: 'choice',
  signupTrainer: 'choice',
  signupInstitution: 'choice',
  signupResponsible: 'signupAthlete',
  athleteArea1: 'signupAthlete',
  athleteArea2: 'athleteArea1',
  homeAthlete: 'athleteArea2',
  homeTrainer: 'signupTrainer',
  homeInstitution: 'signupInstitution',
  homeResponsible: 'opening',
  notifications: 'homeAthlete',
  operations: 'homeAthlete',
  administration: 'opening',
  women: 'homeAthlete',
  opportunitiesAthlete: 'homeAthlete',
  opportunitiesTrainer: 'homeTrainer',
  opportunitiesInstitution: 'homeInstitution',
  opportunitiesCreated: 'opportunitiesInstitution',
  candidates: 'opportunitiesTrainer',
  profileAthlete: 'homeAthlete',
  profileTrainer: 'homeTrainer',
  profileInstitution: 'homeInstitution',
  applications: 'homeAthlete',
  applicationDetail: 'applications',
  matchScore: 'opportunitiesAthlete',
  opportunityDetail: 'matchScore',
  partnerOpportunityCandidates: 'partnerOpportunityDetail',
  partnerOpportunityDetail: 'opportunitiesInstitution',
  partnerOpportunityForm: 'opportunitiesInstitution',
  partnerCandidateProfile: 'partnerOpportunityCandidates',
  technicalEvaluations: 'homeTrainer',
  responsibleAthleteProfile: 'homeResponsible',
  applicationInfo: 'opportunityDetail',
  applicationStatus: 'applicationInfo',
  athleteDetail: 'candidates',
  partnerOpportunityDetail: 'opportunitiesTrainer',
  partnerOpportunityForm: 'opportunitiesTrainer',
  criarOportunidadeTecnico: 'opportunitiesTrainer',
  criarOportunidadeInicioTecnico: 'homeTrainer',
  oportunidadesCriadasTecnico: 'opportunitiesTrainer',
  perfilAtletaTecnico: 'candidates',
}

// Um APK gerado sem as variáveis do Firebase cai no modo em memória e perde tudo ao fechar.
// O aviso deixa isso visível em vez de os dados "sumirem" sem explicação.
const IS_DEMO_NATIVE_BUILD = Platform.OS !== 'web'
  && !__DEV__
  && (process.env.EXPO_PUBLIC_DATA_PROVIDER ?? 'memory') === 'memory'
const DEMO_BANNER = { backgroundColor: '#f5a524', paddingVertical: 3, paddingHorizontal: 10 }
const DEMO_BANNER_TEXT = { color: '#3b2600', fontFamily: 'Poppins_500Medium', fontSize: 11, textAlign: 'center' }

const ROOT_ROUTES = new Set(['opening', 'athleteArea1', 'homeAthlete', 'homeTrainer', 'homeInstitution', 'homeResponsible'])

const TAB_POSITION = {
  homeAthlete: 0,
  opportunitiesAthlete: 1,
  applications: 2,
  profileAthlete: 3,
  homeTrainer: 0,
  opportunitiesTrainer: 1,
  profileTrainer: 2,
  homeInstitution: 0,
  homeResponsible: 0,
  opportunitiesInstitution: 1,
  opportunitiesCreated: 1,
  partnerOpportunityCandidates: 1,
  partnerOpportunityDetail: 1,
  partnerOpportunityForm: 1,
  partnerCandidateProfile: 1,
  technicalEvaluations: 1,
  responsibleAthleteProfile: 0,
  criarOportunidadeTecnico: 1,
  criarOportunidadeInicioTecnico: 1,
  oportunidadesCriadasTecnico: 1,
  perfilAtletaTecnico: 1,
  profileInstitution: 2,
}

export default function App() {
  return (
    <SafeAreaProvider style={ROOT_STYLE}>
      <AccessibilityProvider>
        <MatchPointApp />
      </AccessibilityProvider>
    </SafeAreaProvider>
  )
}

function MatchPointApp() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular: require('./assets/Poppins-Regular.ttf'),
    Poppins_500Medium: require('./assets/Poppins-Medium.ttf'),
    Poppins_600SemiBold: require('./assets/Poppins-SemiBold.ttf'),
    Griffiths: require('./assets/Griffiths.otf'),
  })
  const { width, height } = useWindowDimensions()
  // O Android desenha o app por baixo das barras do sistema (edge-to-edge obrigatório).
  // Reservamos o espaço delas uma única vez aqui: azul da marca em cima, branco embaixo.
  const insets = useSafeAreaInsets()
  const systemBars = Platform.OS === 'web'
    ? null
    : { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#10579b' }
  const repositories = useMemo(() => createRepositories(), [])
  const [route, setRoute] = useState({ name: 'opening', params: {} })
  const routeHistory = useRef([])
  const [session, setSession] = useState(null)
  const [sessionResolved, setSessionResolved] = useState(false)
  const transitionDirection = useRef(1)
  const [loaderTrigger, setLoaderTrigger] = useState(0)
  const isPhoneViewport = width <= 430
  const frameWidth = getFrameWidth(width, height)
  const frameHeight = isPhoneViewport ? height : frameWidth * (874 / 402)
  // Na web o quadro imita um celular de 402x874. No celular ele ocupa a tela inteira e o
  // AppCanvas (src/theme/canvas.js) encaixa o layout do modelo em qualquer tamanho de tela.
  const frameSize = Platform.OS === 'web' ? { width: frameWidth, height: frameHeight } : { flexGrow: 1, flexShrink: 1, width: '100%', alignSelf: 'center' }

  const sessionUserId = useRef(null)

  useEffect(() => {
    const unsubscribe = repositories.authentication.observarSessao(async (nextSession) => {
      setSession(nextSession)

      if (!nextSession) {
        sessionUserId.current = null
        routeHistory.current = []
        setRoute({ name: 'opening', params: {} })
        setSessionResolved(true)
        return
      }

      // Atualizar foto ou nome também avisa a sessão: só redirecionamos quando entra outra pessoa.
      if (nextSession.id === sessionUserId.current) {
        setSessionResolved(true)
        return
      }
      sessionUserId.current = nextSession.id

      let destination = getHomeRouteForUser(nextSession)
      // Atleta sem modalidade ainda não preencheu a Área do Atleta: começa por ela.
      if (destination === 'homeAthlete') {
        try {
          const profile = await withTimeout(repositories.users.obterPerfilAtletaPorUsuario(nextSession.id))
          if (profile.ok && !profile.data.modalidade) destination = 'athleteArea1'
        } catch {
          // Sem conseguir ler o perfil, segue para o início normalmente.
        }
        if (sessionUserId.current !== nextSession.id) return
      }

      // Treinador sem modalidade e instituição sem cidade completam o perfil antes do início.
      let params = {}
      if (destination === 'homeTrainer' || destination === 'homeInstitution') {
        try {
          const partner = await withTimeout(repositories.users.obterPerfilParceiroPorUsuario(nextSession.id))
          const incomplete = destination === 'homeTrainer' ? !partner.data?.modalidade : !partner.data?.localizacao
          if (partner.ok && incomplete) {
            params = { onboarding: true }
            destination = destination === 'homeTrainer' ? 'profileTrainer' : 'profileInstitution'
          }
        } catch {
          // Sem conseguir ler o perfil, segue para o início normalmente.
        }
        if (sessionUserId.current !== nextSession.id) return
      }

      if (destination) {
        transitionDirection.current = 1
        routeHistory.current = []
        setRoute({ name: destination, params })
      }
      setSessionResolved(true)
    })

    return unsubscribe
  }, [repositories])

  const screen = route.name

  const go = (next, params = {}) => {
    if (!ROUTES[next] || (next === screen && JSON.stringify(params) === JSON.stringify(route.params))) return

    const currentPosition = TAB_POSITION[screen]
    const nextPosition = TAB_POSITION[next]
    transitionDirection.current = Number.isFinite(currentPosition) && Number.isFinite(nextPosition) && nextPosition < currentPosition ? -1 : 1
    routeHistory.current = [...routeHistory.current, route]
    if (LOADER_ROUTES.has(next)) setLoaderTrigger((value) => value + 1)
    setRoute({ name: next, params })
  }

  const back = () => {
    transitionDirection.current = -1
    const previousRoute = routeHistory.current.at(-1)
    if (previousRoute) {
      routeHistory.current = routeHistory.current.slice(0, -1)
      setRoute(previousRoute)
      return
    }

    setRoute({ name: HISTORY[screen] || 'opening', params: route.params })
  }

  // No Android, o botão voltar do sistema deve voltar uma tela dentro do app.
  // Só nas telas raiz (abertura e inícios) ele mantém o comportamento padrão de sair.
  const backRef = useRef(back)
  backRef.current = back
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (ROOT_ROUTES.has(screen)) return false
      backRef.current()
      return true
    })
    return () => subscription.remove()
  }, [screen])

  if ((!fontsLoaded && !fontError) || !sessionResolved) {
    return (
      <View style={[styles.appFrame, frameSize, systemBars]}>
        <LoadingScreen />
      </View>
    )
  }

  const CurrentScreen = ROUTES[screen] || OpeningScreen

  return (
    <View style={[styles.appFrame, frameSize, systemBars]}>
      {systemBars && insets.bottom > 0 ? <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: insets.bottom, backgroundColor: '#ffffff' }} /> : null}
      <StatusBar style="light" translucent />
      {IS_DEMO_NATIVE_BUILD ? (
        <View style={DEMO_BANNER}>
          <Text style={DEMO_BANNER_TEXT}>Modo demonstração: os dados não são salvos neste APK</Text>
        </View>
      ) : null}
      {/* Com edge-to-edge o Android não encolhe mais a janela quando o teclado abre:
          o KeyboardAvoidingView faz isso, para o campo digitado não ficar escondido. */}
      <KeyboardAvoidingView enabled={Platform.OS !== 'web'} behavior="padding" style={KEYBOARD_AREA}>
        <AppCanvas>
          <ScreenTransition key={screen} direction={transitionDirection.current}>
            <CurrentScreen
              go={go}
              back={back}
              repositories={repositories}
              session={session}
              routeParams={route.params}
            />
          </ScreenTransition>
        </AppCanvas>
      </KeyboardAvoidingView>
      <LoadingOverlay trigger={loaderTrigger} />
      <AccessibilityPanel />
    </View>
  )
}
