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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import {
  Link,
  Add,
  Delete,
  Refresh,
  ContentCopy,
  Edit,
  Check,
  TrendingUp,
  TrendingDown,
  Info,
  AutoFixHigh,
} from '@mui/icons-material'

interface InternalLinkSuggestion {
  url: string
  title: string
  description: string
  relevance_score: number
  anchor_text_suggestions: string[]
  link_type: 'related' | 'supporting' | 'authoritative'
}

interface LinkPlacement {
  link: InternalLinkSuggestion
  paragraph_index: number
  paragraph_text: string
  suggested_anchor: string
  relevance_score: number
}

interface InternalLinksProps {
  postId?: string
  onLinkAdd?: (link: InternalLinkSuggestion, anchorText: string) => void
}

export default function InternalLinks({ postId, onLinkAdd }: InternalLinksProps) {
  const [suggestions, setSuggestions] = useState<InternalLinkSuggestion[]>([])
  const [placements, setPlacements] = useState<LinkPlacement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'related' | 'supporting' | 'authoritative'>('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedLink, setSelectedLink] = useState<InternalLinkSuggestion | null>(null)
  const [customAnchorText, setCustomAnchorText] = useState('')

  useEffect(() => {
    if (postId) {
      loadInternalLinks()
    }
  }, [postId])

  const loadInternalLinks = async () => {
    if (!postId) return

    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/posts/${postId}/internal-links`)
      // const data = await response.json()

      // Mock internal link suggestions
      await new Promise(resolve => setTimeout(resolve, 1500))
      const mockSuggestions: InternalLinkSuggestion[] = [
        {
          url: '/ai-content-marketing-guide',
          title: 'AI Content Marketing: A Complete Guide',
          description: 'Learn how to leverage AI for content marketing success',
          relevance_score: 0.92,
          anchor_text_suggestions: ['AI content marketing', 'content marketing guide', 'learn more about AI marketing'],
          link_type: 'related'
        },
        {
          url: '/seo-best-practices-2024',
          title: 'SEO Best Practices for 2024',
          description: 'Stay ahead with the latest SEO strategies and techniques',
          relevance_score: 0.85,
          anchor_text_suggestions: ['SEO best practices', '2024 SEO strategies', 'SEO optimization'],
          link_type: 'supporting'
        },
        {
          url: '/content-creation-tools',
          title: 'Top Content Creation Tools for Marketers',
          description: 'Discover the best tools to streamline your content creation process',
          relevance_score: 0.78,
          anchor_text_suggestions: ['content creation tools', 'marketing tools', 'content tools'],
          link_type: 'supporting'
        },
        {
          url: '/digital-marketing-strategy',
          title: 'Digital Marketing Strategy Framework',
          description: 'Build a comprehensive digital marketing strategy from scratch',
          relevance_score: 0.72,
          anchor_text_suggestions: ['digital marketing strategy', 'marketing framework', 'strategy guide'],
          link_type: 'authoritative'
        },
        {
          url: '/blog-writing-tips',
          title: 'Professional Blog Writing Tips and Tricks',
          description: 'Master the art of blog writing with these proven techniques',
          relevance_score: 0.68,
          anchor_text_suggestions: ['blog writing tips', 'writing techniques', 'blogging guide'],
          link_type: 'authoritative'
        }
      ]

      const mockPlacements: LinkPlacement[] = [
        {
          link: mockSuggestions[0],
          paragraph_index: 2,
          paragraph_text: 'AI-powered content creation is revolutionizing how marketers approach their content strategy...',
          suggested_anchor: 'AI content marketing',
          relevance_score: 0.89
        },
        {
          link: mockSuggestions[1],
          paragraph_index: 5,
          paragraph_text: 'To ensure your content ranks well in search engines, you need to follow current SEO best practices...',
          suggested_anchor: 'SEO best practices',
          relevance_score: 0.82
        }
      ]

      setSuggestions(mockSuggestions)
      setPlacements(mockPlacements)
    } catch (err) {
      setError('Failed to load internal link suggestions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generateInternalLinks = async () => {
    if (!postId) return

    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/posts/${postId}/internal-links`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // })
      // const data = await response.json()

      // Mock generation
      await new Promise(resolve => setTimeout(resolve, 3000))
      await loadInternalLinks()
    } catch (err) {
      setError('Failed to generate internal link suggestions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLink = (link: InternalLinkSuggestion) => {
    setSelectedLink(link)
    setCustomAnchorText(link.anchor_text_suggestions[0] || '')
    setAddDialogOpen(true)
  }

  const handleConfirmAddLink = () => {
    if (selectedLink && onLinkAdd) {
      onLinkAdd(selectedLink, customAnchorText)
      setAddDialogOpen(false)
      setSelectedLink(null)
      setCustomAnchorText('')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'related': return 'primary'
      case 'supporting': return 'secondary'
      case 'authoritative': return 'success'
      default: return 'default'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'related': return 'Related'
      case 'supporting': return 'Supporting'
      case 'authoritative': return 'Authoritative'
      default: return type
    }
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'success'
    if (score >= 0.6) return 'warning'
    return 'error'
  }

  const filteredSuggestions = selectedType === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.link_type === selectedType)

  const getSummaryStats = () => {
    const relatedCount = suggestions.filter(s => s.link_type === 'related').length
    const supportingCount = suggestions.filter(s => s.link_type === 'supporting').length
    const authoritativeCount = suggestions.filter(s => s.link_type === 'authoritative').length

    return { relatedCount, supportingCount, authoritativeCount }
  }

  const stats = getSummaryStats()

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Internal Links</Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={generateInternalLinks}
          disabled={loading || !postId}
          startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
        >
          Generate
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Stats */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2">Link Suggestions</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${stats.relatedCount} Related`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`${stats.supportingCount} Supporting`}
              size="small"
              color="secondary"
              variant="outlined"
            />
            <Chip
              label={`${stats.authoritativeCount} Authoritative`}
              size="small"
              color="success"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Filter Toggle */}
        <ToggleButtonGroup
          value={selectedType}
          exclusive
          onChange={(_, value) => value && setSelectedType(value)}
          size="small"
        >
          <ToggleButton value="all">All Types</ToggleButton>
          <ToggleButton value="related">Related</ToggleButton>
          <ToggleButton value="supporting">Supporting</ToggleButton>
          <ToggleButton value="authoritative">Authoritative</ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* Link Suggestions */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {filteredSuggestions.length === 0 && !loading ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <Link sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" align="center">
              No internal link suggestions available.
              <br />
              Click "Generate" to find relevant internal links.
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredSuggestions.map((suggestion, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {suggestion.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {suggestion.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {suggestion.url}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Chip
                        label={getTypeLabel(suggestion.link_type)}
                        size="small"
                        color={getTypeColor(suggestion.link_type) as any}
                        variant="outlined"
                      />
                      <Chip
                        label={`${(suggestion.relevance_score * 100).toFixed(0)}%`}
                        size="small"
                        color={getRelevanceColor(suggestion.relevance_score) as any}
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {/* Anchor Text Suggestions */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Suggested Anchor Text:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {suggestion.anchor_text_suggestions.map((anchor, idx) => (
                        <Chip
                          key={idx}
                          label={anchor}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Tooltip title="Add to content">
                    <IconButton
                      size="small"
                      onClick={() => handleAddLink(suggestion)}
                      color="primary"
                    >
                      <Add />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            ))}
          </List>
        )}
      </Box>

      {/* Placement Suggestions */}
      {placements.length > 0 && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Placement Suggestions
          </Typography>
          <List dense>
            {placements.map((placement, index) => (
              <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {placement.link.title}
                  </Typography>
                  <Chip
                    label={`${(placement.relevance_score * 100).toFixed(0)}%`}
                    size="small"
                    color={getRelevanceColor(placement.relevance_score) as any}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Suggested anchor:</strong> {placement.suggested_anchor}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  "{placement.paragraph_text}"
                </Typography>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Add Link Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Internal Link</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {selectedLink && (
              <>
                <Typography variant="subtitle2">Target Page</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedLink.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedLink.url}
                </Typography>

                <Divider />

                <TextField
                  label="Anchor Text"
                  value={customAnchorText}
                  onChange={(e) => setCustomAnchorText(e.target.value)}
                  fullWidth
                  required
                  helperText="Text that will be displayed as the clickable link"
                />

                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Suggested anchor texts:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {selectedLink.anchor_text_suggestions.map((anchor, idx) => (
                      <Chip
                        key={idx}
                        label={anchor}
                        size="small"
                        variant="outlined"
                        onClick={() => setCustomAnchorText(anchor)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmAddLink}
            variant="contained"
            disabled={!customAnchorText.trim()}
          >
            Add Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
