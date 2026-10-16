import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, useWindowDimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import { ScreenTransition } from './src/components/motion'
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
  InstitutionOpportunitiesScreen,
  InstitutionProfileScreen,
  InstitutionSignupScreen,
  LoginScreen,
  MatchScoreScreen,
  NotificationsScreen,
  OpeningScreen,
  OpportunityDetailScreen,
  ProfileChoiceScreen,
  RecoveryEmailScreen,
  RecoveryInboxScreen,
  RecoveryResetScreen,
  ResponsibleSignupScreen,
  TrainerHomeScreen,
  TrainerOpportunitiesScreen,
  TrainerProfileScreen,
  TrainerSignupScreen,
  TelaCriarOportunidade,
  TelaOportunidadesCriadasTecnico,
  TelaPerfilAtletaTecnico,
  WomenInSportScreen,
} from './src/screens'
import { styles } from './src/theme/styles'

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
  notifications: NotificationsScreen,
  women: WomenInSportScreen,
  opportunitiesAthlete: AthleteOpportunitiesScreen,
  opportunitiesTrainer: TrainerOpportunitiesScreen,
  opportunitiesInstitution: InstitutionOpportunitiesScreen,
  opportunitiesCreated: CreatedOpportunitiesScreen,
  candidates: CandidatesScreen,
  profileAthlete: AthleteProfileScreen,
  profileTrainer: TrainerProfileScreen,
  profileInstitution: InstitutionProfileScreen,
  applications: ApplicationsScreen,
  applicationDetail: ApplicationDetailScreen,
  matchScore: MatchScoreScreen,
  opportunityDetail: OpportunityDetailScreen,
  applicationInfo: ApplicationInfoScreen,
  applicationStatus: ApplicationStatusScreen,
  athleteDetail: AthleteDetailScreen,
  criarOportunidadeTecnico: TelaCriarOportunidade,
  criarOportunidadeInicioTecnico: TelaCriarOportunidade,
  oportunidadesCriadasTecnico: TelaOportunidadesCriadasTecnico,
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
  notifications: 'homeAthlete',
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
  applicationInfo: 'opportunityDetail',
  applicationStatus: 'applicationInfo',
  athleteDetail: 'candidates',
  criarOportunidadeTecnico: 'opportunitiesTrainer',
  criarOportunidadeInicioTecnico: 'homeTrainer',
  oportunidadesCriadasTecnico: 'opportunitiesTrainer',
  perfilAtletaTecnico: 'candidates',
}

const TAB_POSITION = {
  homeAthlete: 0,
  opportunitiesAthlete: 1,
  applications: 2,
  profileAthlete: 3,
  homeTrainer: 0,
  opportunitiesTrainer: 1,
  profileTrainer: 2,
  homeInstitution: 0,
  opportunitiesInstitution: 1,
  opportunitiesCreated: 1,
  criarOportunidadeTecnico: 1,
  criarOportunidadeInicioTecnico: 1,
  oportunidadesCriadasTecnico: 1,
  perfilAtletaTecnico: 1,
  profileInstitution: 2,
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular: require('./assets/Poppins-Regular.ttf'),
    Poppins_500Medium: require('./assets/Poppins-Medium.ttf'),
    Poppins_600SemiBold: require('./assets/Poppins-SemiBold.ttf'),
    Griffiths: require('./assets/Griffiths.otf'),
  })
  const { width, height } = useWindowDimensions()
  const repositories = useMemo(() => createRepositories(), [])
  const [route, setRoute] = useState({ name: 'opening', params: {} })
  const routeHistory = useRef([])
  const [session, setSession] = useState(null)
  const [sessionResolved, setSessionResolved] = useState(false)
  const transitionDirection = useRef(1)
  const isPhoneViewport = width <= 430
  const frameWidth = isPhoneViewport ? width : Math.min(height * (402 / 874), 430)
  const frameHeight = isPhoneViewport ? height : frameWidth * (874 / 402)

  useEffect(() => {
    const unsubscribe = repositories.authentication.observarSessao((nextSession) => {
      setSession(nextSession)
      setSessionResolved(true)

      if (!nextSession) {
        routeHistory.current = []
        setRoute({ name: 'opening', params: {} })
        return
      }

      const destination = getHomeRouteForUser(nextSession)
      if (destination) {
        transitionDirection.current = 1
        routeHistory.current = []
        setRoute({ name: destination, params: {} })
      }
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

  if ((!fontsLoaded && !fontError) || !sessionResolved) {
    return <View style={[styles.full, { backgroundColor: '#0b542d' }]} />
  }

  const CurrentScreen = ROUTES[screen] || OpeningScreen

  return (
    <View style={[styles.appFrame, { width: frameWidth, height: frameHeight }]}>
      <StatusBar style="light" translucent />
      <ScreenTransition key={screen} direction={transitionDirection.current}>
        <CurrentScreen
          go={go}
          back={back}
          repositories={repositories}
          session={session}
          routeParams={route.params}
        />
      </ScreenTransition>
    </View>
  )
}
