'use client'

import { useState } from 'react'
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Search, Visibility, TrendingUp } from '@mui/icons-material'

interface KeywordDiscoverProps {
  onKeywordSelect: (keyword: string) => void
  onSerpDataReceived: (data: any) => void
}

interface KeywordData {
  term: string
  searchVolume: number
  difficulty: number
  cpc: number
}

export default function KeywordDiscover({ onKeywordSelect, onSerpDataReceived }: KeywordDiscoverProps) {
  const [seedKeyword, setSeedKeyword] = useState('')
  const [keywords, setKeywords] = useState<KeywordData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDiscoverKeywords = async () => {
    if (!seedKeyword.trim()) {
      setError('Please enter a seed keyword')
      return
    }

    setLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/keywords/discover', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ keyword: seedKeyword })
      // })
      // const data = await response.json()

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 2000))
      const mockData: KeywordData[] = [
        { term: `${seedKeyword} tools`, searchVolume: 1200, difficulty: 45, cpc: 2.50 },
        { term: `best ${seedKeyword}`, searchVolume: 8900, difficulty: 65, cpc: 3.20 },
        { term: `${seedKeyword} tutorial`, searchVolume: 3400, difficulty: 35, cpc: 1.80 },
        { term: `${seedKeyword} examples`, searchVolume: 2100, difficulty: 40, cpc: 2.10 },
        { term: `how to ${seedKeyword}`, searchVolume: 5600, difficulty: 55, cpc: 2.80 },
      ]

      setKeywords(mockData)
    } catch (err) {
      setError('Failed to discover keywords')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeywordClick = async (keyword: string) => {
    onKeywordSelect(keyword)
    
    // Fetch SERP data for the selected keyword
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/serp/snapshot', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ keyword })
      // })
      // const serpData = await response.json()

      // Mock SERP data
      const mockSerpData = {
        keyword,
        titles: [
          `Top 10 ${keyword} Solutions for 2024`,
          `Complete Guide to ${keyword}`,
          `${keyword} - Everything You Need to Know`,
        ],
        descriptions: [
          `Discover the best ${keyword} tools and strategies...`,
          `Learn how to implement ${keyword} effectively...`,
          `Expert insights on ${keyword} best practices...`,
        ],
        urls: [
          'https://example1.com',
          'https://example2.com',
          'https://example3.com',
        ],
        featuredSnippets: [],
        peopleAlsoAsk: [
          `What is ${keyword}?`,
          `How does ${keyword} work?`,
          `Why is ${keyword} important?`,
        ],
        relatedSearches: [
          `${keyword} vs alternatives`,
          `${keyword} pricing`,
          `${keyword} reviews`,
        ],
      }

      onSerpDataReceived(mockSerpData)
    } catch (err) {
      console.error('Failed to fetch SERP data:', err)
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'success'
    if (difficulty < 60) return 'warning'
    return 'error'
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Enter seed keyword"
          value={seedKeyword}
          onChange={(e) => setSeedKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleDiscoverKeywords()}
          sx={{ mb: 1 }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={handleDiscoverKeywords}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Search />}
        >
          {loading ? 'Discovering...' : 'Discover Keywords'}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Keywords List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {keywords.length > 0 && (
          <Typography variant="subtitle2" gutterBottom>
            Discovered Keywords ({keywords.length})
          </Typography>
        )}
        
        <List dense>
          {keywords.map((keyword, index) => (
            <ListItem
              key={index}
              button
              onClick={() => handleKeywordClick(keyword.term)}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}
            >
              <ListItemText
                primary={keyword.term}
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip
                      icon={<TrendingUp />}
                      label={`${keyword.searchVolume.toLocaleString()}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${keyword.difficulty}/100`}
                      size="small"
                      color={getDifficultyColor(keyword.difficulty) as any}
                      variant="outlined"
                    />
                    <Chip
                      label={`$${keyword.cpc.toFixed(2)}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleKeywordClick(keyword.term)}>
                  <Visibility />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  )
}
