import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login, bootstrapGerente, needsBootstrap } = useAuth()
  const [email, setEmail] = useState(needsBootstrap ? '' : 'gerente@encaje.demo')
  const [password, setPassword] = useState(needsBootstrap ? '' : 'Encaje2026!')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'login' | 'bootstrap'>(needsBootstrap ? 'bootstrap' : 'login')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'bootstrap') {
        await bootstrapGerente(email, password, displayName || 'Gerente')
      } else {
        await login(email, password)
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'No se pudo autenticar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="brand" style={{ marginBottom: 16 }}>
          <div className="brand-mark" />
          <div>
            <div className="brand-name">Encaje CRM</div>
            <div className="brand-sub">acceso con email y contraseña</div>
          </div>
        </div>
        <h1>{mode === 'bootstrap' ? 'Crear primer gerente' : 'Ingresar'}</h1>
        <p className="sub">
          {mode === 'bootstrap'
            ? 'No hay usuarios todavía. Creá el administrador del equipo.'
            : 'Usuarios del app — sin Google Auth.'}
        </p>
        {error && <div className="error-box">{error}</div>}
        {mode === 'bootstrap' && (
          <div className="form-field">
            <label>Nombre</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
        )}
        <div className="form-field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <button className="btn-primary" disabled={busy} type="submit">
          {busy ? 'Esperá…' : mode === 'bootstrap' ? 'Crear gerente' : 'Entrar'}
        </button>
        {needsBootstrap && mode === 'login' && (
          <button type="button" className="btn-secondary" style={{ width: '100%', marginTop: 10 }} onClick={() => setMode('bootstrap')}>
            Crear primer gerente
          </button>
        )}
        <div className="demo-hint">
          Tras el primer gerente, desde Configuración podés <b>cargar datos demo</b> (Ana, Diego, Lucía + 9 oportunidades del prototipo).
          Demo: gerente@encaje.demo / Encaje2026!
        </div>
      </form>
    </div>
  )
}
