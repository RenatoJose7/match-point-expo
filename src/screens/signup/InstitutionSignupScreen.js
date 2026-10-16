import React from 'react'
import { SignupForm } from './SignupForm'
import { assets } from '../../theme/assets'
import { USER_TYPES } from '../../domain/contracts'

const config = {
  accent: 'Instituição',
  background: assets.signupInstitution,
  fields: ['Nome da Instituição', 'Endereço de email', 'Tipo: empresa, clube, academia, etc...', 'CNPJ', 'Localização', 'Senha', 'Confirme sua senha'],
  userType: USER_TYPES.INSTITUTION,
  next: 'homeInstitution',
}

export function InstitutionSignupScreen(props) {
  return <SignupForm {...props} config={config} />
}
