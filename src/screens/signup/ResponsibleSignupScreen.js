import React from 'react'
import { SignupForm } from './SignupForm'
import { assets } from '../../theme/assets'
import { USER_TYPES } from '../../domain/contracts'

const config = {
  accent: 'Responsável',
  background: assets.signupResponsible,
  fields: ['Nome completo', 'Endereço de email', 'Parentesco com o atleta.', 'CPF', 'Telefone', 'Senha', 'Confirme a senha'],
  userType: USER_TYPES.GUARDIAN,
  next: 'athleteArea1',
}

export function ResponsibleSignupScreen(props) {
  return <SignupForm {...props} config={config} />
}
