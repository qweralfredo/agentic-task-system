import { Box, CircularProgress, Typography } from '@mui/material'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProjectProvider } from './context/ProjectContext'
import { AppLayout } from './layout/AppLayout'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const BacklogPage = lazy(() => import('./pages/BacklogPage').then((module) => ({ default: module.BacklogPage })))
const SprintsPage = lazy(() => import('./pages/SprintsPage').then((module) => ({ default: module.SprintsPage })))
const KnowledgePage = lazy(() => import('./pages/KnowledgePage').then((module) => ({ default: module.KnowledgePage })))

function PageFallback() {
  return (
    <Box sx={{ minHeight: 200, display: 'grid', placeItems: 'center', gap: 1 }}>
      <CircularProgress size={30} />
      <Typography color="text.secondary">Carregando tela...</Typography>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ProjectProvider>
  )
}

export default App
