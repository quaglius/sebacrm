import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ImpersonationBar } from './ImpersonationBar'

export function Layout() {
  const { profile, effectiveProfile, logout, isGerente, isAdmin, impersonating } = useAuth()
  const shown = effectiveProfile || profile

  return (
    <div className="app-shell">
      {isAdmin && <ImpersonationBar />}
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark" />
            <div>
              <div className="brand-name">Encaje CRM</div>
              <div className="brand-sub">indagación guiada</div>
            </div>
          </div>
          <div className="user-chip">
            {shown?.displayName} · {shown?.role}
            {impersonating && <span style={{ display: 'block', color: 'var(--status-warning)' }}>vía admin</span>}
          </div>
          <NavLink to="/pipeline" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-dot" /> Pipeline
          </NavLink>
          <NavLink to="/hoy" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-dot" /> Hoy
          </NavLink>
          <NavLink to="/empresas" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-dot" /> Empresas
          </NavLink>
          <NavLink to="/contactos" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-dot" /> Contactos
          </NavLink>
          {isGerente && (
            <NavLink to="/reportes" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <span className="nav-dot" /> Reportes
            </NavLink>
          )}
          <NavLink to="/config" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-dot" /> Configuración
          </NavLink>
          <button type="button" className="nav-item logout" onClick={() => logout()} style={{ background: 'none', border: 'none', textAlign: 'left' }}>
            <span className="nav-dot" /> Cerrar sesión
          </button>
          <div className="sidebar-note">
            Pipeline con encaje ICP y checklist de indagación. Los datos viven en Firebase (capa free).
          </div>
        </aside>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
