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
  Timeline, Speed, Bug, ExpandMore, Refresh, Download, Visibility,
  TrendingUp, TrendingDown, Error, Warning, Info, CheckCircle,
  Schedule, Timer, Storage, CloudUpload, CloudDownload, Memory,
  Storage as StorageIcon, NetworkCheck, Security, Lock, LockOpen,
} from '@mui/icons-material'

interface Trace {
  id: string
  name: string
  service: string
  status: 'success' | 'error' | 'warning'
  duration: number
  start_time: string
  end_time: string
  spans: Span[]
  metadata: Record<string, any>
}

interface Span {
  id: string
  name: string
  service: string
  status: 'success' | 'error' | 'warning'
  duration: number
  start_time: string
  end_time: string
  parent_id?: string
  attributes: Record<string, any>
}

interface Metric {
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change_percent: number
  timestamp: string
  labels: Record<string, string>
}

interface Alert {
  id: string
  name: string
  severity: 'critical' | 'warning' | 'info'
  status: 'firing' | 'resolved'
  description: string
  created_at: string
  resolved_at?: string
  labels: Record<string, string>
}

interface ObservabilityProps {
  onTraceView?: (traceId: string) => Promise<void>
  onMetricExport?: (metricName: string, timeRange: string) => Promise<void>
  onAlertAcknowledge?: (alertId: string) => Promise<void>
  onAlertResolve?: (alertId: string) => Promise<void>
}

export default function Observability({
  onTraceView, onMetricExport, onAlertAcknowledge, onAlertResolve
}: ObservabilityProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Traces state
  const [traces, setTraces] = useState<Trace[]>([])
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null)
  const [traceDialog, setTraceDialog] = useState(false)
  
  // Metrics state
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [timeRange, setTimeRange] = useState('1h')
  
  // Alerts state
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertFilter, setAlertFilter] = useState<'all' | 'firing' | 'resolved'>('all')

  useEffect(() => {
    loadData()
  }, [timeRange, alertFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock traces data
      const mockTraces: Trace[] = [
        {
          id: 'trace_123456789',
          name: 'POST /v1/posts',
          service: 'api-gateway',
          status: 'success',
          duration: 1250,
          start_time: '2024-01-27T10:30:00Z',
          end_time: '2024-01-27T10:30:01.25Z',
          metadata: {
            method: 'POST',
            path: '/v1/posts',
            user_id: 'user_123',
            org_id: 'org_456'
          },
          spans: [
            {
              id: 'span_1',
              name: 'validate_request',
              service: 'api-gateway',
              status: 'success',
              duration: 50,
              start_time: '2024-01-27T10:30:00.1Z',
              end_time: '2024-01-27T10:30:00.15Z',
              attributes: { validation_type: 'schema' }
            },
            {
              id: 'span_2',
              name: 'database_query',
              service: 'api-gateway',
              status: 'success',
              duration: 200,
              start_time: '2024-01-27T10:30:00.2Z',
              end_time: '2024-01-27T10:30:00.4Z',
              parent_id: 'span_1',
              attributes: { query: 'INSERT INTO posts', table: 'posts' }
            },
            {
              id: 'span_3',
              name: 'ai_content_generation',
              service: 'draft-worker',
              status: 'success',
              duration: 800,
              start_time: '2024-01-27T10:30:00.5Z',
              end_time: '2024-01-27T10:30:01.3Z',
              attributes: { model: 'gpt-4', tokens: 1500 }
            }
          ]
        },
        {
          id: 'trace_123456790',
          name: 'GET /v1/analytics',
          service: 'api-gateway',
          status: 'error',
          duration: 5000,
          start_time: '2024-01-27T10:29:00Z',
          end_time: '2024-01-27T10:29:05Z',
          metadata: {
            method: 'GET',
            path: '/v1/analytics',
            user_id: 'user_123',
            org_id: 'org_456'
          },
          spans: [
            {
              id: 'span_4',
              name: 'validate_request',
              service: 'api-gateway',
              status: 'success',
              duration: 30,
              start_time: '2024-01-27T10:29:00.1Z',
              end_time: '2024-01-27T10:29:00.13Z',
              attributes: { validation_type: 'schema' }
            },
            {
              id: 'span_5',
              name: 'external_api_call',
              service: 'metrics-worker',
              status: 'error',
              duration: 4900,
              start_time: '2024-01-27T10:29:00.2Z',
              end_time: '2024-01-27T10:29:05.1Z',
              attributes: { api: 'google-analytics', endpoint: '/reports' }
            }
          ]
        }
      ]
      
      // Mock metrics data
      const mockMetrics: Metric[] = [
        {
          name: 'http_requests_total',
          value: 15420,
          unit: 'requests',
          trend: 'up',
          change_percent: 12.5,
          timestamp: '2024-01-27T10:30:00Z',
          labels: { method: 'POST', path: '/v1/posts' }
        },
        {
          name: 'http_request_duration_seconds',
          value: 0.85,
          unit: 'seconds',
          trend: 'down',
          change_percent: -8.2,
          timestamp: '2024-01-27T10:30:00Z',
          labels: { method: 'POST', path: '/v1/posts' }
        },
        {
          name: 'ai_processing_minutes',
          value: 450,
          unit: 'minutes',
          trend: 'up',
          change_percent: 25.0,
          timestamp: '2024-01-27T10:30:00Z',
          labels: { model: 'gpt-4' }
        },
        {
          name: 'database_connections',
          value: 45,
          unit: 'connections',
          trend: 'stable',
          change_percent: 0.0,
          timestamp: '2024-01-27T10:30:00Z',
          labels: { database: 'postgres' }
        },
        {
          name: 'memory_usage_bytes',
          value: 2147483648,
          unit: 'bytes',
          trend: 'up',
          change_percent: 5.3,
          timestamp: '2024-01-27T10:30:00Z',
          labels: { service: 'api-gateway' }
        },
        {
          name: 'cpu_usage_percent',
          value: 65.2,
          unit: 'percent',
          trend: 'down',
          change_percent: -3.1,
          timestamp: '2024-01-27T10:30:00Z',
          labels: { service: 'api-gateway' }
        }
      ]
      
      // Mock alerts data
      const mockAlerts: Alert[] = [
        {
          id: 'alert_1',
          name: 'High Error Rate',
          severity: 'critical',
          status: 'firing',
          description: 'Error rate is above 5% for the last 5 minutes',
          created_at: '2024-01-27T10:25:00Z',
          labels: { service: 'api-gateway', severity: 'critical' }
        },
        {
          id: 'alert_2',
          name: 'High Memory Usage',
          severity: 'warning',
          status: 'firing',
          description: 'Memory usage is above 80% for the last 10 minutes',
          created_at: '2024-01-27T10:20:00Z',
          labels: { service: 'draft-worker', severity: 'warning' }
        },
        {
          id: 'alert_3',
          name: 'Database Connection Pool Exhausted',
          severity: 'critical',
          status: 'resolved',
          description: 'Database connection pool was exhausted',
          created_at: '2024-01-27T09:30:00Z',
          resolved_at: '2024-01-27T09:35:00Z',
          labels: { service: 'postgres', severity: 'critical' }
        },
        {
          id: 'alert_4',
          name: 'AI Service Unavailable',
          severity: 'warning',
          status: 'firing',
          description: 'OpenAI API is responding slowly',
          created_at: '2024-01-27T10:15:00Z',
          labels: { service: 'openai', severity: 'warning' }
        }
      ]
      
      setTraces(mockTraces)
      setMetrics(mockMetrics)
      setAlerts(mockAlerts)
    } catch (err) {
      setError('Failed to load observability data')
    } finally {
      setLoading(false)
    }
  }

  const handleTraceView = async (traceId: string) => {
    const trace = traces.find(t => t.id === traceId)
    if (trace) {
      setSelectedTrace(trace)
      setTraceDialog(true)
      if (onTraceView) {
        await onTraceView(traceId)
      }
    }
  }

  const handleMetricExport = async (metricName: string) => {
    if (!onMetricExport) return
    
    setLoading(true)
    try {
      await onMetricExport(metricName, timeRange)
    } catch (err) {
      setError('Failed to export metric data')
    } finally {
      setLoading(false)
    }
  }

  const handleAlertAcknowledge = async (alertId: string) => {
    if (!onAlertAcknowledge) return
    
    setLoading(true)
    try {
      await onAlertAcknowledge(alertId)
      await loadData()
    } catch (err) {
      setError('Failed to acknowledge alert')
    } finally {
      setLoading(false)
    }
  }

  const handleAlertResolve = async (alertId: string) => {
    if (!onAlertResolve) return
    
    setLoading(true)
    try {
      await onAlertResolve(alertId)
      await loadData()
    } catch (err) {
      setError('Failed to resolve alert')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(2)}s`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatMetricValue = (value: number, unit: string) => {
    if (unit === 'bytes') {
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(value) / Math.log(1024))
      return `${(value / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
    }
    if (unit === 'requests') {
      return value.toLocaleString()
    }
    return `${value.toFixed(2)} ${unit}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success'
      case 'error': return 'error'
      case 'warning': return 'warning'
      default: return 'default'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error'
      case 'warning': return 'warning'
      case 'info': return 'info'
      default: return 'default'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp color="error" />
      case 'down': return <TrendingDown color="success" />
      case 'stable': return <CheckCircle color="info" />
      default: return <Info />
    }
  }

  const renderTracesTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Distributed Traces</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Trace ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {traces.map((trace) => (
              <TableRow key={trace.id}>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {trace.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {trace.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={trace.service} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={trace.status}
                    size="small"
                    color={getStatusColor(trace.status) as any}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDuration(trace.duration)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(trace.start_time)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="View Trace">
                    <IconButton
                      size="small"
                      onClick={() => handleTraceView(trace.id)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )

  const renderMetricsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Prometheus Metrics</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
          >
            <MenuItem value="5m">Last 5 minutes</MenuItem>
            <MenuItem value="15m">Last 15 minutes</MenuItem>
            <MenuItem value="1h">Last hour</MenuItem>
            <MenuItem value="6h">Last 6 hours</MenuItem>
            <MenuItem value="24h">Last 24 hours</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {metrics.map((metric) => (
          <Grid item xs={12} md={6} lg={4} key={metric.name}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {metric.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleMetricExport(metric.name)}
                  >
                    <Download />
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h4" color="primary">
                    {formatMetricValue(metric.value, metric.unit)}
                  </Typography>
                  {getTrendIcon(metric.trend)}
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {metric.change_percent > 0 ? '+' : ''}{metric.change_percent.toFixed(1)}% from last period
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Object.entries(metric.labels).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}=${value}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const renderAlertsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Alerts</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value as any)}
            label="Status"
          >
            <MenuItem value="all">All Alerts</MenuItem>
            <MenuItem value="firing">Firing</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2}>
        {alerts
          .filter(alert => alertFilter === 'all' || alert.status === alertFilter)
          .map((alert) => (
            <Grid item xs={12} key={alert.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={alert.severity}
                          size="small"
                          color={getSeverityColor(alert.severity) as any}
                        />
                        <Chip
                          label={alert.status}
                          size="small"
                          color={alert.status === 'firing' ? 'error' : 'success'}
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {alert.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {alert.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Created: {formatDate(alert.created_at)}
                        {alert.resolved_at && ` • Resolved: ${formatDate(alert.resolved_at)}`}
                      </Typography>
                    </Box>
                    {alert.status === 'firing' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleAlertAcknowledge(alert.id)}
                        >
                          Acknowledge
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAlertResolve(alert.id)}
                        >
                          Resolve
                        </Button>
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {Object.entries(alert.labels).map(([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}=${value}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
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
          <Tab label="Traces" icon={<Timeline />} />
          <Tab label="Metrics" icon={<Speed />} />
          <Tab label="Alerts" icon={<Bug />} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : activeTab === 0 ? (
          renderTracesTab()
        ) : activeTab === 1 ? (
          renderMetricsTab()
        ) : (
          renderAlertsTab()
        )}
      </Box>

      {/* Trace Detail Dialog */}
      <Dialog open={traceDialog} onClose={() => setTraceDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Trace Details</DialogTitle>
        <DialogContent>
          {selectedTrace && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedTrace.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip label={selectedTrace.service} size="small" variant="outlined" />
                  <Chip
                    label={selectedTrace.status}
                    size="small"
                    color={getStatusColor(selectedTrace.status) as any}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Duration: {formatDuration(selectedTrace.duration)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(selectedTrace.start_time)} - {formatDate(selectedTrace.end_time)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Spans ({selectedTrace.spans.length})
              </Typography>
              
              <List>
                {selectedTrace.spans.map((span) => (
                  <ListItem key={span.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon>
                      <Chip
                        label={span.status}
                        size="small"
                        color={getStatusColor(span.status) as any}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={span.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Service: {span.service} • Duration: {formatDuration(span.duration)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(span.start_time)} - {formatDate(span.end_time)}
                          </Typography>
                          {Object.keys(span.attributes).length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                              {Object.entries(span.attributes).map(([key, value]) => (
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
                Metadata
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Object.entries(selectedTrace.metadata).map(([key, value]) => (
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
          <Button onClick={() => setTraceDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
