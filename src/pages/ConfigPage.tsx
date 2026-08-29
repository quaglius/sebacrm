import { useEffect, useState, type FormEvent } from 'react'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useIcp, useTeamUsers } from '../hooks/useData'
import { suggestIcpFromAnswers } from '../lib/heuristics'
import { inviteUser, seedDemoData } from '../lib/seed'
import type { IcpProfile, Role } from '../types'

export function ConfigPage() {
  const { isGerente, loadSeed } = useAuth()
  const icp = useIcp()
  const { data: users } = useTeamUsers()
  const [step, setStep] = useState(1)
  const [problema, setProblema] = useState('')
  const [clientes, setClientes] = useState('')
  const [draft, setDraft] = useState<Omit<IcpProfile, 'problema' | 'clientesEjemplo'> | null>(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [invite, setInvite] = useState({ email: '', password: '', displayName: '', role: 'vendedor' as Role })

  useEffect(() => {
    if (icp) {
      setProblema(icp.problema || '')
      setClientes(icp.clientesEjemplo || '')
      setDraft({
        rubroObjetivo: icp.rubroObjetivo,
        facturacion: icp.facturacion,
        empleados: icp.empleados,
        volumen: icp.volumen,
        senalFuerte: icp.senalFuerte,
      })
    }
  }, [icp])

  function generateIcp() {
    const suggested = suggestIcpFromAnswers(problema, clientes)
    setDraft(suggested)
    setStep(2)
  }

  async function saveIcp() {
    if (!draft) return
    await setDoc(doc(db, 'icp', 'current'), {
      ...draft,
      problema,
      clientesEjemplo: clientes,
      updatedAt: new Date().toISOString(),
    })
    setStep(3)
    setMsg('ICP guardado')
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    try {
      await inviteUser(invite)
      setInvite({ email: '', password: '', displayName: '', role: 'vendedor' })
      setMsg('Usuario creado')
    } catch (err: unknown) {
      setMsg((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function onSeed() {
    setBusy(true)
    setMsg('')
    try {
      await loadSeed()
      setMsg('Datos demo cargados (usuarios Ana/Diego/Lucía + 9 oportunidades)')
    } catch (err: unknown) {
      try {
        await seedDemoData()
        setMsg('Datos demo cargados')
      } catch (e2: unknown) {
        setMsg((err as Error).message || (e2 as Error).message)
      }
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(uid: string, active: boolean) {
    await updateDoc(doc(db, 'users', uid), { active: !active })
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Configuración</h1>
          <p>Armá el ICP del negocio en minutos (heurística, sin API de IA) e invitá al equipo.</p>
        </div>
      </div>
      <div className="wizard-wrap">
        <div className="wizard-card">
          <div className="wizard-steps">
            <div className={`wizard-step${step === 1 ? ' active' : ''}`}><span>1</span> Contanos tu negocio</div>
            <div className={`wizard-step${step === 2 ? ' active' : ''}`}><span>2</span> Sugerencia de ICP</div>
            <div className={`wizard-step${step === 3 ? ' active' : ''}`}><span>3</span> Confirmar y listo</div>
          </div>

          {step === 1 && (
            <div className="wizard-panel active">
              <label className="wizard-label">¿Qué problema resolvés y para qué tipo de empresa?</label>
              <textarea className="wizard-input" rows={3} value={problema} onChange={(e) => setProblema(e.target.value)} />
              <label className="wizard-label">Contanos un par de clientes con los que te fue bien</label>
              <textarea className="wizard-input" rows={2} value={clientes} onChange={(e) => setClientes(e.target.value)} />
              <button type="button" className="btn-confirm wizard-next" onClick={generateIcp}>Generar ICP →</button>
            </div>
          )}

          {step === 2 && draft && (
            <div className="wizard-panel active">
              <div className="ai-badge">Sugerido por reglas a partir de tus respuestas</div>
              {(
                [
                  ['rubroObjetivo', 'Rubro objetivo'],
                  ['facturacion', 'Facturación estimada'],
                  ['empleados', 'Cantidad de empleados'],
                  ['volumen', 'Volumen de consumo estimado'],
                  ['senalFuerte', 'Señal de encaje fuerte'],
                ] as const
              ).map(([key, label]) => (
                <div className="icp-field" key={key}>
                  <span>{label}</span>
                  <input
                    className="wizard-input-sm"
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="wizard-actions">
                <button type="button" className="btn-edit" onClick={() => setStep(1)}>← Ajustar respuestas</button>
                <button type="button" className="btn-confirm" onClick={() => void saveIcp()} disabled={!isGerente}>
                  {isGerente ? 'Se ve bien →' : 'Solo gerente guarda'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-panel active">
              <div className="wizard-done">
                <div className="wizard-done-icon">✓</div>
                <h3>ICP listo y activo</h3>
                <p>Cada prospecto nuevo se compara contra este perfil y recibe encaje A/B/C.</p>
              </div>
            </div>
          )}
        </div>

        {isGerente && (
          <div className="wizard-card" style={{ marginTop: 20 }}>
            <h3 style={{ marginTop: 0, fontSize: 15 }}>Equipo</h3>
            {msg && <div className="demo-hint" style={{ marginTop: 0 }}>{msg}</div>}
            <table className="team-table" style={{ marginBottom: 16 }}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id || u.uid}>
                    <td>{u.displayName}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <button type="button" className="btn-secondary" onClick={() => toggleActive(u.id || u.uid, u.active)}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <form onSubmit={onInvite}>
              <h3 style={{ fontSize: 14 }}>Invitar usuario</h3>
              <div className="form-field">
                <label>Nombre</label>
                <input value={invite.displayName} onChange={(e) => setInvite({ ...invite, displayName: e.target.value })} required />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} required />
              </div>
              <div className="form-field">
                <label>Contraseña temporal</label>
                <input type="password" value={invite.password} onChange={(e) => setInvite({ ...invite, password: e.target.value })} required minLength={6} />
              </div>
              <div className="form-field">
                <label>Rol</label>
                <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as Role })}>
                  <option value="vendedor">Vendedor</option>
                  <option value="gerente">Gerente</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Creando…' : 'Crear usuario'}</button>
            </form>

            <div style={{ marginTop: 20 }}>
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => void onSeed()}>
                Cargar datos demo del prototipo
              </button>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8 }}>
                Crea Ana, Diego y Lucía (si no existen) y 9 oportunidades. Contraseña demo: Encaje2026!
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
