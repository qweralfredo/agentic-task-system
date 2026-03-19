import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import SprintOutlinedIcon from '@mui/icons-material/OnlinePredictionOutlined'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import {
  Alert,
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useProjectContext } from '../context/useProjectContext'

const drawerWidth = 268

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

  const pageTitle = useMemo(
    () => menu.find((item) => item.to === location.pathname)?.label ?? 'Project Space',
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
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h6">Agentic Jira Flow</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
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
            <Button variant="contained" color="secondary" onClick={() => setDialogOpen(true)}>
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
            background: 'linear-gradient(180deg, #f9fcff 0%, #f2f7fb 100%)',
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
            {selectedProject?.description ?? 'Crie ou selecione um projeto para começar.'}
          </Typography>
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
                  bgcolor: isActive ? 'primary.light' : 'transparent',
                  color: isActive ? '#fff' : 'text.primary',
                  ['&:hover']: {
                    bgcolor: isActive ? 'primary.main' : 'rgba(15, 76, 129, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? '#fff' : 'primary.main', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            )
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, mt: 8 }}>
        <Stack spacing={2}>
          <Typography variant="h4">{pageTitle}</Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {loading ? <Alert severity="info">Atualizando dados do projeto...</Alert> : null}
          <Outlet />
        </Stack>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
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
              <TextField
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                label="Descricao"
                required
                multiline
                minRows={3}
                fullWidth
              />
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
