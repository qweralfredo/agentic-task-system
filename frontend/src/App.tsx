import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Project = {
  id: string
  name: string
  description: string
  createdAt: string
}

type BacklogItem = {
  id: string
  title: string
  description: string
  storyPoints: number
  priority: number
  status: string
}

type Sprint = {
  id: string
  name: string
  goal: string
  status: number | string
  workItems: Array<{ id: string; title: string; description: string; status: number | string; assignee: string }>
}

type KnowledgeResponse = {
  wikiPages: Array<{ id: string; title: string; tags: string; category: string; updatedAt: string }>
  checkpoints: Array<{ id: string; name: string; category: string; createdAt: string }>
  documentationPages: Array<{ id: string; title: string; tags: string; category: string; updatedAt: string }>
  agentRuns: Array<{ id: string; agentName: string; status: string; startedAt: string }>
}

type Dashboard = {
  projectId: string
  projectName: string
  backlogTotal: number
  backlogDone: number
  activeSprints: number
  workItemsTodo: number
  workItemsInProgress: number
  workItemsReview: number
  workItemsDone: number
  knowledgeCheckpoints: number
  wikiPages: number
  agentRuns: number
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:58080'

const workItemStatusLabels: Record<number, string> = {
  0: 'To Do',
  1: 'In Progress',
  2: 'Review',
  3: 'Done',
  4: 'Blocked',
}

const backlogStatusLabels: Record<number, string> = {
  0: 'New',
  1: 'Planned',
  2: 'In Sprint',
  3: 'Done',
  4: 'Blocked',
}

function toNumberStatus(value: string | number): number {
  return typeof value === 'number' ? value : Number(value)
}

function groupByCategory<T extends { category?: string }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const category = item.category?.trim() || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {})
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [backlog, setBacklog] = useState<BacklogItem[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [knowledge, setKnowledge] = useState<KnowledgeResponse | null>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newBacklogTitle, setNewBacklogTitle] = useState('')
  const [newBacklogDescription, setNewBacklogDescription] = useState('')
  const [newBacklogPoints, setNewBacklogPoints] = useState(3)
  const [newBacklogPriority, setNewBacklogPriority] = useState(1)

  const [newSprintName, setNewSprintName] = useState('')
  const [newSprintGoal, setNewSprintGoal] = useState('')
  const [newSprintStartDate, setNewSprintStartDate] = useState('')
  const [newSprintEndDate, setNewSprintEndDate] = useState('')
  const [selectedBacklogIds, setSelectedBacklogIds] = useState<string[]>([])

  const [newWikiTitle, setNewWikiTitle] = useState('')
  const [newWikiCategory, setNewWikiCategory] = useState('How-To')
  const [newWikiTags, setNewWikiTags] = useState('')
  const [newWikiContent, setNewWikiContent] = useState('')

  const [newCheckpointName, setNewCheckpointName] = useState('')
  const [newCheckpointCategory, setNewCheckpointCategory] = useState('Release')
  const [newCheckpointContext, setNewCheckpointContext] = useState('')
  const [newCheckpointDecisions, setNewCheckpointDecisions] = useState('')
  const [newCheckpointRisks, setNewCheckpointRisks] = useState('')
  const [newCheckpointNextActions, setNewCheckpointNextActions] = useState('')

  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocCategory, setNewDocCategory] = useState('Architecture')
  const [newDocTags, setNewDocTags] = useState('')
  const [newDocContent, setNewDocContent] = useState('')

  const [taskDraftStatus, setTaskDraftStatus] = useState<Record<string, number>>({})
  const [taskDraftAssignee, setTaskDraftAssignee] = useState<Record<string, string>>({})

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  const activeSprint = useMemo(
    () => sprints.find((s) => toNumberStatus(s.status) === 1) ?? sprints[0] ?? null,
    [sprints],
  )

  const wikiByCategory = useMemo(() => groupByCategory(knowledge?.wikiPages ?? []), [knowledge])
  const checkpointByCategory = useMemo(() => groupByCategory(knowledge?.checkpoints ?? []), [knowledge])
  const docsByCategory = useMemo(() => groupByCategory(knowledge?.documentationPages ?? []), [knowledge])

  const sprintBoard = useMemo(() => {
    const columns: Record<number, Sprint['workItems']> = { 0: [], 1: [], 2: [], 3: [] }
    const items = activeSprint?.workItems ?? []
    for (const item of items) {
      const status = toNumberStatus(item.status)
      if (columns[status]) {
        columns[status].push(item)
      }
    }
    return columns
  }, [activeSprint])

  async function loadProjects() {
    const result = await api<Project[]>('/api/projects')
    setProjects(result)
    if (!selectedProjectId && result.length > 0) {
      setSelectedProjectId(result[0].id)
    }
  }

  async function loadProjectViews(projectId: string) {
    setLoading(true)
    setError('')
    try {
      const [dashboardResult, backlogResult, sprintResult, knowledgeResult] =
        await Promise.all([
          api<Dashboard>(`/api/projects/${projectId}/dashboard`),
          api<BacklogItem[]>(`/api/projects/${projectId}/backlog`),
          api<Sprint[]>(`/api/projects/${projectId}/sprints`),
          api<KnowledgeResponse>(`/api/projects/${projectId}/knowledge`),
        ])

      setDashboard(dashboardResult)
      setBacklog(backlogResult)
      setSprints(sprintResult)
      setKnowledge(knowledgeResult)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      void loadProjectViews(selectedProjectId)
    }
  }, [selectedProjectId])

  async function handleCreateProject(event: FormEvent) {
    event.preventDefault()
    if (!newProjectName.trim() || !newProjectDescription.trim()) {
      return
    }

    await api<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: newProjectName,
        description: newProjectDescription,
      }),
    })

    setNewProjectName('')
    setNewProjectDescription('')
    await loadProjects()
  }

  async function handleCreateBacklogItem(event: FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !newBacklogTitle.trim() || !newBacklogDescription.trim()) {
      return
    }

    await api<BacklogItem>(`/api/projects/${selectedProjectId}/backlog`, {
      method: 'POST',
      body: JSON.stringify({
        title: newBacklogTitle,
        description: newBacklogDescription,
        storyPoints: newBacklogPoints,
        priority: newBacklogPriority,
      }),
    })

    setNewBacklogTitle('')
    setNewBacklogDescription('')
    setNewBacklogPoints(3)
    setNewBacklogPriority(1)
    await loadProjectViews(selectedProjectId)
  }

  async function handleCreateSprint(event: FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !newSprintName.trim() || !newSprintGoal.trim()) {
      return
    }

    await api(`/api/projects/${selectedProjectId}/sprints`, {
      method: 'POST',
      body: JSON.stringify({
        name: newSprintName,
        goal: newSprintGoal,
        startDate: newSprintStartDate || new Date().toISOString().slice(0, 10),
        endDate: newSprintEndDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        backlogItemIds: selectedBacklogIds,
      }),
    })

    setNewSprintName('')
    setNewSprintGoal('')
    setSelectedBacklogIds([])
    await loadProjectViews(selectedProjectId)
  }

  async function handleCreateWiki(event: FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !newWikiTitle.trim() || !newWikiContent.trim()) {
      return
    }

    await api(`/api/projects/${selectedProjectId}/wiki`, {
      method: 'POST',
      body: JSON.stringify({
        title: newWikiTitle,
        contentMarkdown: newWikiContent,
        category: newWikiCategory,
        tags: newWikiTags,
      }),
    })

    setNewWikiTitle('')
    setNewWikiTags('')
    setNewWikiContent('')
    await loadProjectViews(selectedProjectId)
  }

  async function handleCreateCheckpoint(event: FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !newCheckpointName.trim()) {
      return
    }

    await api(`/api/projects/${selectedProjectId}/checkpoints`, {
      method: 'POST',
      body: JSON.stringify({
        name: newCheckpointName,
        category: newCheckpointCategory,
        contextSnapshot: newCheckpointContext,
        decisions: newCheckpointDecisions,
        risks: newCheckpointRisks,
        nextActions: newCheckpointNextActions,
      }),
    })

    setNewCheckpointName('')
    setNewCheckpointContext('')
    setNewCheckpointDecisions('')
    setNewCheckpointRisks('')
    setNewCheckpointNextActions('')
    await loadProjectViews(selectedProjectId)
  }

  async function handleCreateDocumentation(event: FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !newDocTitle.trim() || !newDocContent.trim()) {
      return
    }

    await api(`/api/projects/${selectedProjectId}/documentation`, {
      method: 'POST',
      body: JSON.stringify({
        title: newDocTitle,
        contentMarkdown: newDocContent,
        category: newDocCategory,
        tags: newDocTags,
      }),
    })

    setNewDocTitle('')
    setNewDocTags('')
    setNewDocContent('')
    await loadProjectViews(selectedProjectId)
  }

  async function handleMoveTask(workItemId: string, currentStatus: number | string, currentAssignee: string) {
    if (!selectedProjectId) {
      return
    }

    await api(`/api/work-items/${workItemId}/status`, {
      method: 'POST',
      body: JSON.stringify({
        status: taskDraftStatus[workItemId] ?? toNumberStatus(currentStatus),
        assignee: (taskDraftAssignee[workItemId] ?? currentAssignee ?? '').trim(),
      }),
    })

    await loadProjectViews(selectedProjectId)
  }

  function toggleBacklogSelection(backlogItemId: string) {
    setSelectedBacklogIds((previous) =>
      previous.includes(backlogItemId)
        ? previous.filter((id) => id !== backlogItemId)
        : [...previous, backlogItemId],
    )
  }

  return (
    <main className="page">
      <header>
        <h1>Project Flowboard</h1>
        <p>
          Hierarquia Trello/Jira: Projeto &gt; Backlog | Wiki | Checkpoint | Documentacao &gt; Sprint &gt; Tasks.
        </p>
        <div className="hierarchy-strip">
          <span>Projeto</span>
          <span>Backlog | Wiki | Checkpoint | Documentacao</span>
          <span>Sprint</span>
          <span>Tasks (Kanban)</span>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="panel">
        <h2>Novo Projeto</h2>
        <form className="form" onSubmit={handleCreateProject}>
          <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Nome do projeto" required />
          <input value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} placeholder="Descrição" required />
          <button type="submit">Criar</button>
        </form>
      </section>

      <section className="panel">
        <h2>Projetos</h2>
        <div className="chips">
          {projects.map((project) => (
            <button
              key={project.id}
              className={project.id === selectedProjectId ? 'chip chip-active' : 'chip'}
              onClick={() => setSelectedProjectId(project.id)}
            >
              {project.name}
            </button>
          ))}
        </div>
      </section>

      {selectedProject && dashboard && (
        <>
          <section className="panel stats">
            <h2>Dashboard do Projeto: {selectedProject.name}</h2>
            {loading ? <p>Carregando...</p> : null}
            <div className="grid">
              <article><h3>Backlog</h3><p>{dashboard.backlogDone} / {dashboard.backlogTotal} concluido</p></article>
              <article><h3>Sprints Ativas</h3><p>{dashboard.activeSprints}</p></article>
              <article><h3>Tasks Em Progresso</h3><p>{dashboard.workItemsInProgress}</p></article>
              <article><h3>Tasks Em Review</h3><p>{dashboard.workItemsReview}</p></article>
              <article><h3>Tasks Done</h3><p>{dashboard.workItemsDone}</p></article>
              <article><h3>Checkpoints IA</h3><p>{dashboard.knowledgeCheckpoints}</p></article>
              <article><h3>Wikis</h3><p>{dashboard.wikiPages}</p></article>
              <article><h3>Execucoes Agenticas</h3><p>{dashboard.agentRuns}</p></article>
            </div>
          </section>

          <section className="panel split">
            <div>
              <h2>Backlog</h2>
              <form className="form" onSubmit={handleCreateBacklogItem}>
                <input value={newBacklogTitle} onChange={(e) => setNewBacklogTitle(e.target.value)} placeholder="Titulo da story" required />
                <input value={newBacklogDescription} onChange={(e) => setNewBacklogDescription(e.target.value)} placeholder="Descricao" required />
                <input type="number" min={1} value={newBacklogPoints} onChange={(e) => setNewBacklogPoints(Number(e.target.value))} />
                <input type="number" min={1} value={newBacklogPriority} onChange={(e) => setNewBacklogPriority(Number(e.target.value))} />
                <button type="submit">Adicionar Item</button>
              </form>

              <ul className="list">
                {backlog.map((item) => (
                  <li key={item.id} className="ticket">
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                    <span>SP: {item.storyPoints} | P: {item.priority} | {backlogStatusLabels[toNumberStatus(item.status)] ?? item.status}</span>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedBacklogIds.includes(item.id)}
                        onChange={() => toggleBacklogSelection(item.id)}
                      />
                      Selecionar para sprint
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2>Criar Sprint</h2>
              <form className="form" onSubmit={handleCreateSprint}>
                <input value={newSprintName} onChange={(e) => setNewSprintName(e.target.value)} placeholder="Nome da sprint" required />
                <input value={newSprintGoal} onChange={(e) => setNewSprintGoal(e.target.value)} placeholder="Objetivo" required />
                <input type="date" value={newSprintStartDate} onChange={(e) => setNewSprintStartDate(e.target.value)} />
                <input type="date" value={newSprintEndDate} onChange={(e) => setNewSprintEndDate(e.target.value)} />
                <button type="submit">Iniciar Sprint</button>
              </form>

              <h3>Sprints</h3>
              <ul className="list compact">
                {sprints.map((sprint) => (
                  <li key={sprint.id} className={activeSprint?.id === sprint.id ? 'active-sprint' : ''}>
                    <strong>{sprint.name}</strong>
                    <span>{sprint.goal}</span>
                    <span>Status: {toNumberStatus(sprint.status) === 1 ? 'Ativa' : 'Planejada/Fechada'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="panel">
            <h2>Knowledge Space (categorizado)</h2>
            <div className="knowledge-forms">
              <form className="form stack" onSubmit={handleCreateWiki}>
                <h3>Wiki</h3>
                <input value={newWikiTitle} onChange={(e) => setNewWikiTitle(e.target.value)} placeholder="Titulo" required />
                <input value={newWikiCategory} onChange={(e) => setNewWikiCategory(e.target.value)} placeholder="Categoria" required />
                <input value={newWikiTags} onChange={(e) => setNewWikiTags(e.target.value)} placeholder="Tags" />
                <textarea value={newWikiContent} onChange={(e) => setNewWikiContent(e.target.value)} placeholder="Conteudo markdown" required />
                <button type="submit">Salvar Wiki</button>
              </form>

              <form className="form stack" onSubmit={handleCreateCheckpoint}>
                <h3>Checkpoint</h3>
                <input value={newCheckpointName} onChange={(e) => setNewCheckpointName(e.target.value)} placeholder="Nome" required />
                <input value={newCheckpointCategory} onChange={(e) => setNewCheckpointCategory(e.target.value)} placeholder="Categoria" required />
                <textarea value={newCheckpointContext} onChange={(e) => setNewCheckpointContext(e.target.value)} placeholder="Contexto" />
                <textarea value={newCheckpointDecisions} onChange={(e) => setNewCheckpointDecisions(e.target.value)} placeholder="Decisoes" />
                <textarea value={newCheckpointRisks} onChange={(e) => setNewCheckpointRisks(e.target.value)} placeholder="Riscos" />
                <textarea value={newCheckpointNextActions} onChange={(e) => setNewCheckpointNextActions(e.target.value)} placeholder="Proximas acoes" />
                <button type="submit">Salvar Checkpoint</button>
              </form>

              <form className="form stack" onSubmit={handleCreateDocumentation}>
                <h3>Documentacao</h3>
                <input value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} placeholder="Titulo" required />
                <input value={newDocCategory} onChange={(e) => setNewDocCategory(e.target.value)} placeholder="Categoria" required />
                <input value={newDocTags} onChange={(e) => setNewDocTags(e.target.value)} placeholder="Tags" />
                <textarea value={newDocContent} onChange={(e) => setNewDocContent(e.target.value)} placeholder="Conteudo markdown" required />
                <button type="submit">Salvar Documento</button>
              </form>
            </div>

            <div className="knowledge-grid">
              <article>
                <h3>Wiki por categoria</h3>
                {Object.entries(wikiByCategory).map(([category, items]) => (
                  <div key={category} className="category-block">
                    <h4>{category}</h4>
                    <ul className="list compact">
                      {items.map((wiki) => (
                        <li key={wiki.id}>{wiki.title} ({wiki.tags})</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </article>

              <article>
                <h3>Checkpoints por categoria</h3>
                {Object.entries(checkpointByCategory).map(([category, items]) => (
                  <div key={category} className="category-block">
                    <h4>{category}</h4>
                    <ul className="list compact">
                      {items.map((checkpoint) => (
                        <li key={checkpoint.id}>{checkpoint.name}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </article>

              <article>
                <h3>Documentacao por categoria</h3>
                {Object.entries(docsByCategory).map(([category, items]) => (
                  <div key={category} className="category-block">
                    <h4>{category}</h4>
                    <ul className="list compact">
                      {items.map((doc) => (
                        <li key={doc.id}>{doc.title} ({doc.tags})</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </article>
            </div>
          </section>

          <section className="panel">
            <h2>Kanban da Sprint {activeSprint ? `- ${activeSprint.name}` : ''}</h2>
            <div className="kanban-grid">
              <article className="kanban-column">
                <h3>Backlog Pool</h3>
                <ul className="list compact">
                  {backlog.filter((item) => toNumberStatus(item.status) <= 2).map((item) => (
                    <li key={item.id} className="ticket">
                      <strong>{item.title}</strong>
                      <span>{backlogStatusLabels[toNumberStatus(item.status)] ?? item.status}</span>
                    </li>
                  ))}
                </ul>
              </article>

              {[0, 1, 2, 3].map((columnStatus) => (
                <article className="kanban-column" key={columnStatus}>
                  <h3>{workItemStatusLabels[columnStatus]}</h3>
                  <ul className="list compact">
                    {(sprintBoard[columnStatus] ?? []).map((item) => (
                      <li key={item.id} className="ticket">
                        <strong>{item.title}</strong>
                        <span>{item.description}</span>
                        <span>Assignee: {item.assignee || 'nao definido'}</span>
                        <div className="task-actions">
                          <select
                            value={taskDraftStatus[item.id] ?? toNumberStatus(item.status)}
                            onChange={(e) => setTaskDraftStatus((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                          >
                            <option value={0}>To Do</option>
                            <option value={1}>In Progress</option>
                            <option value={2}>Review</option>
                            <option value={3}>Done</option>
                            <option value={4}>Blocked</option>
                          </select>
                          <input
                            value={taskDraftAssignee[item.id] ?? item.assignee ?? ''}
                            onChange={(e) => setTaskDraftAssignee((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder="Assignee"
                          />
                          <button type="button" onClick={() => handleMoveTask(item.id, item.status, item.assignee)}>
                            Mover
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default App
