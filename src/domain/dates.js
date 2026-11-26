// Prazo de inscrição: o dia escolhido no formulário vale até o fim desse dia no celular
// de quem consulta (antes fechava às 20:59 de Brasília, pois era salvo como 23:59 UTC).

function localDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function isDeadlinePassed(deadline, reference = new Date()) {
  if (!deadline) return false
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(deadline))
  if (!match) return false
  return localDateKey(reference) > match[1]
}
