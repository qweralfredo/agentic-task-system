import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded'
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { MarkdownField } from '../components/MarkdownField'
import { useMemo, useState } from 'react'
import { apiClient } from '../api/client'
import { useProjectContext } from '../context/useProjectContext'
import { groupByCategory } from '../types'
import { KnowledgeNav } from './KnowledgeNav'

export function CheckpointsPage() {
  const { selectedProjectId, selectedProject, knowledge, refreshProjectViews } = useProjectContext()
  const [isModalOpen, setModalOpen] = useState(false)
  const [checkpointName, setCheckpointName] = useState('')
  const [checkpointCategory, setCheckpointCategory] = useState('Release')
  const [checkpointContext, setCheckpointContext] = useState('')
  const [checkpointDecisions, setCheckpointDecisions] = useState('')
  const [checkpointRisks, setCheckpointRisks] = useState('')
  const [checkpointNextActions, setCheckpointNextActions] = useState('')

  const checkpointByCategory = useMemo(() => groupByCategory(knowledge?.checkpoints ?? []), [knowledge])

  async function handleCreateCheckpoint(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !checkpointName.trim()) {
      return
    }

    await apiClient.createCheckpoint(selectedProjectId, {
      name: checkpointName,
      category: checkpointCategory,
      contextSnapshot: checkpointContext,
      decisions: checkpointDecisions,
      risks: checkpointRisks,
      nextActions: checkpointNextActions,
    })

    setCheckpointName('')
    setCheckpointCategory('Release')
    setCheckpointContext('')
    setCheckpointDecisions('')
    setCheckpointRisks('')
    setCheckpointNextActions('')
    setModalOpen(false)
    await refreshProjectViews(selectedProjectId)
  }

  if (!selectedProject) {
    return (
      <Card variant="outlined" sx={{ borderStyle: 'dashed' }}>
        <CardContent>
          <Stack alignItems="center" justifyContent="center" spacing={1.2} sx={{ py: 4 }}>
            <Typography variant="h6">Sem projeto ativo</Typography>
            <Typography color="text.secondary" sx={{ textAlign: 'center', maxWidth: 540 }}>
              Selecione um projeto para registrar checkpoints de progresso.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Stack spacing={2}>
      <KnowledgeNav />

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.2} alignItems={{ md: 'center' }}>
            <Stack>
              <Typography variant="h6">Checkpoints do Projeto</Typography>
              <Typography color="text.secondary">
                Marcos com contexto, decisoes, riscos e proximas acoes.
              </Typography>
            </Stack>
            <Button variant="contained" startIcon={<AddCircleOutlineRoundedIcon />} onClick={() => setModalOpen(true)}>
              Novo Checkpoint
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {Object.entries(checkpointByCategory).map(([category, items]) => (
          <Grid key={category} size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="overline" color="primary.main">{category}</Typography>
                <Stack spacing={0.7} sx={{ mt: 0.8 }}>
                  {items.map((item) => (
                    <Typography key={item.id} variant="body2" fontWeight={700}>
                      {item.name}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {Object.keys(checkpointByCategory).length === 0 ? (
        <Typography color="text.secondary">Sem checkpoints neste projeto.</Typography>
      ) : null}

      <Dialog open={isModalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="xl">
        <Stack component="form" onSubmit={handleCreateCheckpoint}>
          <DialogTitle>Novo Checkpoint</DialogTitle>
          <DialogContent>
            <Stack spacing={1.2} sx={{ mt: 1 }}>
              <TextField label="Nome" value={checkpointName} onChange={(event) => setCheckpointName(event.target.value)} required />
              <TextField label="Categoria" value={checkpointCategory} onChange={(event) => setCheckpointCategory(event.target.value)} required />
              <MarkdownField label="Contexto" value={checkpointContext} onChange={setCheckpointContext} height={160} />
              <MarkdownField label="Decisoes" value={checkpointDecisions} onChange={setCheckpointDecisions} height={160} />
              <MarkdownField label="Riscos" value={checkpointRisks} onChange={setCheckpointRisks} height={160} />
              <MarkdownField label="Proximas acoes" value={checkpointNextActions} onChange={setCheckpointNextActions} height={160} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Salvar checkpoint</Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Stack>
  )
}
