'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Alert, CircularProgress, Paper, Divider, FormControl, InputLabel,
  Select, MenuItem, Tooltip, Badge, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material'
import {
  History, RestoreFromTrash, Visibility, Compare, Download, Delete,
  ExpandMore, Edit, Save, Undo, Redo, ContentCopy,
} from '@mui/icons-material'

interface Version {
  id: string
  post_id: string
  version_number: number
  title: string
  content: string
  meta_description: string
  target_keyword: string
  slug: string
  author_id: string
  author_name: string
  change_summary: string
  change_type: 'major' | 'minor' | 'draft' | 'published'
  created_at: string
  word_count: number
  is_current: boolean
}

interface VersionDiff {
  title_diff: string
  content_diff: string
  meta_diff: string
  added_words: number
  removed_words: number
  changed_sections: string[]
}

interface VersionsProps {
  postId?: string
  onVersionRestore?: (versionId: string) => Promise<void>
  onVersionCompare?: (version1Id: string, version2Id: string) => Promise<VersionDiff>
  onVersionDownload?: (versionId: string) => Promise<void>
}

export default function Versions({
  postId, onVersionRestore, onVersionCompare, onVersionDownload
}: VersionsProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [compareDialogOpen, setCompareDialogOpen] = useState(false)
  const [diffDialogOpen, setDiffDialogOpen] = useState(false)
  const [version1, setVersion1] = useState<string>('')
  const [version2, setVersion2] = useState<string>('')
  const [diffResult, setDiffResult] = useState<VersionDiff | null>(null)
  const [filter, setFilter] = useState<'all' | 'major' | 'minor' | 'draft' | 'published'>('all')

  useEffect(() => {
    if (postId) {
      loadVersions()
    }
  }, [postId, filter])

  const loadVersions = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock versions data
      const mockVersions: Version[] = [
        {
          id: 'v1',
          post_id: postId!,
          version_number: 1,
          title: 'Original Post Title',
          content: 'This is the original content of the post...',
          meta_description: 'Original meta description',
          target_keyword: 'original keyword',
          slug: 'original-post',
          author_id: 'user1',
          author_name: 'John Doe',
          change_summary: 'Initial version',
          change_type: 'published',
          created_at: '2024-01-20T10:00:00Z',
          word_count: 500,
          is_current: false,
        },
        {
          id: 'v2',
          post_id: postId!,
          version_number: 2,
          title: 'Updated Post Title',
          content: 'This is the updated content with more details and examples...',
          meta_description: 'Updated meta description with better SEO',
          target_keyword: 'updated keyword',
          slug: 'updated-post',
          author_id: 'user1',
          author_name: 'John Doe',
          change_summary: 'Added more examples and improved SEO',
          change_type: 'major',
          created_at: '2024-01-22T14:30:00Z',
          word_count: 800,
          is_current: false,
        },
        {
          id: 'v3',
          post_id: postId!,
          version_number: 3,
          title: 'Updated Post Title',
          content: 'This is the updated content with more details and examples. Fixed some typos and improved readability...',
          meta_description: 'Updated meta description with better SEO',
          target_keyword: 'updated keyword',
          slug: 'updated-post',
          author_id: 'user1',
          author_name: 'John Doe',
          change_summary: 'Fixed typos and improved readability',
          change_type: 'minor',
          created_at: '2024-01-24T09:15:00Z',
          word_count: 820,
          is_current: true,
        },
        {
          id: 'v4',
          post_id: postId!,
          version_number: 4,
          title: 'Draft: New Post Title',
          content: 'This is a draft version with major changes...',
          meta_description: 'Draft meta description',
          target_keyword: 'draft keyword',
          slug: 'draft-post',
          author_id: 'user1',
          author_name: 'John Doe',
          change_summary: 'Draft version with major restructuring',
          change_type: 'draft',
          created_at: '2024-01-26T16:45:00Z',
          word_count: 1200,
          is_current: false,
        }
      ]
      
      // Filter versions
      let filteredVersions = mockVersions
      if (filter !== 'all') {
        filteredVersions = mockVersions.filter(version => version.change_type === filter)
      }
      
      // Sort by version number (newest first)
      filteredVersions.sort((a, b) => b.version_number - a.version_number)
      
      setVersions(filteredVersions)
    } catch (err) {
      setError('Failed to load versions')
    } finally {
      setLoading(false)
    }
  }

  const handleVersionRestore = async (versionId: string) => {
    if (!onVersionRestore) return
    
    setLoading(true)
    try {
      await onVersionRestore(versionId)
      await loadVersions()
    } catch (err) {
      setError('Failed to restore version')
    } finally {
      setLoading(false)
    }
  }

  const handleVersionCompare = async () => {
    if (!version1 || !version2 || !onVersionCompare) return
    
    setLoading(true)
    try {
      const diff = await onVersionCompare(version1, version2)
      setDiffResult(diff)
      setDiffDialogOpen(true)
    } catch (err) {
      setError('Failed to compare versions')
    } finally {
      setLoading(false)
    }
  }

  const handleVersionDownload = async (versionId: string) => {
    if (!onVersionDownload) return
    
    setLoading(true)
    try {
      await onVersionDownload(versionId)
    } catch (err) {
      setError('Failed to download version')
    } finally {
      setLoading(false)
    }
  }

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'major': return 'error'
      case 'minor': return 'warning'
      case 'draft': return 'info'
      case 'published': return 'success'
      default: return 'default'
    }
  }

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'major': return 'Major'
      case 'minor': return 'Minor'
      case 'draft': return 'Draft'
      case 'published': return 'Published'
      default: return changeType
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderDiffContent = (diff: string) => {
    // Simple diff rendering - in production, use a proper diff library
    return (
      <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
        {diff.split('\n').map((line, index) => {
          if (line.startsWith('+')) {
            return <Box key={index} sx={{ color: 'success.main', bgcolor: 'success.light', p: 0.5 }}>{line}</Box>
          } else if (line.startsWith('-')) {
            return <Box key={index} sx={{ color: 'error.main', bgcolor: 'error.light', p: 0.5 }}>{line}</Box>
          } else {
            return <Box key={index} sx={{ p: 0.5 }}>{line}</Box>
          }
        })}
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Version History
          <Badge badgeContent={versions.length} color="primary" sx={{ ml: 1 }} />
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              label="Filter"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="major">Major</MenuItem>
              <MenuItem value="minor">Minor</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="published">Published</MenuItem>
            </Select>
          </FormControl>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setCompareDialogOpen(true)}
            startIcon={<Compare />}
          >
            Compare
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Versions List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : versions.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No versions found
            </Typography>
          </Box>
        ) : (
          <List>
            {versions.map((version) => (
              <Accordion key={version.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <History color="action" />
                      <Typography variant="subtitle2">
                        v{version.version_number}
                      </Typography>
                    </Box>
                    <Chip
                      label={getChangeTypeLabel(version.change_type)}
                      size="small"
                      color={getChangeTypeColor(version.change_type) as any}
                      variant="outlined"
                    />
                    {version.is_current && (
                      <Chip label="Current" size="small" color="primary" />
                    )}
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {version.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(version.created_at)}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Change Summary:</strong> {version.change_summary}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Author:</strong> {version.author_name}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Word Count:</strong> {version.word_count.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Target Keyword:</strong> {version.target_keyword}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Version">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedVersion(version)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={() => handleVersionDownload(version.id)}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                      {!version.is_current && (
                        <Tooltip title="Restore Version">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleVersionRestore(version.id)}
                          >
                            <RestoreFromTrash />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </List>
        )}
      </Box>

      {/* Version Preview Dialog */}
      <Dialog
        open={Boolean(selectedVersion)}
        onClose={() => setSelectedVersion(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedVersion && (
          <>
            <DialogTitle>
              Version {selectedVersion.version_number} - {selectedVersion.title}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Meta Description</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {selectedVersion.meta_description}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>Content</Typography>
                <Box sx={{ 
                  maxHeight: 400, 
                  overflow: 'auto', 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}>
                  {selectedVersion.content}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedVersion(null)}>Close</Button>
              <Button
                variant="contained"
                onClick={() => handleVersionDownload(selectedVersion.id)}
                startIcon={<Download />}
              >
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Compare Versions Dialog */}
      <Dialog
        open={compareDialogOpen}
        onClose={() => setCompareDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Compare Versions</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Version 1 (Older)</InputLabel>
              <Select
                value={version1}
                onChange={(e) => setVersion1(e.target.value)}
                label="Version 1 (Older)"
              >
                {versions.map((version) => (
                  <MenuItem key={version.id} value={version.id}>
                    v{version.version_number} - {version.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Version 2 (Newer)</InputLabel>
              <Select
                value={version2}
                onChange={(e) => setVersion2(e.target.value)}
                label="Version 2 (Newer)"
              >
                {versions.map((version) => (
                  <MenuItem key={version.id} value={version.id}>
                    v{version.version_number} - {version.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleVersionCompare}
            disabled={!version1 || !version2 || version1 === version2}
          >
            Compare
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diff Results Dialog */}
      <Dialog
        open={diffDialogOpen}
        onClose={() => setDiffDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Version Comparison</DialogTitle>
        <DialogContent>
          {diffResult && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Summary</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip label={`+${diffResult.added_words} words`} color="success" size="small" />
                  <Chip label={`-${diffResult.removed_words} words`} color="error" size="small" />
                  <Chip label={`${diffResult.changed_sections.length} sections changed`} color="info" size="small" />
                </Box>
              </Box>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Title Changes</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {renderDiffContent(diffResult.title_diff)}
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Content Changes</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {renderDiffContent(diffResult.content_diff)}
                  </Box>
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Meta Description Changes</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {renderDiffContent(diffResult.meta_diff)}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiffDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
