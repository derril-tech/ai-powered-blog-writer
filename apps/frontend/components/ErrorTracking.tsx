'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  Paper, Divider, FormControl, InputLabel, Select, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  List, ListItem, ListItemText, ListItemIcon, Accordion, AccordionSummary,
  AccordionDetails, Badge, Tooltip, Tabs, Tab, LinearProgress,
} from '@mui/material'
import {
  BugReport, Error, Warning, Info, ExpandMore, Refresh, Download, Visibility,
  TrendingUp, TrendingDown, CheckCircle, Schedule, Timer, Storage, CloudUpload,
  CloudDownload, Memory, Storage as StorageIcon, NetworkCheck, Security,
  Lock, LockOpen, Code, Stack, Timeline, FilterList, Search,
} from '@mui/icons-material'

interface ErrorEvent {
  id: string
  title: string
  message: string
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  type: string
  environment: string
  release: string
  timestamp: string
  user: {
    id: string
    email: string
    username: string
  }
  tags: Record<string, string>
  context: Record<string, any>
  stacktrace: StackFrame[]
  breadcrumbs: Breadcrumb[]
  occurrences: number
  first_seen: string
  last_seen: string
  status: 'unresolved' | 'resolved' | 'ignored'
  assigned_to?: string
  resolved_at?: string
}

interface StackFrame {
  filename: string
  function: string
  line_number: number
  column_number: number
  context_line: string
  pre_context: string[]
  post_context: string[]
  in_app: boolean
}

interface Breadcrumb {
  timestamp: string
  message: string
  level: string
  category: string
  data: Record<string, any>
}

interface ErrorGroup {
  id: string
  title: string
  count: number
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  type: string
  first_seen: string
  last_seen: string
  status: 'unresolved' | 'resolved' | 'ignored'
  assigned_to?: string
  resolved_at?: string
  events: ErrorEvent[]
}

interface ErrorStats {
  total_errors: number
  errors_today: number
  errors_this_week: number
  errors_this_month: number
  error_rate: number
  top_errors: Array<{
    title: string
    count: number
    percentage: number
  }>
  errors_by_level: Record<string, number>
  errors_by_environment: Record<string, number>
}

interface ErrorTrackingProps {
  onErrorResolve?: (errorId: string) => Promise<void>
  onErrorIgnore?: (errorId: string) => Promise<void>
  onErrorAssign?: (errorId: string, assignee: string) => Promise<void>
  onErrorExport?: (errorId: string) => Promise<void>
}

export default function ErrorTracking({
  onErrorResolve, onErrorIgnore, onErrorAssign, onErrorExport
}: ErrorTrackingProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Error groups state
  const [errorGroups, setErrorGroups] = useState<ErrorGroup[]>([])
  const [selectedError, setSelectedError] = useState<ErrorEvent | null>(null)
  const [errorDialog, setErrorDialog] = useState(false)
  
  // Stats state
  const [stats, setStats] = useState<ErrorStats | null>(null)
  
  // Filters state
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [levelFilter, statusFilter, environmentFilter, searchQuery])

  const loadData = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock error groups data
      const mockErrorGroups: ErrorGroup[] = [
        {
          id: 'group_1',
          title: 'TypeError: Cannot read property \'title\' of undefined',
          count: 156,
          level: 'error',
          type: 'TypeError',
          first_seen: '2024-01-25T08:00:00Z',
          last_seen: '2024-01-27T10:30:00Z',
          status: 'unresolved',
          assigned_to: 'john@example.com',
          events: [
            {
              id: 'event_1',
              title: 'TypeError: Cannot read property \'title\' of undefined',
              message: 'Cannot read property \'title\' of undefined',
              level: 'error',
              type: 'TypeError',
              environment: 'production',
              release: 'v1.2.3',
              timestamp: '2024-01-27T10:30:00Z',
              user: {
                id: 'user_123',
                email: 'user@example.com',
                username: 'testuser'
              },
              tags: {
                component: 'post-editor',
                user_id: 'user_123',
                session_id: 'session_456'
              },
              context: {
                url: 'https://app.example.com/posts/123/edit',
                user_agent: 'Mozilla/5.0...',
                ip_address: '192.168.1.1'
              },
              occurrences: 1,
              first_seen: '2024-01-27T10:30:00Z',
              last_seen: '2024-01-27T10:30:00Z',
              status: 'unresolved',
              stacktrace: [
                {
                  filename: '/app/components/PostEditor.tsx',
                  function: 'renderPostContent',
                  line_number: 45,
                  column_number: 12,
                  context_line: 'const title = post.title;',
                  pre_context: [
                    'function renderPostContent(post) {',
                    '  if (!post) return null;',
                    '  const title = post.title;'
                  ],
                  post_context: [
                    '  const content = post.content;',
                    '  return (',
                    '    <div>'
                  ],
                  in_app: true
                },
                {
                  filename: '/app/components/PostEditor.tsx',
                  function: 'PostEditor',
                  line_number: 23,
                  column_number: 8,
                  context_line: 'return renderPostContent(post);',
                  pre_context: [
                    'export default function PostEditor({ post }) {',
                    '  const [loading, setLoading] = useState(false);',
                    '  return renderPostContent(post);'
                  ],
                  post_context: [
                    '}',
                    '',
                    'export default PostEditor;'
                  ],
                  in_app: true
                }
              ],
              breadcrumbs: [
                {
                  timestamp: '2024-01-27T10:29:55Z',
                  message: 'User clicked Save button',
                  level: 'info',
                  category: 'ui.click',
                  data: { button_id: 'save-post' }
                },
                {
                  timestamp: '2024-01-27T10:29:50Z',
                  message: 'API call to /api/posts/123',
                  level: 'info',
                  category: 'http',
                  data: { method: 'GET', url: '/api/posts/123' }
                }
              ]
            }
          ]
        },
        {
          id: 'group_2',
          title: 'NetworkError: Failed to fetch',
          count: 89,
          level: 'error',
          type: 'NetworkError',
          first_seen: '2024-01-26T14:00:00Z',
          last_seen: '2024-01-27T09:15:00Z',
          status: 'unresolved',
          events: []
        },
        {
          id: 'group_3',
          title: 'ValidationError: Invalid email format',
          count: 34,
          level: 'warning',
          type: 'ValidationError',
          first_seen: '2024-01-24T10:00:00Z',
          last_seen: '2024-01-27T08:45:00Z',
          status: 'resolved',
          resolved_at: '2024-01-27T09:00:00Z',
          events: []
        }
      ]
      
      // Mock stats data
      const mockStats: ErrorStats = {
        total_errors: 279,
        errors_today: 23,
        errors_this_week: 156,
        errors_this_month: 892,
        error_rate: 0.15,
        top_errors: [
          { title: 'TypeError: Cannot read property \'title\' of undefined', count: 156, percentage: 55.9 },
          { title: 'NetworkError: Failed to fetch', count: 89, percentage: 31.9 },
          { title: 'ValidationError: Invalid email format', count: 34, percentage: 12.2 }
        ],
        errors_by_level: {
          error: 245,
          warning: 28,
          info: 6
        },
        errors_by_environment: {
          production: 245,
          staging: 28,
          development: 6
        }
      }
      
      setErrorGroups(mockErrorGroups)
      setStats(mockStats)
    } catch (err) {
      setError('Failed to load error tracking data')
    } finally {
      setLoading(false)
    }
  }

  const handleErrorResolve = async (errorId: string) => {
    if (!onErrorResolve) return
    
    setLoading(true)
    try {
      await onErrorResolve(errorId)
      await loadData()
    } catch (err) {
      setError('Failed to resolve error')
    } finally {
      setLoading(false)
    }
  }

  const handleErrorIgnore = async (errorId: string) => {
    if (!onErrorIgnore) return
    
    setLoading(true)
    try {
      await onErrorIgnore(errorId)
      await loadData()
    } catch (err) {
      setError('Failed to ignore error')
    } finally {
      setLoading(false)
    }
  }

  const handleErrorAssign = async (errorId: string, assignee: string) => {
    if (!onErrorAssign) return
    
    setLoading(true)
    try {
      await onErrorAssign(errorId, assignee)
      await loadData()
    } catch (err) {
      setError('Failed to assign error')
    } finally {
      setLoading(false)
    }
  }

  const handleErrorExport = async (errorId: string) => {
    if (!onErrorExport) return
    
    setLoading(true)
    try {
      await onErrorExport(errorId)
    } catch (err) {
      setError('Failed to export error data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'fatal': return 'error'
      case 'error': return 'error'
      case 'warning': return 'warning'
      case 'info': return 'info'
      case 'debug': return 'default'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unresolved': return 'error'
      case 'resolved': return 'success'
      case 'ignored': return 'default'
      default: return 'default'
    }
  }

  const renderOverviewTab = () => (
    <Box>
      {stats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="error" gutterBottom>
                  {stats.total_errors}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Errors
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="warning" gutterBottom>
                  {stats.errors_today}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Errors Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="info" gutterBottom>
                  {stats.errors_this_week}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This Week
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary" gutterBottom>
                  {(stats.error_rate * 100).toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Error Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Errors
                </Typography>
                <List dense>
                  {stats.top_errors.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Typography variant="h6" color="primary">
                          {index + 1}
                        </Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary={error.title}
                        secondary={`${error.count} occurrences (${error.percentage.toFixed(1)}%)`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Errors by Level
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Object.entries(stats.errors_by_level).map(([level, count]) => (
                    <Box key={level}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" textTransform="capitalize">
                          {level}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {count}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / stats.total_errors) * 100}
                        color={getLevelColor(level) as any}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )

  const renderErrorsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Error Groups</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Level</InputLabel>
            <Select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              label="Level"
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="fatal">Fatal</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="debug">Debug</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="unresolved">Unresolved</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="ignored">Ignored</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Environment</InputLabel>
            <Select
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value)}
              label="Environment"
            >
              <MenuItem value="all">All Environments</MenuItem>
              <MenuItem value="production">Production</MenuItem>
              <MenuItem value="staging">Staging</MenuItem>
              <MenuItem value="development">Development</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder="Search errors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 200 }}
          />
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Error</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Count</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>First Seen</TableCell>
              <TableCell>Last Seen</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {errorGroups
              .filter(group => {
                if (levelFilter !== 'all' && group.level !== levelFilter) return false
                if (statusFilter !== 'all' && group.status !== statusFilter) return false
                if (searchQuery && !group.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
                return true
              })
              .map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      {group.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {group.type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={group.level}
                      size="small"
                      color={getLevelColor(group.level) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {group.count}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={group.status}
                      size="small"
                      color={getStatusColor(group.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(group.first_seen)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(group.last_seen)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {group.assigned_to ? (
                      <Typography variant="body2" color="text.secondary">
                        {group.assigned_to}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedError(group.events[0])
                            setErrorDialog(true)
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {group.status === 'unresolved' && (
                        <>
                          <Tooltip title="Resolve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleErrorResolve(group.id)}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ignore">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => handleErrorIgnore(group.id)}
                            >
                              <Info />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Export">
                        <IconButton
                          size="small"
                          onClick={() => handleErrorExport(group.id)}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="Overview" icon={<BugReport />} />
          <Tab label="Errors" icon={<Error />} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : activeTab === 0 ? (
          renderOverviewTab()
        ) : (
          renderErrorsTab()
        )}
      </Box>

      {/* Error Detail Dialog */}
      <Dialog open={errorDialog} onClose={() => setErrorDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Error Details</DialogTitle>
        <DialogContent>
          {selectedError && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedError.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={selectedError.level}
                    color={getLevelColor(selectedError.level) as any}
                  />
                  <Chip label={selectedError.type} size="small" variant="outlined" />
                  <Chip label={selectedError.environment} size="small" variant="outlined" />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(selectedError.timestamp)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedError.message}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                User Information
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Typography variant="body2">
                  <strong>User:</strong> {selectedError.user.username} ({selectedError.user.email})
                </Typography>
                <Typography variant="body2">
                  <strong>User ID:</strong> {selectedError.user.id}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Stack Trace
              </Typography>
              <List dense>
                {selectedError.stacktrace.map((frame, index) => (
                  <ListItem key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon>
                      <Chip
                        label={frame.in_app ? 'App' : 'Library'}
                        size="small"
                        color={frame.in_app ? 'primary' : 'default'}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontFamily="monospace">
                          {frame.filename}:{frame.line_number}:{frame.column_number}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {frame.function}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                            {frame.context_line}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Breadcrumbs
              </Typography>
              <List dense>
                {selectedError.breadcrumbs.map((breadcrumb, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={breadcrumb.message}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(breadcrumb.timestamp)} • {breadcrumb.category} • {breadcrumb.level}
                          </Typography>
                          {Object.keys(breadcrumb.data).length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                              {Object.entries(breadcrumb.data).map(([key, value]) => (
                                <Chip
                                  key={key}
                                  label={`${key}=${value}`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Context
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Object.entries(selectedError.context).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}=${value}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Object.entries(selectedError.tags).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}=${value}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
