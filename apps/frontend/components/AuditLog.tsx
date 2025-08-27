'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, List, ListItem, ListItemText, ListItemIcon,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Alert, CircularProgress, Paper, Divider, FormControl, InputLabel,
  Select, MenuItem, TextField, Tooltip, Badge, Accordion, AccordionSummary,
  AccordionDetails, Grid, Card, CardContent,
} from '@mui/material'
import {
  History, Visibility, Download, FilterList, Search, CalendarToday,
  Person, Edit, Delete, Add, Save, Publish, Unpublish, Security,
  ExpandMore, Info, Warning, Error, CheckCircle, Timeline,
} from '@mui/icons-material'

interface AuditEntry {
  id: string
  user_id: string
  user_name: string
  user_email: string
  action: string
  resource_type: string
  resource_id: string
  resource_name: string
  details: string
  ip_address: string
  user_agent: string
  severity: 'info' | 'warning' | 'error' | 'success'
  created_at: string
  metadata?: Record<string, any>
}

interface AuditLogProps {
  postId?: string
  onExport?: (filters: any) => Promise<void>
  onViewDetails?: (entryId: string) => Promise<void>
}

export default function AuditLog({
  postId, onExport, onViewDetails
}: AuditLogProps) {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (postId) {
      loadAuditLog()
    }
  }, [postId, filter, actionFilter, dateRange, searchQuery])

  const loadAuditLog = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock audit log data
      const mockEntries: AuditEntry[] = [
        {
          id: '1',
          user_id: 'user1',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          action: 'post_created',
          resource_type: 'post',
          resource_id: postId!,
          resource_name: 'Sample Blog Post',
          details: 'Created new blog post with title "Sample Blog Post"',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'info',
          created_at: '2024-01-25T10:00:00Z',
          metadata: {
            word_count: 500,
            target_keyword: 'sample keyword'
          }
        },
        {
          id: '2',
          user_id: 'user1',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          action: 'post_updated',
          resource_type: 'post',
          resource_id: postId!,
          resource_name: 'Sample Blog Post',
          details: 'Updated post content and meta description',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'info',
          created_at: '2024-01-25T14:30:00Z',
          metadata: {
            changes: ['content', 'meta_description'],
            word_count_change: '+200'
          }
        },
        {
          id: '3',
          user_id: 'user1',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          action: 'post_published',
          resource_type: 'post',
          resource_id: postId!,
          resource_name: 'Sample Blog Post',
          details: 'Published post to WordPress',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'success',
          created_at: '2024-01-25T16:00:00Z',
          metadata: {
            platform: 'wordpress',
            url: 'https://example.com/sample-blog-post'
          }
        },
        {
          id: '4',
          user_id: 'user2',
          user_name: 'Jane Smith',
          user_email: 'jane@example.com',
          action: 'comment_moderated',
          resource_type: 'comment',
          resource_id: 'comment1',
          resource_name: 'Comment on Sample Blog Post',
          details: 'Approved comment from user bob@example.com',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          severity: 'info',
          created_at: '2024-01-26T09:15:00Z',
          metadata: {
            comment_author: 'bob@example.com',
            moderation_action: 'approved'
          }
        },
        {
          id: '5',
          user_id: 'user1',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          action: 'post_deleted',
          resource_type: 'post',
          resource_id: 'post2',
          resource_name: 'Old Blog Post',
          details: 'Deleted old blog post that was no longer relevant',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'warning',
          created_at: '2024-01-26T11:45:00Z',
          metadata: {
            reason: 'no longer relevant',
            backup_created: true
          }
        },
        {
          id: '6',
          user_id: 'system',
          user_name: 'System',
          user_email: 'system@example.com',
          action: 'security_alert',
          resource_type: 'system',
          resource_id: 'security1',
          resource_name: 'Failed Login Attempt',
          details: 'Multiple failed login attempts detected from IP 203.0.113.1',
          ip_address: '203.0.113.1',
          user_agent: 'Unknown',
          severity: 'error',
          created_at: '2024-01-26T15:30:00Z',
          metadata: {
            failed_attempts: 5,
            blocked_ip: true,
            duration: '30 minutes'
          }
        }
      ]
      
      // Filter entries
      let filteredEntries = mockEntries
      
      // Filter by severity
      if (filter !== 'all') {
        filteredEntries = filteredEntries.filter(entry => entry.severity === filter)
      }
      
      // Filter by action
      if (actionFilter !== 'all') {
        filteredEntries = filteredEntries.filter(entry => entry.action === actionFilter)
      }
      
      // Filter by date range
      filteredEntries = filteredEntries.filter(entry => {
        const entryDate = new Date(entry.created_at).toISOString().split('T')[0]
        return entryDate >= dateRange.start && entryDate <= dateRange.end
      })
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredEntries = filteredEntries.filter(entry =>
          entry.user_name.toLowerCase().includes(query) ||
          entry.resource_name.toLowerCase().includes(query) ||
          entry.details.toLowerCase().includes(query) ||
          entry.action.toLowerCase().includes(query)
        )
      }
      
      // Sort by date (newest first)
      filteredEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setAuditEntries(filteredEntries)
    } catch (err) {
      setError('Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!onExport) return
    
    setLoading(true)
    try {
      await onExport({
        filter,
        actionFilter,
        dateRange,
        searchQuery
      })
    } catch (err) {
      setError('Failed to export audit log')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (entryId: string) => {
    if (!onViewDetails) return
    
    setLoading(true)
    try {
      await onViewDetails(entryId)
    } catch (err) {
      setError('Failed to load entry details')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <CheckCircle color="success" />
      case 'warning': return <Warning color="warning" />
      case 'error': return <Error color="error" />
      case 'info': return <Info color="info" />
      default: return <Info color="action" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'success'
      case 'warning': return 'warning'
      case 'error': return 'error'
      case 'info': return 'info'
      default: return 'default'
    }
  }

  const getActionLabel = (action: string) => {
    const actionLabels: Record<string, string> = {
      'post_created': 'Post Created',
      'post_updated': 'Post Updated',
      'post_published': 'Post Published',
      'post_deleted': 'Post Deleted',
      'comment_moderated': 'Comment Moderated',
      'security_alert': 'Security Alert',
      'user_login': 'User Login',
      'user_logout': 'User Logout',
      'permission_changed': 'Permission Changed',
      'settings_updated': 'Settings Updated'
    }
    return actionLabels[action] || action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getResourceTypeIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'post': return <Edit />
      case 'comment': return <Add />
      case 'user': return <Person />
      case 'system': return <Security />
      default: return <Info />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getSummaryStats = () => {
    const total = auditEntries.length
    const bySeverity = auditEntries.reduce((acc, entry) => {
      acc[entry.severity] = (acc[entry.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const byAction = auditEntries.reduce((acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return { total, bySeverity, byAction }
  }

  const stats = getSummaryStats()

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Audit Log
          <Badge badgeContent={auditEntries.length} color="primary" sx={{ ml: 1 }} />
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleExport}
            disabled={loading}
            startIcon={<Download />}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom>{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total Entries</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom color="error.main">
                {stats.bySeverity.error || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Errors</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom color="warning.main">
                {stats.bySeverity.warning || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Warnings</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom color="success.main">
                {stats.bySeverity.success || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Success</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                label="Severity"
              >
                <MenuItem value="all">All Severities</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="success">Success</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Action</InputLabel>
              <Select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                label="Action"
              >
                <MenuItem value="all">All Actions</MenuItem>
                <MenuItem value="post_created">Post Created</MenuItem>
                <MenuItem value="post_updated">Post Updated</MenuItem>
                <MenuItem value="post_published">Post Published</MenuItem>
                <MenuItem value="post_deleted">Post Deleted</MenuItem>
                <MenuItem value="comment_moderated">Comment Moderated</MenuItem>
                <MenuItem value="security_alert">Security Alert</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search audit log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Audit Log List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : auditEntries.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No audit entries found
            </Typography>
          </Box>
        ) : (
          <List>
            {auditEntries.map((entry) => (
              <Accordion key={entry.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getSeverityIcon(entry.severity)}
                    </ListItemIcon>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getResourceTypeIcon(entry.resource_type)}
                      <Typography variant="subtitle2">
                        {getActionLabel(entry.action)}
                      </Typography>
                    </Box>
                    <Chip
                      label={entry.severity}
                      size="small"
                      color={getSeverityColor(entry.severity) as any}
                      variant="outlined"
                    />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {entry.details}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(entry.created_at)}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ width: '100%' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>User Information</Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Name:</strong> {entry.user_name}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Email:</strong> {entry.user_email}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>IP Address:</strong> {entry.ip_address}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>Resource Information</Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Type:</strong> {entry.resource_type}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Name:</strong> {entry.resource_name}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>ID:</strong> {entry.resource_id}
                        </Typography>
                      </Grid>
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>Additional Details</Typography>
                          <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                              {JSON.stringify(entry.metadata, null, 2)}
                            </pre>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </List>
        )}
      </Box>
    </Box>
  )
}
