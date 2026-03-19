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
  status: string
  workItems: Array<{ id: string; title: string; status: string; assignee: string }>
}

type KnowledgeResponse = {
  wikiPages: Array<{ id: string; title: string; tags: string; updatedAt: string }>
  checkpoints: Array<{ id: string; name: string; createdAt: string }>
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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

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

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

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

  return (
    <main className="page">
      <header>
        <h1>Agentic TodoList Scrum Command Center</h1>
        <p>
          Gerencie projetos de software, backlog, sprint, tasks, reviews e conhecimento para humanos e IA.
        </p>
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

          <section className="panel">
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
                <li key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                  <span>SP: {item.storyPoints} | P: {item.priority} | Status: {item.status}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2>Sprints</h2>
            <div className="grid sprint-grid">
              {sprints.map((sprint) => (
                <article key={sprint.id}>
                  <h3>{sprint.name}</h3>
                  <p>{sprint.goal}</p>
                  <p>Status: {sprint.status}</p>
                  <ul className="list compact">
                    {sprint.workItems.map((item) => (
                      <li key={item.id}>{item.title} - {item.status} - {item.assignee || 'sem responsavel'}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Knowledge Hub</h2>
            <div className="grid knowledge-grid">
              <article>
                <h3>Wikis</h3>
                <ul className="list compact">
                  {(knowledge?.wikiPages ?? []).map((wiki) => (
                    <li key={wiki.id}>{wiki.title} ({wiki.tags})</li>
                  ))}
                </ul>
              </article>
              <article>
                <h3>Checkpoints</h3>
                <ul className="list compact">
                  {(knowledge?.checkpoints ?? []).map((checkpoint) => (
                    <li key={checkpoint.id}>{checkpoint.name}</li>
                  ))}
                </ul>
              </article>
              <article>
                <h3>Agent Runs</h3>
                <ul className="list compact">
                  {(knowledge?.agentRuns ?? []).map((run) => (
                    <li key={run.id}>{run.agentName} - {run.status}</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default App
