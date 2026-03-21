import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useProjectContext } from '../context/useProjectContext'

export function SettingsPage() {
  const { selectedProject, updateProjectConfig } = useProjectContext()

  const [gitHubUrl, setGitHubUrl] = useState('')
  const [localPath, setLocalPath] = useState('')
  const [techStack, setTechStack] = useState('')
  const [mainBranch, setMainBranch] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (selectedProject) {
      setGitHubUrl(selectedProject.gitHubUrl ?? '')
      setLocalPath(selectedProject.localPath ?? '')
      setTechStack(selectedProject.techStack ?? '')
      setMainBranch(selectedProject.mainBranch ?? 'main')
    }
  }, [selectedProject])

  const handleSave = async () => {
    setSaving(true)
    setErrorMsg('')
    try {
      await updateProjectConfig({ gitHubUrl, localPath, techStack, mainBranch })
      setSuccess(true)
    } catch {
      setErrorMsg('Erro ao salvar configurações.')
    } finally {
      setSaving(false)
    }
  }

  if (!selectedProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">Nenhum projeto selecionado.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Configurações do Projeto
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {selectedProject.name}
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={3}>
            <TextField
              label="Branch Atual"
              value={mainBranch}
              onChange={(e) => setMainBranch(e.target.value)}
              placeholder="main"
              helperText="Branch principal do repositório (ex: main, develop)"
              fullWidth
            />
            <TextField
              label="URL do GitHub"
              value={gitHubUrl}
              onChange={(e) => setGitHubUrl(e.target.value)}
              placeholder="https://github.com/org/repo"
              fullWidth
            />
            <TextField
              label="Caminho Local"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="c:\projetos\meu-repo"
              fullWidth
            />
            <TextField
              label="Tech Stack"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder=".NET 10, React 19, PostgreSQL"
              fullWidth
            />

            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            <Box>
              <Button
                variant="contained"
                startIcon={<SaveOutlinedIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Configurações salvas com sucesso!
        </Alert>
      </Snackbar>
    </Box>
  )
}
