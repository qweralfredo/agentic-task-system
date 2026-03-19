import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
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
  const draggedWorkItemRef = useRef('')

  const activeSprint = useMemo(
    () => sprints.find((sprint) => toNumberStatus(sprint.status) === 1) ?? sprints[0] ?? null,
    [sprints],
  )

  const sprintBoard = useMemo(() => {
    const columns: Record<number, typeof activeSprint.workItems> = { 0: [], 1: [], 2: [], 3: [] }
    const items = activeSprint?.workItems ?? []
    for (const item of items) {
      const status = toNumberStatus(item.status)
      if (columns[status]) {
        columns[status].push(item)
      }
    }
    return columns
  }, [activeSprint])

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
    if (!workItemId || !activeSprint || !selectedProjectId) {
      setDragTargetStatus(null)
      return
    }

    const task = activeSprint.workItems.find((item) => item.id === workItemId)
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

  async function handleMoveTask(workItemId: string, currentStatus: number | string, currentAssignee: string) {
    if (!selectedProjectId) {
      return
    }

    await apiClient.updateWorkItemStatus({
      workItemId,
      status: taskDraftStatus[workItemId] ?? toNumberStatus(currentStatus),
      assignee: (taskDraftAssignee[workItemId] ?? currentAssignee ?? '').trim(),
    })

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
    await refreshProjectViews(selectedProjectId)
  }

  if (!selectedProject) {
    return <Typography>Selecione um projeto para gerenciar sprints.</Typography>
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6">Planejamento da Sprint</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.8 }}>
            Monte a sprint selecionando itens de backlog e datas de execucao.
          </Typography>

          <Stack component="form" spacing={1.2} onSubmit={handleCreateSprint}>
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

            <Stack spacing={0.5} sx={{ maxHeight: 220, overflowY: 'auto', p: 1, border: '1px solid #dde6f0', borderRadius: 2 }}>
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

            <Button type="submit" variant="contained">Criar sprint</Button>
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
                color={activeSprint?.id === sprint.id ? 'primary' : 'default'}
                label={`${sprint.name} • ${toNumberStatus(sprint.status) === 1 ? 'Ativa' : 'Planejada/Fechada'}`}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>

      {!activeSprint ? (
        <Alert severity="info">Crie uma sprint para visualizar o quadro Kanban.</Alert>
      ) : (
        <Stack spacing={1.2}>
          <Typography variant="h6">Kanban da Sprint: {activeSprint.name}</Typography>
          <Grid container spacing={1.2}>
            {[0, 1, 2, 3].map((columnStatus) => (
              <Grid key={columnStatus} size={{ xs: 12, md: 6, lg: 3 }}>
                <Card
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
                    bgcolor: dragTargetStatus === columnStatus ? 'rgba(15,76,129,0.08)' : 'background.paper',
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                      {workItemStatusLabels[columnStatus]}
                    </Typography>
                    <Stack spacing={1}>
                      {(sprintBoard[columnStatus] ?? []).map((item) => (
                        <Card
                          key={item.id}
                          variant="outlined"
                          sx={{
                            borderLeft: '4px solid #0f4c81',
                            opacity: draggedWorkItemId === item.id ? 0.65 : 1,
                          }}
                        >
                          <CardContent>
                            <Stack spacing={0.8}>
                              <BoxDragHandle onDragStart={(event) => handleTaskDragStart(event, item.id)} onDragEnd={handleTaskDragEnd} />
                              <Typography variant="subtitle2" fontWeight={700}>{item.title}</Typography>
                              <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                              <Typography variant="caption">Assignee: {item.assignee || 'nao definido'}</Typography>
                              <Stack direction="row" spacing={0.8}>
                                <FormControl size="small" fullWidth>
                                  <InputLabel id={`status-${item.id}`}>Status</InputLabel>
                                  <Select
                                    labelId={`status-${item.id}`}
                                    label="Status"
                                    value={taskDraftStatus[item.id] ?? toNumberStatus(item.status)}
                                    onChange={(event) =>
                                      setTaskDraftStatus((prev) => ({ ...prev, [item.id]: Number(event.target.value) }))
                                    }
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
                                  value={taskDraftAssignee[item.id] ?? item.assignee ?? ''}
                                  onChange={(event) =>
                                    setTaskDraftAssignee((prev) => ({ ...prev, [item.id]: event.target.value }))
                                  }
                                />
                              </Stack>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleMoveTask(item.id, item.status, item.assignee)}
                              >
                                Atualizar
                              </Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}
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
        border: '1px dashed #0f4c81',
        color: '#0f4c81',
        borderRadius: 1,
        py: 0.3,
        cursor: 'grab',
      }}
    >
      <Typography variant="caption" fontWeight={700}>Arrastar</Typography>
    </Stack>
  )
}
