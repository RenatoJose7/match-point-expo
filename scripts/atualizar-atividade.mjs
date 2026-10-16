import { writeFileSync } from 'node:fs'

const repository = process.env.GITHUB_REPOSITORY
const token = process.env.GITHUB_TOKEN
const apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com'
const periodDays = 7

if (!repository || !token) {
  throw new Error('GITHUB_REPOSITORY e GITHUB_TOKEN são obrigatórios para atualizar a atividade.')
}

function escapeCell(value) {
  return String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ')
}

async function request(path) {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub API respondeu ${response.status} para ${path}.`)
  }

  return response.json()
}

function getAuthor(commit) {
  return commit.author?.login ?? commit.commit?.author?.name ?? 'Sem conta GitHub vinculada'
}

const now = new Date()
const since = new Date(now)
since.setUTCDate(since.getUTCDate() - periodDays)

const [commits, pullRequests] = await Promise.all([
  request(`/repos/${repository}/commits?sha=develop&since=${encodeURIComponent(since.toISOString())}&per_page=100`),
  request(`/repos/${repository}/pulls?state=open&base=develop&per_page=100`),
])

const activityByPerson = new Map()
const getActivity = (person) => {
  if (!activityByPerson.has(person)) {
    activityByPerson.set(person, { commitsIntegrados: 0, prsAbertas: 0, commitsEmPrs: 0 })
  }
  return activityByPerson.get(person)
}

for (const commit of commits) {
  getActivity(getAuthor(commit)).commitsIntegrados += 1
}

for (const pullRequest of pullRequests) {
  const activity = getActivity(pullRequest.user?.login ?? 'Sem conta GitHub vinculada')
  activity.prsAbertas += 1
  activity.commitsEmPrs += pullRequest.commits ?? 0
}

const people = [...activityByPerson.entries()]
  .sort(([first], [second]) => first.localeCompare(second, 'pt-BR'))

const lines = [
  '# Atividade automática da equipe',
  '',
  '> Este arquivo é gerado pelo GitHub Actions. Ele acompanha atividade no Git, mas **não** altera o status funcional dos requisitos em `docs/PROGRESSO.md`.',
  '',
  `Atualizado em: ${now.toISOString()}`,
  `Período dos commits integrados: últimos ${periodDays} dias na branch \`develop\`.`,
  '',
  '## Resumo por participante',
  '',
  '| Conta do GitHub | Commits integrados | PRs abertas | Commits nas PRs abertas |',
  '| --- | ---: | ---: | ---: |',
  ...(people.length > 0
    ? people.map(([person, activity]) => (
      `| ${escapeCell(person)} | ${activity.commitsIntegrados} | ${activity.prsAbertas} | ${activity.commitsEmPrs} |`
    ))
    : ['| Nenhuma atividade encontrada | 0 | 0 | 0 |']),
  '',
  '## Pull Requests abertas para `develop`',
  '',
  '| PR | Responsável | Branch | Commits | Atualizada em |',
  '| --- | --- | --- | ---: | --- |',
  ...(pullRequests.length > 0
    ? pullRequests.map((pullRequest) => (
      `| [#${pullRequest.number}](${pullRequest.html_url}) ${escapeCell(pullRequest.title)} | ${escapeCell(pullRequest.user?.login)} | \`${escapeCell(pullRequest.head?.ref)}\` | ${pullRequest.commits ?? 0} | ${pullRequest.updated_at} |`
    ))
    : ['| — | — | — | 0 | — |']),
  '',
  '## Como interpretar',
  '',
  '- **Commits integrados**: alterações já incorporadas à `develop` no período indicado.',
  '- **PRs abertas**: trabalho publicado que ainda depende de revisão ou integração.',
  '- **Commits nas PRs abertas**: volume de commits daquela pessoa nas PRs ainda abertas; não mede qualidade nem conclusão.',
  '- Para a meta de 70%, consulte exclusivamente o [painel de progresso](PROGRESSO.md).',
  '',
]

writeFileSync('docs/ATIVIDADE_EQUIPE.md', `${lines.join('\n')}\n`)
