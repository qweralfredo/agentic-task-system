import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import { MarkdownField } from '../components/MarkdownField'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import SprintOutlinedIcon from '@mui/icons-material/OnlinePredictionOutlined'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useProjectContext } from '../context/useProjectContext'

const drawerWidth = 244

const menu = [
  { label: 'Dashboard', to: '/', icon: <DashboardOutlinedIcon /> },
  { label: 'Backlog', to: '/backlog', icon: <ViewKanbanOutlinedIcon /> },
  { label: 'Sprints', to: '/sprints', icon: <SprintOutlinedIcon /> },
  { label: 'Knowledge', to: '/knowledge', icon: <DescriptionOutlinedIcon /> },
]

export function AppLayout() {
  const location = useLocation()
  const {
    projects,
    selectedProjectId,
    selectedProject,
    loading,
    error,
    setSelectedProjectId,
    createProject,
  } = useProjectContext()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const showErrorBanner = Boolean(error && selectedProjectId)

  const pageTitle = useMemo(
    () => menu.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))?.label ?? 'Project Space',
    [location.pathname],
  )

  async function handleCreateProject(event: React.FormEvent) {
    event.preventDefault()
    if (!projectName.trim() || !projectDescription.trim()) {
      return
    }

    await createProject({
      name: projectName,
      description: projectDescription,
    })

    setProjectName('')
    setProjectDescription('')
    setDialogOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, minHeight: 68 }}>
          <Box>
            <Typography variant="h6">Pandora Todo List</Typography>
            <Typography variant="caption" sx={{ opacity: 0.88 }}>
              Projeto &gt; Backlog &gt; Sprint &gt; Tasks &gt; Knowledge
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 260, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 1 }}>
              <InputLabel id="project-select-label">Projeto ativo</InputLabel>
              <Select
                labelId="project-select-label"
                value={selectedProjectId}
                label="Projeto ativo"
                onChange={(event) => setSelectedProjectId(event.target.value)}
              >
                {projects.map((project) => (
                  <MenuItem value={project.id} key={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" color="secondary" onClick={() => setDialogOpen(true)} sx={{ px: 2.2 }}>
              Novo projeto
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          ['& .MuiDrawer-paper']: {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #d8e2ed',
            backgroundColor: '#f7f9fc',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2.2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Painel atual
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.4 }}>
            {selectedProject?.name ?? 'Sem projeto'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {selectedProject?.description ?? 'Crie ou selecione um projeto para comeÃ§ar.'}
          </Typography>
          <Divider sx={{ mt: 1.6 }} />
        </Box>

        <List sx={{ px: 1.4 }}>
          {menu.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                sx={{
                  borderRadius: 2,
                  mb: 0.6,
                  bgcolor: isActive ? 'rgba(15, 76, 129, 0.10)' : 'transparent',
                  color: isActive ? 'primary.dark' : 'text.primary',
                  ['&:hover']: {
                    bgcolor: 'rgba(15, 76, 129, 0.10)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'primary.main', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            )
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, mt: 8, pb: 3 }}>
        <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 3 } }}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #dde6f0',
              borderRadius: 3,
              p: { xs: 2, md: 2.5 },
              backgroundColor: 'rgba(255, 255, 255, 0.82)',
              backdropFilter: 'blur(3px)',
            }}
          >
            <Stack spacing={1.4}>
              <Typography variant="h4">{pageTitle}</Typography>
              {loading ? <LinearProgress sx={{ borderRadius: 999, height: 6 }} /> : null}
              {showErrorBanner ? (
                <Alert severity="error" variant="outlined" sx={{ py: 0.25 }}>
                  {error}
                </Alert>
              ) : null}
              <Outlet />
            </Stack>
          </Paper>
        </Container>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <Box component="form" onSubmit={handleCreateProject}>
          <DialogTitle>Novo Projeto</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                label="Nome"
                required
                fullWidth
              />
              <MarkdownField label="Descricao" value={projectDescription} onChange={setProjectDescription} required />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Criar</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

