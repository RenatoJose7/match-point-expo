import { assets } from './assets'

const imageSet = [
  assets.opportunityMountains,
  assets.opportunityClayCourt,
  assets.opportunityBlueCourt,
  assets.opportunityPurpleCourt,
]

const normalize = value => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()

export function getOpportunityImage(opportunity, index = 0) {
  const text = normalize(`${opportunity?.id ?? ''} ${opportunity?.titulo ?? ''} ${opportunity?.beneficio ?? ''}`)
  if (text.includes('bolsa')) return assets.opportunityMountains
  if (text.includes('auxilio') || text.includes('financeiro') || text.includes('clinica')) return assets.opportunityPurpleCourt
  if (text.includes('circuito') || text.includes('campeonato')) return assets.opportunityBlueCourt
  if (text.includes('tecnica') || text.includes('avaliacao')) return assets.opportunityClayCourt
  return imageSet[index % imageSet.length]
}
