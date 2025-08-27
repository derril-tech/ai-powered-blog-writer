'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, TextField, Button, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress, Paper,
  Divider, Menu, MenuItem, FormControl, InputLabel, Select,
  ToggleButton, ToggleButtonGroup, Badge,
} from '@mui/material'
import {
  Send, Reply, Edit, Delete, Flag, MoreVert, ThumbUp, ThumbDown,
  Visibility, VisibilityOff, Check, Close, Notifications, NotificationsOff,
} from '@mui/icons-material'

interface Comment {
  id: string
  post_id: string
  author_name: string
  author_email: string
  author_avatar?: string
  content: string
  parent_id?: string
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  likes: number
  dislikes: number
  created_at: string
  updated_at: string
  replies?: Comment[]
  is_author: boolean
  is_moderated: boolean
}

interface CommentsProps {
  postId?: string
  onCommentAdd?: (comment: Partial<Comment>) => Promise<void>
  onCommentUpdate?: (commentId: string, content: string) => Promise<void>
  onCommentDelete?: (commentId: string) => Promise<void>
  onCommentModerate?: (commentId: string, status: string) => Promise<void>
}

export default function Comments({
  postId, onCommentAdd, onCommentUpdate, onCommentDelete, onCommentModerate
}: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [editComment, setEditComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest')
  const [showModerated, setShowModerated] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedComment, setSelectedComment] = useState<string | null>(null)

  useEffect(() => {
    if (postId) {
      loadComments()
    }
  }, [postId, filter, sortBy])

  const loadComments = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock comments data
      const mockComments: Comment[] = [
        {
          id: '1',
          post_id: postId!,
          author_name: 'John Doe',
          author_email: 'john@example.com',
          author_avatar: 'https://via.placeholder.com/40',
          content: 'Great article! Very informative and well-written.',
          status: 'approved',
          likes: 5,
          dislikes: 0,
          created_at: '2024-01-25T10:30:00Z',
          updated_at: '2024-01-25T10:30:00Z',
          is_author: false,
          is_moderated: false,
          replies: [
            {
              id: '1-1',
              post_id: postId!,
              author_name: 'Jane Smith',
              author_email: 'jane@example.com',
              content: 'I agree! The examples were particularly helpful.',
              parent_id: '1',
              status: 'approved',
              likes: 2,
              dislikes: 0,
              created_at: '2024-01-25T11:00:00Z',
              updated_at: '2024-01-25T11:00:00Z',
              is_author: false,
              is_moderated: false,
            }
          ]
        },
        {
          id: '2',
          post_id: postId!,
          author_name: 'Bob Wilson',
          author_email: 'bob@example.com',
          content: 'This needs more technical details.',
          status: 'pending',
          likes: 1,
          dislikes: 2,
          created_at: '2024-01-26T09:15:00Z',
          updated_at: '2024-01-26T09:15:00Z',
          is_author: false,
          is_moderated: true,
        },
        {
          id: '3',
          post_id: postId!,
          author_name: 'Spam Bot',
          author_email: 'spam@bot.com',
          content: 'Buy cheap viagra now!',
          status: 'spam',
          likes: 0,
          dislikes: 10,
          created_at: '2024-01-26T15:45:00Z',
          updated_at: '2024-01-26T15:45:00Z',
          is_author: false,
          is_moderated: true,
        }
      ]
      
      // Filter comments
      let filteredComments = mockComments
      if (filter !== 'all') {
        filteredComments = mockComments.filter(comment => comment.status === filter)
      }
      
      // Sort comments
      filteredComments.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          case 'popular':
            return (b.likes - b.dislikes) - (a.likes - a.dislikes)
          default:
            return 0
        }
      })
      
      setComments(filteredComments)
    } catch (err) {
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !onCommentAdd) return
    
    setLoading(true)
    try {
      await onCommentAdd({
        post_id: postId!,
        content: newComment,
        parent_id: replyTo || undefined
      })
      setNewComment('')
      setReplyTo(null)
      await loadComments()
    } catch (err) {
      setError('Failed to add comment')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateComment = async () => {
    if (!editComment || !editContent.trim() || !onCommentUpdate) return
    
    setLoading(true)
    try {
      await onCommentUpdate(editComment, editContent)
      setEditComment(null)
      setEditContent('')
      await loadComments()
    } catch (err) {
      setError('Failed to update comment')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!onCommentDelete) return
    
    setLoading(true)
    try {
      await onCommentDelete(commentId)
      await loadComments()
    } catch (err) {
      setError('Failed to delete comment')
    } finally {
      setLoading(false)
    }
  }

  const handleModerateComment = async (commentId: string, status: string) => {
    if (!onCommentModerate) return
    
    setLoading(true)
    try {
      await onCommentModerate(commentId, status)
      await loadComments()
    } catch (err) {
      setError('Failed to moderate comment')
    } finally {
      setLoading(false)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, commentId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedComment(commentId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedComment(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'pending': return 'warning'
      case 'rejected': return 'error'
      case 'spam': return 'error'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved'
      case 'pending': return 'Pending'
      case 'rejected': return 'Rejected'
      case 'spam': return 'Spam'
      default: return status
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

  const renderComment = (comment: Comment, level: number = 0) => (
    <Box key={comment.id} sx={{ ml: level * 3 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={comment.author_avatar} sx={{ width: 32, height: 32 }}>
              {comment.author_name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2">{comment.author_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(comment.created_at)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={getStatusLabel(comment.status)}
              size="small"
              color={getStatusColor(comment.status) as any}
              variant="outlined"
            />
            {comment.is_moderated && (
              <Chip label="Moderated" size="small" color="warning" variant="outlined" />
            )}
            <IconButton size="small" onClick={(e) => handleMenuOpen(e, comment.id)}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
        
        {editComment === comment.id ? (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your comment..."
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button size="small" onClick={() => setEditComment(null)}>Cancel</Button>
              <Button size="small" variant="contained" onClick={handleUpdateComment}>Save</Button>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {comment.content}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small">
              <ThumbUp fontSize="small" />
            </IconButton>
            <Typography variant="caption">{comment.likes}</Typography>
            <IconButton size="small">
              <ThumbDown fontSize="small" />
            </IconButton>
            <Typography variant="caption">{comment.dislikes}</Typography>
          </Box>
          
          <Button
            size="small"
            startIcon={<Reply />}
            onClick={() => setReplyTo(comment.id)}
          >
            Reply
          </Button>
          
          {comment.is_author && (
            <Button
              size="small"
              startIcon={<Edit />}
              onClick={() => {
                setEditComment(comment.id)
                setEditContent(comment.content)
              }}
            >
              Edit
            </Button>
          )}
        </Box>
        
        {/* Reply form */}
        {replyTo === comment.id && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a reply..."
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={() => setReplyTo(null)}>Cancel</Button>
              <Button size="small" variant="contained" onClick={handleAddComment}>Reply</Button>
            </Box>
          </Box>
        )}
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {comment.replies.map(reply => renderComment(reply, level + 1))}
          </Box>
        )}
      </Paper>
    </Box>
  )

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Comments
          <Badge badgeContent={comments.length} color="primary" sx={{ ml: 1 }} />
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, value) => value && setFilter(value)}
            size="small"
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="pending">Pending</ToggleButton>
            <ToggleButton value="approved">Approved</ToggleButton>
            <ToggleButton value="rejected">Rejected</ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              label="Sort"
            >
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="oldest">Oldest</MenuItem>
              <MenuItem value="popular">Popular</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* New Comment Form */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Add a Comment</Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write your comment..."
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={loading || !newComment.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <Send />}
          >
            Post Comment
          </Button>
        </Box>
      </Paper>

      {/* Comments List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : comments.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No comments yet. Be the first to comment!
            </Typography>
          </Box>
        ) : (
          <List>
            {comments.map(comment => renderComment(comment))}
          </List>
        )}
      </Box>

      {/* Comment Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedComment) {
            handleModerateComment(selectedComment, 'approved')
          }
          handleMenuClose()
        }}>
          <Check sx={{ mr: 1 }} /> Approve
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedComment) {
            handleModerateComment(selectedComment, 'rejected')
          }
          handleMenuClose()
        }}>
          <Close sx={{ mr: 1 }} /> Reject
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedComment) {
            handleModerateComment(selectedComment, 'spam')
          }
          handleMenuClose()
        }}>
          <Flag sx={{ mr: 1 }} /> Mark as Spam
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          if (selectedComment) {
            handleDeleteComment(selectedComment)
          }
          handleMenuClose()
        }}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  )
}
