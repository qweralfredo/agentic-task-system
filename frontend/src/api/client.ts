import type { BacklogItem, Dashboard, KnowledgeResponse, Project, Sprint } from '../types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8480'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
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

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  listProjects: () => request<Project[]>('/api/projects'),
  createProject: (payload: { name: string; description: string }) =>
    request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDashboard: (projectId: string) => request<Dashboard>(`/api/projects/${projectId}/dashboard`),
  getBacklog: (projectId: string) => request<BacklogItem[]>(`/api/projects/${projectId}/backlog`),
  createBacklogItem: (
    projectId: string,
    payload: { title: string; description: string; storyPoints: number; priority: number; commitIds?: string[] },
  ) =>
    request<BacklogItem>(`/api/projects/${projectId}/backlog`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSprints: (projectId: string) => request<Sprint[]>(`/api/projects/${projectId}/sprints`),
  createSprint: (
    projectId: string,
    payload: { name: string; goal: string; startDate: string; endDate: string; backlogItemIds: string[]; commitIds?: string[] },
  ) =>
    request(`/api/projects/${projectId}/sprints`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateWorkItemStatus: (payload: {
    workItemId: string
    status: number
    assignee: string
    branch?: string
    agentName?: string
    modelUsed?: string
    ideUsed?: string
    tokensUsed?: number
    feedback?: string
    metadataJson?: string
    commitIds?: string[]
  }) =>
    request(`/api/work-items/${payload.workItemId}/status`, {
      method: 'POST',
      body: JSON.stringify({
        status: payload.status,
        assignee: payload.assignee,
        branch: payload.branch ?? '',
        agentName: payload.agentName ?? '',
        modelUsed: payload.modelUsed ?? '',
        ideUsed: payload.ideUsed ?? '',
        tokensUsed: payload.tokensUsed ?? 0,
        feedback: payload.feedback ?? '',
        metadataJson: payload.metadataJson ?? '',
        commitIds: payload.commitIds ?? [],
      }),
    }),
  updateSprintCommitIds: (sprintId: string, payload: { commitIds: string[] }) =>
    request(`/api/sprints/${sprintId}/commits`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getKnowledge: (projectId: string) => request<KnowledgeResponse>(`/api/projects/${projectId}/knowledge`),
  createWikiPage: (
    projectId: string,
    payload: { title: string; contentMarkdown: string; category: string; tags: string },
  ) =>
    request(`/api/projects/${projectId}/wiki`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createCheckpoint: (
    projectId: string,
    payload: {
      name: string
      category: string
      contextSnapshot: string
      decisions: string
      risks: string
      nextActions: string
    },
  ) =>
    request(`/api/projects/${projectId}/checkpoints`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createDocumentation: (
    projectId: string,
    payload: { title: string; contentMarkdown: string; category: string; tags: string },
  ) =>
    request(`/api/projects/${projectId}/documentation`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProjectConfig: (
    projectId: string,
    payload: { gitHubUrl?: string; localPath?: string; techStack?: string; mainBranch?: string },
  ) =>
    request<Project>(`/api/projects/${projectId}/config`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  addSubTask: (
    parentWorkItemId: string,
    payload: { title: string; description: string; assignee?: string; branch?: string; tags?: string },
  ) =>
    request(`/api/work-items/${parentWorkItemId}/sub-tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateBacklogContext: (
    backlogItemId: string,
    payload: { tags?: string; wikiRefs?: string; constraints?: string; commitIds?: string[] },
  ) =>
    request(`/api/backlog-items/${backlogItemId}/context`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
}
