'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  Paper, Divider, FormControl, InputLabel, Select, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, FormControlLabel, List, ListItem, ListItemText, ListItemIcon,
  Accordion, AccordionSummary, AccordionDetails, Badge, Tooltip,
  Avatar, Tabs, Tab, Checkbox, Radio, RadioGroup,
} from '@mui/material'
import {
  Security, Group, CheckCircle, Cancel, Pending, ExpandMore,
  Add, Edit, Delete, Visibility, VisibilityOff, AdminPanelSettings,
  Person, SupervisorAccount, Assignment, Approval, History,
  Notifications, NotificationsOff, Lock, LockOpen,
} from '@mui/icons-material'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  created_at: string
  updated_at: string
  user_count: number
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  last_login?: string
}

interface ApprovalRequest {
  id: string
  type: 'post_publish' | 'content_edit' | 'user_invite' | 'role_change'
  title: string
  description: string
  requester: User
  approver?: User
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at?: string
  metadata: any
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
  resource: string
  action: string
}

interface RolesApprovalsProps {
  onRoleCreate?: (role: Partial<Role>) => Promise<void>
  onRoleUpdate?: (roleId: string, updates: Partial<Role>) => Promise<void>
  onRoleDelete?: (roleId: string) => Promise<void>
  onUserRoleUpdate?: (userId: string, roleId: string) => Promise<void>
  onApprovalRequest?: (request: Partial<ApprovalRequest>) => Promise<void>
  onApprovalResponse?: (requestId: string, status: 'approved' | 'rejected', comment?: string) => Promise<void>
}

export default function RolesApprovals({
  onRoleCreate, onRoleUpdate, onRoleDelete, onUserRoleUpdate,
  onApprovalRequest, onApprovalResponse
}: RolesApprovalsProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Roles state
  const [roles, setRoles] = useState<Role[]>([])
  const [createRoleDialog, setCreateRoleDialog] = useState(false)
  const [editRoleDialog, setEditRoleDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: '',
    description: '',
    permissions: []
  })
  
  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [userRoleDialog, setUserRoleDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Approvals state
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([])
  const [approvalDialog, setApprovalDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [approvalComment, setApprovalComment] = useState('')
  
  // Permissions
  const [permissions] = useState<Permission[]>([
    { id: 'posts_read', name: 'Read Posts', description: 'View all posts', category: 'Content', resource: 'posts', action: 'read' },
    { id: 'posts_create', name: 'Create Posts', description: 'Create new posts', category: 'Content', resource: 'posts', action: 'create' },
    { id: 'posts_edit', name: 'Edit Posts', description: 'Edit existing posts', category: 'Content', resource: 'posts', action: 'update' },
    { id: 'posts_delete', name: 'Delete Posts', description: 'Delete posts', category: 'Content', resource: 'posts', action: 'delete' },
    { id: 'posts_publish', name: 'Publish Posts', description: 'Publish posts without approval', category: 'Content', resource: 'posts', action: 'publish' },
    { id: 'users_read', name: 'Read Users', description: 'View user information', category: 'Users', resource: 'users', action: 'read' },
    { id: 'users_create', name: 'Create Users', description: 'Invite new users', category: 'Users', resource: 'users', action: 'create' },
    { id: 'users_edit', name: 'Edit Users', description: 'Update user information', category: 'Users', resource: 'users', action: 'update' },
    { id: 'users_delete', name: 'Delete Users', description: 'Remove users', category: 'Users', resource: 'users', action: 'delete' },
    { id: 'roles_manage', name: 'Manage Roles', description: 'Create and edit roles', category: 'Roles', resource: 'roles', action: 'manage' },
    { id: 'analytics_view', name: 'View Analytics', description: 'Access analytics data', category: 'Analytics', resource: 'analytics', action: 'read' },
    { id: 'settings_manage', name: 'Manage Settings', description: 'Update system settings', category: 'Settings', resource: 'settings', action: 'manage' },
  ])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock roles data
      const mockRoles: Role[] = [
        {
          id: '1',
          name: 'Super Admin',
          description: 'Full system access',
          permissions: ['posts_read', 'posts_create', 'posts_edit', 'posts_delete', 'posts_publish', 'users_read', 'users_create', 'users_edit', 'users_delete', 'roles_manage', 'analytics_view', 'settings_manage'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          user_count: 1
        },
        {
          id: '2',
          name: 'Content Manager',
          description: 'Manage all content and publishing',
          permissions: ['posts_read', 'posts_create', 'posts_edit', 'posts_delete', 'posts_publish', 'users_read', 'analytics_view'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          user_count: 3
        },
        {
          id: '3',
          name: 'Content Writer',
          description: 'Create and edit content',
          permissions: ['posts_read', 'posts_create', 'posts_edit'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          user_count: 5
        },
        {
          id: '4',
          name: 'Reviewer',
          description: 'Review and approve content',
          permissions: ['posts_read', 'posts_edit'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          user_count: 2
        }
      ]
      
      // Mock users data
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'John Admin',
          email: 'john@example.com',
          avatar: 'https://via.placeholder.com/32',
          role: 'Super Admin',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          last_login: '2024-01-27T10:30:00Z'
        },
        {
          id: '2',
          name: 'Jane Manager',
          email: 'jane@example.com',
          avatar: 'https://via.placeholder.com/32',
          role: 'Content Manager',
          status: 'active',
          created_at: '2024-01-05T00:00:00Z',
          last_login: '2024-01-27T09:15:00Z'
        },
        {
          id: '3',
          name: 'Bob Writer',
          email: 'bob@example.com',
          avatar: 'https://via.placeholder.com/32',
          role: 'Content Writer',
          status: 'active',
          created_at: '2024-01-10T00:00:00Z',
          last_login: '2024-01-26T16:45:00Z'
        },
        {
          id: '4',
          name: 'Alice Reviewer',
          email: 'alice@example.com',
          avatar: 'https://via.placeholder.com/32',
          role: 'Reviewer',
          status: 'active',
          created_at: '2024-01-15T00:00:00Z',
          last_login: '2024-01-27T08:20:00Z'
        },
        {
          id: '5',
          name: 'Charlie New',
          email: 'charlie@example.com',
          avatar: 'https://via.placeholder.com/32',
          role: 'Content Writer',
          status: 'pending',
          created_at: '2024-01-25T00:00:00Z'
        }
      ]
      
      // Mock approval requests data
      const mockApprovals: ApprovalRequest[] = [
        {
          id: '1',
          type: 'post_publish',
          title: 'Publish: Complete Guide to AI Content Creation',
          description: 'Request to publish the AI content creation guide',
          requester: mockUsers[2],
          status: 'pending',
          created_at: '2024-01-27T10:00:00Z',
          metadata: { post_id: '123', post_title: 'Complete Guide to AI Content Creation' }
        },
        {
          id: '2',
          type: 'user_invite',
          title: 'Invite: David Editor',
          description: 'Request to invite David as a Content Writer',
          requester: mockUsers[1],
          approver: mockUsers[0],
          status: 'approved',
          created_at: '2024-01-26T14:30:00Z',
          updated_at: '2024-01-27T09:00:00Z',
          metadata: { email: 'david@example.com', role: 'Content Writer' }
        },
        {
          id: '3',
          type: 'content_edit',
          title: 'Edit: SEO Best Practices for 2024',
          description: 'Request to edit the SEO best practices post',
          requester: mockUsers[2],
          approver: mockUsers[3],
          status: 'approved',
          created_at: '2024-01-25T16:20:00Z',
          updated_at: '2024-01-26T11:15:00Z',
          metadata: { post_id: '456', changes: 'Updated meta description and added new section' }
        },
        {
          id: '4',
          type: 'role_change',
          title: 'Role Change: Bob Writer to Content Manager',
          description: 'Request to promote Bob to Content Manager role',
          requester: mockUsers[1],
          status: 'pending',
          created_at: '2024-01-27T11:30:00Z',
          metadata: { user_id: '3', current_role: 'Content Writer', new_role: 'Content Manager' }
        }
      ]
      
      setRoles(mockRoles)
      setUsers(mockUsers)
      setApprovalRequests(mockApprovals)
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async () => {
    if (!onRoleCreate) return
    
    setLoading(true)
    try {
      await onRoleCreate(newRole)
      setCreateRoleDialog(false)
      setNewRole({ name: '', description: '', permissions: [] })
      await loadData()
    } catch (err) {
      setError('Failed to create role')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedRole || !onRoleUpdate) return
    
    setLoading(true)
    try {
      await onRoleUpdate(selectedRole.id, selectedRole)
      setEditRoleDialog(false)
      setSelectedRole(null)
      await loadData()
    } catch (err) {
      setError('Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!onRoleDelete) return
    
    setLoading(true)
    try {
      await onRoleDelete(roleId)
      await loadData()
    } catch (err) {
      setError('Failed to delete role')
    } finally {
      setLoading(false)
    }
  }

  const handleUserRoleUpdate = async () => {
    if (!selectedUser || !onUserRoleUpdate) return
    
    setLoading(true)
    try {
      await onUserRoleUpdate(selectedUser.id, selectedUser.role)
      setUserRoleDialog(false)
      setSelectedUser(null)
      await loadData()
    } catch (err) {
      setError('Failed to update user role')
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalResponse = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest || !onApprovalResponse) return
    
    setLoading(true)
    try {
      await onApprovalResponse(selectedRequest.id, status, approvalComment)
      setApprovalDialog(false)
      setSelectedRequest(null)
      setApprovalComment('')
      await loadData()
    } catch (err) {
      setError('Failed to respond to approval request')
    } finally {
      setLoading(false)
    }
  }

  const getPermissionCategory = (category: string) => {
    const categoryPermissions = permissions.filter(p => p.category === category)
    return categoryPermissions
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Pending />
      case 'approved': return <CheckCircle />
      case 'rejected': return <Cancel />
      default: return <Pending />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'post_publish': return 'Post Publish'
      case 'content_edit': return 'Content Edit'
      case 'user_invite': return 'User Invite'
      case 'role_change': return 'Role Change'
      default: return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderRolesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Roles & Permissions</Typography>
        <Button
          variant="contained"
          onClick={() => setCreateRoleDialog(true)}
          startIcon={<Add />}
        >
          Create Role
        </Button>
      </Box>

      <Grid container spacing={2}>
        {roles.map((role) => (
          <Grid item xs={12} md={6} key={role.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{role.name}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {role.description}
                    </Typography>
                    <Chip
                      label={`${role.user_count} users`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit Role">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedRole(role)
                          setEditRoleDialog(true)
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Role">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.user_count > 0}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Permissions ({role.permissions.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {role.permissions.slice(0, 3).map((permissionId) => {
                    const permission = permissions.find(p => p.id === permissionId)
                    return permission ? (
                      <Chip
                        key={permissionId}
                        label={permission.name}
                        size="small"
                        variant="outlined"
                      />
                    ) : null
                  })}
                  {role.permissions.length > 3 && (
                    <Chip
                      label={`+${role.permissions.length - 3} more`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const renderUsersTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Users & Roles</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={user.avatar} sx={{ width: 32, height: 32 }}>
                      {user.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2">{user.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    size="small"
                    color={user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {user.last_login ? formatDate(user.last_login) : 'Never'}
                </TableCell>
                <TableCell>
                  <Tooltip title="Change Role">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedUser(user)
                        setUserRoleDialog(true)
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )

  const renderApprovalsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Approval Requests</Typography>
      
      <Grid container spacing={2}>
        {approvalRequests.map((request) => (
          <Grid item xs={12} key={request.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        label={getTypeLabel(request.type)}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={getStatusIcon(request.status)}
                        label={request.status}
                        size="small"
                        color={getStatusColor(request.status) as any}
                      />
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {request.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {request.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={request.requester.avatar} sx={{ width: 24, height: 24 }}>
                          {request.requester.name.charAt(0)}
                        </Avatar>
                        <Typography variant="caption">
                          Requested by {request.requester.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(request.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                  {request.status === 'pending' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedRequest(request)
                        setApprovalDialog(true)
                      }}
                    >
                      Review
                    </Button>
                  )}
                </Box>
                
                {request.approver && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {request.status === 'approved' ? 'Approved' : 'Rejected'} by:
                    </Typography>
                    <Avatar src={request.approver.avatar} sx={{ width: 20, height: 20 }}>
                      {request.approver.name.charAt(0)}
                    </Avatar>
                    <Typography variant="caption">
                      {request.approver.name}
                    </Typography>
                    {request.updated_at && (
                      <Typography variant="caption" color="text.secondary">
                        on {formatDate(request.updated_at)}
                      </Typography>
                    )}
                  </Box>
                )}
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
          <Tab label="Roles & Permissions" icon={<Security />} />
          <Tab label="Users" icon={<Group />} />
          <Tab label="Approvals" icon={<Approval />} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : activeTab === 0 ? (
          renderRolesTab()
        ) : activeTab === 1 ? (
          renderUsersTab()
        ) : (
          renderApprovalsTab()
        )}
      </Box>

      {/* Create Role Dialog */}
      <Dialog open={createRoleDialog} onClose={() => setCreateRoleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role Name"
                value={newRole.name}
                onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Permissions
              </Typography>
              {['Content', 'Users', 'Roles', 'Analytics', 'Settings'].map((category) => (
                <Accordion key={category}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">{category}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={1}>
                      {getPermissionCategory(category).map((permission) => (
                        <Grid item xs={12} sm={6} key={permission.id}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={newRole.permissions?.includes(permission.id)}
                                onChange={(e) => {
                                  const updatedPermissions = e.target.checked
                                    ? [...(newRole.permissions || []), permission.id]
                                    : (newRole.permissions || []).filter(p => p !== permission.id)
                                  setNewRole(prev => ({ ...prev, permissions: updatedPermissions }))
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2">{permission.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {permission.description}
                                </Typography>
                              </Box>
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRoleDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateRole}
            variant="contained"
            disabled={!newRole.name}
          >
            Create Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialog} onClose={() => setEditRoleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Role</DialogTitle>
        <DialogContent>
          {selectedRole && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Role Name"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={selectedRole.description}
                  onChange={(e) => setSelectedRole(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Permissions
                </Typography>
                {['Content', 'Users', 'Roles', 'Analytics', 'Settings'].map((category) => (
                  <Accordion key={category}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">{category}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1}>
                        {getPermissionCategory(category).map((permission) => (
                          <Grid item xs={12} sm={6} key={permission.id}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedRole.permissions.includes(permission.id)}
                                  onChange={(e) => {
                                    const updatedPermissions = e.target.checked
                                      ? [...selectedRole.permissions, permission.id]
                                      : selectedRole.permissions.filter(p => p !== permission.id)
                                    setSelectedRole(prev => prev ? { ...prev, permissions: updatedPermissions } : null)
                                  }}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2">{permission.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {permission.description}
                                  </Typography>
                                </Box>
                              }
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRoleDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateRole}
            variant="contained"
            disabled={!selectedRole?.name}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Role Dialog */}
      <Dialog open={userRoleDialog} onClose={() => setUserRoleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={selectedUser.avatar} sx={{ width: 48, height: 48 }}>
                  {selectedUser.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedUser.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                </Box>
              </Box>
              
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser(prev => prev ? { ...prev, role: e.target.value } : null)}
                  label="Role"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      <Box>
                        <Typography variant="body2">{role.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {role.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserRoleDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUserRoleUpdate}
            variant="contained"
            disabled={!selectedUser?.role}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Review Approval Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedRequest.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedRequest.description}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={selectedRequest.requester.avatar} sx={{ width: 32, height: 32 }}>
                  {selectedRequest.requester.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2">
                    Requested by {selectedRequest.requester.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(selectedRequest.created_at)}
                  </Typography>
                </Box>
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Comment (optional)"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Add a comment about your decision..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button
            onClick={() => handleApprovalResponse('rejected')}
            color="error"
            variant="outlined"
          >
            Reject
          </Button>
          <Button
            onClick={() => handleApprovalResponse('approved')}
            variant="contained"
            color="success"
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
