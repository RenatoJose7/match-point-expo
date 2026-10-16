import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const progressDirectory = path.join(projectRoot, 'docs', 'progresso')
const dashboardPath = path.join(projectRoot, 'docs', 'PROGRESSO.md')
const sourceFiles = ['maria.json', 'marcelo.json', 'laura.json', 'renato.json', 'backlog.json']
const allowedStatuses = new Set([
  'nao_iniciado',
  'em_andamento',
  'bloqueado',
  'em_revisao',
  'simulado',
  'concluido',
])
const statusLabels = {
  nao_iniciado: 'Não iniciado',
  em_andamento: 'Em andamento',
  bloqueado: 'Bloqueado',
  em_revisao: 'Em revisão',
  simulado: 'Simulado',
  concluido: 'Concluído',
}

const normalizeLineEndings = (value) => value.replace(/\r\n/g, '\n')

async function loadSources() {
  return Promise.all(sourceFiles.map(async (file) => {
    const filePath = path.join(progressDirectory, file)
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'))
    return { file, filePath, data }
  }))
}

function validate(sources) {
  const requirements = sources.flatMap(({ data }) => (
    data.requisitos.map((requirement) => ({ ...requirement, responsavel: data.responsavel }))
  ))
  const ids = requirements.map(({ id }) => id)
  const expectedIds = Array.from({ length: 30 }, (_, index) => `RF${String(index + 1).padStart(2, '0')}`)
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
  const missing = expectedIds.filter((id) => !ids.includes(id))
  const unexpected = ids.filter((id) => !expectedIds.includes(id))
  const invalidStatuses = requirements.filter(({ status }) => !allowedStatuses.has(status))

  if (duplicates.length || missing.length || unexpected.length || invalidStatuses.length) {
    throw new Error(JSON.stringify({ duplicates, missing, unexpected, invalidStatuses }, null, 2))
  }

  for (const requirement of requirements) {
    if (requirement.status === 'concluido' && (!requirement.pr || !requirement.evidencia)) {
      throw new Error(`${requirement.id}: Concluído exige PR e evidência.`)
    }
    if (requirement.status === 'bloqueado' && !requirement.bloqueio) {
      throw new Error(`${requirement.id}: Bloqueado exige a descrição do bloqueio.`)
    }
  }

  return requirements.sort((a, b) => a.id.localeCompare(b.id))
}

function bar(done, total, size = 20) {
  const percentage = total === 0 ? 0 : Math.round((done / total) * 100)
  const filled = total === 0 ? 0 : Math.round((done / total) * size)
  return `${'█'.repeat(filled)}${'░'.repeat(size - filled)} ${percentage}% (${done}/${total})`
}

function escapeCell(value) {
  return String(value || '—').replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function latestUpdate(requirements) {
  return requirements
    .map(({ atualizadoEm }) => atualizadoEm)
    .filter(Boolean)
    .sort()
    .at(-1) ?? 'nenhuma atualização registrada'
}

function generateDashboard(requirements) {
  const priorities = ['P0', 'P1', 'P2']
  const people = ['Maria', 'Marcelo', 'Laura', 'Renato']
  const lines = [
    '# Progresso de implementação — MatchPoint',
    '',
    '> Arquivo gerado por `npm run progress`. Não edite esta página manualmente.',
    '',
    `Última atualização registrada: ${latestUpdate(requirements)}`,
    '',
    '## Barras de progresso',
    '',
  ]

  for (const priority of priorities) {
    const items = requirements.filter((requirement) => requirement.prioridade === priority)
    const done = items.filter((requirement) => requirement.status === 'concluido').length
    lines.push(`- **${priority}:** \`${bar(done, items.length)}\``)
  }

  const totalDone = requirements.filter((requirement) => requirement.status === 'concluido').length
  lines.push(`- **Total:** \`${bar(totalDone, requirements.length)}\``)
  lines.push('', 'Somente requisitos `Concluídos`, com PR e evidência, avançam as barras. Itens simulados não contam para os 70%.')
  lines.push('', '## Progresso por pessoa', '')
  lines.push('| Responsável | P0 concluído | Total concluído | Em andamento | Bloqueado |')
  lines.push('| --- | --- | --- | --- | --- |')

  for (const person of people) {
    const items = requirements.filter((requirement) => requirement.responsavel === person)
    const p0 = items.filter((requirement) => requirement.prioridade === 'P0')
    const p0Done = p0.filter((requirement) => requirement.status === 'concluido').length
    const done = items.filter((requirement) => requirement.status === 'concluido').length
    const active = items.filter((requirement) => requirement.status === 'em_andamento').length
    const blocked = items.filter((requirement) => requirement.status === 'bloqueado').length
    lines.push(`| ${person} | ${p0Done}/${p0.length} | ${done}/${items.length} | ${active} | ${blocked} |`)
  }

  lines.push('', '## Requisitos', '')
  lines.push('| RF | Prioridade | Responsável | Status | PR | Evidência ou bloqueio |')
  lines.push('| --- | --- | --- | --- | --- | --- |')

  for (const requirement of requirements) {
    const detail = requirement.status === 'bloqueado' ? requirement.bloqueio : requirement.evidencia
    lines.push(`| ${requirement.id} — ${escapeCell(requirement.titulo)} | ${requirement.prioridade} | ${escapeCell(requirement.responsavel)} | ${statusLabels[requirement.status]} | ${escapeCell(requirement.pr)} | ${escapeCell(detail)} |`)
  }

  lines.push(
    '',
    '## Como atualizar',
    '',
    '```text',
    'npm run progress -- set RF09 em_andamento',
    'npm run progress -- set RF09 bloqueado --blocker "Aguardando contrato de oportunidade"',
    'npm run progress -- set RF09 em_revisao --pr "#12"',
    'npm run progress -- set RF09 concluido --pr "#12" --evidence "Vídeo e roteiro 3 aprovados"',
    '```',
    '',
    'Estados permitidos: `nao_iniciado`, `em_andamento`, `bloqueado`, `em_revisao`, `simulado` e `concluido`.',
  )

  return `${lines.join('\n')}\n`
}

function readFlag(args, name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] ?? '' : undefined
}

async function updateRequirement(sources, args) {
  const [command, id, status] = args
  if (command !== 'set') return false
  if (!/^RF\d{2}$/.test(id ?? '') || !allowedStatuses.has(status)) {
    throw new Error('Uso: npm run progress -- set RF01 em_andamento [--pr "#1"] [--evidence "..."] [--blocker "..."]')
  }

  const source = sources.find(({ data }) => data.requisitos.some((requirement) => requirement.id === id))
  if (!source) throw new Error(`${id} não encontrado.`)
  const requirement = source.data.requisitos.find((item) => item.id === id)
  const pr = readFlag(args, '--pr')
  const evidence = readFlag(args, '--evidence')
  const blocker = readFlag(args, '--blocker')

  requirement.status = status
  if (pr !== undefined) requirement.pr = pr
  if (evidence !== undefined) requirement.evidencia = evidence
  requirement.bloqueio = status === 'bloqueado' ? (blocker ?? requirement.bloqueio) : ''
  requirement.atualizadoEm = new Date().toISOString()

  if (status === 'concluido' && (!requirement.pr || !requirement.evidencia)) {
    throw new Error(`${id}: use --pr e --evidence antes de marcar como concluído.`)
  }
  if (status === 'bloqueado' && !requirement.bloqueio) {
    throw new Error(`${id}: use --blocker para explicar o bloqueio.`)
  }

  await fs.writeFile(source.filePath, `${JSON.stringify(source.data, null, 2)}\n`, 'utf8')
  return true
}

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const sources = await loadSources()

if (!checkOnly) await updateRequirement(sources, args)

const refreshedSources = await loadSources()
const requirements = validate(refreshedSources)
const dashboard = generateDashboard(requirements)

if (checkOnly) {
  const current = await fs.readFile(dashboardPath, 'utf8').catch(() => '')
  if (normalizeLineEndings(current) !== normalizeLineEndings(dashboard)) {
    throw new Error('docs/PROGRESSO.md está desatualizado. Execute npm run progress.')
  }
  console.log('Painel de progresso validado.')
} else {
  await fs.writeFile(dashboardPath, dashboard, 'utf8')
  console.log('docs/PROGRESSO.md atualizado.')
}
