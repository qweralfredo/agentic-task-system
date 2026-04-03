import AddTaskOutlinedIcon from '@mui/icons-material/AddTaskOutlined'
import EditIcon from '@mui/icons-material/Edit'
import {
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { MarkdownField } from '../components/MarkdownField'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { useProjectContext } from '../context/useProjectContext'
import { backlogStatusLabels, toNumberStatus } from '../types'
import type { BacklogItem } from '../types'

function parseCommitIds(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function BacklogPage() {
  const { selectedProjectId, selectedProject, backlog, refreshProjectViews } = useProjectContext()
  const navigate = useNavigate()

  // ── Create modal ───────────────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [storyPoints, setStoryPoints] = useState(3)
  const [priority, setPriority] = useState(1)
  const [isCreateModalOpen, setCreateModalOpen] = useState(false)

  // ── Edit modal ─────────────────────────────────────────────────────────────
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStoryPoints, setEditStoryPoints] = useState(3)
  const [editPriority, setEditPriority] = useState(1)
  const [editStatus, setEditStatus] = useState(0)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // ── Context modal ──────────────────────────────────────────────────────────
  const [contextItemId, setContextItemId] = useState('')
  const [contextTags, setContextTags] = useState('')
  const [contextWikiRefs, setContextWikiRefs] = useState('')
  const [contextConstraints, setContextConstraints] = useState('')
  const [contextCommitIds, setContextCommitIds] = useState('')

  function handleOpenEditModal(item: BacklogItem) {
    setEditingItem(item)
    setEditTitle(item.title)
    setEditDescription(item.description)
    setEditStoryPoints(item.storyPoints)
    setEditPriority(item.priority)
    setEditStatus(toNumberStatus(item.status))
  }

  function handleCloseEditModal() {
    setEditingItem(null)
  }

  async function handleSaveEdit() {
    if (!editingItem || !selectedProjectId) return
    setIsSavingEdit(true)
    try {
      await apiClient.updateBacklogItem(editingItem.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        storyPoints: editStoryPoints,
        priority: editPriority,
        status: editStatus,
      })
      setEditingItem(null)
      await refreshProjectViews(selectedProjectId)
    } finally {
      setIsSavingEdit(false)
    }
  }

  function handleOpenContextModal(id: string, tags = '', wikiRefs = '', constraints = '', commitIds: string[] = []) {
    setContextItemId(id)
    setContextTags(tags)
    setContextWikiRefs(wikiRefs)
    setContextConstraints(constraints)
    setContextCommitIds(commitIds.join(', '))
  }

  async function handleSaveContext() {
    if (!contextItemId || !selectedProjectId) return
    await apiClient.updateBacklogContext(contextItemId, {
      tags: contextTags,
      wikiRefs: contextWikiRefs,
      constraints: contextConstraints,
      commitIds: parseCommitIds(contextCommitIds),
    })
    setContextItemId('')
    await refreshProjectViews(selectedProjectId)
  }

  async function handleCreateBacklogItem(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !title.trim() || !description.trim()) {
      return
    }

    await apiClient.createBacklogItem(selectedProjectId, {
      title,
      description,
      storyPoints,
      priority,
    })

    setTitle('')
    setDescription('')
    setStoryPoints(3)
    setPriority(1)
    setCreateModalOpen(false)
    await refreshProjectViews(selectedProjectId)
  }

  if (!selectedProject) {
    return (
      <Card variant="outlined" sx={{ borderStyle: 'dashed' }}>
        <CardContent>
          <Stack alignItems="center" justifyContent="center" spacing={1.2} sx={{ py: 4 }}>
            <Typography variant="h6">No active project</Typography>
            <Typography color="text.secondary" sx={{ textAlign: 'center', maxWidth: 520 }}>
              Choose a project to create stories, prioritize the backlog and organize sprint planning.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.2} alignItems={{ md: 'center' }}>
            <Stack>
              <Typography variant="h6">Story Backlog</Typography>
              <Typography variant="body2" color="text.secondary">
                Structure items with priority and story points in an objective planning flow.
              </Typography>
            </Stack>
            <Button variant="contained" startIcon={<AddTaskOutlinedIcon />} onClick={() => setCreateModalOpen(true)}>
              New Story
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        <Typography variant="h6">Backlog List</Typography>
        {backlog.length === 0 ? (
          <Typography color="text.secondary">No items registered for this project.</Typography>
        ) : (
          backlog.map((item) => (
            <Card key={item.id}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                  <Stack spacing={0.6} sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" fontWeight={700}>{item.title}</Typography>
                      <Tooltip title="Edit this backlog item">
                        <IconButton size="small" onClick={() => handleOpenEditModal(item)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Typography color="text.secondary">{item.description}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip label={`SP ${item.storyPoints}`} color="primary" variant="outlined" />
                    <Chip label={`P${item.priority}`} color="secondary" variant="outlined" />
                    <Chip label={backlogStatusLabels[toNumberStatus(item.status)] ?? String(item.status)} color="default" />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/sprints?backlogId=${item.id}`)}
                    >
                      View Sprints
                    </Button>
                    <Tooltip title="Edit tags, wiki refs and constraints for this backlog item">
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleOpenContextModal(item.id, item.tags, item.wikiRefs, item.constraints, item.commitIds ?? [])}
                      >
                        Context
                      </Button>
                    </Tooltip>
                  </Stack>
                </Stack>
                {(item.tags || item.wikiRefs || item.constraints || (item.commitIds && item.commitIds.length > 0)) && (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    {item.tags && item.tags.trim() && item.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                      <Chip key={tag} size="small" label={tag} variant="outlined" color="default" sx={{ fontSize: 11 }} />
                    ))}
                    {item.wikiRefs && item.wikiRefs.trim() && (
                      <Chip size="small" label={`wiki: ${item.wikiRefs}`} variant="outlined" sx={{ fontSize: 11, color: '#1565c0' }} />
                    )}
                    {item.constraints && item.constraints.trim() && (
                      <Chip size="small" label={`constraints: ${item.constraints}`} variant="outlined" color="warning" sx={{ fontSize: 11 }} />
                    )}
                    {item.commitIds && item.commitIds.length > 0 && item.commitIds.map((commitId) => (
                      <Chip key={commitId} size="small" label={commitId} variant="outlined" sx={{ fontSize: 11, fontFamily: 'monospace' }} />
                    ))}
                  </Stack>
                )}
                <Divider sx={{ my: 1.2 }} />
                <Typography variant="caption" color="text.secondary">
                  ID: {item.id}
                </Typography>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      <Dialog open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="md">
        <Stack component="form" onSubmit={handleCreateBacklogItem}>
          <DialogTitle>New Story</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required fullWidth />
              <MarkdownField label="Description" value={description} onChange={setDescription} required />
              <Grid container spacing={1.2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    type="number"
                    label="Story points"
                    value={storyPoints}
                    onChange={(event) => setStoryPoints(Number(event.target.value))}
                    inputProps={{ min: 1 }}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    type="number"
                    label="Priority"
                    value={priority}
                    onChange={(event) => setPriority(Number(event.target.value))}
                    inputProps={{ min: 1 }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add item</Button>
          </DialogActions>
        </Stack>
      </Dialog>

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(editingItem)} onClose={handleCloseEditModal} fullWidth maxWidth="md">
        <DialogTitle>Edit Story</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              fullWidth
            />
            <MarkdownField label="Description" value={editDescription} onChange={setEditDescription} required />
            <Grid container spacing={1.2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  type="number"
                  label="Story points"
                  value={editStoryPoints}
                  onChange={(e) => setEditStoryPoints(Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  type="number"
                  label="Priority"
                  value={editPriority}
                  onChange={(e) => setEditPriority(Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel id="edit-backlog-status-label">Status</InputLabel>
                  <Select
                    labelId="edit-backlog-status-label"
                    label="Status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(Number(e.target.value))}
                  >
                    <MenuItem value={0}>New</MenuItem>
                    <MenuItem value={1}>Planned</MenuItem>
                    <MenuItem value={2}>In Sprint</MenuItem>
                    <MenuItem value={3}>Done</MenuItem>
                    <MenuItem value={4}>Blocked</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={isSavingEdit}>
            {isSavingEdit ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Context modal ─────────────────────────────────────────────────── */}
      <Dialog open={Boolean(contextItemId)} onClose={() => setContextItemId('')} fullWidth maxWidth="sm">
        <DialogTitle>Edit Context</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              size="small"
              label="Tags (comma-separated)"
              fullWidth
              placeholder="ex: auth, backend, performance"
              value={contextTags}
              onChange={(event) => setContextTags(event.target.value)}
            />
            <TextField
              size="small"
              label="Wiki Refs"
              fullWidth
              placeholder="ex: architecture, api-design"
              value={contextWikiRefs}
              onChange={(event) => setContextWikiRefs(event.target.value)}
            />
            <TextField
              size="small"
              label="Constraints"
              fullWidth
              multiline
              minRows={2}
              placeholder="ex: must not break existing API, max 200ms latency"
              value={contextConstraints}
              onChange={(event) => setContextConstraints(event.target.value)}
            />
            <TextField
              size="small"
              label="Commit IDs"
              fullWidth
              multiline
              minRows={2}
              placeholder="abc123, def456"
              value={contextCommitIds}
              onChange={(event) => setContextCommitIds(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContextItemId('')}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveContext}>Save</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
