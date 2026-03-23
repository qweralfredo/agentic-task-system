import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { MarkdownField } from '../components/MarkdownField'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import SprintOutlinedIcon from '@mui/icons-material/OnlinePredictionOutlined'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
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
  IconButton,
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
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useProjectContext } from '../context/useProjectContext'

const drawerWidthExpanded = 244
const drawerWidthCollapsed = 76

const menu = [
  { label: 'Dashboard', to: '/', icon: <DashboardOutlinedIcon /> },
  { label: 'Backlog', to: '/backlog', icon: <ViewKanbanOutlinedIcon /> },
  { label: 'Sprints', to: '/sprints', icon: <SprintOutlinedIcon /> },
  { label: 'Knowledge', to: '/knowledge', icon: <DescriptionOutlinedIcon /> },
  { label: 'Settings', to: '/settings', icon: <SettingsOutlinedIcon /> },
]

export function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [desktopMenuCollapsed, setDesktopMenuCollapsed] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const showErrorBanner = Boolean(error && selectedProjectId)
  const desktopDrawerWidth = desktopMenuCollapsed ? drawerWidthCollapsed : drawerWidthExpanded
  const showMenuLabels = isMobile || !desktopMenuCollapsed

  const pageTitle = useMemo(
    () => menu.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))?.label ?? 'Project Space',
    [location.pathname],
  )

  const drawerContent = (
    <>
      <Toolbar />
      <Box sx={{ p: 2.2 }}>
        {showMenuLabels && (
          <>
            <Typography variant="subtitle2" color="text.secondary">
              Current panel
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.4 }}>
              {selectedProject?.name ?? 'No project'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {selectedProject?.description ?? 'Create or select a project to get started.'}
            </Typography>
          </>
        )}
        <Divider sx={{ mt: 1.6 }} />
      </Box>

      <List sx={{ px: 1.4 }}>
        {menu.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`))
          return (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              onClick={() => setMobileDrawerOpen(false)}
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
              {showMenuLabels && <ListItemText primary={item.label} />}
            </ListItemButton>
          )
        })}
      </List>
    </>
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
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, minHeight: 68, flexWrap: { xs: 'wrap', md: 'nowrap' }, py: { xs: 1, md: 0 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            {isMobile ? (
              <IconButton
                color="inherit"
                aria-label="open navigation"
                onClick={() => setMobileDrawerOpen(true)}
                edge="start"
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <IconButton
                color="inherit"
                aria-label="toggle navigation"
                onClick={() => setDesktopMenuCollapsed((prev) => !prev)}
                edge="start"
              >
                {desktopMenuCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            )}
            <Typography variant="h6">Pandora Todo List</Typography>
            <Typography variant="caption" sx={{ opacity: 0.88 }}>
              Project &gt; Backlog &gt; Sprint &gt; Tasks &gt; Knowledge
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems="stretch"
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220, md: 260 }, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 1 }}>
              <InputLabel id="project-select-label">Active project</InputLabel>
              <Select
                labelId="project-select-label"
                value={selectedProjectId}
                label="Active project"
                onChange={(event) => setSelectedProjectId(event.target.value)}
              >
                {projects.map((project) => (
                  <MenuItem value={project.id} key={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" color="secondary" onClick={() => setDialogOpen(true)} sx={{ px: 2.2, whiteSpace: 'nowrap' }}>
              New project
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileDrawerOpen : true}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: { md: desktopDrawerWidth },
          flexShrink: 0,
          ['& .MuiDrawer-paper']: {
            width: { xs: drawerWidthExpanded, md: desktopDrawerWidth },
            boxSizing: 'border-box',
            borderRight: '1px solid #d8e2ed',
            backgroundColor: '#f7f9fc',
          },
          display: { xs: 'block', md: 'block' },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: { xs: 15, sm: 12, md: 8 },
          pb: 3,
        }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 3 }, px: { xs: 1.25, sm: 2, md: 3 } }}>
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
          <DialogTitle>New Project</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                label="Name"
                required
                fullWidth
              />
              <MarkdownField label="Description" value={projectDescription} onChange={setProjectDescription} required />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

