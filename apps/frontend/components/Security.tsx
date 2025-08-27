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
  Security, Lock, LockOpen, ExpandMore, Refresh, Download, Visibility,
  TrendingUp, TrendingDown, CheckCircle, Schedule, Timer, Storage, CloudUpload,
  CloudDownload, Memory, Storage as StorageIcon, NetworkCheck, Bug,
  Warning, Error, Info, Settings, Assessment, Analytics, Timeline as TimelineIcon,
  Shield, VerifiedUser, Block, Report, Security as SecurityIcon,
} from '@mui/icons-material'

interface SecurityVulnerability {
  id: string
  package_name: string
  package_version: string
  vulnerability_id: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  cve_id?: string
  cvss_score: number
  affected_versions: string[]
  fixed_versions: string[]
  published_date: string
  last_updated: string
  status: 'open' | 'fixed' | 'ignored' | 'investigating'
  remediation: string
  references: string[]
}

interface RLSRule {
  id: string
  name: string
  table: string
  policy: string
  roles: string[]
  conditions: string
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  updated_at: string
  created_by: string
  description: string
}

interface SignedURL {
  id: string
  url: string
  resource_type: 'image' | 'document' | 'export' | 'backup'
  resource_id: string
  expires_at: string
  created_at: string
  created_by: string
  access_count: number
  max_accesses: number
  status: 'active' | 'expired' | 'revoked'
  permissions: string[]
}

interface SecurityScan {
  id: string
  type: 'dependency' | 'container' | 'infrastructure' | 'code'
  status: 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  vulnerabilities_found: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  scan_config: Record<string, any>
  results_summary: string
}

interface SecurityMetrics {
  total_vulnerabilities: number
  critical_vulnerabilities: number
  high_vulnerabilities: number
  medium_vulnerabilities: number
  low_vulnerabilities: number
  rls_rules_active: number
  signed_urls_active: number
  security_score: number
  last_scan_date: string
  compliance_status: 'compliant' | 'non_compliant' | 'partial'
}

interface SecurityProps {
  onVulnerabilityUpdate?: (vulnId: string, status: string) => Promise<void>
  onRLSRuleCreate?: (rule: Partial<RLSRule>) => Promise<void>
  onRLSRuleUpdate?: (ruleId: string, updates: Partial<RLSRule>) => Promise<void>
  onSignedURLCreate?: (url: Partial<SignedURL>) => Promise<void>
  onSignedURLRevoke?: (urlId: string) => Promise<void>
  onSecurityScanStart?: (scanType: string) => Promise<void>
  onSecurityReportExport?: (scanId: string) => Promise<void>
}

export default function Security({
  onVulnerabilityUpdate, onRLSRuleCreate, onRLSRuleUpdate,
  onSignedURLCreate, onSignedURLRevoke, onSecurityScanStart,
  onSecurityReportExport
}: SecurityProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Vulnerabilities state
  const [vulnerabilities, setVulnerabilities] = useState<SecurityVulnerability[]>([])
  const [vulnFilter, setVulnFilter] = useState<string>('all')
  
  // RLS rules state
  const [rlsRules, setRlsRules] = useState<RLSRule[]>([])
  const [createRLSDialog, setCreateRLSDialog] = useState(false)
  const [newRLSRule, setNewRLSRule] = useState<Partial<RLSRule>>({
    name: '',
    table: '',
    policy: '',
    roles: [],
    conditions: '',
    description: ''
  })
  
  // Signed URLs state
  const [signedUrls, setSignedUrls] = useState<SignedURL[]>([])
  const [createSignedURLDialog, setCreateSignedURLDialog] = useState(false)
  const [newSignedURL, setNewSignedURL] = useState<Partial<SignedURL>>({
    resource_type: 'image',
    resource_id: '',
    expires_at: '',
    max_accesses: 1,
    permissions: ['read']
  })
  
  // Security scans state
  const [securityScans, setSecurityScans] = useState<SecurityScan[]>([])
  
  // Security metrics state
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null)

  useEffect(() => {
    loadData()
  }, [vulnFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock vulnerabilities data
      const mockVulnerabilities: SecurityVulnerability[] = [
        {
          id: 'vuln_1',
          package_name: 'lodash',
          package_version: '4.17.15',
          vulnerability_id: 'CVE-2021-23337',
          severity: 'high',
          title: 'Prototype Pollution in lodash',
          description: 'A prototype pollution vulnerability exists in lodash versions before 4.17.21.',
          cve_id: 'CVE-2021-23337',
          cvss_score: 7.5,
          affected_versions: ['<4.17.21'],
          fixed_versions: ['4.17.21'],
          published_date: '2021-03-15T00:00:00Z',
          last_updated: '2021-03-20T00:00:00Z',
          status: 'open',
          remediation: 'Update to lodash version 4.17.21 or later',
          references: [
            'https://nvd.nist.gov/vuln/detail/CVE-2021-23337',
            'https://github.com/lodash/lodash/pull/4759'
          ]
        },
        {
          id: 'vuln_2',
          package_name: 'axios',
          package_version: '0.21.1',
          vulnerability_id: 'CVE-2021-3749',
          severity: 'medium',
          title: 'Server-Side Request Forgery in axios',
          description: 'A server-side request forgery vulnerability exists in axios versions before 0.21.2.',
          cve_id: 'CVE-2021-3749',
          cvss_score: 6.5,
          affected_versions: ['<0.21.2'],
          fixed_versions: ['0.21.2'],
          published_date: '2021-08-10T00:00:00Z',
          last_updated: '2021-08-15T00:00:00Z',
          status: 'fixed',
          remediation: 'Update to axios version 0.21.2 or later',
          references: [
            'https://nvd.nist.gov/vuln/detail/CVE-2021-3749',
            'https://github.com/axios/axios/pull/3410'
          ]
        }
      ]
      
      // Mock RLS rules data
      const mockRLSRules: RLSRule[] = [
        {
          id: 'rls_1',
          name: 'Users can only access their own posts',
          table: 'posts',
          policy: 'users_can_access_own_posts',
          roles: ['user', 'admin'],
          conditions: 'auth.uid() = user_id',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'admin@example.com',
          description: 'Restricts users to only view and edit posts they created'
        },
        {
          id: 'rls_2',
          name: 'Admins can access all posts',
          table: 'posts',
          policy: 'admins_can_access_all_posts',
          roles: ['admin'],
          conditions: 'auth.jwt() ->> \'role\' = \'admin\'',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'admin@example.com',
          description: 'Allows administrators to access all posts in the system'
        }
      ]
      
      // Mock signed URLs data
      const mockSignedUrls: SignedURL[] = [
        {
          id: 'url_1',
          url: 'https://storage.example.com/images/post_123.jpg?signature=abc123&expires=1640995200',
          resource_type: 'image',
          resource_id: 'post_123',
          expires_at: '2024-01-01T12:00:00Z',
          created_at: '2024-01-01T10:00:00Z',
          created_by: 'user@example.com',
          access_count: 5,
          max_accesses: 10,
          status: 'active',
          permissions: ['read']
        },
        {
          id: 'url_2',
          url: 'https://storage.example.com/exports/analytics_2024.csv?signature=def456&expires=1640995200',
          resource_type: 'export',
          resource_id: 'analytics_2024',
          expires_at: '2024-01-01T12:00:00Z',
          created_at: '2024-01-01T11:00:00Z',
          created_by: 'admin@example.com',
          access_count: 2,
          max_accesses: 5,
          status: 'active',
          permissions: ['read', 'download']
        }
      ]
      
      // Mock security scans data
      const mockSecurityScans: SecurityScan[] = [
        {
          id: 'scan_1',
          type: 'dependency',
          status: 'completed',
          started_at: '2024-01-27T09:00:00Z',
          completed_at: '2024-01-27T09:05:00Z',
          vulnerabilities_found: 2,
          critical_count: 0,
          high_count: 1,
          medium_count: 1,
          low_count: 0,
          scan_config: {
            include_dev_dependencies: false,
            fail_on_severity: 'high'
          },
          results_summary: 'Found 2 vulnerabilities: 1 high, 1 medium'
        },
        {
          id: 'scan_2',
          type: 'container',
          status: 'running',
          started_at: '2024-01-27T10:00:00Z',
          vulnerabilities_found: 0,
          critical_count: 0,
          high_count: 0,
          medium_count: 0,
          low_count: 0,
          scan_config: {
            image_name: 'ai-blog-writer:latest',
            registry: 'docker.io'
          },
          results_summary: 'Scan in progress...'
        }
      ]
      
      // Mock security metrics data
      const mockSecurityMetrics: SecurityMetrics = {
        total_vulnerabilities: 2,
        critical_vulnerabilities: 0,
        high_vulnerabilities: 1,
        medium_vulnerabilities: 1,
        low_vulnerabilities: 0,
        rls_rules_active: 2,
        signed_urls_active: 2,
        security_score: 85,
        last_scan_date: '2024-01-27T09:05:00Z',
        compliance_status: 'compliant'
      }
      
      setVulnerabilities(mockVulnerabilities)
      setRlsRules(mockRLSRules)
      setSignedUrls(mockSignedUrls)
      setSecurityScans(mockSecurityScans)
      setSecurityMetrics(mockSecurityMetrics)
    } catch (err) {
      setError('Failed to load security data')
    } finally {
      setLoading(false)
    }
  }

  const handleVulnerabilityUpdate = async (vulnId: string, status: string) => {
    if (!onVulnerabilityUpdate) return
    
    setLoading(true)
    try {
      await onVulnerabilityUpdate(vulnId, status)
      await loadData()
    } catch (err) {
      setError('Failed to update vulnerability status')
    } finally {
      setLoading(false)
    }
  }

  const handleRLSRuleCreate = async () => {
    if (!onRLSRuleCreate) return
    
    setLoading(true)
    try {
      await onRLSRuleCreate(newRLSRule)
      setCreateRLSDialog(false)
      setNewRLSRule({
        name: '',
        table: '',
        policy: '',
        roles: [],
        conditions: '',
        description: ''
      })
      await loadData()
    } catch (err) {
      setError('Failed to create RLS rule')
    } finally {
      setLoading(false)
    }
  }

  const handleSignedURLCreate = async () => {
    if (!onSignedURLCreate) return
    
    setLoading(true)
    try {
      await onSignedURLCreate(newSignedURL)
      setCreateSignedURLDialog(false)
      setNewSignedURL({
        resource_type: 'image',
        resource_id: '',
        expires_at: '',
        max_accesses: 1,
        permissions: ['read']
      })
      await loadData()
    } catch (err) {
      setError('Failed to create signed URL')
    } finally {
      setLoading(false)
    }
  }

  const handleSignedURLRevoke = async (urlId: string) => {
    if (!onSignedURLRevoke) return
    
    setLoading(true)
    try {
      await onSignedURLRevoke(urlId)
      await loadData()
    } catch (err) {
      setError('Failed to revoke signed URL')
    } finally {
      setLoading(false)
    }
  }

  const handleSecurityScanStart = async (scanType: string) => {
    if (!onSecurityScanStart) return
    
    setLoading(true)
    try {
      await onSecurityScanStart(scanType)
      await loadData()
    } catch (err) {
      setError('Failed to start security scan')
    } finally {
      setLoading(false)
    }
  }

  const handleSecurityReportExport = async (scanId: string) => {
    if (!onSecurityReportExport) return
    
    setLoading(true)
    try {
      await onSecurityReportExport(scanId)
    } catch (err) {
      setError('Failed to export security report')
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
      case 'info': return 'default'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'default'
      case 'draft': return 'warning'
      case 'running': return 'primary'
      case 'completed': return 'success'
      case 'failed': return 'error'
      case 'open': return 'error'
      case 'fixed': return 'success'
      case 'ignored': return 'default'
      case 'investigating': return 'warning'
      case 'expired': return 'default'
      case 'revoked': return 'error'
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
      {securityMetrics && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary" gutterBottom>
                  {securityMetrics.security_score}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Security Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="error" gutterBottom>
                  {securityMetrics.total_vulnerabilities}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Vulnerabilities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="success" gutterBottom>
                  {securityMetrics.rls_rules_active}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active RLS Rules
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="info" gutterBottom>
                  {securityMetrics.signed_urls_active}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Signed URLs
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vulnerability Breakdown
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="error">
                        Critical
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {securityMetrics.critical_vulnerabilities}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(securityMetrics.critical_vulnerabilities / securityMetrics.total_vulnerabilities) * 100}
                      color="error"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="error">
                        High
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {securityMetrics.high_vulnerabilities}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(securityMetrics.high_vulnerabilities / securityMetrics.total_vulnerabilities) * 100}
                      color="error"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="warning">
                        Medium
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {securityMetrics.medium_vulnerabilities}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(securityMetrics.medium_vulnerabilities / securityMetrics.total_vulnerabilities) * 100}
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="info">
                        Low
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {securityMetrics.low_vulnerabilities}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(securityMetrics.low_vulnerabilities / securityMetrics.total_vulnerabilities) * 100}
                      color="info"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Compliance Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={securityMetrics.compliance_status}
                    color={getComplianceColor(securityMetrics.compliance_status) as any}
                    size="large"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Security Scan: {formatDate(securityMetrics.last_scan_date)}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => handleSecurityScanStart('dependency')}
                  sx={{ mt: 1 }}
                >
                  Run Security Scan
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )

  const renderVulnerabilitiesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Security Vulnerabilities</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Severity</InputLabel>
          <Select
            value={vulnFilter}
            onChange={(e) => setVulnFilter(e.target.value)}
            label="Severity"
          >
            <MenuItem value="all">All Severities</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="info">Info</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2}>
        {vulnerabilities
          .filter(vuln => vulnFilter === 'all' || vuln.severity === vulnFilter)
          .map((vuln) => (
            <Grid item xs={12} key={vuln.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={vuln.severity}
                          color={getSeverityColor(vuln.severity) as any}
                        />
                        <Chip
                          label={vuln.status}
                          size="small"
                          color={getStatusColor(vuln.status) as any}
                        />
                        <Chip
                          label={`CVSS ${vuln.cvss_score}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {vuln.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {vuln.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Package: {vuln.package_name}@{vuln.package_version}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {vuln.status === 'open' && (
                        <>
                          <Tooltip title="Mark as Fixed">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleVulnerabilityUpdate(vuln.id, 'fixed')}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ignore">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => handleVulnerabilityUpdate(vuln.id, 'ignored')}
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
                    Remediation
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {vuln.remediation}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Affected Versions
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {vuln.affected_versions.map((version, index) => (
                      <Chip
                        key={index}
                        label={version}
                        size="small"
                        variant="outlined"
                        color="error"
                      />
                    ))}
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>
                    Fixed Versions
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {vuln.fixed_versions.map((version, index) => (
                      <Chip
                        key={index}
                        label={version}
                        size="small"
                        variant="outlined"
                        color="success"
                      />
                    ))}
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Published: {formatDate(vuln.published_date)} • Updated: {formatDate(vuln.last_updated)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  )

  const renderRLSRulesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Row Level Security (RLS) Rules</Typography>
        <Button
          variant="contained"
          onClick={() => setCreateRLSDialog(true)}
          startIcon={<Lock />}
        >
          Create RLS Rule
        </Button>
      </Box>

      <Grid container spacing={2}>
        {rlsRules.map((rule) => (
          <Grid item xs={12} md={6} key={rule.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {rule.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {rule.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={rule.status}
                        size="small"
                        color={getStatusColor(rule.status) as any}
                      />
                      <Chip
                        label={rule.table}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Policy
                </Typography>
                <Typography variant="body2" fontFamily="monospace" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                  {rule.policy}
                </Typography>

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Conditions
                </Typography>
                <Typography variant="body2" fontFamily="monospace" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                  {rule.conditions}
                </Typography>

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Roles
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {rule.roles.map((role) => (
                    <Chip
                      key={role}
                      label={role}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Created: {formatDate(rule.created_at)} • Updated: {formatDate(rule.updated_at)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const renderSignedURLsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Signed URLs</Typography>
        <Button
          variant="contained"
          onClick={() => setCreateSignedURLDialog(true)}
          startIcon={<Link />}
        >
          Create Signed URL
        </Button>
      </Box>

      <Grid container spacing={2}>
        {signedUrls.map((url) => (
          <Grid item xs={12} md={6} key={url.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {url.resource_type} - {url.resource_id}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={url.status}
                        size="small"
                        color={getStatusColor(url.status) as any}
                      />
                      <Chip
                        label={url.resource_type}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {url.status === 'active' && (
                      <Tooltip title="Revoke URL">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleSignedURLRevoke(url.id)}
                        >
                          <Block />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Copy URL">
                      <IconButton
                        size="small"
                        onClick={() => navigator.clipboard.writeText(url.url)}
                      >
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  URL: {url.url.substring(0, 50)}...
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Access: {url.access_count} / {url.max_accesses}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Permissions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {url.permissions.map((permission) => (
                    <Chip
                      key={permission}
                      label={permission}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Created: {formatDate(url.created_at)} • Expires: {formatDate(url.expires_at)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const renderScansTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Security Scans</Typography>
      
      <Grid container spacing={2}>
        {securityScans.map((scan) => (
          <Grid item xs={12} md={6} key={scan.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {scan.type.charAt(0).toUpperCase() + scan.type.slice(1)} Scan
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={scan.status}
                        size="small"
                        color={getStatusColor(scan.status) as any}
                      />
                      <Chip
                        label={`${scan.vulnerabilities_found} vulnerabilities`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {scan.status === 'completed' && (
                      <Tooltip title="Export Report">
                        <IconButton
                          size="small"
                          onClick={() => handleSecurityReportExport(scan.id)}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {scan.results_summary}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Vulnerability Breakdown
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="error">
                      Critical: {scan.critical_count}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="error">
                      High: {scan.high_count}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="warning">
                      Medium: {scan.medium_count}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="info">
                      Low: {scan.low_count}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Started: {formatDate(scan.started_at)}
                  {scan.completed_at && ` • Completed: ${formatDate(scan.completed_at)}`}
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
          <Tab label="Overview" icon={<Security />} />
          <Tab label="Vulnerabilities" icon={<Bug />} />
          <Tab label="RLS Rules" icon={<Lock />} />
          <Tab label="Signed URLs" icon={<Link />} />
          <Tab label="Scans" icon={<Assessment />} />
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
          renderVulnerabilitiesTab()
        ) : activeTab === 2 ? (
          renderRLSRulesTab()
        ) : activeTab === 3 ? (
          renderSignedURLsTab()
        ) : (
          renderScansTab()
        )}
      </Box>

      {/* Create RLS Rule Dialog */}
      <Dialog open={createRLSDialog} onClose={() => setCreateRLSDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create RLS Rule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Name"
                value={newRLSRule.name}
                onChange={(e) => setNewRLSRule(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={newRLSRule.description}
                onChange={(e) => setNewRLSRule(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Table"
                value={newRLSRule.table}
                onChange={(e) => setNewRLSRule(prev => ({ ...prev, table: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Policy Name"
                value={newRLSRule.policy}
                onChange={(e) => setNewRLSRule(prev => ({ ...prev, policy: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Conditions (SQL)"
                value={newRLSRule.conditions}
                onChange={(e) => setNewRLSRule(prev => ({ ...prev, conditions: e.target.value }))}
                placeholder="auth.uid() = user_id"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRLSDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRLSRuleCreate}
            variant="contained"
            disabled={!newRLSRule.name || !newRLSRule.table || !newRLSRule.policy}
          >
            Create Rule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Signed URL Dialog */}
      <Dialog open={createSignedURLDialog} onClose={() => setCreateSignedURLDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Signed URL</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Resource Type</InputLabel>
                <Select
                  value={newSignedURL.resource_type}
                  onChange={(e) => setNewSignedURL(prev => ({ ...prev, resource_type: e.target.value as any }))}
                  label="Resource Type"
                >
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="document">Document</MenuItem>
                  <MenuItem value="export">Export</MenuItem>
                  <MenuItem value="backup">Backup</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Resource ID"
                value={newSignedURL.resource_id}
                onChange={(e) => setNewSignedURL(prev => ({ ...prev, resource_id: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Expires At"
                value={newSignedURL.expires_at}
                onChange={(e) => setNewSignedURL(prev => ({ ...prev, expires_at: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Accesses"
                value={newSignedURL.max_accesses}
                onChange={(e) => setNewSignedURL(prev => ({ ...prev, max_accesses: parseInt(e.target.value) || 1 }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateSignedURLDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSignedURLCreate}
            variant="contained"
            disabled={!newSignedURL.resource_id || !newSignedURL.expires_at}
          >
            Create Signed URL
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
