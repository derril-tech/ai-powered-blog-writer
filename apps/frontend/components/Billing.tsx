'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  Paper, Divider, FormControl, InputLabel, Select, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, FormControlLabel, List, ListItem, ListItemText, ListItemIcon,
  Accordion, AccordionSummary, AccordionDetails, Badge, Tooltip,
  Avatar, Tabs, Tab, LinearProgress, AlertTitle,
} from '@mui/material'
import {
  Payment, CreditCard, Receipt, TrendingUp, TrendingDown, ExpandMore,
  Add, Edit, Delete, Visibility, VisibilityOff, CheckCircle, Error,
  Warning, Info, Download, Refresh, CalendarToday, Person, Group,
  Storage, Speed, CloudUpload, CloudDownload, Timer, AttachMoney,
  AccountBalance, CreditScore, Security, Lock, LockOpen,
} from '@mui/icons-material'

interface Subscription {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  plan: string
  plan_name: string
  seats: number
  seats_used: number
  current_period_start: string
  current_period_end: string
  amount: number
  currency: string
  trial_end?: string
  cancel_at_period_end: boolean
}

interface Usage {
  period_start: string
  period_end: string
  ai_minutes_used: number
  ai_minutes_limit: number
  storage_used_gb: number
  storage_limit_gb: number
  api_calls_used: number
  api_calls_limit: number
  seats_used: number
  seats_limit: number
}

interface Invoice {
  id: string
  number: string
  amount: number
  currency: string
  status: 'paid' | 'open' | 'void' | 'uncollectible'
  created: string
  due_date: string
  pdf_url?: string
  hosted_invoice_url?: string
  lines: InvoiceLine[]
}

interface InvoiceLine {
  id: string
  description: string
  quantity: number
  unit_amount: number
  amount: number
  currency: string
}

interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account'
  last4: string
  brand?: string
  exp_month?: number
  exp_year?: number
  is_default: boolean
  fingerprint?: string
}

interface BillingProps {
  onSubscriptionUpdate?: (subscriptionId: string, updates: Partial<Subscription>) => Promise<void>
  onSeatsUpdate?: (subscriptionId: string, seats: number) => Promise<void>
  onPaymentMethodAdd?: (paymentMethod: any) => Promise<void>
  onPaymentMethodDelete?: (paymentMethodId: string) => Promise<void>
  onInvoiceDownload?: (invoiceId: string) => Promise<void>
}

export default function Billing({
  onSubscriptionUpdate, onSeatsUpdate, onPaymentMethodAdd,
  onPaymentMethodDelete, onInvoiceDownload
}: BillingProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Subscription state
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [seatsDialog, setSeatsDialog] = useState(false)
  const [newSeats, setNewSeats] = useState(0)
  
  // Usage state
  const [usage, setUsage] = useState<Usage | null>(null)
  
  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([])
  
  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [addPaymentDialog, setAddPaymentDialog] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    card_number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
    name: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock subscription data
      const mockSubscription: Subscription = {
        id: 'sub_123456789',
        status: 'active',
        plan: 'pro',
        plan_name: 'Pro Plan',
        seats: 10,
        seats_used: 7,
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-02-01T00:00:00Z',
        amount: 29900, // $299.00
        currency: 'usd',
        cancel_at_period_end: false
      }
      
      // Mock usage data
      const mockUsage: Usage = {
        period_start: '2024-01-01T00:00:00Z',
        period_end: '2024-02-01T00:00:00Z',
        ai_minutes_used: 450,
        ai_minutes_limit: 1000,
        storage_used_gb: 2.5,
        storage_limit_gb: 10,
        api_calls_used: 15000,
        api_calls_limit: 50000,
        seats_used: 7,
        seats_limit: 10
      }
      
      // Mock invoices data
      const mockInvoices: Invoice[] = [
        {
          id: 'in_123456789',
          number: 'INV-2024-001',
          amount: 29900,
          currency: 'usd',
          status: 'paid',
          created: '2024-01-01T00:00:00Z',
          due_date: '2024-01-01T00:00:00Z',
          pdf_url: 'https://example.com/invoice.pdf',
          hosted_invoice_url: 'https://example.com/invoice',
          lines: [
            {
              id: 'li_1',
              description: 'Pro Plan - 10 seats',
              quantity: 1,
              unit_amount: 29900,
              amount: 29900,
              currency: 'usd'
            }
          ]
        },
        {
          id: 'in_123456790',
          number: 'INV-2023-012',
          amount: 29900,
          currency: 'usd',
          status: 'paid',
          created: '2023-12-01T00:00:00Z',
          due_date: '2023-12-01T00:00:00Z',
          pdf_url: 'https://example.com/invoice.pdf',
          hosted_invoice_url: 'https://example.com/invoice',
          lines: [
            {
              id: 'li_2',
              description: 'Pro Plan - 10 seats',
              quantity: 1,
              unit_amount: 29900,
              amount: 29900,
              currency: 'usd'
            }
          ]
        }
      ]
      
      // Mock payment methods data
      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: 'pm_123456789',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          exp_month: 12,
          exp_year: 2025,
          is_default: true
        },
        {
          id: 'pm_123456790',
          type: 'card',
          last4: '5555',
          brand: 'mastercard',
          exp_month: 8,
          exp_year: 2026,
          is_default: false
        }
      ]
      
      setSubscription(mockSubscription)
      setUsage(mockUsage)
      setInvoices(mockInvoices)
      setPaymentMethods(mockPaymentMethods)
    } catch (err) {
      setError('Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }

  const handleSeatsUpdate = async () => {
    if (!subscription || !onSeatsUpdate) return
    
    setLoading(true)
    try {
      await onSeatsUpdate(subscription.id, newSeats)
      setSeatsDialog(false)
      setNewSeats(0)
      await loadData()
    } catch (err) {
      setError('Failed to update seats')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    if (!onPaymentMethodAdd) return
    
    setLoading(true)
    try {
      await onPaymentMethodAdd(newPaymentMethod)
      setAddPaymentDialog(false)
      setNewPaymentMethod({
        card_number: '',
        exp_month: '',
        exp_year: '',
        cvc: '',
        name: ''
      })
      await loadData()
    } catch (err) {
      setError('Failed to add payment method')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!onPaymentMethodDelete) return
    
    setLoading(true)
    try {
      await onPaymentMethodDelete(paymentMethodId)
      await loadData()
    } catch (err) {
      setError('Failed to delete payment method')
    } finally {
      setLoading(false)
    }
  }

  const handleInvoiceDownload = async (invoiceId: string) => {
    if (!onInvoiceDownload) return
    
    setLoading(true)
    try {
      await onInvoiceDownload(invoiceId)
    } catch (err) {
      setError('Failed to download invoice')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error'
    if (percentage >= 75) return 'warning'
    return 'success'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'canceled': return 'error'
      case 'past_due': return 'warning'
      case 'trialing': return 'info'
      default: return 'default'
    }
  }

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'open': return 'warning'
      case 'void': return 'error'
      case 'uncollectible': return 'error'
      default: return 'default'
    }
  }

  const renderSubscriptionTab = () => (
    <Box>
      {subscription && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {subscription.plan_name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Chip
                        label={subscription.status}
                        color={getStatusColor(subscription.status) as any}
                        variant="outlined"
                      />
                      <Typography variant="h6" color="primary">
                        {formatCurrency(subscription.amount, subscription.currency)}/month
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Billing period: {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setNewSeats(subscription.seats)
                      setSeatsDialog(true)
                    }}
                  >
                    Manage Seats
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Seats</Typography>
                  <Typography variant="h6">
                    {subscription.seats_used} / {subscription.seats}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(subscription.seats_used / subscription.seats) * 100}
                  color={getUsageColor((subscription.seats_used / subscription.seats) * 100) as any}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {subscription.seats - subscription.seats_used} seats available
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Plan Features
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Up to 10 team members" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="1,000 AI minutes/month" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="10GB storage" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="50,000 API calls/month" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Priority support" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )

  const renderUsageTab = () => (
    <Box>
      {usage && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AI Processing Minutes
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" color="primary">
                    {usage.ai_minutes_used}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    / {usage.ai_minutes_limit} minutes
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getUsagePercentage(usage.ai_minutes_used, usage.ai_minutes_limit)}
                  color={getUsageColor(getUsagePercentage(usage.ai_minutes_used, usage.ai_minutes_limit)) as any}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {usage.ai_minutes_limit - usage.ai_minutes_used} minutes remaining
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Storage Usage
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" color="primary">
                    {usage.storage_used_gb.toFixed(1)} GB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    / {usage.storage_limit_gb} GB
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getUsagePercentage(usage.storage_used_gb, usage.storage_limit_gb)}
                  color={getUsageColor(getUsagePercentage(usage.storage_used_gb, usage.storage_limit_gb)) as any}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {(usage.storage_limit_gb - usage.storage_used_gb).toFixed(1)} GB remaining
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API Calls
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" color="primary">
                    {usage.api_calls_used.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    / {usage.api_calls_limit.toLocaleString()} calls
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getUsagePercentage(usage.api_calls_used, usage.api_calls_limit)}
                  color={getUsageColor(getUsagePercentage(usage.api_calls_used, usage.api_calls_limit)) as any}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {(usage.api_calls_limit - usage.api_calls_used).toLocaleString()} calls remaining
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Usage Period
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {formatDate(usage.period_start)} - {formatDate(usage.period_end)}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadData}
                  sx={{ mt: 1 }}
                >
                  Refresh Usage
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )

  const renderInvoicesTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Billing History</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {invoice.number}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(invoice.created)}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={invoice.status}
                    size="small"
                    color={getInvoiceStatusColor(invoice.status) as any}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {invoice.pdf_url && (
                      <Tooltip title="Download PDF">
                        <IconButton
                          size="small"
                          onClick={() => handleInvoiceDownload(invoice.id)}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                    )}
                    {invoice.hosted_invoice_url && (
                      <Tooltip title="View Online">
                        <IconButton
                          size="small"
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )

  const renderPaymentMethodsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Payment Methods</Typography>
        <Button
          variant="contained"
          onClick={() => setAddPaymentDialog(true)}
          startIcon={<Add />}
        >
          Add Payment Method
        </Button>
      </Box>

      <Grid container spacing={2}>
        {paymentMethods.map((method) => (
          <Grid item xs={12} md={6} key={method.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CreditCard color="primary" />
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        •••• •••• •••• {method.last4}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {method.brand?.toUpperCase()} • Expires {method.exp_month}/{method.exp_year}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {method.is_default && (
                      <Chip label="Default" size="small" color="primary" />
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        disabled={method.is_default}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
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
          <Tab label="Subscription" icon={<Payment />} />
          <Tab label="Usage" icon={<TrendingUp />} />
          <Tab label="Invoices" icon={<Receipt />} />
          <Tab label="Payment Methods" icon={<CreditCard />} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : activeTab === 0 ? (
          renderSubscriptionTab()
        ) : activeTab === 1 ? (
          renderUsageTab()
        ) : activeTab === 2 ? (
          renderInvoicesTab()
        ) : (
          renderPaymentMethodsTab()
        )}
      </Box>

      {/* Seats Dialog */}
      <Dialog open={seatsDialog} onClose={() => setSeatsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Seats</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current seats: {subscription?.seats_used} used / {subscription?.seats} total
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="New number of seats"
              value={newSeats}
              onChange={(e) => setNewSeats(parseInt(e.target.value) || 0)}
              inputProps={{ min: subscription?.seats_used || 1 }}
              sx={{ mt: 2 }}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>Pricing</AlertTitle>
              Each additional seat costs $29/month. Changes will be prorated.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSeatsDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSeatsUpdate}
            variant="contained"
            disabled={newSeats === subscription?.seats || newSeats < (subscription?.seats_used || 0)}
          >
            Update Seats
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Method Dialog */}
      <Dialog open={addPaymentDialog} onClose={() => setAddPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                value={newPaymentMethod.card_number}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, card_number: e.target.value }))}
                placeholder="1234 5678 9012 3456"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry Month"
                value={newPaymentMethod.exp_month}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, exp_month: e.target.value }))}
                placeholder="MM"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry Year"
                value={newPaymentMethod.exp_year}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, exp_year: e.target.value }))}
                placeholder="YYYY"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CVC"
                value={newPaymentMethod.cvc}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cvc: e.target.value }))}
                placeholder="123"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Name on Card"
                value={newPaymentMethod.name}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPaymentDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddPaymentMethod}
            variant="contained"
            disabled={!newPaymentMethod.card_number || !newPaymentMethod.exp_month || !newPaymentMethod.exp_year || !newPaymentMethod.cvc || !newPaymentMethod.name}
          >
            Add Payment Method
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
