import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient } from '../api/client'
import type { BacklogItem, Dashboard, KnowledgeResponse, Project, Sprint } from '../types'
import { ProjectContext } from './projectContextObject'
import type { ProjectContextValue } from './projectContextObject'

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [backlog, setBacklog] = useState<BacklogItem[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [knowledge, setKnowledge] = useState<KnowledgeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  const refreshProjectViews = useCallback(async (projectId: string) => {
    if (!projectId) {
      return
    }

    setLoading(true)
    setError('')
    try {
      const [dashboardResult, backlogResult, sprintResult, knowledgeResult] = await Promise.all([
        apiClient.getDashboard(projectId),
        apiClient.getBacklog(projectId),
        apiClient.getSprints(projectId),
        apiClient.getKnowledge(projectId),
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
  }, [])

  const refreshProjects = useCallback(async () => {
    try {
      const result = await apiClient.listProjects()
      setProjects(result)
      if (!selectedProjectId && result.length > 0) {
        setSelectedProjectId(result[0].id)
      }
      if (selectedProjectId && !result.some((project) => project.id === selectedProjectId)) {
        setSelectedProjectId(result[0]?.id ?? '')
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erro ao carregar projetos')
    }
  }, [selectedProjectId])

  const createProject = useCallback(
    async (payload: { name: string; description: string }) => {
      setError('')
      try {
        await apiClient.createProject(payload)
        await refreshProjects()
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Error creating project')
      }
    },
    [refreshProjects],
  )

  const updateProjectConfig = useCallback(
    async (payload: { gitHubUrl?: string; localPath?: string; techStack?: string; mainBranch?: string }) => {
      if (!selectedProjectId) return
      setError('')
      try {
        await apiClient.updateProjectConfig(selectedProjectId, payload)
        await refreshProjects()
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Erro ao salvar configurações')
      }
    },
    [selectedProjectId, refreshProjects],
  )

  useEffect(() => {
    void refreshProjects()
  }, [refreshProjects])

  useEffect(() => {
    if (selectedProjectId) {
      void refreshProjectViews(selectedProjectId)
    }
  }, [refreshProjectViews, selectedProjectId])

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      selectedProjectId,
      selectedProject,
      dashboard,
      backlog,
      sprints,
      knowledge,
      loading,
      error,
      setSelectedProjectId,
      refreshProjects,
      refreshProjectViews,
      createProject,
      updateProjectConfig,
    }),
    [
      backlog,
      createProject,
      updateProjectConfig,
      dashboard,
      error,
      knowledge,
      loading,
      projects,
      refreshProjects,
      refreshProjectViews,
      selectedProject,
      selectedProjectId,
      sprints,
    ],
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}
