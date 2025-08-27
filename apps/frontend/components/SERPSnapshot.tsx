'use client'

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Paper,
  Divider,
} from '@mui/material'
import { ExpandMore, Search, QuestionAnswer, TrendingUp } from '@mui/icons-material'

interface SERPSnapshotProps {
  keyword: string
  serpData: any
}

export default function SERPSnapshot({ keyword, serpData }: SERPSnapshotProps) {
  if (!keyword) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Select a keyword to view SERP data
        </Typography>
      </Box>
    )
  }

  if (!serpData) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading SERP data...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Keyword Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {keyword}
        </Typography>
        <Chip
          icon={<Search />}
          label="SERP Analysis"
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Organic Results */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">
            Organic Results ({serpData.titles?.length || 0})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {serpData.titles?.map((title: string, index: number) => (
              <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <ListItemText
                  primary={
                    <Link
                      href={serpData.urls?.[index] || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textDecoration: 'none', fontWeight: 'bold' }}
                    >
                      {title}
                    </Link>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {serpData.descriptions?.[index] || 'No description available'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {serpData.urls?.[index] || 'No URL available'}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Featured Snippets */}
      {serpData.featuredSnippets && serpData.featuredSnippets.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              Featured Snippets ({serpData.featuredSnippets.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {serpData.featuredSnippets.map((snippet: any, index: number) => (
              <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                <Typography variant="body2" gutterBottom>
                  {snippet.title || 'Featured Snippet'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {snippet.snippet || snippet.answer || 'No content available'}
                </Typography>
              </Paper>
            ))}
          </AccordionDetails>
        </Accordion>
      )}

      {/* People Also Ask */}
      {serpData.peopleAlsoAsk && serpData.peopleAlsoAsk.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              People Also Ask ({serpData.peopleAlsoAsk.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {serpData.peopleAlsoAsk.map((question: string, index: number) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <QuestionAnswer fontSize="small" color="action" />
                        {question}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Related Searches */}
      {serpData.relatedSearches && serpData.relatedSearches.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              Related Searches ({serpData.relatedSearches.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {serpData.relatedSearches.map((search: string, index: number) => (
                <Chip
                  key={index}
                  label={search}
                  size="small"
                  variant="outlined"
                  icon={<TrendingUp />}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Entities */}
      {serpData.entities && serpData.entities.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              Entities ({serpData.entities.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {serpData.entities.map((entity: any, index: number) => (
                <Chip
                  key={index}
                  label={entity.text}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  )
}
