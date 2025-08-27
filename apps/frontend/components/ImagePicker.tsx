'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Tooltip,
  Paper,
} from '@mui/material'
import {
  Search,
  Add,
  Delete,
  Download,
  Image,
  Refresh,
  Favorite,
  FavoriteBorder,
  Info,
  Check,
} from '@mui/icons-material'

interface ImageResult {
  id: string
  url: string
  thumbnail: string
  title: string
  source: 'unsplash' | 'pexels' | 'ai-generated'
  width: number
  height: number
  altText?: string
  photographer?: string
  license?: string
}

interface ImagePickerProps {
  postId?: string
  onImageSelect?: (image: ImageResult) => void
  onImageRemove?: (imageId: string) => void
  selectedImages?: ImageResult[]
}

export default function ImagePicker({ 
  postId, 
  onImageSelect, 
  onImageRemove,
  selectedImages = [] 
}: ImagePickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ImageResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedSource, setSelectedSource] = useState<'all' | 'unsplash' | 'pexels' | 'ai-generated'>('all')
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null)

  const searchImages = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/images/search?q=${encodeURIComponent(searchQuery)}&source=${selectedSource}`)
      // const data = await response.json()

      // Mock search results
      await new Promise(resolve => setTimeout(resolve, 1500))
      const mockResults: ImageResult[] = [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&h=200&fit=crop',
          title: 'AI Technology Concept',
          source: 'unsplash',
          width: 800,
          height: 600,
          photographer: 'John Doe',
          license: 'Unsplash License'
        },
        {
          id: '2',
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop',
          title: 'Digital Innovation',
          source: 'unsplash',
          width: 800,
          height: 600,
          photographer: 'Jane Smith',
          license: 'Unsplash License'
        },
        {
          id: '3',
          url: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?w=800&h=600&fit=crop',
          thumbnail: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?w=300&h=200&fit=crop',
          title: 'Modern Technology',
          source: 'pexels',
          width: 800,
          height: 600,
          photographer: 'Tech Photographer',
          license: 'Pexels License'
        },
        {
          id: '4',
          url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop',
          title: 'Data Visualization',
          source: 'unsplash',
          width: 800,
          height: 600,
          photographer: 'Data Artist',
          license: 'Unsplash License'
        },
        {
          id: '5',
          url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=600&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=300&h=200&fit=crop',
          title: 'Artificial Intelligence',
          source: 'ai-generated',
          width: 800,
          height: 600,
          altText: 'AI-powered technology visualization'
        },
        {
          id: '6',
          url: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?w=800&h=600&fit=crop',
          thumbnail: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?w=300&h=200&fit=crop',
          title: 'Creative Process',
          source: 'pexels',
          width: 800,
          height: 600,
          photographer: 'Creative Studio',
          license: 'Pexels License'
        }
      ]

      // Filter by source if not 'all'
      const filteredResults = selectedSource === 'all' 
        ? mockResults 
        : mockResults.filter(img => img.source === selectedSource)

      setSearchResults(filteredResults)
    } catch (err) {
      setError('Failed to search images')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generateAIImage = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/images/generate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ prompt: searchQuery })
      // })
      // const data = await response.json()

      // Mock AI generation
      await new Promise(resolve => setTimeout(resolve, 3000))
      const generatedImage: ImageResult = {
        id: `ai-${Date.now()}`,
        url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=600&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=300&h=200&fit=crop',
        title: `AI Generated: ${searchQuery}`,
        source: 'ai-generated',
        width: 800,
        height: 600,
        altText: `AI-generated image for: ${searchQuery}`
      }

      setSearchResults([generatedImage, ...searchResults])
    } catch (err) {
      setError('Failed to generate AI image')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (image: ImageResult) => {
    onImageSelect?.(image)
  }

  const handleImageRemove = (imageId: string) => {
    onImageRemove?.(imageId)
  }

  const handleImageClick = (image: ImageResult) => {
    setSelectedImage(image)
    setImageDialogOpen(true)
  }

  const isImageSelected = (imageId: string) => {
    return selectedImages.some(img => img.id === imageId)
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'unsplash': return 'primary'
      case 'pexels': return 'secondary'
      case 'ai-generated': return 'success'
      default: return 'default'
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'unsplash': return 'Unsplash'
      case 'pexels': return 'Pexels'
      case 'ai-generated': return 'AI Generated'
      default: return source
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Image Picker</Typography>
        <Chip 
          label={`${selectedImages.length} selected`} 
          size="small" 
          variant="outlined" 
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search for images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchImages()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={selectedSource}
              exclusive
              onChange={(_, value) => value && setSelectedSource(value)}
              size="small"
            >
              <ToggleButton value="all">All Sources</ToggleButton>
              <ToggleButton value="unsplash">Unsplash</ToggleButton>
              <ToggleButton value="pexels">Pexels</ToggleButton>
              <ToggleButton value="ai-generated">AI Generated</ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="outlined"
              onClick={searchImages}
              disabled={loading || !searchQuery.trim()}
              startIcon={loading ? <CircularProgress size={16} /> : <Search />}
            >
              Search
            </Button>

            <Button
              variant="contained"
              onClick={generateAIImage}
              disabled={loading || !searchQuery.trim()}
              startIcon={loading ? <CircularProgress size={16} /> : <Image />}
            >
              Generate AI
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Selected Images */}
      {selectedImages.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Images
          </Typography>
          <Grid container spacing={1}>
            {selectedImages.map((image) => (
              <Grid item xs={6} sm={4} md={3} key={image.id}>
                <Card sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="120"
                    image={image.thumbnail}
                    alt={image.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardActions sx={{ p: 1, justifyContent: 'space-between' }}>
                    <Chip
                      label={getSourceLabel(image.source)}
                      size="small"
                      color={getSourceColor(image.source) as any}
                      variant="outlined"
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleImageRemove(image.id)}
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Search Results */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {searchResults.length === 0 && !loading ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <Image sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" align="center">
              No images found.
              <br />
              Try searching for something or generate an AI image.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {searchResults.map((image) => (
              <Grid item xs={6} sm={4} md={3} key={image.id}>
                <Card 
                  sx={{ 
                    position: 'relative',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 }
                  }}
                  onClick={() => handleImageClick(image)}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    image={image.thumbnail}
                    alt={image.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  
                  {isImageSelected(image.id) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'primary.main',
                        borderRadius: '50%',
                        p: 0.5,
                      }}
                    >
                      <Check sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                  )}

                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="body2" noWrap>
                      {image.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {image.width} × {image.height}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ p: 1, justifyContent: 'space-between' }}>
                    <Chip
                      label={getSourceLabel(image.source)}
                      size="small"
                      color={getSourceColor(image.source) as any}
                      variant="outlined"
                    />
                    <Box>
                      <Tooltip title="Add to selection">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleImageSelect(image)
                          }}
                          color={isImageSelected(image.id) ? 'primary' : 'default'}
                        >
                          {isImageSelected(image.id) ? <Check /> : <Add />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Image Detail Dialog */}
      <Dialog 
        open={imageDialogOpen} 
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedImage && (
          <>
            <DialogTitle>
              {selectedImage.title}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    maxHeight: '400px',
                    objectFit: 'contain'
                  }}
                />
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${selectedImage.width} × ${selectedImage.height}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={getSourceLabel(selectedImage.source)}
                    size="small"
                    color={getSourceColor(selectedImage.source) as any}
                    variant="outlined"
                  />
                  {selectedImage.photographer && (
                    <Chip
                      label={`By ${selectedImage.photographer}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {selectedImage.license && (
                    <Chip
                      label={selectedImage.license}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                {selectedImage.altText && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Alt Text:</strong> {selectedImage.altText}
                  </Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setImageDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleImageSelect(selectedImage)
                  setImageDialogOpen(false)
                }}
                startIcon={isImageSelected(selectedImage.id) ? <Check /> : <Add />}
              >
                {isImageSelected(selectedImage.id) ? 'Selected' : 'Add to Selection'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}
