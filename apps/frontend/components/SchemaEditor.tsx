'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Schema,
  Add,
  Delete,
  Refresh,
  ContentCopy,
  Edit,
  Check,
  ExpandMore,
  AutoFixHigh,
  Code,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material'

interface SchemaField {
  name: string
  value: string
  required: boolean
  type: 'text' | 'url' | 'date' | 'number' | 'boolean'
  description: string
}

interface SchemaType {
  id: string
  name: string
  type: 'Article' | 'Product' | 'FAQ' | 'HowTo' | 'Review' | 'Organization'
  fields: SchemaField[]
  enabled: boolean
}

interface SchemaEditorProps {
  postId?: string
  onSchemaChange?: (schemas: SchemaType[]) => void
}

export default function SchemaEditor({ postId, onSchemaChange }: SchemaEditorProps) {
  const [schemas, setSchemas] = useState<SchemaType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedSchema, setSelectedSchema] = useState<SchemaType | null>(null)
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    if (postId) {
      loadSchemas()
    }
  }, [postId])

  const loadSchemas = async () => {
    if (!postId) return

    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/posts/${postId}/schema`)
      // const data = await response.json()

      // Mock schema data
      await new Promise(resolve => setTimeout(resolve, 1000))
      const mockSchemas: SchemaType[] = [
        {
          id: '1',
          name: 'Article Schema',
          type: 'Article',
          enabled: true,
          fields: [
            {
              name: 'headline',
              value: 'AI-Powered Blog Writing: A Complete Guide',
              required: true,
              type: 'text',
              description: 'The headline of the article'
            },
            {
              name: 'author',
              value: 'John Doe',
              required: true,
              type: 'text',
              description: 'The author of the article'
            },
            {
              name: 'datePublished',
              value: '2024-01-27',
              required: true,
              type: 'date',
              description: 'Publication date'
            },
            {
              name: 'dateModified',
              value: '2024-01-27',
              required: false,
              type: 'date',
              description: 'Last modified date'
            },
            {
              name: 'description',
              value: 'Learn how AI is revolutionizing blog writing and content creation',
              required: false,
              type: 'text',
              description: 'Article description'
            }
          ]
        },
        {
          id: '2',
          name: 'Organization Schema',
          type: 'Organization',
          enabled: true,
          fields: [
            {
              name: 'name',
              value: 'AI Blog Writer',
              required: true,
              type: 'text',
              description: 'Organization name'
            },
            {
              name: 'url',
              value: 'https://aiblogwriter.com',
              required: true,
              type: 'url',
              description: 'Organization website'
            },
            {
              name: 'logo',
              value: 'https://aiblogwriter.com/logo.png',
              required: false,
              type: 'url',
              description: 'Organization logo'
            }
          ]
        }
      ]

      setSchemas(mockSchemas)
      onSchemaChange?.(mockSchemas)
    } catch (err) {
      setError('Failed to load schema data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generateSchema = async () => {
    if (!postId) return

    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/posts/${postId}/schema`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // })
      // const data = await response.json()

      // Mock generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      await loadSchemas()
    } catch (err) {
      setError('Failed to generate schema')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSchema = () => {
    const newSchema: SchemaType = {
      id: `schema-${Date.now()}`,
      name: 'New Schema',
      type: 'Article',
      enabled: true,
      fields: []
    }
    setSelectedSchema(newSchema)
    setEditDialogOpen(true)
  }

  const handleEditSchema = (schema: SchemaType) => {
    setSelectedSchema({ ...schema })
    setEditDialogOpen(true)
  }

  const handleDeleteSchema = (schemaId: string) => {
    const updatedSchemas = schemas.filter(s => s.id !== schemaId)
    setSchemas(updatedSchemas)
    onSchemaChange?.(updatedSchemas)
  }

  const handleSaveSchema = () => {
    if (!selectedSchema) return

    const updatedSchemas = [...schemas]
    const existingIndex = updatedSchemas.findIndex(s => s.id === selectedSchema.id)
    
    if (existingIndex >= 0) {
      updatedSchemas[existingIndex] = selectedSchema
    } else {
      updatedSchemas.push(selectedSchema)
    }

    setSchemas(updatedSchemas)
    onSchemaChange?.(updatedSchemas)
    setEditDialogOpen(false)
    setSelectedSchema(null)
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    if (!selectedSchema) return

    const updatedFields = selectedSchema.fields.map(field =>
      field.name === fieldName ? { ...field, value } : field
    )

    setSelectedSchema({ ...selectedSchema, fields: updatedFields })
  }

  const handleAddField = () => {
    if (!selectedSchema) return

    const newField: SchemaField = {
      name: `field_${selectedSchema.fields.length + 1}`,
      value: '',
      required: false,
      type: 'text',
      description: 'New field'
    }

    setSelectedSchema({
      ...selectedSchema,
      fields: [...selectedSchema.fields, newField]
    })
  }

  const handleRemoveField = (fieldName: string) => {
    if (!selectedSchema) return

    const updatedFields = selectedSchema.fields.filter(field => field.name !== fieldName)
    setSelectedSchema({ ...selectedSchema, fields: updatedFields })
  }

  const getSchemaTypeFields = (type: string): SchemaField[] => {
    const typeFields: Record<string, SchemaField[]> = {
      'Article': [
        { name: 'headline', value: '', required: true, type: 'text', description: 'Article headline' },
        { name: 'author', value: '', required: true, type: 'text', description: 'Article author' },
        { name: 'datePublished', value: '', required: true, type: 'date', description: 'Publication date' },
        { name: 'dateModified', value: '', required: false, type: 'date', description: 'Last modified date' },
        { name: 'description', value: '', required: false, type: 'text', description: 'Article description' },
        { name: 'image', value: '', required: false, type: 'url', description: 'Featured image URL' }
      ],
      'Product': [
        { name: 'name', value: '', required: true, type: 'text', description: 'Product name' },
        { name: 'description', value: '', required: true, type: 'text', description: 'Product description' },
        { name: 'price', value: '', required: true, type: 'number', description: 'Product price' },
        { name: 'image', value: '', required: false, type: 'url', description: 'Product image URL' },
        { name: 'brand', value: '', required: false, type: 'text', description: 'Product brand' }
      ],
      'FAQ': [
        { name: 'question', value: '', required: true, type: 'text', description: 'FAQ question' },
        { name: 'answer', value: '', required: true, type: 'text', description: 'FAQ answer' }
      ],
      'HowTo': [
        { name: 'name', value: '', required: true, type: 'text', description: 'How-to title' },
        { name: 'description', value: '', required: true, type: 'text', description: 'How-to description' },
        { name: 'totalTime', value: '', required: false, type: 'text', description: 'Total time required' },
        { name: 'image', value: '', required: false, type: 'url', description: 'How-to image URL' }
      ],
      'Review': [
        { name: 'itemReviewed', value: '', required: true, type: 'text', description: 'Reviewed item name' },
        { name: 'reviewRating', value: '', required: true, type: 'number', description: 'Rating (1-5)' },
        { name: 'reviewBody', value: '', required: true, type: 'text', description: 'Review content' },
        { name: 'author', value: '', required: true, type: 'text', description: 'Review author' }
      ],
      'Organization': [
        { name: 'name', value: '', required: true, type: 'text', description: 'Organization name' },
        { name: 'url', value: '', required: true, type: 'url', description: 'Organization website' },
        { name: 'logo', value: '', required: false, type: 'url', description: 'Organization logo' },
        { name: 'description', value: '', required: false, type: 'text', description: 'Organization description' }
      ]
    }

    return typeFields[type] || []
  }

  const generateJSONLD = (schemas: SchemaType[]): string => {
    const enabledSchemas = schemas.filter(s => s.enabled)
    
    if (enabledSchemas.length === 0) return ''

    const jsonld = enabledSchemas.map(schema => {
      const schemaData: any = {
        '@context': 'https://schema.org',
        '@type': schema.type
      }

      schema.fields.forEach(field => {
        if (field.value) {
          let value: any = field.value
          
          // Convert value based on type
          if (field.type === 'number') {
            value = parseFloat(field.value)
          } else if (field.type === 'boolean') {
            value = field.value === 'true'
          } else if (field.type === 'date') {
            value = field.value
          }

          schemaData[field.name] = value
        }
      })

      return schemaData
    })

    return JSON.stringify(jsonld, null, 2)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getSchemaTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Article': 'primary',
      'Product': 'secondary',
      'FAQ': 'success',
      'HowTo': 'warning',
      'Review': 'info',
      'Organization': 'default'
    }
    return colors[type] || 'default'
  }

  const jsonldOutput = generateJSONLD(schemas)

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Schema Markup</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setIsPreview(!isPreview)}
            startIcon={isPreview ? <VisibilityOff /> : <Visibility />}
          >
            {isPreview ? 'Hide' : 'Preview'} JSON-LD
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={generateSchema}
            disabled={loading || !postId}
            startIcon={loading ? <CircularProgress size={16} /> : <AutoFixHigh />}
          >
            Generate
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleAddSchema}
            startIcon={<Add />}
          >
            Add Schema
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* JSON-LD Preview */}
      {isPreview && jsonldOutput && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">JSON-LD Output</Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => copyToClipboard(jsonldOutput)}
              startIcon={<ContentCopy />}
            >
              Copy
            </Button>
          </Box>
          <Box
            sx={{
              backgroundColor: 'grey.100',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '300px',
              overflow: 'auto'
            }}
          >
            {jsonldOutput}
          </Box>
        </Paper>
      )}

      {/* Schema List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {schemas.length === 0 && !loading ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <Schema sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" align="center">
              No schema markup configured.
              <br />
              Click "Add Schema" to create structured data or "Generate" for AI suggestions.
            </Typography>
          </Box>
        ) : (
          <List>
            {schemas.map((schema) => (
              <Accordion key={schema.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Chip
                      label={schema.type}
                      size="small"
                      color={getSchemaTypeColor(schema.type) as any}
                      variant="outlined"
                    />
                    <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                      {schema.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={schema.enabled ? 'Enabled' : 'Disabled'}
                        size="small"
                        color={schema.enabled ? 'success' : 'default'}
                        variant="outlined"
                      />
                      <Chip
                        label={`${schema.fields.length} fields`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ width: '100%' }}>
                    {/* Schema Fields */}
                    <List dense>
                      {schema.fields.map((field) => (
                        <ListItem key={field.name} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {field.name}
                                </Typography>
                                {field.required && (
                                  <Chip label="Required" size="small" color="error" variant="outlined" />
                                )}
                                <Chip label={field.type} size="small" variant="outlined" />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {field.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Value: {field.value || '(empty)'}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>

                    {/* Schema Actions */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleEditSchema(schema)}
                        startIcon={<Edit />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteSchema(schema.id)}
                        startIcon={<Delete />}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </List>
        )}
      </Box>

      {/* Edit Schema Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSchema?.id.startsWith('schema-') ? 'Add Schema' : 'Edit Schema'}
        </DialogTitle>
        <DialogContent>
          {selectedSchema && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Schema Name"
                value={selectedSchema.name}
                onChange={(e) => setSelectedSchema({ ...selectedSchema, name: e.target.value })}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Schema Type</InputLabel>
                <Select
                  value={selectedSchema.type}
                  onChange={(e) => {
                    const newType = e.target.value as any
                    const newFields = getSchemaTypeFields(newType)
                    setSelectedSchema({
                      ...selectedSchema,
                      type: newType,
                      fields: newFields
                    })
                  }}
                  label="Schema Type"
                >
                  <MenuItem value="Article">Article</MenuItem>
                  <MenuItem value="Product">Product</MenuItem>
                  <MenuItem value="FAQ">FAQ</MenuItem>
                  <MenuItem value="HowTo">HowTo</MenuItem>
                  <MenuItem value="Review">Review</MenuItem>
                  <MenuItem value="Organization">Organization</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={selectedSchema.enabled}
                    onChange={(e) => setSelectedSchema({ ...selectedSchema, enabled: e.target.checked })}
                  />
                }
                label="Enable this schema"
              />

              <Divider />

              <Typography variant="subtitle2">Schema Fields</Typography>
              
              <List dense>
                {selectedSchema.fields.map((field) => (
                  <ListItem key={field.name} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {field.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {field.required && (
                          <Chip label="Required" size="small" color="error" variant="outlined" />
                        )}
                        <Chip label={field.type} size="small" variant="outlined" />
                      </Box>
                    </Box>
                    <TextField
                      label="Value"
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      fullWidth
                      size="small"
                      helperText={field.description}
                    />
                  </ListItem>
                ))}
              </List>

              <Button
                variant="outlined"
                onClick={handleAddField}
                startIcon={<Add />}
                size="small"
              >
                Add Custom Field
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSchema} variant="contained">
            Save Schema
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
