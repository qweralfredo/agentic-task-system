import { Navigate, Route, Routes } from 'react-router-dom'
import { ProjectProvider } from './context/ProjectContext'
import { AppLayout } from './layout/AppLayout'
import { BacklogPage } from './pages/BacklogPage'
import { DashboardPage } from './pages/DashboardPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { SprintsPage } from './pages/SprintsPage'

function App() {
  return (
    <ProjectProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="backlog" element={<BacklogPage />} />
          <Route path="sprints" element={<SprintsPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ProjectProvider>
  )
}

export default App
