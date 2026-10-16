import React from 'react'
import { SignupForm } from './SignupForm'
import { assets } from '../../theme/assets'
import { USER_TYPES } from '../../domain/contracts'

const config = {
  accent: 'Treinador',
  background: assets.signupTrainer,
  fields: ['Nome completo', 'Endereço de email', 'CPF', 'Senha', 'Confirme a senha'],
  userType: USER_TYPES.TRAINER,
  next: 'homeTrainer',
}

export function TrainerSignupScreen(props) {
  return <SignupForm {...props} config={config} />
}
