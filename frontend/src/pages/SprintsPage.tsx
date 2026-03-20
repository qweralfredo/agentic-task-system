import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { apiClient } from '../api/client'
import { useProjectContext } from '../context/useProjectContext'
import { backlogStatusLabels, toNumberStatus, workItemStatusLabels } from '../types'

export function SprintsPage() {
  const { selectedProjectId, selectedProject, backlog, sprints, refreshProjectViews } = useProjectContext()

  const [newSprintName, setNewSprintName] = useState('')
  const [newSprintGoal, setNewSprintGoal] = useState('')
  const [newSprintStartDate, setNewSprintStartDate] = useState('')
  const [newSprintEndDate, setNewSprintEndDate] = useState('')
  const [selectedBacklogIds, setSelectedBacklogIds] = useState<string[]>([])
  const [taskDraftStatus, setTaskDraftStatus] = useState<Record<string, number>>({})
  const [taskDraftAssignee, setTaskDraftAssignee] = useState<Record<string, string>>({})
  const [draggedWorkItemId, setDraggedWorkItemId] = useState('')
  const [dragTargetStatus, setDragTargetStatus] = useState<number | null>(null)
  const [selectedBoardSprintId, setSelectedBoardSprintId] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [isSprintModalOpen, setSprintModalOpen] = useState(false)
  const [editingWorkItemId, setEditingWorkItemId] = useState('')
  const [editingWorkItemStatus, setEditingWorkItemStatus] = useState(0)
  const [editingWorkItemAssignee, setEditingWorkItemAssignee] = useState('')
  const draggedWorkItemRef = useRef('')

  const fallbackBoardSprintId =
    sprints.find((sprint) => toNumberStatus(sprint.status) === 1)?.id ?? sprints[0]?.id ?? ''
  const boardSprintId = selectedBoardSprintId || fallbackBoardSprintId

  const boardSprint = useMemo(
    () =>
      sprints.find((sprint) => sprint.id === boardSprintId) ??
      sprints.find((sprint) => toNumberStatus(sprint.status) === 1) ??
      sprints[0] ??
      null,
    [boardSprintId, sprints],
  )

  const activeSprint = useMemo(
    () => sprints.find((sprint) => toNumberStatus(sprint.status) === 1) ?? sprints[0] ?? null,
    [sprints],
  )

  const workItemPriorityByTitle = useMemo(
    () =>
      backlog.reduce<Record<string, number>>((acc, item) => {
        acc[item.title.trim().toLowerCase()] = item.priority
        return acc
      }, {}),
    [backlog],
  )

  const availableAssignees = useMemo(() => {
    const assignees = new Set<string>()
    const items = boardSprint?.workItems ?? []
    for (const item of items) {
      const currentAssignee = (taskDraftAssignee[item.id] ?? item.assignee ?? '').trim()
      if (currentAssignee) {
        assignees.add(currentAssignee)
      }
    }
    return Array.from(assignees).sort((a, b) => a.localeCompare(b))
  }, [boardSprint, taskDraftAssignee])

  const availablePriorities = useMemo(() => {
    const priorities = new Set<number>()
    for (const item of boardSprint?.workItems ?? []) {
      const priority = workItemPriorityByTitle[item.title.trim().toLowerCase()]
      if (typeof priority === 'number') {
        priorities.add(priority)
      }
    }
    return Array.from(priorities).sort((a, b) => a - b)
  }, [boardSprint, workItemPriorityByTitle])

  const sprintBoard = useMemo(() => {
    const columns: Record<number, typeof boardSprint.workItems> = { 0: [], 1: [], 2: [], 3: [] }
    const items = boardSprint?.workItems ?? []
    for (const item of items) {
      const status = toNumberStatus(item.status)
      const assignee = (taskDraftAssignee[item.id] ?? item.assignee ?? '').trim()
      const priority = workItemPriorityByTitle[item.title.trim().toLowerCase()]

      const matchesAssignee = assigneeFilter === 'all' || assignee === assigneeFilter
      const matchesPriority =
        priorityFilter === 'all' ||
        (typeof priority === 'number' && String(priority) === priorityFilter)

      if (columns[status] && matchesAssignee && matchesPriority) {
        columns[status].push(item)
      }
    }
    return columns
  }, [assigneeFilter, boardSprint, priorityFilter, taskDraftAssignee, workItemPriorityByTitle])

  function toggleBacklogSelection(backlogItemId: string) {
    setSelectedBacklogIds((previous) =>
      previous.includes(backlogItemId)
        ? previous.filter((id) => id !== backlogItemId)
        : [...previous, backlogItemId],
    )
  }

  function handleTaskDragStart(event: DragEvent<HTMLDivElement>, workItemId: string) {
    draggedWorkItemRef.current = workItemId
    event.dataTransfer.setData('text/work-item-id', workItemId)
    event.dataTransfer.effectAllowed = 'move'
    setDraggedWorkItemId(workItemId)
  }

  function handleTaskDragEnd() {
    draggedWorkItemRef.current = ''
    setDraggedWorkItemId('')
    setDragTargetStatus(null)
  }

  function getDroppedWorkItemId(event: DragEvent<HTMLElement>): string {
    const payload = event.dataTransfer.getData('text/work-item-id')
    return payload || draggedWorkItemRef.current
  }

  async function handleTaskDrop(targetStatus: number, workItemId: string) {
    if (!workItemId || !boardSprint || !selectedProjectId) {
      setDragTargetStatus(null)
      return
    }

    const task = boardSprint.workItems.find((item) => item.id === workItemId)
    if (!task) {
      setDragTargetStatus(null)
      return
    }

    setTaskDraftStatus((prev) => ({ ...prev, [workItemId]: targetStatus }))
    await apiClient.updateWorkItemStatus({
      workItemId,
      status: targetStatus,
      assignee: (taskDraftAssignee[workItemId] ?? task.assignee ?? '').trim(),
    })

    handleTaskDragEnd()
    await refreshProjectViews(selectedProjectId)
  }

  function handleOpenTaskModal(workItemId: string, currentStatus: number | string, currentAssignee: string) {
    setEditingWorkItemId(workItemId)
    setEditingWorkItemStatus(taskDraftStatus[workItemId] ?? toNumberStatus(currentStatus))
    setEditingWorkItemAssignee(taskDraftAssignee[workItemId] ?? currentAssignee ?? '')
  }

  async function handleSaveTaskFromModal() {
    if (!editingWorkItemId || !selectedProjectId) {
      return
    }

    await apiClient.updateWorkItemStatus({
      workItemId: editingWorkItemId,
      status: editingWorkItemStatus,
      assignee: editingWorkItemAssignee.trim(),
    })

    setTaskDraftStatus((prev) => ({ ...prev, [editingWorkItemId]: editingWorkItemStatus }))
    setTaskDraftAssignee((prev) => ({ ...prev, [editingWorkItemId]: editingWorkItemAssignee }))
    setEditingWorkItemId('')
    await refreshProjectViews(selectedProjectId)
  }

  async function handleCreateSprint(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !newSprintName.trim() || !newSprintGoal.trim()) {
      return
    }

    await apiClient.createSprint(selectedProjectId, {
      name: newSprintName,
      goal: newSprintGoal,
      startDate: newSprintStartDate || new Date().toISOString().slice(0, 10),
      endDate: newSprintEndDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      backlogItemIds: selectedBacklogIds,
    })

    setNewSprintName('')
    setNewSprintGoal('')
    setNewSprintStartDate('')
    setNewSprintEndDate('')
    setSelectedBacklogIds([])
    setSprintModalOpen(false)
    await refreshProjectViews(selectedProjectId)
  }

  if (!selectedProject) {
    return (
      <Card variant="outlined" sx={{ borderStyle: 'dashed' }}>
        <CardContent>
          <Stack alignItems="center" justifyContent="center" spacing={1.2} sx={{ py: 4 }}>
            <Typography variant="h6">Sem projeto ativo</Typography>
            <Typography color="text.secondary" sx={{ textAlign: 'center', maxWidth: 520 }}>
              Selecione um projeto para montar sprint, distribuir tarefas no kanban e acompanhar o fluxo.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.2} alignItems={{ md: 'center' }}>
            <Stack>
              <Typography variant="h6">Planejamento da Sprint</Typography>
              <Typography variant="body2" color="text.secondary">
                Defina objetivo, datas e backlog em um modal para manter foco no board.
              </Typography>
            </Stack>
            <Button variant="contained" onClick={() => setSprintModalOpen(true)}>
              Nova Sprint
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">Sprints do Projeto</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.2 }}>
            {sprints.map((sprint) => (
              <Chip
                key={sprint.id}
                clickable
                color={boardSprintId === sprint.id ? 'primary' : 'default'}
                variant={activeSprint?.id === sprint.id ? 'filled' : 'outlined'}
                label={`${sprint.name} • ${toNumberStatus(sprint.status) === 1 ? 'Ativa' : 'Planejada/Fechada'}`}
                onClick={() => setSelectedBoardSprintId(sprint.id)}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">Filtros do Board</Typography>
          <Grid container spacing={1.2} sx={{ mt: 0.6 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="board-sprint-label">Sprint</InputLabel>
                <Select
                  labelId="board-sprint-label"
                  label="Sprint"
                  value={boardSprintId}
                  onChange={(event) => setSelectedBoardSprintId(event.target.value)}
                >
                  {sprints.map((sprint) => (
                    <MenuItem key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="board-assignee-label">Assignee</InputLabel>
                <Select
                  labelId="board-assignee-label"
                  label="Assignee"
                  value={assigneeFilter}
                  onChange={(event) => setAssigneeFilter(event.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {availableAssignees.map((assignee) => (
                    <MenuItem key={assignee} value={assignee}>
                      {assignee}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="board-priority-label">Prioridade</InputLabel>
                <Select
                  labelId="board-priority-label"
                  label="Prioridade"
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  {availablePriorities.map((priority) => (
                    <MenuItem key={priority} value={String(priority)}>
                      P{priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!boardSprint ? (
        <Alert severity="info">Crie uma sprint para visualizar o quadro Kanban.</Alert>
      ) : (
        <Stack spacing={1.2}>
          <Typography variant="h6">Kanban da Sprint: {boardSprint.name}</Typography>
          <Grid container spacing={1.2}>
            {[0, 1, 2, 3].map((columnStatus) => (
              <Grid key={columnStatus} size={{ xs: 12, md: 6, lg: 3 }}>
                <Paper
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragTargetStatus(columnStatus)
                  }}
                  onDragLeave={() => setDragTargetStatus((prev) => (prev === columnStatus ? null : prev))}
                  onDrop={(event) => {
                    event.preventDefault()
                    const droppedWorkItemId = getDroppedWorkItemId(event)
                    void handleTaskDrop(columnStatus, droppedWorkItemId)
                  }}
                  sx={{
                    minHeight: 360,
                    borderRadius: 3,
                    border: dragTargetStatus === columnStatus ? '1px solid #4f8fda' : '1px solid #d6deea',
                    bgcolor: dragTargetStatus === columnStatus ? '#e7f1ff' : '#edf2f8',
                    transition: 'background-color 120ms ease, border-color 120ms ease',
                  }}
                >
                  <CardContent sx={{ p: 1.3 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5, pb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {workItemStatusLabels[columnStatus]}
                      </Typography>
                      <Chip label={(sprintBoard[columnStatus] ?? []).length} size="small" color="default" />
                    </Stack>
                    <Stack spacing={1}>
                      {(sprintBoard[columnStatus] ?? []).map((item) => (
                        <Paper
                          key={item.id}
                          sx={{
                            borderRadius: 2,
                            border: '1px solid #d7dfeb',
                            borderLeft: '4px solid #2f78c5',
                            bgcolor: '#ffffff',
                            boxShadow: '0 1px 1px rgba(9,30,66,0.09)',
                            opacity: draggedWorkItemId === item.id ? 0.65 : 1,
                          }}
                        >
                          <CardContent sx={{ p: 1.1, '&:last-child': { pb: 1.1 } }}>
                            <Stack spacing={0.8}>
                              <BoxDragHandle onDragStart={(event) => handleTaskDragStart(event, item.id)} onDragEnd={handleTaskDragEnd} />
                              <Typography variant="subtitle2" fontWeight={700}>{item.title}</Typography>
                              <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption">Assignee: {item.assignee || 'nao definido'}</Typography>
                                <Chip size="small" label={`P${workItemPriorityByTitle[item.title.trim().toLowerCase()] ?? '-'}`} />
                              </Stack>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleOpenTaskModal(item.id, item.status, item.assignee)}
                              >
                                Editar task
                              </Button>
                            </Stack>
                          </CardContent>
                        </Paper>
                      ))}
                      {(sprintBoard[columnStatus] ?? []).length === 0 ? (
                        <Box
                          sx={{
                            borderRadius: 2,
                            border: '1px dashed #b7c7dc',
                            p: 1.2,
                            textAlign: 'center',
                            color: 'text.secondary',
                            fontSize: 13,
                          }}
                        >
                          Arraste uma task para esta lista.
                        </Box>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}

      <Dialog open={isSprintModalOpen} onClose={() => setSprintModalOpen(false)} fullWidth maxWidth="md">
        <Stack component="form" spacing={1.2} onSubmit={handleCreateSprint}>
          <DialogTitle>Nova Sprint</DialogTitle>
          <DialogContent>
            <Stack spacing={1.2} sx={{ mt: 1 }}>
              <TextField
                value={newSprintName}
                onChange={(event) => setNewSprintName(event.target.value)}
                label="Nome da sprint"
                required
              />
              <TextField
                value={newSprintGoal}
                onChange={(event) => setNewSprintGoal(event.target.value)}
                label="Objetivo"
                required
              />
              <Grid container spacing={1.2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    type="date"
                    value={newSprintStartDate}
                    onChange={(event) => setNewSprintStartDate(event.target.value)}
                    label="Inicio"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    type="date"
                    value={newSprintEndDate}
                    onChange={(event) => setNewSprintEndDate(event.target.value)}
                    label="Fim"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Stack spacing={0.5} sx={{ maxHeight: 260, overflowY: 'auto', p: 1, border: '1px solid #dde6f0', borderRadius: 2 }}>
                {backlog.filter((item) => toNumberStatus(item.status) <= 2).map((item) => (
                  <Stack key={item.id} direction="row" alignItems="center" spacing={1}>
                    <Checkbox
                      checked={selectedBacklogIds.includes(item.id)}
                      onChange={() => toggleBacklogSelection(item.id)}
                    />
                    <Stack>
                      <Typography variant="body2" fontWeight={700}>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {backlogStatusLabels[toNumberStatus(item.status)] ?? String(item.status)} | SP {item.storyPoints}
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSprintModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Criar sprint</Button>
          </DialogActions>
        </Stack>
      </Dialog>

      <Dialog open={Boolean(editingWorkItemId)} onClose={() => setEditingWorkItemId('')} fullWidth maxWidth="xs">
        <DialogTitle>Editar task</DialogTitle>
        <DialogContent>
          <Stack spacing={1.2} sx={{ mt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="modal-task-status-label">Status</InputLabel>
              <Select
                labelId="modal-task-status-label"
                label="Status"
                value={editingWorkItemStatus}
                onChange={(event) => setEditingWorkItemStatus(Number(event.target.value))}
              >
                <MenuItem value={0}>To Do</MenuItem>
                <MenuItem value={1}>In Progress</MenuItem>
                <MenuItem value={2}>Review</MenuItem>
                <MenuItem value={3}>Done</MenuItem>
                <MenuItem value={4}>Blocked</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Assignee"
              value={editingWorkItemAssignee}
              onChange={(event) => setEditingWorkItemAssignee(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingWorkItemId('')}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveTaskFromModal}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

function BoxDragHandle({
  onDragStart,
  onDragEnd,
}: {
  onDragStart: (event: DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      sx={{
        border: '1px dashed #5f7fa5',
        color: '#30587f',
        borderRadius: 1,
        py: 0.3,
        bgcolor: '#f6f9ff',
        cursor: 'grab',
      }}
    >
      <Typography variant="caption" fontWeight={700}>Arrastar</Typography>
    </Stack>
  )
}
