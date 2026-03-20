import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded'
import {
  Button,
  Card,
  CardContent,
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
import { useMemo, useState } from 'react'
import { apiClient } from '../api/client'
import { useProjectContext } from '../context/useProjectContext'
import { groupByCategory } from '../types'
import { KnowledgeNav } from './KnowledgeNav'

export function DocumentationPage() {
  const { selectedProjectId, selectedProject, knowledge, refreshProjectViews } = useProjectContext()
  const [isModalOpen, setModalOpen] = useState(false)
  const [docTitle, setDocTitle] = useState('')
  const [docCategory, setDocCategory] = useState('Architecture')
  const [docTags, setDocTags] = useState('')
  const [docContent, setDocContent] = useState('')

  const docsByCategory = useMemo(() => groupByCategory(knowledge?.documentationPages ?? []), [knowledge])

  async function handleCreateDocumentation(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !docTitle.trim() || !docContent.trim()) {
      return
    }

    await apiClient.createDocumentation(selectedProjectId, {
      title: docTitle,
      contentMarkdown: docContent,
      category: docCategory,
      tags: docTags,
    })

    setDocTitle('')
    setDocCategory('Architecture')
    setDocTags('')
    setDocContent('')
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
              Selecione um projeto para manter a documentacao tecnica organizada.
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
              <Typography variant="h6">Documentacao do Projeto</Typography>
              <Typography color="text.secondary">
                Paginas oficiais de arquitetura, operacao e decisoes de engenharia.
              </Typography>
            </Stack>
            <Button variant="contained" startIcon={<AddCircleOutlineRoundedIcon />} onClick={() => setModalOpen(true)}>
              Novo Documento
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {Object.entries(docsByCategory).map(([category, items]) => (
          <Grid key={category} size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="overline" color="primary.main">{category}</Typography>
                <Stack spacing={0.8} sx={{ mt: 0.8 }}>
                  {items.map((item) => (
                    <Stack key={item.id} spacing={0.4}>
                      <Typography variant="body2" fontWeight={700}>{item.title}</Typography>
                      {item.tags ? <Typography variant="caption" color="text.secondary">{item.tags}</Typography> : null}
                      <Divider />
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {Object.keys(docsByCategory).length === 0 ? (
        <Typography color="text.secondary">Sem documentos neste projeto.</Typography>
      ) : null}

      <Dialog open={isModalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="lg">
        <Stack component="form" onSubmit={handleCreateDocumentation}>
          <DialogTitle>Novo Documento</DialogTitle>
          <DialogContent>
            <Stack spacing={1.2} sx={{ mt: 1 }}>
              <TextField label="Titulo" value={docTitle} onChange={(event) => setDocTitle(event.target.value)} required />
              <TextField label="Categoria" value={docCategory} onChange={(event) => setDocCategory(event.target.value)} required />
              <TextField label="Tags" value={docTags} onChange={(event) => setDocTags(event.target.value)} />
              <MarkdownField label="Conteudo" value={docContent} onChange={setDocContent} required height={320} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Salvar documento</Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Stack>
  )
}
