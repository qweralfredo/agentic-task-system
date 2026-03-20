import AddTaskOutlinedIcon from '@mui/icons-material/AddTaskOutlined'
import {
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { MarkdownField } from '../components/MarkdownField'
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
  const [isCreateModalOpen, setCreateModalOpen] = useState(false)

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
    setCreateModalOpen(false)
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
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.2} alignItems={{ md: 'center' }}>
            <Stack>
              <Typography variant="h6">Backlog de Stories</Typography>
              <Typography variant="body2" color="text.secondary">
                Estruture itens com prioridade e story points em um fluxo objetivo de planejamento.
              </Typography>
            </Stack>
            <Button variant="contained" startIcon={<AddTaskOutlinedIcon />} onClick={() => setCreateModalOpen(true)}>
              Nova Story
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

      <Dialog open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="md">
        <Stack component="form" onSubmit={handleCreateBacklogItem}>
          <DialogTitle>Nova Story</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <TextField label="Titulo" value={title} onChange={(event) => setTitle(event.target.value)} required fullWidth />
              <MarkdownField label="Descricao" value={description} onChange={setDescription} required />
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
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Adicionar item</Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Stack>
  )
}
