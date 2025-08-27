'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material'
import { 
  ExpandMore, 
  Group, 
  TrendingUp, 
  Create, 
  Visibility,
  Refresh 
} from '@mui/icons-material'

interface ClusterData {
  id: string
  name: string
  description: string
  keywords: string[]
  size: number
  avgSearchVolume: number
  avgDifficulty: number
  avgCpc: number
}

export default function ClusterPlanner() {
  const [clusters, setClusters] = useState<ClusterData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateClusters = async () => {
    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/clusters', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // })
      // const data = await response.json()

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 3000))
      const mockClusters: ClusterData[] = [
        {
          id: 'cluster_1',
          name: 'Cluster: AI Tools',
          description: 'Keywords related to AI tools and software',
          keywords: ['AI tools', 'AI software', 'machine learning tools', 'AI platforms'],
          size: 4,
          avgSearchVolume: 4500,
          avgDifficulty: 55,
          avgCpc: 2.80
        },
        {
          id: 'cluster_2',
          name: 'Cluster: Blog Writing',
          description: 'Keywords related to blog writing and content creation',
          keywords: ['blog writing', 'content creation', 'writing tools', 'blog tips'],
          size: 4,
          avgSearchVolume: 3200,
          avgDifficulty: 45,
          avgCpc: 2.20
        },
        {
          id: 'cluster_3',
          name: 'Cluster: SEO Optimization',
          description: 'Keywords related to SEO and optimization',
          keywords: ['SEO optimization', 'search engine optimization', 'SEO tools', 'keyword research'],
          size: 4,
          avgSearchVolume: 6800,
          avgDifficulty: 65,
          avgCpc: 3.50
        }
      ]

      setClusters(mockClusters)
    } catch (err) {
      setError('Failed to create clusters')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClusterClick = (cluster: ClusterData) => {
    // TODO: Handle cluster selection for content planning
    console.log('Selected cluster:', cluster)
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'success'
    if (difficulty < 60) return 'warning'
    return 'error'
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Keyword Clusters
        </Typography>
        <Button
          fullWidth
          variant="contained"
          onClick={handleCreateClusters}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Group />}
        >
          {loading ? 'Creating Clusters...' : 'Create Clusters'}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading Progress */}
      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary">
            Analyzing keywords and creating clusters...
          </Typography>
        </Box>
      )}

      {/* Clusters List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {clusters.length > 0 && (
          <Typography variant="subtitle2" gutterBottom>
            Keyword Clusters ({clusters.length})
          </Typography>
        )}
        
        {clusters.map((cluster) => (
          <Accordion key={cluster.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  {cluster.name}
                </Typography>
                <Chip
                  label={`${cluster.size} keywords`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {cluster.description}
                </Typography>
                
                {/* Cluster Stats */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    icon={<TrendingUp />}
                    label={`${cluster.avgSearchVolume.toLocaleString()}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${cluster.avgDifficulty}/100`}
                    size="small"
                    color={getDifficultyColor(cluster.avgDifficulty) as any}
                    variant="outlined"
                  />
                  <Chip
                    label={`$${cluster.avgCpc.toFixed(2)}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                {/* Keywords */}
                <Typography variant="subtitle2" gutterBottom>
                  Keywords:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {cluster.keywords.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Create />}
                    onClick={() => handleClusterClick(cluster)}
                  >
                    Create Content
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                  >
                    View Details
                  </Button>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}

        {clusters.length === 0 && !loading && (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <Group sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" align="center">
              No clusters created yet.
              <br />
              Click "Create Clusters" to group related keywords.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
