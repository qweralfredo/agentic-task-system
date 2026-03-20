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
    payload: { title: string; description: string; storyPoints: number; priority: number },
  ) =>
    request<BacklogItem>(`/api/projects/${projectId}/backlog`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSprints: (projectId: string) => request<Sprint[]>(`/api/projects/${projectId}/sprints`),
  createSprint: (
    projectId: string,
    payload: { name: string; goal: string; startDate: string; endDate: string; backlogItemIds: string[] },
  ) =>
    request(`/api/projects/${projectId}/sprints`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateWorkItemStatus: (payload: { workItemId: string; status: number; assignee: string }) =>
    request(`/api/work-items/${payload.workItemId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: payload.status, assignee: payload.assignee }),
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
}
