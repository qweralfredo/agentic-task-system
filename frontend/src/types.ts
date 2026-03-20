export type Project = {
  id: string
  name: string
  description: string
  createdAt: string
}

export type BacklogItem = {
  id: string
  title: string
  description: string
  storyPoints: number
  priority: number
  status: number | string
}

export type WorkItemFeedback = {
  id: string
  agentName: string
  modelUsed: string
  ideUsed: string
  tokensUsed: number
  feedback: string
  metadataJson: string
  createdAt: string
}

export type SprintWorkItem = {
  id: string
  backlogItemId: string
  title: string
  description: string
  status: number | string
  assignee: string
  totalTokensSpent: number
  lastModelUsed: string
  lastIdeUsed: string
  createdAt: string
  updatedAt?: string
  feedbacks: WorkItemFeedback[]
}

export type Sprint = {
  id: string
  name: string
  goal: string
  status: number | string
  startDate: string
  endDate: string
  workItems: SprintWorkItem[]
}

export type KnowledgeWikiPage = {
  id: string
  title: string
  tags: string
  category: string
  updatedAt: string
}

export type KnowledgeCheckpoint = {
  id: string
  name: string
  category: string
  createdAt: string
}

export type KnowledgeDocumentation = {
  id: string
  title: string
  tags: string
  category: string
  updatedAt: string
}

export type AgentRun = {
  id: string
  agentName: string
  status: string
  startedAt: string
}

export type KnowledgeResponse = {
  wikiPages: KnowledgeWikiPage[]
  checkpoints: KnowledgeCheckpoint[]
  documentationPages: KnowledgeDocumentation[]
  agentRuns: AgentRun[]
}

export type Dashboard = {
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

export const workItemStatusLabels: Record<number, string> = {
  0: 'To Do',
  1: 'In Progress',
  2: 'Review',
  3: 'Done',
  4: 'Blocked',
}

export const backlogStatusLabels: Record<number, string> = {
  0: 'New',
  1: 'Planned',
  2: 'In Sprint',
  3: 'Done',
  4: 'Blocked',
}

export function toNumberStatus(value: number | string): number {
  return typeof value === 'number' ? value : Number(value)
}

export function groupByCategory<T extends { category?: string }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const category = item.category?.trim() || 'General'
    if (!acc[category]) {
      acc[category] = []
    }

    acc[category].push(item)
    return acc
  }, {})
}
