import { useAuth } from '../context/AuthContext'
import { useTeamUsers } from '../hooks/useData'

export function ImpersonationBar() {
  const { isAdmin, profile, impersonatedUser, setImpersonation } = useAuth()
  const { data: users } = useTeamUsers()

  if (!isAdmin || !profile) return null

  const others = users.filter((u) => u.uid !== profile.uid && u.active)

  return (
    <div className="impersonate-bar">
      <span className="impersonate-label">Admin · ver como</span>
      <select
        className="impersonate-select"
        value={impersonatedUser?.uid || ''}
        onChange={(e) => setImpersonation(e.target.value || null)}
      >
        <option value="">Yo ({profile.displayName})</option>
        {others.map((u) => (
          <option key={u.uid} value={u.uid}>
            {u.displayName} · {u.role} · {u.email}
          </option>
        ))}
      </select>
      {impersonatedUser && (
        <>
          <span className="impersonate-active">
            Impersonando a <b>{impersonatedUser.displayName}</b> ({impersonatedUser.role})
          </span>
          <button type="button" className="impersonate-exit" onClick={() => setImpersonation(null)}>
            Volver a mi sesión
          </button>
        </>
      )}
    </div>
  )
}
