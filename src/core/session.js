import { USER_TYPES } from '../domain/contracts.js'

const HOME_ROUTE_BY_USER_TYPE = Object.freeze({
  [USER_TYPES.ATHLETE]: 'homeAthlete',
  [USER_TYPES.TRAINER]: 'homeTrainer',
  [USER_TYPES.INSTITUTION]: 'homeInstitution',
  [USER_TYPES.GUARDIAN]: 'homeResponsible',
  [USER_TYPES.ADMIN]: 'administration',
})

export function getHomeRouteForUser(user) {
  return HOME_ROUTE_BY_USER_TYPE[user?.tipo] ?? null
}
