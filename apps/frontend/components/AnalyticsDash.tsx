'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress,
  Alert, Paper, Divider, IconButton, Tooltip, FormControl, InputLabel,
  Select, MenuItem, ToggleButton, ToggleButtonGroup,
} from '@mui/material'
import {
  TrendingUp, TrendingDown, Visibility, Click, Timer, BounceRate,
  Refresh, CalendarToday, FilterList, Download, Share,
} from '@mui/icons-material'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'

interface AnalyticsData {
  date: string
  page_views: number
  unique_visitors: number
  sessions: number
  bounce_rate: number
  avg_time_on_page: number
  clicks: number
  impressions: number
  ctr: number
  position: number
  organic_traffic: number
  social_traffic: number
  direct_traffic: number
  referral_traffic: number
}

interface AnalyticsSummary {
  total_page_views: number
  total_unique_visitors: number
  total_sessions: number
  avg_bounce_rate: number
  avg_time_on_page: number
  total_clicks: number
  total_impressions: number
  avg_ctr: number
  avg_position: number
  page_views_change: number
  visitors_change: number
  ctr_change: number
  position_change: number
}

interface AnalyticsDashProps {
  postId?: string
  dateRange?: '7d' | '30d' | '90d' | '1y'
  onDateRangeChange?: (range: string) => void
}

export default function AnalyticsDash({
  postId, dateRange = '30d', onDateRangeChange
}: AnalyticsDashProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedMetric, setSelectedMetric] = useState('page_views')
  const [selectedChart, setSelectedChart] = useState('line')

  useEffect(() => {
    if (postId) {
      loadAnalyticsData()
    }
  }, [postId, dateRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock analytics data
      const mockData: AnalyticsData[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        
        return {
          date: date.toISOString().split('T')[0],
          page_views: Math.floor(Math.random() * 1000) + 100,
          unique_visitors: Math.floor(Math.random() * 800) + 80,
          sessions: Math.floor(Math.random() * 1200) + 120,
          bounce_rate: Math.random() * 0.8 + 0.2,
          avg_time_on_page: Math.random() * 300 + 60,
          clicks: Math.floor(Math.random() * 50) + 5,
          impressions: Math.floor(Math.random() * 500) + 50,
          ctr: Math.random() * 0.1 + 0.01,
          position: Math.random() * 20 + 1,
          organic_traffic: Math.floor(Math.random() * 600) + 60,
          social_traffic: Math.floor(Math.random() * 200) + 20,
          direct_traffic: Math.floor(Math.random() * 150) + 15,
          referral_traffic: Math.floor(Math.random() * 100) + 10,
        }
      })
      
      setAnalyticsData(mockData)
      
      // Calculate summary
      const totalPageViews = mockData.reduce((sum, d) => sum + d.page_views, 0)
      const totalVisitors = mockData.reduce((sum, d) => sum + d.unique_visitors, 0)
      const totalSessions = mockData.reduce((sum, d) => sum + d.sessions, 0)
      const avgBounceRate = mockData.reduce((sum, d) => sum + d.bounce_rate, 0) / mockData.length
      const avgTimeOnPage = mockData.reduce((sum, d) => sum + d.avg_time_on_page, 0) / mockData.length
      const totalClicks = mockData.reduce((sum, d) => sum + d.clicks, 0)
      const totalImpressions = mockData.reduce((sum, d) => sum + d.impressions, 0)
      const avgCtr = mockData.reduce((sum, d) => sum + d.ctr, 0) / mockData.length
      const avgPosition = mockData.reduce((sum, d) => sum + d.position, 0) / mockData.length
      
      // Calculate changes (mock)
      const pageViewsChange = 12.5
      const visitorsChange = 8.3
      const ctrChange = -2.1
      const positionChange = 5.7
      
      setSummary({
        total_page_views: totalPageViews,
        total_unique_visitors: totalVisitors,
        total_sessions: totalSessions,
        avg_bounce_rate: avgBounceRate,
        avg_time_on_page: avgTimeOnPage,
        total_clicks: totalClicks,
        total_impressions: totalImpressions,
        avg_ctr: avgCtr,
        avg_position: avgPosition,
        page_views_change: pageViewsChange,
        visitors_change: visitorsChange,
        ctr_change: ctrChange,
        position_change: positionChange,
      })
      
    } catch (err) {
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'page_views': return 'Page Views'
      case 'unique_visitors': return 'Unique Visitors'
      case 'sessions': return 'Sessions'
      case 'clicks': return 'Clicks'
      case 'impressions': return 'Impressions'
      case 'ctr': return 'CTR'
      case 'position': return 'Position'
      default: return metric
    }
  }

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'page_views': return '#8884d8'
      case 'unique_visitors': return '#82ca9d'
      case 'sessions': return '#ffc658'
      case 'clicks': return '#ff7300'
      case 'impressions': return '#00C49F'
      case 'ctr': return '#FFBB28'
      case 'position': return '#FF8042'
      default: return '#8884d8'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%'
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />
  }

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'success' : 'error'
  }

  const trafficSourceData = summary ? [
    { name: 'Organic', value: summary.total_page_views * 0.6, color: '#82ca9d' },
    { name: 'Social', value: summary.total_page_views * 0.2, color: '#8884d8' },
    { name: 'Direct', value: summary.total_page_views * 0.15, color: '#ffc658' },
    { name: 'Referral', value: summary.total_page_views * 0.05, color: '#ff7300' },
  ] : []

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Analytics Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={dateRange}
            exclusive
            onChange={(_, value) => value && onDateRangeChange?.(value)}
            size="small"
          >
            <ToggleButton value="7d">7D</ToggleButton>
            <ToggleButton value="30d">30D</ToggleButton>
            <ToggleButton value="90d">90D</ToggleButton>
            <ToggleButton value="1y">1Y</ToggleButton>
          </ToggleButtonGroup>
          <IconButton size="small" onClick={loadAnalyticsData} disabled={loading}>
            {loading ? <CircularProgress size={16} /> : <Refresh />}
          </IconButton>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" gutterBottom>
                      {formatNumber(summary.total_page_views)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Page Views
                    </Typography>
                  </Box>
                  <Visibility color="primary" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {getChangeIcon(summary.page_views_change)}
                  <Chip
                    label={`${summary.page_views_change >= 0 ? '+' : ''}${summary.page_views_change.toFixed(1)}%`}
                    size="small"
                    color={getChangeColor(summary.page_views_change) as any}
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" gutterBottom>
                      {formatNumber(summary.total_unique_visitors)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unique Visitors
                    </Typography>
                  </Box>
                  <Click color="primary" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {getChangeIcon(summary.visitors_change)}
                  <Chip
                    label={`${summary.visitors_change >= 0 ? '+' : ''}${summary.visitors_change.toFixed(1)}%`}
                    size="small"
                    color={getChangeColor(summary.visitors_change) as any}
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" gutterBottom>
                      {formatPercentage(summary.avg_ctr)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      CTR
                    </Typography>
                  </Box>
                  <TrendingUp color="primary" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {getChangeIcon(summary.ctr_change)}
                  <Chip
                    label={`${summary.ctr_change >= 0 ? '+' : ''}${summary.ctr_change.toFixed(1)}%`}
                    size="small"
                    color={getChangeColor(summary.ctr_change) as any}
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" gutterBottom>
                      {summary.avg_position.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Position
                    </Typography>
                  </Box>
                  <TrendingDown color="primary" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {getChangeIcon(-summary.position_change)}
                  <Chip
                    label={`${summary.position_change >= 0 ? '+' : ''}${summary.position_change.toFixed(1)}`}
                    size="small"
                    color={getChangeColor(-summary.position_change) as any}
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts Section */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Chart Controls */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">Performance Trends</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  label="Metric"
                >
                  <MenuItem value="page_views">Page Views</MenuItem>
                  <MenuItem value="unique_visitors">Unique Visitors</MenuItem>
                  <MenuItem value="sessions">Sessions</MenuItem>
                  <MenuItem value="clicks">Clicks</MenuItem>
                  <MenuItem value="impressions">Impressions</MenuItem>
                  <MenuItem value="ctr">CTR</MenuItem>
                  <MenuItem value="position">Position</MenuItem>
                </Select>
              </FormControl>
              <ToggleButtonGroup
                value={selectedChart}
                exclusive
                onChange={(_, value) => value && setSelectedChart(value)}
                size="small"
              >
                <ToggleButton value="line">Line</ToggleButton>
                <ToggleButton value="bar">Bar</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Main Chart */}
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              {selectedChart === 'line' ? (
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={getMetricColor(selectedMetric)}
                    strokeWidth={2}
                    dot={{ fill: getMetricColor(selectedMetric) }}
                  />
                </LineChart>
              ) : (
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey={selectedMetric} fill={getMetricColor(selectedMetric)} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Traffic Sources & Additional Metrics */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 300 }}>
              <Typography variant="subtitle2" gutterBottom>Traffic Sources</Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trafficSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {trafficSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 300 }}>
              <Typography variant="subtitle2" gutterBottom>Additional Metrics</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {summary && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BounceRate color="action" />
                        <Typography variant="body2">Bounce Rate</Typography>
                      </Box>
                      <Typography variant="h6">{formatPercentage(summary.avg_bounce_rate)}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timer color="action" />
                        <Typography variant="body2">Avg Time on Page</Typography>
                      </Box>
                      <Typography variant="h6">{formatTime(summary.avg_time_on_page)}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Click color="action" />
                        <Typography variant="body2">Total Clicks</Typography>
                      </Box>
                      <Typography variant="h6">{formatNumber(summary.total_clicks)}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Visibility color="action" />
                        <Typography variant="body2">Total Impressions</Typography>
                      </Box>
                      <Typography variant="h6">{formatNumber(summary.total_impressions)}</Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
