import AddTaskOutlinedIcon from '@mui/icons-material/AddTaskOutlined'
import {
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { apiClient } from '../api/client'
import { useProjectContext } from '../context/useProjectContext'
import { backlogStatusLabels, toNumberStatus } from '../types'

export function BacklogPage() {
  const { selectedProjectId, selectedProject, backlog, refreshProjectViews } = useProjectContext()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [storyPoints, setStoryPoints] = useState(3)
  const [priority, setPriority] = useState(1)

  async function handleCreateBacklogItem(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !title.trim() || !description.trim()) {
      return
    }

    await apiClient.createBacklogItem(selectedProjectId, {
      title,
      description,
      storyPoints,
      priority,
    })

    setTitle('')
    setDescription('')
    setStoryPoints(3)
    setPriority(1)
    await refreshProjectViews(selectedProjectId)
  }

  if (!selectedProject) {
    return (
      <Card variant="outlined" sx={{ borderStyle: 'dashed' }}>
        <CardContent>
          <Stack alignItems="center" justifyContent="center" spacing={1.2} sx={{ py: 4 }}>
            <Typography variant="h6">Sem projeto ativo</Typography>
            <Typography color="text.secondary" sx={{ textAlign: 'center', maxWidth: 520 }}>
              Escolha um projeto para criar stories, priorizar backlog e organizar o planejamento de sprint.
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
          <Typography variant="h6">Nova Story</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Estruture itens do backlog com prioridade e story points no estilo Jira.
          </Typography>
          <Stack component="form" spacing={1.5} onSubmit={handleCreateBacklogItem}>
            <TextField label="Titulo" value={title} onChange={(event) => setTitle(event.target.value)} required fullWidth />
            <TextField
              label="Descricao"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              multiline
              minRows={3}
              fullWidth
            />
            <Grid container spacing={1.2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="number"
                  label="Story points"
                  value={storyPoints}
                  onChange={(event) => setStoryPoints(Number(event.target.value))}
                  inputProps={{ min: 1 }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="number"
                  label="Prioridade"
                  value={priority}
                  onChange={(event) => setPriority(Number(event.target.value))}
                  inputProps={{ min: 1 }}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Button type="submit" variant="contained" startIcon={<AddTaskOutlinedIcon />}>
              Adicionar item
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        <Typography variant="h6">Lista de Backlog</Typography>
        {backlog.length === 0 ? (
          <Typography color="text.secondary">Nenhum item cadastrado para este projeto.</Typography>
        ) : (
          backlog.map((item) => (
            <Card key={item.id}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                  <Stack spacing={0.6}>
                    <Typography variant="subtitle1" fontWeight={700}>{item.title}</Typography>
                    <Typography color="text.secondary">{item.description}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip label={`SP ${item.storyPoints}`} color="primary" variant="outlined" />
                    <Chip label={`P${item.priority}`} color="secondary" variant="outlined" />
                    <Chip label={backlogStatusLabels[toNumberStatus(item.status)] ?? String(item.status)} color="default" />
                  </Stack>
                </Stack>
                <Divider sx={{ my: 1.2 }} />
                <Typography variant="caption" color="text.secondary">
                  ID: {item.id}
                </Typography>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Stack>
  )
}
