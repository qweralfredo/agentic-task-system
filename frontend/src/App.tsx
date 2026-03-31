import { Box, CircularProgress, Typography } from '@mui/material'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProjectProvider } from './context/ProjectContext'
import { AppLayout } from './layout/AppLayout'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const TokenInsightsPage = lazy(() => import('./pages/TokenInsightsPage').then((module) => ({ default: module.TokenInsightsPage })))
const BacklogPage = lazy(() => import('./pages/BacklogPage').then((module) => ({ default: module.BacklogPage })))
const SprintsPage = lazy(() => import('./pages/SprintsPage').then((module) => ({ default: module.SprintsPage })))
const KnowledgePage = lazy(() => import('./pages/KnowledgePage').then((module) => ({ default: module.KnowledgePage })))
const WikiPage = lazy(() => import('./pages/WikiPage').then((module) => ({ default: module.WikiPage })))
const CheckpointsPage = lazy(() => import('./pages/CheckpointsPage').then((module) => ({ default: module.CheckpointsPage })))
const DocumentationPage = lazy(() => import('./pages/DocumentationPage').then((module) => ({ default: module.DocumentationPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))

function PageFallback() {
  return (
    <Box sx={{ minHeight: 200, display: 'grid', placeItems: 'center', gap: 1 }}>
      <CircularProgress size={30} />
      <Typography color="text.secondary">Loading...</Typography>
    </Box>
  )
}

function App() {
  return (
    <ProjectProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            index
            element={(
              <Suspense fallback={<PageFallback />}>
                <DashboardPage />
              </Suspense>
            )}
          />
          <Route
            path="backlog"
            element={(
              <Suspense fallback={<PageFallback />}>
                <BacklogPage />
              </Suspense>
            )}
          />
          <Route
            path="dashboard/tokens"
            element={(
              <Suspense fallback={<PageFallback />}>
                <TokenInsightsPage />
              </Suspense>
            )}
          />
          <Route
            path="sprints"
            element={(
              <Suspense fallback={<PageFallback />}>
                <SprintsPage />
              </Suspense>
            )}
          />
          <Route
            path="knowledge"
            element={(
              <Suspense fallback={<PageFallback />}>
                <KnowledgePage />
              </Suspense>
            )}
          />
          <Route
            path="knowledge/wiki"
            element={(
              <Suspense fallback={<PageFallback />}>
                <WikiPage />
              </Suspense>
            )}
          />
          <Route
            path="knowledge/checkpoints"
            element={(
              <Suspense fallback={<PageFallback />}>
                <CheckpointsPage />
              </Suspense>
            )}
          />
          <Route
            path="knowledge/documentation"
            element={(
              <Suspense fallback={<PageFallback />}>
                <DocumentationPage />
              </Suspense>
            )}
          />
          <Route
            path="settings"
            element={(
              <Suspense fallback={<PageFallback />}>
                <SettingsPage />
              </Suspense>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ProjectProvider>
  )
}

export default App
