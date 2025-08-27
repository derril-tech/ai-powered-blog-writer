'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Paper,
  Divider,
} from '@mui/material'
import {
  CheckCircle,
  Warning,
  Error,
  ExpandMore,
  Refresh,
  TrendingUp,
  TrendingDown,
  Info,
  AutoFixHigh,
} from '@mui/icons-material'

interface QACheck {
  type: string
  status: 'pass' | 'warning' | 'fail'
  score: number
  message: string
  suggestions: string[]
  data?: any
}

interface QAPanelProps {
  postId?: string
  onRefresh?: () => void
}

export default function QAPanel({ postId, onRefresh }: QAPanelProps) {
  const [checks, setChecks] = useState<QACheck[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [overallScore, setOverallScore] = useState(0)

  useEffect(() => {
    if (postId) {
      loadQAChecks()
    }
  }, [postId])

  const loadQAChecks = async () => {
    if (!postId) return

    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/posts/${postId}/qa`)
      // const data = await response.json()

      // Mock QA checks
      await new Promise(resolve => setTimeout(resolve, 1500))
      const mockChecks: QACheck[] = [
        {
          type: 'title',
          status: 'pass',
          score: 85,
          message: 'Title analysis: 45 characters',
          suggestions: ['Consider adding emotional trigger words'],
          data: { length: 45, keyword_present: true }
        },
        {
          type: 'meta_description',
          status: 'warning',
          score: 70,
          message: 'Meta description: 95 characters',
          suggestions: [
            'Meta description too short (95 chars). Aim for 120-160 characters.',
            'Consider adding a call-to-action'
          ],
          data: { length: 95, keyword_present: true }
        },
        {
          type: 'slug',
          status: 'pass',
          score: 90,
          message: 'Slug analysis: 32 characters',
          suggestions: [],
          data: { length: 32, hyphen_count: 2 }
        },
        {
          type: 'heading_structure',
          status: 'pass',
          score: 95,
          message: 'Heading structure: H1=1, H2=4, H3=2',
          suggestions: [],
          data: { h1_count: 1, h2_count: 4, h3_count: 2, total: 7 }
        },
        {
          type: 'readability',
          status: 'pass',
          score: 88,
          message: 'Readability: Flesch 72.5, Grade 6.8',
          suggestions: [],
          data: { flesch_score: 72.5, grade_level: 6.8, avg_sentence_length: 16.2 }
        },
        {
          type: 'keyword_density',
          status: 'warning',
          score: 65,
          message: 'Keyword density: 0.8% (12 occurrences)',
          suggestions: [
            'Keyword density too low (0.8%). Aim for 0.5-2.5%.',
            'Consider adding more related keywords (LSI keywords).'
          ],
          data: { density: 0.8, occurrences: 12, total_words: 1500 }
        },
        {
          type: 'links',
          status: 'pass',
          score: 85,
          message: 'Links: 3 internal, 2 external',
          suggestions: [],
          data: { internal_links: 3, external_links: 2, total_links: 5 }
        },
        {
          type: 'schema_markup',
          status: 'fail',
          score: 30,
          message: 'Schema markup analysis',
          suggestions: [
            'No schema markup found. Add structured data for better search visibility.',
            'Suggested schema: {...}'
          ],
          data: { has_schema: false }
        }
      ]

      setChecks(mockChecks)
      setOverallScore(mockChecks.reduce((sum, check) => sum + check.score, 0) / mockChecks.length)
    } catch (err) {
      setError('Failed to load QA checks')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const runQAAnalysis = async () => {
    if (!postId) return

    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/posts/${postId}/qa`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // })
      // const data = await response.json()

      // Mock analysis
      await new Promise(resolve => setTimeout(resolve, 3000))
      await loadQAChecks()
    } catch (err) {
      setError('Failed to run QA analysis')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle color="success" />
      case 'warning': return <Warning color="warning" />
      case 'fail': return <Error color="error" />
      default: return <Info color="info" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'success'
      case 'warning': return 'warning'
      case 'fail': return 'error'
      default: return 'default'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'error'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Fair'
    if (score >= 60) return 'Poor'
    return 'Very Poor'
  }

  const getCheckTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'title': 'Title',
      'meta_description': 'Meta Description',
      'slug': 'URL Slug',
      'heading_structure': 'Heading Structure',
      'readability': 'Readability',
      'keyword_density': 'Keyword Density',
      'links': 'Internal/External Links',
      'schema_markup': 'Schema Markup'
    }
    return labels[type] || type
  }

  const getSummaryStats = () => {
    const passCount = checks.filter(c => c.status === 'pass').length
    const warningCount = checks.filter(c => c.status === 'warning').length
    const failCount = checks.filter(c => c.status === 'fail').length

    return { passCount, warningCount, failCount }
  }

  const stats = getSummaryStats()

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Quality Assurance</Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={runQAAnalysis}
          disabled={loading || !postId}
          startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
        >
          Run Analysis
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Overall Score */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={overallScore}
              size={60}
              color={getScoreColor(overallScore) as any}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" component="div" color="text.secondary">
                {Math.round(overallScore)}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="h6">{getScoreLabel(overallScore)}</Typography>
            <Typography variant="body2" color="text.secondary">
              Overall SEO Score: {overallScore.toFixed(1)}/100
            </Typography>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            icon={<CheckCircle />}
            label={`${stats.passCount} Pass`}
            color="success"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<Warning />}
            label={`${stats.warningCount} Warning`}
            color="warning"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<Error />}
            label={`${stats.failCount} Fail`}
            color="error"
            variant="outlined"
            size="small"
          />
        </Box>
      </Paper>

      {/* QA Checks */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {checks.length === 0 && !loading ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <AutoFixHigh sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" align="center">
              No QA checks available.
              <br />
              Click "Run Analysis" to perform SEO and quality checks.
            </Typography>
          </Box>
        ) : (
          <List>
            {checks.map((check, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getStatusIcon(check.status)}
                    </ListItemIcon>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2">
                        {getCheckTypeLabel(check.type)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {check.message}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`${check.score}/100`}
                        size="small"
                        color={getScoreColor(check.score) as any}
                        variant="outlined"
                      />
                      <Chip
                        label={check.status.toUpperCase()}
                        size="small"
                        color={getStatusColor(check.status) as any}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ width: '100%' }}>
                    {/* Score Progress */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Score</Typography>
                        <Typography variant="body2">{check.score}/100</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={check.score}
                        color={getScoreColor(check.score) as any}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Suggestions */}
                    {check.suggestions.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Suggestions for Improvement:
                        </Typography>
                        <List dense>
                          {check.suggestions.map((suggestion, idx) => (
                            <ListItem key={idx} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <AutoFixHigh fontSize="small" color="primary" />
                              </ListItemIcon>
                              <ListItemText
                                primary={suggestion}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {/* Additional Data */}
                    {check.data && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Details:
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 1 }}>
                          <pre style={{ 
                            margin: 0, 
                            fontSize: '12px', 
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}>
                            {JSON.stringify(check.data, null, 2)}
                          </pre>
                        </Paper>
                      </Box>
                    )}
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
