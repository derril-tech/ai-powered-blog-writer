'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Card, CardContent, CardActions, Chip, CircularProgress,
  Alert, List, ListItem, ListItemText, ListItemIcon, Paper, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Switch, FormControlLabel, ToggleButton, ToggleButtonGroup,
  Accordion, AccordionSummary, AccordionDetails, IconButton, Tooltip, Grid,
} from '@mui/material'
import {
  Publish, Schedule, Visibility, Refresh, CheckCircle, Error, Warning,
  ExpandMore, Edit, Delete, ContentCopy, PlayArrow, Stop, History,
  Settings, CloudUpload, Link, CalendarToday, AccessTime,
} from '@mui/icons-material'

interface PublishStatus {
  platform: string
  status: 'draft' | 'published' | 'scheduled' | 'failed'
  post_id?: string
  url?: string
  published_at?: string
  errors?: string[]
  warnings?: string[]
}

interface PublishSchedule {
  platform: string
  scheduled_at: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

interface PublishPanelProps {
  postId?: string
  onPublish?: (platform: string, status: string) => Promise<void>
  onSchedule?: (platform: string, scheduledAt: string) => Promise<void>
  onDryRun?: (platform: string) => Promise<void>
}

export default function PublishPanel({
  postId, onPublish, onSchedule, onDryRun
}: PublishPanelProps) {
  const [publishStatuses, setPublishStatuses] = useState<PublishStatus[]>([])
  const [schedules, setSchedules] = useState<PublishSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [publishStatus, setPublishStatus] = useState('draft')
  const [scheduledAt, setScheduledAt] = useState('')
  const [dryRunResults, setDryRunResults] = useState<any>(null)
  const [dryRunLoading, setDryRunLoading] = useState(false)

  const platforms = [
    { id: 'wordpress', name: 'WordPress', icon: '🌐' },
    { id: 'medium', name: 'Medium', icon: '📝' },
    { id: 'ghost', name: 'Ghost', icon: '👻' },
  ]

  useEffect(() => {
    if (postId) {
      loadPublishStatus()
      loadSchedules()
    }
  }, [postId])

  const loadPublishStatus = async () => {
    // Mock API call
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data
      const mockStatuses: PublishStatus[] = [
        {
          platform: 'wordpress',
          status: 'published',
          post_id: 'wp_123',
          url: 'https://example.com/post-123',
          published_at: '2024-01-27T10:30:00Z'
        },
        {
          platform: 'medium',
          status: 'draft',
          post_id: 'med_456',
          url: 'https://medium.com/@user/post-456'
        }
      ]
      
      setPublishStatuses(mockStatuses)
    } catch (err) {
      setError('Failed to load publish status')
    } finally {
      setLoading(false)
    }
  }

  const loadSchedules = async () => {
    // Mock API call
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock data
      const mockSchedules: PublishSchedule[] = [
        {
          platform: 'ghost',
          scheduled_at: '2024-01-28T09:00:00Z',
          status: 'pending'
        }
      ]
      
      setSchedules(mockSchedules)
    } catch (err) {
      console.error('Failed to load schedules:', err)
    }
  }

  const handlePublish = async () => {
    if (!selectedPlatform || !onPublish) return
    
    setLoading(true)
    try {
      await onPublish(selectedPlatform, publishStatus)
      setPublishDialogOpen(false)
      await loadPublishStatus()
    } catch (err) {
      setError('Failed to publish')
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = async () => {
    if (!selectedPlatform || !scheduledAt || !onSchedule) return
    
    setLoading(true)
    try {
      await onSchedule(selectedPlatform, scheduledAt)
      setScheduleDialogOpen(false)
      await loadSchedules()
    } catch (err) {
      setError('Failed to schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleDryRun = async (platform: string) => {
    if (!onDryRun) return
    
    setDryRunLoading(true)
    try {
      await onDryRun(platform)
      // Mock dry run results
      setDryRunResults({
        platform,
        success: true,
        preview: {
          title: 'Sample Post Title',
          content: 'This is a preview of how the post will appear...',
          meta_description: 'Sample meta description',
          tags: ['sample', 'preview', 'test']
        },
        warnings: ['No featured image set'],
        errors: []
      })
    } catch (err) {
      setError('Dry run failed')
    } finally {
      setDryRunLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle color="success" />
      case 'draft': return <Edit color="primary" />
      case 'scheduled': return <Schedule color="warning" />
      case 'failed': return <Error color="error" />
      default: return <Warning color="warning" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success'
      case 'draft': return 'primary'
      case 'scheduled': return 'warning'
      case 'failed': return 'error'
      default: return 'default'
    }
  }

  const getScheduleStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'processing': return 'warning'
      case 'failed': return 'error'
      default: return 'default'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Publishing</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setPublishDialogOpen(true)}
            disabled={loading || !postId}
            startIcon={<Publish />}
          >
            Publish
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setScheduleDialogOpen(true)}
            disabled={loading || !postId}
            startIcon={<Schedule />}
          >
            Schedule
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Dry Run Results */}
      {dryRunResults && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">Dry Run Results - {dryRunResults.platform}</Typography>
            <IconButton size="small" onClick={() => setDryRunResults(null)}>
              <Delete />
            </IconButton>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom><strong>Title:</strong> {dryRunResults.preview.title}</Typography>
            <Typography variant="body2" gutterBottom><strong>Meta:</strong> {dryRunResults.preview.meta_description}</Typography>
            <Typography variant="body2" gutterBottom><strong>Tags:</strong> {dryRunResults.preview.tags.join(', ')}</Typography>
          </Box>
          {dryRunResults.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {dryRunResults.warnings.join(', ')}
            </Alert>
          )}
          {dryRunResults.errors.length > 0 && (
            <Alert severity="error">
              {dryRunResults.errors.join(', ')}
            </Alert>
          )}
        </Paper>
      )}

      {/* Publish Status */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Publish Status</Typography>
        {publishStatuses.length === 0 && !loading ? (
          <Typography variant="body2" color="text.secondary">No published posts</Typography>
        ) : (
          <List dense>
            {publishStatuses.map((status, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getStatusIcon(status.status)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {status.platform}
                      </Typography>
                      <Chip
                        label={status.status}
                        size="small"
                        color={getStatusColor(status.status) as any}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      {status.url && (
                        <Typography variant="caption" display="block">
                          <Link fontSize="small" sx={{ mr: 0.5 }} />
                          {status.url}
                        </Typography>
                      )}
                      {status.published_at && (
                        <Typography variant="caption" display="block">
                          <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
                          {new Date(status.published_at).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {status.url && (
                    <Tooltip title="Copy URL">
                      <IconButton size="small" onClick={() => copyToClipboard(status.url!)}>
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Dry Run">
                    <IconButton
                      size="small"
                      onClick={() => handleDryRun(status.platform)}
                      disabled={dryRunLoading}
                    >
                      {dryRunLoading ? <CircularProgress size={16} /> : <Visibility />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Scheduled Posts */}
      {schedules.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Scheduled Posts</Typography>
          <List dense>
            {schedules.map((schedule, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Schedule color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {schedule.platform}
                      </Typography>
                      <Chip
                        label={schedule.status}
                        size="small"
                        color={getScheduleStatusColor(schedule.status) as any}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption">
                      <AccessTime fontSize="small" sx={{ mr: 0.5 }} />
                      {new Date(schedule.scheduled_at).toLocaleString()}
                    </Typography>
                  }
                />
                <IconButton size="small" color="error">
                  <Delete />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Platform Quick Actions */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Quick Actions</Typography>
        <Grid container spacing={1}>
          {platforms.map((platform) => (
            <Grid item xs={12} sm={4} key={platform.id}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    {platform.icon} {platform.name}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 1, justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleDryRun(platform.id)}
                    disabled={dryRunLoading}
                    startIcon={dryRunLoading ? <CircularProgress size={16} /> : <Visibility />}
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      setSelectedPlatform(platform.id)
                      setPublishDialogOpen(true)
                    }}
                    disabled={loading || !postId}
                    startIcon={<Publish />}
                  >
                    Publish
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Publish Post</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Platform</InputLabel>
              <Select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                label="Platform"
              >
                {platforms.map((platform) => (
                  <MenuItem key={platform.id} value={platform.id}>
                    {platform.icon} {platform.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={publishStatus}
                onChange={(e) => setPublishStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handlePublish}
            variant="contained"
            disabled={!selectedPlatform || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Publish />}
          >
            Publish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Post</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Platform</InputLabel>
              <Select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                label="Platform"
              >
                {platforms.map((platform) => (
                  <MenuItem key={platform.id} value={platform.id}>
                    {platform.icon} {platform.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Scheduled Date & Time"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSchedule}
            variant="contained"
            disabled={!selectedPlatform || !scheduledAt || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Schedule />}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
