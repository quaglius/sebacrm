import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { PipelinePage } from './pages/PipelinePage'
import { EmpresasPage } from './pages/EmpresasPage'
import { ContactosPage } from './pages/ContactosPage'
import { ReportesPage } from './pages/ReportesPage'
import { ConfigPage } from './pages/ConfigPage'
import type { ReactNode } from 'react'

function Protected({ children, gerenteOnly = false }: { children: ReactNode; gerenteOnly?: boolean }) {
  const { profile, loading, firebaseUser } = useAuth()
  if (loading) return <div style={{ padding: 40 }}>Cargando…</div>
  if (!firebaseUser || !profile) return <Navigate to="/login" replace />
  if (!profile.active) return <div style={{ padding: 40 }}>Usuario inactivo. Contactá a un gerente.</div>
  if (gerenteOnly && profile.role !== 'gerente') return <Navigate to="/pipeline" replace />
  return children
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { profile, loading, firebaseUser } = useAuth()
  if (loading) return <div style={{ padding: 40 }}>Cargando…</div>
  if (firebaseUser && profile?.active) return <Navigate to="/pipeline" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/hoy" element={<PipelinePage mobileDefault />} />
        <Route path="/empresas" element={<EmpresasPage />} />
        <Route path="/contactos" element={<ContactosPage />} />
        <Route path="/reportes" element={<Protected gerenteOnly><ReportesPage /></Protected>} />
        <Route path="/config" element={<ConfigPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/pipeline" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
