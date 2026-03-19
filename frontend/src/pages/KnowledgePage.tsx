import {
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { apiClient } from '../api/client'
import { useProjectContext } from '../context/useProjectContext'
import { groupByCategory } from '../types'

export function KnowledgePage() {
  const { selectedProjectId, selectedProject, knowledge, refreshProjectViews } = useProjectContext()

  const [wikiTitle, setWikiTitle] = useState('')
  const [wikiCategory, setWikiCategory] = useState('How-To')
  const [wikiTags, setWikiTags] = useState('')
  const [wikiContent, setWikiContent] = useState('')

  const [checkpointName, setCheckpointName] = useState('')
  const [checkpointCategory, setCheckpointCategory] = useState('Release')
  const [checkpointContext, setCheckpointContext] = useState('')
  const [checkpointDecisions, setCheckpointDecisions] = useState('')
  const [checkpointRisks, setCheckpointRisks] = useState('')
  const [checkpointNextActions, setCheckpointNextActions] = useState('')

  const [docTitle, setDocTitle] = useState('')
  const [docCategory, setDocCategory] = useState('Architecture')
  const [docTags, setDocTags] = useState('')
  const [docContent, setDocContent] = useState('')

  const wikiByCategory = useMemo(() => groupByCategory(knowledge?.wikiPages ?? []), [knowledge])
  const checkpointByCategory = useMemo(() => groupByCategory(knowledge?.checkpoints ?? []), [knowledge])
  const docsByCategory = useMemo(() => groupByCategory(knowledge?.documentationPages ?? []), [knowledge])

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
    setWikiTags('')
    setWikiContent('')
    await refreshProjectViews(selectedProjectId)
  }

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
    setCheckpointContext('')
    setCheckpointDecisions('')
    setCheckpointRisks('')
    setCheckpointNextActions('')
    await refreshProjectViews(selectedProjectId)
  }

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
    setDocTags('')
    setDocContent('')
    await refreshProjectViews(selectedProjectId)
  }

  if (!selectedProject) {
    return (
      <Card variant="outlined" sx={{ borderStyle: 'dashed' }}>
        <CardContent>
          <Stack alignItems="center" justifyContent="center" spacing={1.2} sx={{ py: 4 }}>
            <Typography variant="h6">Sem projeto ativo</Typography>
            <Typography color="text.secondary" sx={{ textAlign: 'center', maxWidth: 540 }}>
              Selecione um projeto para cadastrar wiki, checkpoints e documentação da execução.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Wiki</Typography>
              <Stack component="form" spacing={1.2} sx={{ mt: 1 }} onSubmit={handleCreateWiki}>
                <TextField label="Titulo" value={wikiTitle} onChange={(event) => setWikiTitle(event.target.value)} required />
                <TextField label="Categoria" value={wikiCategory} onChange={(event) => setWikiCategory(event.target.value)} required />
                <TextField label="Tags" value={wikiTags} onChange={(event) => setWikiTags(event.target.value)} />
                <TextField
                  label="Conteudo"
                  value={wikiContent}
                  onChange={(event) => setWikiContent(event.target.value)}
                  multiline
                  minRows={4}
                  required
                />
                <Button type="submit" variant="contained">Salvar wiki</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Checkpoint</Typography>
              <Stack component="form" spacing={1.2} sx={{ mt: 1 }} onSubmit={handleCreateCheckpoint}>
                <TextField label="Nome" value={checkpointName} onChange={(event) => setCheckpointName(event.target.value)} required />
                <TextField
                  label="Categoria"
                  value={checkpointCategory}
                  onChange={(event) => setCheckpointCategory(event.target.value)}
                  required
                />
                <TextField label="Contexto" value={checkpointContext} onChange={(event) => setCheckpointContext(event.target.value)} multiline minRows={2} />
                <TextField label="Decisoes" value={checkpointDecisions} onChange={(event) => setCheckpointDecisions(event.target.value)} multiline minRows={2} />
                <TextField label="Riscos" value={checkpointRisks} onChange={(event) => setCheckpointRisks(event.target.value)} multiline minRows={2} />
                <TextField
                  label="Proximas acoes"
                  value={checkpointNextActions}
                  onChange={(event) => setCheckpointNextActions(event.target.value)}
                  multiline
                  minRows={2}
                />
                <Button type="submit" variant="contained">Salvar checkpoint</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Documentacao</Typography>
              <Stack component="form" spacing={1.2} sx={{ mt: 1 }} onSubmit={handleCreateDocumentation}>
                <TextField label="Titulo" value={docTitle} onChange={(event) => setDocTitle(event.target.value)} required />
                <TextField label="Categoria" value={docCategory} onChange={(event) => setDocCategory(event.target.value)} required />
                <TextField label="Tags" value={docTags} onChange={(event) => setDocTags(event.target.value)} />
                <TextField
                  label="Conteudo"
                  value={docContent}
                  onChange={(event) => setDocContent(event.target.value)}
                  multiline
                  minRows={4}
                  required
                />
                <Button type="submit" variant="contained">Salvar documento</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <CategoryCards title="Wiki por categoria" groupedData={wikiByCategory} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <CategoryCards title="Checkpoints por categoria" groupedData={checkpointByCategory} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <CategoryCards title="Documentacao por categoria" groupedData={docsByCategory} />
        </Grid>
      </Grid>
    </Stack>
  )
}

function CategoryCards({ title, groupedData }: { title: string; groupedData: Record<string, Array<{ id: string; title?: string; name?: string; tags?: string }>> }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6">{title}</Typography>
        <Stack spacing={1.2} sx={{ mt: 1.1 }}>
          {Object.entries(groupedData).map(([category, items]) => (
            <Stack key={category} spacing={0.6}>
              <Typography variant="overline" color="primary.main">{category}</Typography>
              {items.map((item) => (
                <Stack key={item.id} spacing={0.4}>
                  <Typography variant="body2" fontWeight={700}>{item.title ?? item.name}</Typography>
                  {item.tags ? <Typography variant="caption" color="text.secondary">{item.tags}</Typography> : null}
                  <Divider />
                </Stack>
              ))}
            </Stack>
          ))}
          {Object.keys(groupedData).length === 0 ? (
            <Typography variant="body2" color="text.secondary">Sem registros nessa secao.</Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
}
