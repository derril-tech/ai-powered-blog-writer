'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  Paper, Divider, FormControl, InputLabel, Select, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  List, ListItem, ListItemText, ListItemIcon, Accordion, AccordionSummary,
  AccordionDetails, Badge, Tooltip, Tabs, Tab, LinearProgress, Switch,
  FormControlLabel, Slider, InputAdornment,
} from '@mui/material'
import {
  Speed, Bug, ExpandMore, Refresh, Download, Visibility, PlayArrow, Stop,
  TrendingUp, TrendingDown, CheckCircle, Schedule, Timer, Storage, CloudUpload,
  CloudDownload, Memory, Storage as StorageIcon, NetworkCheck, Security,
  Lock, LockOpen, Code, Stack, Timeline, FilterList, Search, Warning,
  Error, Info, Settings, Assessment, Analytics, Timeline as TimelineIcon,
} from '@mui/icons-material'

interface LoadTest {
  id: string
  name: string
  description: string
  status: 'running' | 'completed' | 'failed' | 'scheduled'
  type: 'load' | 'stress' | 'spike' | 'soak'
  target_url: string
  duration_minutes: number
  virtual_users: number
  requests_per_second: number
  created_at: string
  started_at?: string
  completed_at?: string
  results: LoadTestResults
}

interface LoadTestResults {
  total_requests: number
  successful_requests: number
  failed_requests: number
  average_response_time: number
  p95_response_time: number
  p99_response_time: number
  requests_per_second: number
  error_rate: number
  throughput: number
  cpu_usage: number
  memory_usage: number
  network_io: number
  database_connections: number
  slow_queries: number
}

interface ChaosExperiment {
  id: string
  name: string
  description: string
  status: 'running' | 'completed' | 'failed' | 'scheduled'
  type: 'network_latency' | 'network_loss' | 'cpu_stress' | 'memory_stress' | 'disk_io' | 'service_failure'
  target_service: string
  duration_minutes: number
  intensity: number
  created_at: string
  started_at?: string
  completed_at?: string
  results: ChaosExperimentResults
}

interface ChaosExperimentResults {
  service_impact: 'none' | 'minor' | 'moderate' | 'severe'
  error_rate_increase: number
  response_time_increase: number
  availability_impact: number
  recovery_time_seconds: number
  cascading_failures: boolean
  data_loss: boolean
  user_impact: 'none' | 'low' | 'medium' | 'high'
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  threshold: number
  status: 'healthy' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  timestamp: string
}

interface LoadTestingProps {
  onLoadTestCreate?: (test: Partial<LoadTest>) => Promise<void>
  onLoadTestStart?: (testId: string) => Promise<void>
  onLoadTestStop?: (testId: string) => Promise<void>
  onChaosExperimentCreate?: (experiment: Partial<ChaosExperiment>) => Promise<void>
  onChaosExperimentStart?: (experimentId: string) => Promise<void>
  onChaosExperimentStop?: (experimentId: string) => Promise<void>
  onResultsExport?: (testId: string, type: 'load' | 'chaos') => Promise<void>
}

export default function LoadTesting({
  onLoadTestCreate, onLoadTestStart, onLoadTestStop,
  onChaosExperimentCreate, onChaosExperimentStart, onChaosExperimentStop,
  onResultsExport
}: LoadTestingProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Load tests state
  const [loadTests, setLoadTests] = useState<LoadTest[]>([])
  const [createLoadTestDialog, setCreateLoadTestDialog] = useState(false)
  const [newLoadTest, setNewLoadTest] = useState<Partial<LoadTest>>({
    name: '',
    description: '',
    type: 'load',
    target_url: '',
    duration_minutes: 5,
    virtual_users: 10,
    requests_per_second: 10
  })
  
  // Chaos experiments state
  const [chaosExperiments, setChaosExperiments] = useState<ChaosExperiment[]>([])
  const [createChaosDialog, setCreateChaosDialog] = useState(false)
  const [newChaosExperiment, setNewChaosExperiment] = useState<Partial<ChaosExperiment>>({
    name: '',
    description: '',
    type: 'network_latency',
    target_service: '',
    duration_minutes: 2,
    intensity: 50
  })
  
  // Performance metrics state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock load tests data
      const mockLoadTests: LoadTest[] = [
        {
          id: 'load_1',
          name: 'API Gateway Load Test',
          description: 'Test API gateway performance under load',
          status: 'completed',
          type: 'load',
          target_url: 'https://api.example.com/v1/posts',
          duration_minutes: 10,
          virtual_users: 50,
          requests_per_second: 100,
          created_at: '2024-01-27T09:00:00Z',
          started_at: '2024-01-27T09:05:00Z',
          completed_at: '2024-01-27T09:15:00Z',
          results: {
            total_requests: 60000,
            successful_requests: 59850,
            failed_requests: 150,
            average_response_time: 245,
            p95_response_time: 450,
            p99_response_time: 890,
            requests_per_second: 100,
            error_rate: 0.25,
            throughput: 95.8,
            cpu_usage: 65.2,
            memory_usage: 78.5,
            network_io: 45.2,
            database_connections: 25,
            slow_queries: 12
          }
        },
        {
          id: 'load_2',
          name: 'Stress Test - High Load',
          description: 'Stress test with maximum load',
          status: 'running',
          type: 'stress',
          target_url: 'https://api.example.com/v1/posts',
          duration_minutes: 15,
          virtual_users: 200,
          requests_per_second: 500,
          created_at: '2024-01-27T10:00:00Z',
          started_at: '2024-01-27T10:05:00Z',
          results: {
            total_requests: 45000,
            successful_requests: 44100,
            failed_requests: 900,
            average_response_time: 890,
            p95_response_time: 1500,
            p99_response_time: 2500,
            requests_per_second: 500,
            error_rate: 2.0,
            throughput: 88.2,
            cpu_usage: 95.8,
            memory_usage: 92.3,
            network_io: 78.5,
            database_connections: 45,
            slow_queries: 89
          }
        }
      ]
      
      // Mock chaos experiments data
      const mockChaosExperiments: ChaosExperiment[] = [
        {
          id: 'chaos_1',
          name: 'Network Latency Injection',
          description: 'Inject network latency to test resilience',
          status: 'completed',
          type: 'network_latency',
          target_service: 'api-gateway',
          duration_minutes: 5,
          intensity: 75,
          created_at: '2024-01-27T08:00:00Z',
          started_at: '2024-01-27T08:05:00Z',
          completed_at: '2024-01-27T08:10:00Z',
          results: {
            service_impact: 'minor',
            error_rate_increase: 0.5,
            response_time_increase: 45.2,
            availability_impact: 0.1,
            recovery_time_seconds: 30,
            cascading_failures: false,
            data_loss: false,
            user_impact: 'low'
          }
        },
        {
          id: 'chaos_2',
          name: 'Database Connection Pool Exhaustion',
          description: 'Test database connection handling',
          status: 'running',
          type: 'service_failure',
          target_service: 'postgres',
          duration_minutes: 3,
          intensity: 90,
          created_at: '2024-01-27T10:30:00Z',
          started_at: '2024-01-27T10:35:00Z',
          results: {
            service_impact: 'moderate',
            error_rate_increase: 15.2,
            response_time_increase: 200.5,
            availability_impact: 5.8,
            recovery_time_seconds: 120,
            cascading_failures: true,
            data_loss: false,
            user_impact: 'medium'
          }
        }
      ]
      
      // Mock performance metrics data
      const mockPerformanceMetrics: PerformanceMetric[] = [
        {
          name: 'Response Time',
          value: 245,
          unit: 'ms',
          threshold: 500,
          status: 'healthy',
          trend: 'stable',
          timestamp: '2024-01-27T10:30:00Z'
        },
        {
          name: 'Error Rate',
          value: 0.25,
          unit: '%',
          threshold: 1.0,
          status: 'healthy',
          trend: 'down',
          timestamp: '2024-01-27T10:30:00Z'
        },
        {
          name: 'CPU Usage',
          value: 85.2,
          unit: '%',
          threshold: 80.0,
          status: 'warning',
          trend: 'up',
          timestamp: '2024-01-27T10:30:00Z'
        },
        {
          name: 'Memory Usage',
          value: 92.5,
          unit: '%',
          threshold: 85.0,
          status: 'critical',
          trend: 'up',
          timestamp: '2024-01-27T10:30:00Z'
        },
        {
          name: 'Database Connections',
          value: 45,
          unit: 'connections',
          threshold: 50,
          status: 'healthy',
          trend: 'stable',
          timestamp: '2024-01-27T10:30:00Z'
        },
        {
          name: 'Slow Queries',
          value: 23,
          unit: 'queries/min',
          threshold: 10,
          status: 'critical',
          trend: 'up',
          timestamp: '2024-01-27T10:30:00Z'
        }
      ]
      
      setLoadTests(mockLoadTests)
      setChaosExperiments(mockChaosExperiments)
      setPerformanceMetrics(mockPerformanceMetrics)
    } catch (err) {
      setError('Failed to load testing data')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadTestCreate = async () => {
    if (!onLoadTestCreate) return
    
    setLoading(true)
    try {
      await onLoadTestCreate(newLoadTest)
      setCreateLoadTestDialog(false)
      setNewLoadTest({
        name: '',
        description: '',
        type: 'load',
        target_url: '',
        duration_minutes: 5,
        virtual_users: 10,
        requests_per_second: 10
      })
      await loadData()
    } catch (err) {
      setError('Failed to create load test')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadTestStart = async (testId: string) => {
    if (!onLoadTestStart) return
    
    setLoading(true)
    try {
      await onLoadTestStart(testId)
      await loadData()
    } catch (err) {
      setError('Failed to start load test')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadTestStop = async (testId: string) => {
    if (!onLoadTestStop) return
    
    setLoading(true)
    try {
      await onLoadTestStop(testId)
      await loadData()
    } catch (err) {
      setError('Failed to stop load test')
    } finally {
      setLoading(false)
    }
  }

  const handleChaosExperimentCreate = async () => {
    if (!onChaosExperimentCreate) return
    
    setLoading(true)
    try {
      await onChaosExperimentCreate(newChaosExperiment)
      setCreateChaosDialog(false)
      setNewChaosExperiment({
        name: '',
        description: '',
        type: 'network_latency',
        target_service: '',
        duration_minutes: 2,
        intensity: 50
      })
      await loadData()
    } catch (err) {
      setError('Failed to create chaos experiment')
    } finally {
      setLoading(false)
    }
  }

  const handleChaosExperimentStart = async (experimentId: string) => {
    if (!onChaosExperimentStart) return
    
    setLoading(true)
    try {
      await onChaosExperimentStart(experimentId)
      await loadData()
    } catch (err) {
      setError('Failed to start chaos experiment')
    } finally {
      setLoading(false)
    }
  }

  const handleChaosExperimentStop = async (experimentId: string) => {
    if (!onChaosExperimentStop) return
    
    setLoading(true)
    try {
      await onChaosExperimentStop(experimentId)
      await loadData()
    } catch (err) {
      setError('Failed to stop chaos experiment')
    } finally {
      setLoading(false)
    }
  }

  const handleResultsExport = async (testId: string, type: 'load' | 'chaos') => {
    if (!onResultsExport) return
    
    setLoading(true)
    try {
      await onResultsExport(testId, type)
    } catch (err) {
      setError('Failed to export results')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'primary'
      case 'completed': return 'success'
      case 'failed': return 'error'
      case 'scheduled': return 'warning'
      default: return 'default'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'load': return 'primary'
      case 'stress': return 'warning'
      case 'spike': return 'error'
      case 'soak': return 'info'
      default: return 'default'
    }
  }

  const getChaosTypeColor = (type: string) => {
    switch (type) {
      case 'network_latency': return 'primary'
      case 'network_loss': return 'warning'
      case 'cpu_stress': return 'error'
      case 'memory_stress': return 'error'
      case 'disk_io': return 'warning'
      case 'service_failure': return 'error'
      default: return 'default'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'none': return 'success'
      case 'minor': return 'info'
      case 'moderate': return 'warning'
      case 'severe': return 'error'
      default: return 'default'
    }
  }

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success'
      case 'warning': return 'warning'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  const renderLoadTestsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Load Tests</Typography>
        <Button
          variant="contained"
          onClick={() => setCreateLoadTestDialog(true)}
          startIcon={<PlayArrow />}
        >
          Create Load Test
        </Button>
      </Box>

      <Grid container spacing={3}>
        {loadTests.map((test) => (
          <Grid item xs={12} md={6} key={test.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {test.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {test.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={test.status}
                        size="small"
                        color={getStatusColor(test.status) as any}
                      />
                      <Chip
                        label={test.type}
                        size="small"
                        color={getTypeColor(test.type) as any}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {test.status === 'running' ? (
                      <Tooltip title="Stop Test">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleLoadTestStop(test.id)}
                        >
                          <Stop />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Start Test">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleLoadTestStart(test.id)}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Export Results">
                      <IconButton
                        size="small"
                        onClick={() => handleResultsExport(test.id, 'load')}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Target: {test.target_url}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Duration: {test.duration_minutes} minutes • Users: {test.virtual_users} • RPS: {test.requests_per_second}
                </Typography>

                {test.results && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Results
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Avg Response Time
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {test.results.average_response_time}ms
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Error Rate
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {test.results.error_rate.toFixed(2)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Throughput
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {test.results.throughput.toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          CPU Usage
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {test.results.cpu_usage.toFixed(1)}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Created: {formatDate(test.created_at)}
                  {test.started_at && ` • Started: ${formatDate(test.started_at)}`}
                  {test.completed_at && ` • Completed: ${formatDate(test.completed_at)}`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const renderChaosExperimentsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Chaos Experiments</Typography>
        <Button
          variant="contained"
          color="warning"
          onClick={() => setCreateChaosDialog(true)}
          startIcon={<Bug />}
        >
          Create Chaos Experiment
        </Button>
      </Box>

      <Grid container spacing={3}>
        {chaosExperiments.map((experiment) => (
          <Grid item xs={12} md={6} key={experiment.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {experiment.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {experiment.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={experiment.status}
                        size="small"
                        color={getStatusColor(experiment.status) as any}
                      />
                      <Chip
                        label={experiment.type.replace('_', ' ')}
                        size="small"
                        color={getChaosTypeColor(experiment.type) as any}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {experiment.status === 'running' ? (
                      <Tooltip title="Stop Experiment">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleChaosExperimentStop(experiment.id)}
                        >
                          <Stop />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Start Experiment">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleChaosExperimentStart(experiment.id)}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Export Results">
                      <IconButton
                        size="small"
                        onClick={() => handleResultsExport(experiment.id, 'chaos')}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Target: {experiment.target_service}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Duration: {experiment.duration_minutes} minutes • Intensity: {experiment.intensity}%
                </Typography>

                {experiment.results && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Impact Assessment
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Service Impact
                        </Typography>
                        <Chip
                          label={experiment.results.service_impact}
                          size="small"
                          color={getImpactColor(experiment.results.service_impact) as any}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Error Rate Increase
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          +{experiment.results.error_rate_increase.toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Response Time Increase
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          +{experiment.results.response_time_increase.toFixed(1)}ms
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Recovery Time
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {experiment.results.recovery_time_seconds}s
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Created: {formatDate(experiment.created_at)}
                  {experiment.started_at && ` • Started: ${formatDate(experiment.started_at)}`}
                  {experiment.completed_at && ` • Completed: ${formatDate(experiment.completed_at)}`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const renderPerformanceTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
      
      <Grid container spacing={3}>
        {performanceMetrics.map((metric) => (
          <Grid item xs={12} md={6} lg={4} key={metric.name}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6">
                    {metric.name}
                  </Typography>
                  <Chip
                    label={metric.status}
                    size="small"
                    color={getMetricStatusColor(metric.status) as any}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h4" color="primary">
                    {metric.value}{metric.unit}
                  </Typography>
                  {metric.trend === 'up' ? (
                    <TrendingUp color="error" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown color="success" />
                  ) : (
                    <CheckCircle color="info" />
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Threshold: {metric.threshold}{metric.unit}
                </Typography>
                
                <LinearProgress
                  variant="determinate"
                  value={(metric.value / metric.threshold) * 100}
                  color={getMetricStatusColor(metric.status) as any}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {formatDate(metric.timestamp)}
                </Typography>
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
          <Tab label="Load Tests" icon={<Speed />} />
          <Tab label="Chaos Experiments" icon={<Bug />} />
          <Tab label="Performance" icon={<Assessment />} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : activeTab === 0 ? (
          renderLoadTestsTab()
        ) : activeTab === 1 ? (
          renderChaosExperimentsTab()
        ) : (
          renderPerformanceTab()
        )}
      </Box>

      {/* Create Load Test Dialog */}
      <Dialog open={createLoadTestDialog} onClose={() => setCreateLoadTestDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Load Test</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Test Name"
                value={newLoadTest.name}
                onChange={(e) => setNewLoadTest(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={newLoadTest.description}
                onChange={(e) => setNewLoadTest(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Test Type</InputLabel>
                <Select
                  value={newLoadTest.type}
                  onChange={(e) => setNewLoadTest(prev => ({ ...prev, type: e.target.value as any }))}
                  label="Test Type"
                >
                  <MenuItem value="load">Load Test</MenuItem>
                  <MenuItem value="stress">Stress Test</MenuItem>
                  <MenuItem value="spike">Spike Test</MenuItem>
                  <MenuItem value="soak">Soak Test</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Target URL"
                value={newLoadTest.target_url}
                onChange={(e) => setNewLoadTest(prev => ({ ...prev, target_url: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={newLoadTest.duration_minutes}
                onChange={(e) => setNewLoadTest(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Virtual Users"
                value={newLoadTest.virtual_users}
                onChange={(e) => setNewLoadTest(prev => ({ ...prev, virtual_users: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Requests per Second"
                value={newLoadTest.requests_per_second}
                onChange={(e) => setNewLoadTest(prev => ({ ...prev, requests_per_second: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateLoadTestDialog(false)}>Cancel</Button>
          <Button
            onClick={handleLoadTestCreate}
            variant="contained"
            disabled={!newLoadTest.name || !newLoadTest.target_url}
          >
            Create Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Chaos Experiment Dialog */}
      <Dialog open={createChaosDialog} onClose={() => setCreateChaosDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Chaos Experiment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Experiment Name"
                value={newChaosExperiment.name}
                onChange={(e) => setNewChaosExperiment(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={newChaosExperiment.description}
                onChange={(e) => setNewChaosExperiment(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Experiment Type</InputLabel>
                <Select
                  value={newChaosExperiment.type}
                  onChange={(e) => setNewChaosExperiment(prev => ({ ...prev, type: e.target.value as any }))}
                  label="Experiment Type"
                >
                  <MenuItem value="network_latency">Network Latency</MenuItem>
                  <MenuItem value="network_loss">Network Loss</MenuItem>
                  <MenuItem value="cpu_stress">CPU Stress</MenuItem>
                  <MenuItem value="memory_stress">Memory Stress</MenuItem>
                  <MenuItem value="disk_io">Disk I/O</MenuItem>
                  <MenuItem value="service_failure">Service Failure</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Target Service"
                value={newChaosExperiment.target_service}
                onChange={(e) => setNewChaosExperiment(prev => ({ ...prev, target_service: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={newChaosExperiment.duration_minutes}
                onChange={(e) => setNewChaosExperiment(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Intensity (%)"
                value={newChaosExperiment.intensity}
                onChange={(e) => setNewChaosExperiment(prev => ({ ...prev, intensity: parseInt(e.target.value) || 0 }))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateChaosDialog(false)}>Cancel</Button>
          <Button
            onClick={handleChaosExperimentCreate}
            variant="contained"
            color="warning"
            disabled={!newChaosExperiment.name || !newChaosExperiment.target_service}
          >
            Create Experiment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
