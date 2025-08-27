'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  Paper, Divider, FormControl, InputLabel, Select, MenuItem, TextField,
  ToggleButton, ToggleButtonGroup, Badge, Tooltip, Avatar, List, ListItem,
  ListItemText, ListItemAvatar, Accordion, AccordionSummary, AccordionDetails,
  DragIndicator, CalendarToday, ViewKanban, Add, Edit, Delete, Schedule,
  FilterList, Search, Today, Event, Assignment,
} from '@mui/material'
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from '@hello-pangea/dnd'

interface ContentItem {
  id: string
  title: string
  status: 'draft' | 'in_progress' | 'review' | 'scheduled' | 'published'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee: string
  assignee_avatar?: string
  target_keyword: string
  word_count: number
  due_date: string
  created_at: string
  updated_at: string
  tags: string[]
  description: string
}

interface ContentCalendarProps {
  onItemCreate?: (item: Partial<ContentItem>) => Promise<void>
  onItemUpdate?: (itemId: string, updates: Partial<ContentItem>) => Promise<void>
  onItemDelete?: (itemId: string) => Promise<void>
  onStatusChange?: (itemId: string, newStatus: string) => Promise<void>
}

export default function ContentCalendar({
  onItemCreate, onItemUpdate, onItemDelete, onStatusChange
}: ContentCalendarProps) {
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'kanban' | 'calendar'>('kanban')
  const [filter, setFilter] = useState<'all' | 'draft' | 'in_progress' | 'review' | 'scheduled' | 'published'>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [newItem, setNewItem] = useState<Partial<ContentItem>>({
    title: '',
    status: 'draft',
    priority: 'medium',
    assignee: '',
    target_keyword: '',
    word_count: 0,
    due_date: '',
    description: '',
    tags: []
  })

  const statusColumns = [
    { id: 'draft', title: 'Draft', color: 'default' },
    { id: 'in_progress', title: 'In Progress', color: 'primary' },
    { id: 'review', title: 'Review', color: 'warning' },
    { id: 'scheduled', title: 'Scheduled', color: 'info' },
    { id: 'published', title: 'Published', color: 'success' }
  ]

  useEffect(() => {
    loadContentItems()
  }, [])

  const loadContentItems = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock content items data
      const mockItems: ContentItem[] = [
        {
          id: '1',
          title: 'Complete Guide to AI Content Creation',
          status: 'draft',
          priority: 'high',
          assignee: 'John Doe',
          assignee_avatar: 'https://via.placeholder.com/32',
          target_keyword: 'AI content creation',
          word_count: 0,
          due_date: '2024-02-15',
          created_at: '2024-01-25T10:00:00Z',
          updated_at: '2024-01-25T10:00:00Z',
          tags: ['AI', 'content', 'guide'],
          description: 'A comprehensive guide to using AI for content creation'
        },
        {
          id: '2',
          title: 'SEO Best Practices for 2024',
          status: 'in_progress',
          priority: 'urgent',
          assignee: 'Jane Smith',
          assignee_avatar: 'https://via.placeholder.com/32',
          target_keyword: 'SEO best practices',
          word_count: 1200,
          due_date: '2024-02-10',
          created_at: '2024-01-24T14:30:00Z',
          updated_at: '2024-01-26T09:15:00Z',
          tags: ['SEO', '2024', 'best practices'],
          description: 'Updated SEO strategies for the current year'
        },
        {
          id: '3',
          title: 'How to Write Engaging Blog Posts',
          status: 'review',
          priority: 'medium',
          assignee: 'Bob Wilson',
          assignee_avatar: 'https://via.placeholder.com/32',
          target_keyword: 'blog writing tips',
          word_count: 800,
          due_date: '2024-02-12',
          created_at: '2024-01-23T11:20:00Z',
          updated_at: '2024-01-25T16:45:00Z',
          tags: ['blogging', 'writing', 'tips'],
          description: 'Tips and techniques for writing engaging blog content'
        },
        {
          id: '4',
          title: 'Content Marketing Strategy Guide',
          status: 'scheduled',
          priority: 'high',
          assignee: 'Alice Johnson',
          assignee_avatar: 'https://via.placeholder.com/32',
          target_keyword: 'content marketing strategy',
          word_count: 1500,
          due_date: '2024-02-20',
          created_at: '2024-01-22T08:45:00Z',
          updated_at: '2024-01-26T10:30:00Z',
          tags: ['marketing', 'strategy', 'content'],
          description: 'Strategic approach to content marketing'
        },
        {
          id: '5',
          title: 'Social Media Content Calendar',
          status: 'published',
          priority: 'low',
          assignee: 'Charlie Brown',
          assignee_avatar: 'https://via.placeholder.com/32',
          target_keyword: 'social media calendar',
          word_count: 600,
          due_date: '2024-01-30',
          created_at: '2024-01-20T13:15:00Z',
          updated_at: '2024-01-28T14:20:00Z',
          tags: ['social media', 'calendar', 'planning'],
          description: 'How to create and maintain a social media content calendar'
        }
      ]
      
      setContentItems(mockItems)
    } catch (err) {
      setError('Failed to load content items')
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !onStatusChange) return

    const { source, destination, draggableId } = result
    const newStatus = destination.droppableId

    setLoading(true)
    try {
      await onStatusChange(draggableId, newStatus)
      await loadContentItems()
    } catch (err) {
      setError('Failed to update item status')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async () => {
    if (!onItemCreate) return
    
    setLoading(true)
    try {
      await onItemCreate(newItem)
      setCreateDialogOpen(false)
      setNewItem({
        title: '',
        status: 'draft',
        priority: 'medium',
        assignee: '',
        target_keyword: '',
        word_count: 0,
        due_date: '',
        description: '',
        tags: []
      })
      await loadContentItems()
    } catch (err) {
      setError('Failed to create item')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateItem = async () => {
    if (!selectedItem || !onItemUpdate) return
    
    setLoading(true)
    try {
      await onItemUpdate(selectedItem.id, selectedItem)
      setEditDialogOpen(false)
      setSelectedItem(null)
      await loadContentItems()
    } catch (err) {
      setError('Failed to update item')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!onItemDelete) return
    
    setLoading(true)
    try {
      await onItemDelete(itemId)
      await loadContentItems()
    } catch (err) {
      setError('Failed to delete item')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'default'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default'
      case 'in_progress': return 'primary'
      case 'review': return 'warning'
      case 'scheduled': return 'info'
      case 'published': return 'success'
      default: return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getFilteredItems = () => {
    let filtered = contentItems

    if (filter !== 'all') {
      filtered = filtered.filter(item => item.status === filter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter)
    }

    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(item => item.assignee === assigneeFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.target_keyword.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }

  const renderKanbanView = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Grid container spacing={2}>
        {statusColumns.map((column) => {
          const columnItems = getFilteredItems().filter(item => item.status === column.id)
          
          return (
            <Grid item xs={12} md={2.4} key={column.id}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {column.title}
                    <Badge badgeContent={columnItems.length} color="primary" sx={{ ml: 1 }} />
                  </Typography>
                  <Chip
                    label={column.title}
                    size="small"
                    color={column.color as any}
                    variant="outlined"
                  />
                </Box>
                
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ minHeight: 200 }}
                    >
                      {columnItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              sx={{ mb: 2, cursor: 'grab' }}
                            >
                              <CardContent sx={{ p: 2 }}>
                                <Box {...provided.dragHandleProps} sx={{ mb: 1 }}>
                                  <DragIndicator color="action" />
                                </Box>
                                
                                <Typography variant="subtitle2" gutterBottom>
                                  {item.title}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Avatar src={item.assignee_avatar} sx={{ width: 24, height: 24 }}>
                                    {item.assignee.charAt(0)}
                                  </Avatar>
                                  <Typography variant="caption">{item.assignee}</Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                  <Chip
                                    label={item.priority}
                                    size="small"
                                    color={getPriorityColor(item.priority) as any}
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={`${item.word_count} words`}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                                
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Due: {formatDate(item.due_date)}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setSelectedItem(item)
                                        setEditDialogOpen(true)
                                      }}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </Grid>
          )
        })}
      </Grid>
    </DragDropContext>
  )

  const renderCalendarView = () => {
    const filteredItems = getFilteredItems()
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const todayItems = filteredItems.filter(item => 
      new Date(item.due_date).toDateString() === today.toDateString()
    )
    
    const upcomingItems = filteredItems.filter(item => {
      const dueDate = new Date(item.due_date)
      return dueDate > today && dueDate <= nextWeek
    })
    
    const overdueItems = filteredItems.filter(item => 
      new Date(item.due_date) < today && item.status !== 'published'
    )

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom color="error">
              Overdue ({overdueItems.length})
            </Typography>
            <List>
              {overdueItems.map((item) => (
                <ListItem key={item.id} sx={{ border: '1px solid #ffcdd2', borderRadius: 1, mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar src={item.assignee_avatar}>{item.assignee.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.title}
                    secondary={`Due: ${formatDate(item.due_date)} • ${item.assignee}`}
                  />
                  <Chip
                    label={item.priority}
                    size="small"
                    color={getPriorityColor(item.priority) as any}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Today ({todayItems.length})
            </Typography>
            <List>
              {todayItems.map((item) => (
                <ListItem key={item.id} sx={{ border: '1px solid #e3f2fd', borderRadius: 1, mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar src={item.assignee_avatar}>{item.assignee.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.title}
                    secondary={`${item.assignee} • ${item.word_count} words`}
                  />
                  <Chip
                    label={item.status}
                    size="small"
                    color={getStatusColor(item.status) as any}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom color="info">
              This Week ({upcomingItems.length})
            </Typography>
            <List>
              {upcomingItems.map((item) => (
                <ListItem key={item.id} sx={{ border: '1px solid #f3e5f5', borderRadius: 1, mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar src={item.assignee_avatar}>{item.assignee.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.title}
                    secondary={`Due: ${formatDate(item.due_date)} • ${item.assignee}`}
                  />
                  <Chip
                    label={item.priority}
                    size="small"
                    color={getPriorityColor(item.priority) as any}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Content Calendar</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, value) => value && setView(value)}
            size="small"
          >
            <ToggleButton value="kanban">
              <ViewKanban />
            </ToggleButton>
            <ToggleButton value="calendar">
              <CalendarToday />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            size="small"
            variant="contained"
            onClick={() => setCreateDialogOpen(true)}
            startIcon={<Add />}
          >
            Add Content
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                label="Priority"
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Assignee</InputLabel>
              <Select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                label="Assignee"
              >
                <MenuItem value="all">All Assignees</MenuItem>
                <MenuItem value="John Doe">John Doe</MenuItem>
                <MenuItem value="Jane Smith">Jane Smith</MenuItem>
                <MenuItem value="Bob Wilson">Bob Wilson</MenuItem>
                <MenuItem value="Alice Johnson">Alice Johnson</MenuItem>
                <MenuItem value="Charlie Brown">Charlie Brown</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Content View */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : view === 'kanban' ? (
          renderKanbanView()
        ) : (
          renderCalendarView()
        )}
      </Box>

      {/* Create Item Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Content</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newItem.status}
                  onChange={(e) => setNewItem(prev => ({ ...prev, status: e.target.value as any }))}
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newItem.priority}
                  onChange={(e) => setNewItem(prev => ({ ...prev, priority: e.target.value as any }))}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Assignee"
                value={newItem.assignee}
                onChange={(e) => setNewItem(prev => ({ ...prev, assignee: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Target Keyword"
                value={newItem.target_keyword}
                onChange={(e) => setNewItem(prev => ({ ...prev, target_keyword: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Word Count"
                value={newItem.word_count}
                onChange={(e) => setNewItem(prev => ({ ...prev, word_count: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                value={newItem.due_date}
                onChange={(e) => setNewItem(prev => ({ ...prev, due_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateItem}
            variant="contained"
            disabled={!newItem.title || !newItem.assignee}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Content</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={selectedItem.title}
                  onChange={(e) => setSelectedItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedItem.status}
                    onChange={(e) => setSelectedItem(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                    label="Status"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="review">Review</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={selectedItem.priority}
                    onChange={(e) => setSelectedItem(prev => prev ? { ...prev, priority: e.target.value as any } : null)}
                    label="Priority"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Assignee"
                  value={selectedItem.assignee}
                  onChange={(e) => setSelectedItem(prev => prev ? { ...prev, assignee: e.target.value } : null)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Target Keyword"
                  value={selectedItem.target_keyword}
                  onChange={(e) => setSelectedItem(prev => prev ? { ...prev, target_keyword: e.target.value } : null)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Word Count"
                  value={selectedItem.word_count}
                  onChange={(e) => setSelectedItem(prev => prev ? { ...prev, word_count: parseInt(e.target.value) || 0 } : null)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Due Date"
                  value={selectedItem.due_date}
                  onChange={(e) => setSelectedItem(prev => prev ? { ...prev, due_date: e.target.value } : null)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={selectedItem.description}
                  onChange={(e) => setSelectedItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateItem}
            variant="contained"
            disabled={!selectedItem?.title || !selectedItem?.assignee}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
