import {
  Card,
  CardContent,
  Grid,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import { NavLink } from 'react-router-dom'
import { useProjectContext } from '../context/useProjectContext'
import { KnowledgeNav } from './KnowledgeNav'

export function KnowledgePage() {
  const { selectedProject, knowledge } = useProjectContext()

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
      <KnowledgeNav />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Wiki</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.8 }}>
                Centralize guias, how-tos e acordos tecnicos da equipe.
              </Typography>
              <Link component={NavLink} to="/knowledge/wiki" underline="hover" sx={{ mt: 1.2, display: 'inline-flex' }}>
                Abrir tela de Wiki
              </Link>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Checkpoint</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.8 }}>
                Registre contexto, decisoes, riscos e proximos passos por marco.
              </Typography>
              <Link component={NavLink} to="/knowledge/checkpoints" underline="hover" sx={{ mt: 1.2, display: 'inline-flex' }}>
                Abrir tela de Checkpoints
              </Link>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Documentacao</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.8 }}>
                Mantenha arquitetura, operacao e referencias tecnicas organizadas.
              </Typography>
              <Link component={NavLink} to="/knowledge/documentation" underline="hover" sx={{ mt: 1.2, display: 'inline-flex' }}>
                Abrir tela de Documentacao
              </Link>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <CategoryCountCard title="Wiki" total={knowledge?.wikiPages.length ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <CategoryCountCard title="Checkpoints" total={knowledge?.checkpoints.length ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <CategoryCountCard title="Documentacao" total={knowledge?.documentationPages.length ?? 0} />
        </Grid>
      </Grid>
    </Stack>
  )
}

function CategoryCountCard({ title, total }: { title: string; total: number }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="h3" sx={{ mt: 1.2 }}>{total}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
          itens cadastrados
        </Typography>
      </CardContent>
    </Card>
  )
}
