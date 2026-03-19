import {
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useProjectContext } from '../context/useProjectContext'

const metricCards: Array<{ key: string; label: string; color: 'primary' | 'secondary' | 'success' | 'warning' }> = [
  { key: 'backlogTotal', label: 'Backlog total', color: 'primary' },
  { key: 'backlogDone', label: 'Backlog concluido', color: 'success' },
  { key: 'activeSprints', label: 'Sprints ativas', color: 'secondary' },
  { key: 'workItemsInProgress', label: 'Tasks em progresso', color: 'warning' },
  { key: 'workItemsReview', label: 'Tasks em review', color: 'warning' },
  { key: 'workItemsDone', label: 'Tasks done', color: 'success' },
  { key: 'knowledgeCheckpoints', label: 'Checkpoints', color: 'primary' },
  { key: 'wikiPages', label: 'Wikis', color: 'secondary' },
  { key: 'agentRuns', label: 'Execucoes agenticas', color: 'primary' },
]

export function DashboardPage() {
  const { selectedProject, dashboard } = useProjectContext()

  if (!selectedProject) {
    return <Typography>Selecione um projeto para visualizar o dashboard.</Typography>
  }

  if (!dashboard) {
    return <Typography>Carregando metricas...</Typography>
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
            <Stack>
              <Typography variant="h5">{dashboard.projectName}</Typography>
              <Typography color="text.secondary">Painel de capacidade e andamento no estilo Jira.</Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip color="primary" label={`To Do: ${dashboard.workItemsTodo}`} />
              <Chip color="warning" label={`In Progress: ${dashboard.workItemsInProgress}`} />
              <Chip color="secondary" label={`Review: ${dashboard.workItemsReview}`} />
              <Chip color="success" label={`Done: ${dashboard.workItemsDone}`} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {metricCards.map((metric) => (
          <Grid key={metric.key} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ borderTop: '4px solid', borderColor: `${metric.color}.main` }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.8 }}>
                  {dashboard[metric.key as keyof typeof dashboard]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}
