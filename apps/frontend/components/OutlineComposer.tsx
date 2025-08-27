'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
} from '@mui/material'
import { 
  Add, 
  Edit, 
  Delete, 
  ExpandMore, 
  ContentCopy,
  Save,
  Refresh 
} from '@mui/icons-material'

interface OutlineSection {
  level: number
  title: string
  wordCount: number
  content?: string
}

interface OutlineComposerProps {
  postId?: string
  onOutlineChange?: (outline: OutlineSection[]) => void
}

export default function OutlineComposer({ postId, onOutlineChange }: OutlineComposerProps) {
  const [outline, setOutline] = useState<OutlineSection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<OutlineSection | null>(null)
  const [editIndex, setEditIndex] = useState(-1)

  useEffect(() => {
    if (postId) {
      loadOutline()
    }
  }, [postId])

  const loadOutline = async () => {
    if (!postId) return

    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/posts/${postId}/outline`)
      // const data = await response.json()

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      const mockOutline: OutlineSection[] = [
        { level: 1, title: 'Introduction', wordCount: 150, content: 'Overview of the topic and what readers will learn' },
        { level: 2, title: 'What is AI Blog Writing?', wordCount: 300, content: 'Definition and explanation of AI-powered content creation' },
        { level: 3, title: 'Key Components', wordCount: 200, content: 'Main elements of AI blog writing tools' },
        { level: 2, title: 'Benefits of AI Blog Writing', wordCount: 400, content: 'Advantages and improvements over traditional methods' },
        { level: 3, title: 'Time Savings', wordCount: 150, content: 'How AI reduces writing time' },
        { level: 3, title: 'Quality Improvements', wordCount: 150, content: 'Enhanced content quality and consistency' },
        { level: 2, title: 'Best Practices', wordCount: 350, content: 'Guidelines for effective AI blog writing' },
        { level: 1, title: 'Conclusion', wordCount: 150, content: 'Summary and next steps' },
      ]

      setOutline(mockOutline)
      onOutlineChange?.(mockOutline)
    } catch (err) {
      setError('Failed to load outline')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generateOutline = async () => {
    if (!postId) return

    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/posts/${postId}/outline`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // })
      // const data = await response.json()

      // Mock generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      const generatedOutline: OutlineSection[] = [
        { level: 1, title: 'Introduction', wordCount: 150, content: 'Overview of the topic and what readers will learn' },
        { level: 2, title: 'Understanding the Basics', wordCount: 300, content: 'Fundamental concepts and definitions' },
        { level: 2, title: 'Advanced Techniques', wordCount: 400, content: 'Sophisticated approaches and strategies' },
        { level: 3, title: 'Implementation Steps', wordCount: 250, content: 'Step-by-step guide for implementation' },
        { level: 2, title: 'Common Challenges', wordCount: 300, content: 'Potential issues and solutions' },
        { level: 1, title: 'Conclusion', wordCount: 150, content: 'Summary and next steps' },
      ]

      setOutline(generatedOutline)
      onOutlineChange?.(generatedOutline)
    } catch (err) {
      setError('Failed to generate outline')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSection = () => {
    setEditingSection({
      level: 2,
      title: '',
      wordCount: 0,
      content: ''
    })
    setEditIndex(-1)
    setEditDialogOpen(true)
  }

  const handleEditSection = (section: OutlineSection, index: number) => {
    setEditingSection({ ...section })
    setEditIndex(index)
    setEditDialogOpen(true)
  }

  const handleDeleteSection = (index: number) => {
    const newOutline = outline.filter((_, i) => i !== index)
    setOutline(newOutline)
    onOutlineChange?.(newOutline)
  }

  const handleSaveSection = () => {
    if (!editingSection || !editingSection.title.trim()) return

    const newOutline = [...outline]
    
    if (editIndex >= 0) {
      // Edit existing section
      newOutline[editIndex] = editingSection
    } else {
      // Add new section
      newOutline.push(editingSection)
    }

    setOutline(newOutline)
    onOutlineChange?.(newOutline)
    setEditDialogOpen(false)
    setEditingSection(null)
    setEditIndex(-1)
  }

  const handleSectionChange = (field: keyof OutlineSection, value: any) => {
    if (!editingSection) return
    setEditingSection({ ...editingSection, [field]: value })
  }

  const getTotalWords = () => {
    return outline.reduce((total, section) => total + section.wordCount, 0)
  }

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'primary'
      case 2: return 'secondary'
      case 3: return 'default'
      default: return 'default'
    }
  }

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'H1'
      case 2: return 'H2'
      case 3: return 'H3'
      default: return `H${level}`
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Content Outline</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={generateOutline}
            disabled={loading || !postId}
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
          >
            Generate
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleAddSection}
            startIcon={<Add />}
          >
            Add Section
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Outline Stats */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Total Sections: {outline.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Words: {getTotalWords().toLocaleString()}
          </Typography>
        </Box>
      </Paper>

      {/* Outline List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {outline.length === 0 && !loading ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <ContentCopy sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" align="center">
              No outline sections yet.
              <br />
              Click "Generate" to create an AI-powered outline or "Add Section" to build manually.
            </Typography>
          </Box>
        ) : (
          <List dense>
            {outline.map((section, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip
                      label={getLevelLabel(section.level)}
                      size="small"
                      color={getLevelColor(section.level) as any}
                      variant="outlined"
                    />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {section.title}
                    </Typography>
                    <Chip
                      label={`${section.wordCount} words`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    {section.content && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {section.content}
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditSection(section, index)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteSection(index)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </List>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editIndex >= 0 ? 'Edit Section' : 'Add Section'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Heading Level"
              type="number"
              value={editingSection?.level || 2}
              onChange={(e) => handleSectionChange('level', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 6 }}
              fullWidth
            />
            
            <TextField
              label="Title"
              value={editingSection?.title || ''}
              onChange={(e) => handleSectionChange('title', e.target.value)}
              fullWidth
              required
            />
            
            <TextField
              label="Word Count"
              type="number"
              value={editingSection?.wordCount || 0}
              onChange={(e) => handleSectionChange('wordCount', parseInt(e.target.value))}
              inputProps={{ min: 0 }}
              fullWidth
            />
            
            <TextField
              label="Description (Optional)"
              value={editingSection?.content || ''}
              onChange={(e) => handleSectionChange('content', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveSection} 
            variant="contained"
            disabled={!editingSection?.title?.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
