'use client'

import { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  AppBar,
  Toolbar,
  Button,
} from '@mui/material'
import KeywordDiscover from '@/components/KeywordDiscover'
import SERPSnapshot from '@/components/SERPSnapshot'
import ClusterPlanner from '@/components/ClusterPlanner'

export default function Dashboard() {
  const [selectedKeyword, setSelectedKeyword] = useState<string>('')
  const [serpData, setSerpData] = useState<any>(null)

  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeyword(keyword)
    // TODO: Fetch SERP data for the selected keyword
  }

  const handleSerpDataReceived = (data: any) => {
    setSerpData(data)
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI Blog Writer
          </Typography>
          <Button color="inherit">Dashboard</Button>
          <Button color="inherit">Projects</Button>
          <Button color="inherit">Analytics</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Keyword Research & Content Planning
        </Typography>

        <Grid container spacing={3}>
          {/* Keyword Discovery */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 600 }}>
              <Typography variant="h6" gutterBottom>
                Keyword Discovery
              </Typography>
              <KeywordDiscover 
                onKeywordSelect={handleKeywordSelect}
                onSerpDataReceived={handleSerpDataReceived}
              />
            </Paper>
          </Grid>

          {/* SERP Snapshot */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 600 }}>
              <Typography variant="h6" gutterBottom>
                SERP Snapshot
              </Typography>
              <SERPSnapshot 
                keyword={selectedKeyword}
                serpData={serpData}
              />
            </Paper>
          </Grid>

          {/* Cluster Planner */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 600 }}>
              <Typography variant="h6" gutterBottom>
                Cluster Planner
              </Typography>
              <ClusterPlanner />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
