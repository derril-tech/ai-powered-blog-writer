'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  Paper, Divider, FormControl, InputLabel, Select, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  List, ListItem, ListItemText, ListItemIcon, Accordion, AccordionSummary,
  AccordionDetails, Badge, Tooltip, Tabs, Tab, LinearProgress, Switch,
  FormControlLabel, AlertTitle,
} from '@mui/material'
import {
  Security, Gavel, ExpandMore, Refresh, Download, Visibility,
  TrendingUp, TrendingDown, CheckCircle, Schedule, Timer, Storage, CloudUpload,
  CloudDownload, Memory, Storage as StorageIcon, NetworkCheck, Bug,
  Warning, Error, Info, Settings, Assessment, Analytics, Timeline as TimelineIcon,
  Shield, VerifiedUser, Block, Report, Security as SecurityIcon,
  Delete, Archive, Restore, History, Policy, Compliance,
} from '@mui/icons-material'

interface RetentionPolicy {
  id: string
  name: string
  data_type: 'posts' | 'analytics' | 'user_data' | 'logs' | 'backups'
  retention_period_days: number
  action: 'delete' | 'archive' | 'anonymize'
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  updated_at: string
  created_by: string
  description: string
  compliance_standards: string[]
}

interface CopyrightViolation {
  id: string
  content_id: string
  content_type: 'post' | 'image' | 'video'
  violation_type: 'plagiarism' | 'copyright' | 'trademark' | 'fair_use'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'detected' | 'investigating' | 'resolved' | 'ignored'
  detected_at: string
  resolved_at?: string
  description: string
  source_url?: string
  original_author?: string
  action_taken: string
  compliance_score: number
}

interface ComplianceAudit {
  id: string
  audit_type: 'retention' | 'copyright' | 'gdpr' | 'ccpa' | 'sox'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  compliance_score: number
  issues_found: number
  critical_issues: number
  recommendations: string[]
  auditor: string
  next_audit_date: string
}

interface DataSubjectRequest {
  id: string
  subject_email: string
  request_type: 'access' | 'deletion' | 'correction' | 'portability'
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  submitted_at: string
  completed_at?: string
  data_found: boolean
  data_processed: boolean
  response_sent: boolean
  notes: string
}

interface ComplianceMetrics {
  overall_compliance_score: number
  retention_policies_active: number
  copyright_violations_open: number
  data_requests_pending: number
  last_audit_date: string
  next_audit_date: string
  gdpr_compliance: 'compliant' | 'non_compliant' | 'partial'
  ccpa_compliance: 'compliant' | 'non_compliant' | 'partial'
}

interface ComplianceProps {
  onRetentionPolicyCreate?: (policy: Partial<RetentionPolicy>) => Promise<void>
  onRetentionPolicyUpdate?: (policyId: string, updates: Partial<RetentionPolicy>) => Promise<void>
  onCopyrightViolationUpdate?: (violationId: string, status: string) => Promise<void>
  onAuditStart?: (auditType: string) => Promise<void>
  onDataRequestProcess?: (requestId: string, action: string) => Promise<void>
  onComplianceReportExport?: (auditId: string) => Promise<void>
}

export default function Compliance({
  onRetentionPolicyCreate, onRetentionPolicyUpdate, onCopyrightViolationUpdate,
  onAuditStart, onDataRequestProcess, onComplianceReportExport
}: ComplianceProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Retention policies state
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([])
  const [createPolicyDialog, setCreatePolicyDialog] = useState(false)
  const [newPolicy, setNewPolicy] = useState<Partial<RetentionPolicy>>({
    name: '',
    data_type: 'posts',
    retention_period_days: 365,
    action: 'delete',
    description: '',
    compliance_standards: []
  })
  
  // Copyright violations state
  const [copyrightViolations, setCopyrightViolations] = useState<CopyrightViolation[]>([])
  const [violationFilter, setViolationFilter] = useState<string>('all')
  
  // Compliance audits state
  const [complianceAudits, setComplianceAudits] = useState<ComplianceAudit[]>([])
  
  // Data subject requests state
  const [dataRequests, setDataRequests] = useState<DataSubjectRequest[]>([])
  const [requestFilter, setRequestFilter] = useState<string>('all')
  
  // Compliance metrics state
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetrics | null>(null)

  useEffect(() => {
    loadData()
  }, [violationFilter, requestFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock retention policies data
      const mockRetentionPolicies: RetentionPolicy[] = [
        {
          id: 'retention_1',
          name: 'User Data Retention',
          data_type: 'user_data',
          retention_period_days: 730,
          action: 'delete',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'admin@example.com',
          description: 'Delete user data after 2 years of inactivity',
          compliance_standards: ['GDPR', 'CCPA']
        },
        {
          id: 'retention_2',
          name: 'Analytics Data Retention',
          data_type: 'analytics',
          retention_period_days: 2555,
          action: 'archive',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'admin@example.com',
          description: 'Archive analytics data after 7 years for business intelligence',
          compliance_standards: ['SOX']
        }
      ]
      
      // Mock copyright violations data
      const mockCopyrightViolations: CopyrightViolation[] = [
        {
          id: 'violation_1',
          content_id: 'post_123',
          content_type: 'post',
          violation_type: 'plagiarism',
          severity: 'high',
          status: 'detected',
          detected_at: '2024-01-27T10:00:00Z',
          description: 'Content appears to be copied from external source without attribution',
          source_url: 'https://example.com/original-content',
          original_author: 'John Doe',
          action_taken: 'Content flagged for review',
          compliance_score: 75
        },
        {
          id: 'violation_2',
          content_id: 'image_456',
          content_type: 'image',
          violation_type: 'copyright',
          severity: 'medium',
          status: 'resolved',
          detected_at: '2024-01-26T15:30:00Z',
          resolved_at: '2024-01-27T09:00:00Z',
          description: 'Image used without proper licensing',
          action_taken: 'Image replaced with licensed alternative',
          compliance_score: 90
        }
      ]
      
      // Mock compliance audits data
      const mockComplianceAudits: ComplianceAudit[] = [
        {
          id: 'audit_1',
          audit_type: 'gdpr',
          status: 'completed',
          started_at: '2024-01-20T00:00:00Z',
          completed_at: '2024-01-25T00:00:00Z',
          compliance_score: 85,
          issues_found: 3,
          critical_issues: 0,
          recommendations: [
            'Implement data subject request automation',
            'Add cookie consent banner',
            'Update privacy policy'
          ],
          auditor: 'Compliance Team',
          next_audit_date: '2024-07-20T00:00:00Z'
        },
        {
          id: 'audit_2',
          audit_type: 'retention',
          status: 'in_progress',
          started_at: '2024-01-27T00:00:00Z',
          compliance_score: 0,
          issues_found: 0,
          critical_issues: 0,
          recommendations: [],
          auditor: 'Data Protection Officer',
          next_audit_date: '2024-04-27T00:00:00Z'
        }
      ]
      
      // Mock data subject requests data
      const mockDataRequests: DataSubjectRequest[] = [
        {
          id: 'request_1',
          subject_email: 'user@example.com',
          request_type: 'access',
          status: 'completed',
          submitted_at: '2024-01-25T10:00:00Z',
          completed_at: '2024-01-26T14:00:00Z',
          data_found: true,
          data_processed: true,
          response_sent: true,
          notes: 'Personal data exported and sent to user'
        },
        {
          id: 'request_2',
          subject_email: 'another@example.com',
          request_type: 'deletion',
          status: 'processing',
          submitted_at: '2024-01-27T09:00:00Z',
          data_found: true,
          data_processed: false,
          response_sent: false,
          notes: 'Deletion in progress - 3 days remaining'
        }
      ]
      
      // Mock compliance metrics data
      const mockComplianceMetrics: ComplianceMetrics = {
        overall_compliance_score: 87,
        retention_policies_active: 2,
        copyright_violations_open: 1,
        data_requests_pending: 1,
        last_audit_date: '2024-01-25T00:00:00Z',
        next_audit_date: '2024-04-27T00:00:00Z',
        gdpr_compliance: 'compliant',
        ccpa_compliance: 'compliant'
      }
      
      setRetentionPolicies(mockRetentionPolicies)
      setCopyrightViolations(mockCopyrightViolations)
      setComplianceAudits(mockComplianceAudits)
      setDataRequests(mockDataRequests)
      setComplianceMetrics(mockComplianceMetrics)
    } catch (err) {
      setError('Failed to load compliance data')
    } finally {
      setLoading(false)
    }
  }

  const handleRetentionPolicyCreate = async () => {
    if (!onRetentionPolicyCreate) return
    
    setLoading(true)
    try {
      await onRetentionPolicyCreate(newPolicy)
      setCreatePolicyDialog(false)
      setNewPolicy({
        name: '',
        data_type: 'posts',
        retention_period_days: 365,
        action: 'delete',
        description: '',
        compliance_standards: []
      })
      await loadData()
    } catch (err) {
      setError('Failed to create retention policy')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyrightViolationUpdate = async (violationId: string, status: string) => {
    if (!onCopyrightViolationUpdate) return
    
    setLoading(true)
    try {
      await onCopyrightViolationUpdate(violationId, status)
      await loadData()
    } catch (err) {
      setError('Failed to update copyright violation')
    } finally {
      setLoading(false)
    }
  }

  const handleDataRequestProcess = async (requestId: string, action: string) => {
    if (!onDataRequestProcess) return
    
    setLoading(true)
    try {
      await onDataRequestProcess(requestId, action)
      await loadData()
    } catch (err) {
      setError('Failed to process data request')
    } finally {
      setLoading(false)
    }
  }

  const handleAuditStart = async (auditType: string) => {
    if (!onAuditStart) return
    
    setLoading(true)
    try {
      await onAuditStart(auditType)
      await loadData()
    } catch (err) {
      setError('Failed to start compliance audit')
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error'
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'default'
      case 'draft': return 'warning'
      case 'pending': return 'warning'
      case 'processing': return 'primary'
      case 'completed': return 'success'
      case 'failed': return 'error'
      case 'detected': return 'error'
      case 'investigating': return 'warning'
      case 'resolved': return 'success'
      case 'ignored': return 'default'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'success'
      case 'non_compliant': return 'error'
      case 'partial': return 'warning'
      default: return 'default'
    }
  }

  const renderOverviewTab = () => (
    <Box>
      {complianceMetrics && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary" gutterBottom>
                  {complianceMetrics.overall_compliance_score}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Compliance Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="success" gutterBottom>
                  {complianceMetrics.retention_policies_active}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Retention Policies
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="warning" gutterBottom>
                  {complianceMetrics.copyright_violations_open}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Open Copyright Violations
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="info" gutterBottom>
                  {complianceMetrics.data_requests_pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Data Requests
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Regulatory Compliance
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">GDPR</Typography>
                    <Chip
                      label={complianceMetrics.gdpr_compliance}
                      color={getComplianceColor(complianceMetrics.gdpr_compliance) as any}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">CCPA</Typography>
                    <Chip
                      label={complianceMetrics.ccpa_compliance}
                      color={getComplianceColor(complianceMetrics.ccpa_compliance) as any}
                      size="small"
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Last Audit: {formatDate(complianceMetrics.last_audit_date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Next Audit: {formatDate(complianceMetrics.next_audit_date)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleAuditStart('gdpr')}
                    startIcon={<Assessment />}
                  >
                    Start GDPR Audit
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleAuditStart('retention')}
                    startIcon={<History />}
                  >
                    Start Retention Audit
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setCreatePolicyDialog(true)}
                    startIcon={<Policy />}
                  >
                    Create Retention Policy
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )

  const renderRetentionTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Data Retention Policies</Typography>
        <Button
          variant="contained"
          onClick={() => setCreatePolicyDialog(true)}
          startIcon={<Policy />}
        >
          Create Policy
        </Button>
      </Box>

      <Grid container spacing={2}>
        {retentionPolicies.map((policy) => (
          <Grid item xs={12} md={6} key={policy.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {policy.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {policy.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={policy.status}
                        size="small"
                        color={getStatusColor(policy.status) as any}
                      />
                      <Chip
                        label={policy.data_type}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${policy.retention_period_days} days`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Action: {policy.action}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Compliance Standards
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {policy.compliance_standards.map((standard) => (
                    <Chip
                      key={standard}
                      label={standard}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Created: {formatDate(policy.created_at)} • Updated: {formatDate(policy.updated_at)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const renderCopyrightTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Copyright Violations</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={violationFilter}
            onChange={(e) => setViolationFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="detected">Detected</MenuItem>
            <MenuItem value="investigating">Investigating</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="ignored">Ignored</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2}>
        {copyrightViolations
          .filter(violation => violationFilter === 'all' || violation.status === violationFilter)
          .map((violation) => (
            <Grid item xs={12} key={violation.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={violation.severity}
                          color={getSeverityColor(violation.severity) as any}
                        />
                        <Chip
                          label={violation.status}
                          size="small"
                          color={getStatusColor(violation.status) as any}
                        />
                        <Chip
                          label={violation.violation_type}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${violation.compliance_score}%`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {violation.content_type} - {violation.content_id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {violation.description}
                      </Typography>
                      {violation.source_url && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Source: {violation.source_url}
                        </Typography>
                      )}
                      {violation.original_author && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Original Author: {violation.original_author}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {violation.status === 'detected' && (
                        <>
                          <Tooltip title="Mark as Investigating">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleCopyrightViolationUpdate(violation.id, 'investigating')}
                            >
                              <Assessment />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Mark as Resolved">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleCopyrightViolationUpdate(violation.id, 'resolved')}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ignore">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => handleCopyrightViolationUpdate(violation.id, 'ignored')}
                            >
                              <Block />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Action Taken
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {violation.action_taken}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Detected: {formatDate(violation.detected_at)}
                    {violation.resolved_at && ` • Resolved: ${formatDate(violation.resolved_at)}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  )

  const renderAuditsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Compliance Audits</Typography>
      
      <Grid container spacing={2}>
        {complianceAudits.map((audit) => (
          <Grid item xs={12} md={6} key={audit.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {audit.audit_type.toUpperCase()} Audit
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={audit.status}
                        size="small"
                        color={getStatusColor(audit.status) as any}
                      />
                      <Chip
                        label={`${audit.compliance_score}%`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${audit.issues_found} issues`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Auditor: {audit.auditor}
                </Typography>

                {audit.recommendations.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Recommendations
                    </Typography>
                    <List dense>
                      {audit.recommendations.map((rec, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemText
                            primary={rec}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Started: {formatDate(audit.started_at)}
                  {audit.completed_at && ` • Completed: ${formatDate(audit.completed_at)}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Next Audit: {formatDate(audit.next_audit_date)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const renderDataRequestsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Data Subject Requests</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={requestFilter}
            onChange={(e) => setRequestFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2}>
        {dataRequests
          .filter(request => requestFilter === 'all' || request.status === requestFilter)
          .map((request) => (
            <Grid item xs={12} md={6} key={request.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {request.request_type.charAt(0).toUpperCase() + request.request_type.slice(1)} Request
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {request.subject_email}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          label={request.status}
                          size="small"
                          color={getStatusColor(request.status) as any}
                        />
                        <Chip
                          label={request.request_type}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {request.status === 'pending' && (
                        <>
                          <Tooltip title="Start Processing">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleDataRequestProcess(request.id, 'start')}
                            >
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDataRequestProcess(request.id, 'reject')}
                            >
                              <Block />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {request.status === 'processing' && (
                        <Tooltip title="Mark Complete">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleDataRequestProcess(request.id, 'complete')}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Data Found</Typography>
                      <Chip
                        label={request.data_found ? 'Yes' : 'No'}
                        size="small"
                        color={request.data_found ? 'success' : 'default'}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Data Processed</Typography>
                      <Chip
                        label={request.data_processed ? 'Yes' : 'No'}
                        size="small"
                        color={request.data_processed ? 'success' : 'default'}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Response Sent</Typography>
                      <Chip
                        label={request.response_sent ? 'Yes' : 'No'}
                        size="small"
                        color={request.response_sent ? 'success' : 'default'}
                      />
                    </Box>
                  </Box>

                  {request.notes && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {request.notes}
                      </Typography>
                    </>
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Submitted: {formatDate(request.submitted_at)}
                    {request.completed_at && ` • Completed: ${formatDate(request.completed_at)}`}
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
          <Tab label="Overview" icon={<Compliance />} />
          <Tab label="Retention" icon={<History />} />
          <Tab label="Copyright" icon={<Gavel />} />
          <Tab label="Audits" icon={<Assessment />} />
          <Tab label="Data Requests" icon={<Security />} />
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
        ) : activeTab === 1 ? (
          renderRetentionTab()
        ) : activeTab === 2 ? (
          renderCopyrightTab()
        ) : activeTab === 3 ? (
          renderAuditsTab()
        ) : (
          renderDataRequestsTab()
        )}
      </Box>

      {/* Create Retention Policy Dialog */}
      <Dialog open={createPolicyDialog} onClose={() => setCreatePolicyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Retention Policy</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Policy Name"
                value={newPolicy.name}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={newPolicy.description}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Data Type</InputLabel>
                <Select
                  value={newPolicy.data_type}
                  onChange={(e) => setNewPolicy(prev => ({ ...prev, data_type: e.target.value as any }))}
                  label="Data Type"
                >
                  <MenuItem value="posts">Posts</MenuItem>
                  <MenuItem value="analytics">Analytics</MenuItem>
                  <MenuItem value="user_data">User Data</MenuItem>
                  <MenuItem value="logs">Logs</MenuItem>
                  <MenuItem value="backups">Backups</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Retention Period (days)"
                value={newPolicy.retention_period_days}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, retention_period_days: parseInt(e.target.value) || 365 }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={newPolicy.action}
                  onChange={(e) => setNewPolicy(prev => ({ ...prev, action: e.target.value as any }))}
                  label="Action"
                >
                  <MenuItem value="delete">Delete</MenuItem>
                  <MenuItem value="archive">Archive</MenuItem>
                  <MenuItem value="anonymize">Anonymize</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePolicyDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRetentionPolicyCreate}
            variant="contained"
            disabled={!newPolicy.name || !newPolicy.description}
          >
            Create Policy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
