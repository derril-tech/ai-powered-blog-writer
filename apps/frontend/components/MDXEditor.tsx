'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material'
import {
  FormatBold,
  FormatItalic,
  FormatUnderline,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Code,
  Link,
  Image,
  Save,
  Refresh,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material'

interface MDXEditorProps {
  postId?: string
  content?: string
  onContentChange?: (content: string) => void
  onSave?: (content: string) => Promise<void>
  readOnly?: boolean
}

export default function MDXEditor({ 
  postId, 
  content: initialContent = '', 
  onContentChange, 
  onSave,
  readOnly = false 
}: MDXEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setContent(initialContent)
  }, [initialContent])

  useEffect(() => {
    updateCounts(content)
  }, [content])

  const updateCounts = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length
    setWordCount(words)
    setCharCount(text.length)
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    onContentChange?.(newContent)
  }

  const handleSave = async () => {
    if (!onSave) return

    setSaving(true)
    setError('')

    try {
      await onSave(content)
    } catch (err) {
      setError('Failed to save content')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const generateContent = async () => {
    if (!postId) return

    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/posts/${postId}/draft`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // })
      // const data = await response.json()

      // Mock generation
      await new Promise(resolve => setTimeout(resolve, 3000))
      const generatedContent = `# AI-Powered Blog Writing: A Complete Guide

In today's digital landscape, content creation has become more important than ever. With the rise of AI technology, we're seeing a revolution in how we approach blog writing. This comprehensive guide will walk you through everything you need to know about AI-powered blog writing.

## What is AI Blog Writing?

AI blog writing refers to the use of artificial intelligence tools and technologies to assist in the creation of blog content. These tools can help with everything from research and outline generation to full content creation and optimization.

### Key Benefits

- **Time Efficiency**: AI can significantly reduce the time needed to create high-quality content
- **Consistency**: Maintain consistent tone and style across all your content
- **SEO Optimization**: Built-in SEO features help improve search engine rankings
- **Scalability**: Create more content without proportionally increasing resources

## How AI Blog Writing Works

The process typically involves several key steps:

1. **Keyword Research**: AI tools analyze search trends and competition
2. **Outline Generation**: Create structured content outlines based on research
3. **Content Creation**: Generate initial drafts using AI models
4. **Human Review**: Writers review and refine the AI-generated content
5. **Optimization**: Final SEO and readability optimizations

### Best Practices

> "The key to successful AI blog writing is finding the right balance between automation and human creativity."

When using AI for blog writing, consider these best practices:

- **Start with clear objectives**: Define your content goals and target audience
- **Use AI as a tool, not a replacement**: Human creativity and insight remain essential
- **Review and edit**: Always review AI-generated content before publishing
- **Maintain your voice**: Ensure the content reflects your brand's unique voice

## Advanced Techniques

### Content Clustering

Group related topics together to create comprehensive content clusters that cover all aspects of a subject.

### Personalization

Use AI to personalize content based on user behavior and preferences.

### A/B Testing

Leverage AI to test different content variations and optimize for engagement.

## Conclusion

AI-powered blog writing represents the future of content creation. By combining the efficiency of AI with human creativity and insight, you can create better content faster than ever before.

The key is to view AI as a powerful tool that enhances your writing process, not as a replacement for human creativity and judgment.`

      handleContentChange(generatedContent)
    } catch (err) {
      setError('Failed to generate content')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const insertText = (text: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    let insertText = text
    if (selectedText) {
      // Handle different formatting based on selection
      if (text === '**') {
        insertText = `**${selectedText}**`
      } else if (text === '*') {
        insertText = `*${selectedText}*`
      } else if (text === '`') {
        insertText = `\`${selectedText}\``
      } else if (text === '> ') {
        insertText = `> ${selectedText}`
      } else if (text === '- ') {
        insertText = `- ${selectedText}`
      } else if (text === '1. ') {
        insertText = `1. ${selectedText}`
      }
    }

    const newContent = content.substring(0, start) + insertText + content.substring(end)
    handleContentChange(newContent)

    // Set cursor position after inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = start + insertText.length
        textareaRef.current.setSelectionRange(newPosition, newPosition)
        textareaRef.current.focus()
      }
    }, 0)
  }

  const renderPreview = () => {
    // Simple markdown to HTML conversion (basic implementation)
    let html = content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^1\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '<br><br>')

    return (
      <Box
        sx={{
          p: 2,
          height: '100%',
          overflow: 'auto',
          '& h1': { fontSize: '2rem', fontWeight: 'bold', mb: 2 },
          '& h2': { fontSize: '1.5rem', fontWeight: 'bold', mb: 1.5 },
          '& h3': { fontSize: '1.25rem', fontWeight: 'bold', mb: 1 },
          '& p': { mb: 1 },
          '& blockquote': { 
            borderLeft: '4px solid #ccc', 
            pl: 2, 
            ml: 0, 
            fontStyle: 'italic',
            color: 'text.secondary'
          },
          '& code': { 
            backgroundColor: 'grey.100', 
            px: 0.5, 
            borderRadius: 1,
            fontFamily: 'monospace'
          },
          '& li': { mb: 0.5 }
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Content Editor</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label={`${wordCount} words`} size="small" variant="outlined" />
          <Chip label={`${charCount} chars`} size="small" variant="outlined" />
          <ToggleButton
            value="preview"
            selected={isPreview}
            onChange={() => setIsPreview(!isPreview)}
            size="small"
          >
            {isPreview ? <VisibilityOff /> : <Visibility />}
          </ToggleButton>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Toolbar */}
      {!readOnly && !isPreview && (
        <Paper sx={{ p: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <ToggleButtonGroup size="small">
              <Tooltip title="Bold">
                <ToggleButton value="bold" onClick={() => insertText('**')}>
                  <FormatBold />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Italic">
                <ToggleButton value="italic" onClick={() => insertText('*')}>
                  <FormatItalic />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Code">
                <ToggleButton value="code" onClick={() => insertText('`')}>
                  <Code />
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>

            <Divider orientation="vertical" flexItem />

            <ToggleButtonGroup size="small">
              <Tooltip title="Bullet List">
                <ToggleButton value="bullet" onClick={() => insertText('- ')}>
                  <FormatListBulleted />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Numbered List">
                <ToggleButton value="numbered" onClick={() => insertText('1. ')}>
                  <FormatListNumbered />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Quote">
                <ToggleButton value="quote" onClick={() => insertText('> ')}>
                  <FormatQuote />
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>

            <Divider orientation="vertical" flexItem />

            <Button
              size="small"
              variant="outlined"
              onClick={generateContent}
              disabled={loading || !postId}
              startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            >
              Generate
            </Button>

            {onSave && (
              <Button
                size="small"
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : <Save />}
              >
                Save
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Editor/Preview */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {isPreview ? (
          renderPreview()
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            disabled={readOnly}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              resize: 'none',
              padding: '16px',
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: 'inherit',
              backgroundColor: 'transparent',
            }}
            placeholder="Start writing your content here... Use markdown formatting for rich text."
          />
        )}
      </Box>
    </Box>
  )
}
