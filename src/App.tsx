import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { MenuPage } from './pages/MenuPage'
import { InventarioPage } from './pages/InventarioPage'
import { TraspasosPage } from './pages/TraspasosPage'
import { OutboxIndicator } from './components/OutboxIndicator'
import { UpdatePrompt } from './components/UpdatePrompt'

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <MenuPage />
              </RequireAuth>
            }
          />
          <Route
            path="/inventario"
            element={
              <RequireAuth>
                <InventarioPage />
              </RequireAuth>
            }
          />
          <Route
            path="/traspasos"
            element={
              <RequireAuth>
                <TraspasosPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <OutboxIndicator />
        <UpdatePrompt />
      </HashRouter>
    </AuthProvider>
  )
}
