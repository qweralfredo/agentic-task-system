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

export function WikiPage() {
  const { selectedProjectId, selectedProject, knowledge, refreshProjectViews } = useProjectContext()
  const [isModalOpen, setModalOpen] = useState(false)
  const [wikiTitle, setWikiTitle] = useState('')
  const [wikiCategory, setWikiCategory] = useState('How-To')
  const [wikiTags, setWikiTags] = useState('')
  const [wikiContent, setWikiContent] = useState('')

  const wikiByCategory = useMemo(() => groupByCategory(knowledge?.wikiPages ?? []), [knowledge])

  async function handleCreateWiki(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !wikiTitle.trim() || !wikiContent.trim()) {
      return
    }

    await apiClient.createWikiPage(selectedProjectId, {
      title: wikiTitle,
      contentMarkdown: wikiContent,
      category: wikiCategory,
      tags: wikiTags,
    })

    setWikiTitle('')
    setWikiCategory('How-To')
    setWikiTags('')
    setWikiContent('')
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
              Selecione um projeto para cadastrar e revisar as paginas de wiki.
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
              <Typography variant="h6">Wiki do Projeto</Typography>
              <Typography color="text.secondary">
                Conteudo vivo para padroes, how-to e acordos operacionais.
              </Typography>
            </Stack>
            <Button variant="contained" startIcon={<AddCircleOutlineRoundedIcon />} onClick={() => setModalOpen(true)}>
              Nova Wiki
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {Object.entries(wikiByCategory).map(([category, items]) => (
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

      {Object.keys(wikiByCategory).length === 0 ? (
        <Typography color="text.secondary">Sem registros de wiki neste projeto.</Typography>
      ) : null}

      <Dialog open={isModalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="lg">
        <Stack component="form" onSubmit={handleCreateWiki}>
          <DialogTitle>Nova Wiki</DialogTitle>
          <DialogContent>
            <Stack spacing={1.2} sx={{ mt: 1 }}>
              <TextField label="Titulo" value={wikiTitle} onChange={(event) => setWikiTitle(event.target.value)} required />
              <TextField label="Categoria" value={wikiCategory} onChange={(event) => setWikiCategory(event.target.value)} required />
              <TextField label="Tags" value={wikiTags} onChange={(event) => setWikiTags(event.target.value)} />
              <MarkdownField label="Conteudo" value={wikiContent} onChange={setWikiContent} required height={320} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Salvar wiki</Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Stack>
  )
}
