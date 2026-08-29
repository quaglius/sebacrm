import { useMemo } from 'react'
import { useEmpresas, useOportunidades, useTeamUsers } from '../hooks/useData'

export function ReportesPage() {
  const { data: oportunidades } = useOportunidades()
  const { data: empresas } = useEmpresas()
  const { data: users } = useTeamUsers()

  const empresaFit = Object.fromEntries(empresas.map((e) => [e.id, e.fit]))

  const kpis = useMemo(() => {
    const total = oportunidades.length
    const avg = total ? Math.round(oportunidades.reduce((s, o) => s + o.completitud, 0) / total) : 0
    const fitA = oportunidades.filter((o) => empresaFit[o.empresaId] === 'A').length
    const stalled = oportunidades.filter((o) => o.completitud < 40 && o.etapa !== 'fase0').length
    return { total, avg, fitA, stalled }
  }, [oportunidades, empresaFit])

  const byVendor = useMemo(() => {
    const map = new Map<string, { name: string; count: number; avg: number; sum: number }>()
    for (const o of oportunidades) {
      const cur = map.get(o.vendedorId) || { name: o.vendedorNombre, count: 0, avg: 0, sum: 0 }
      cur.count += 1
      cur.sum += o.completitud
      cur.avg = Math.round(cur.sum / cur.count)
      map.set(o.vendedorId, cur)
    }
    return [...map.values()]
  }, [oportunidades])

  const fitDist = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0 }
    for (const o of oportunidades) {
      const f = empresaFit[o.empresaId]
      if (f === 'A' || f === 'B' || f === 'C') counts[f] += 1
    }
    return counts
  }, [oportunidades, empresaFit])

  const totalFit = fitDist.A + fitDist.B + fitDist.C || 1

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Reportes — vista de gerencia</h1>
          <p>Salud del pipeline del equipo: visibilidad para acompañar mejor a cada vendedor.</p>
        </div>
      </div>
      <div className="reportes-wrap">
        <div className="kpi-row">
          <div className="kpi-tile">
            <div className="kpi-label">Oportunidades activas</div>
            <div className="kpi-value">{kpis.total}</div>
            <div className="kpi-sub">{users.filter((u) => u.role === 'vendedor').length} vendedores</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Indagación promedio</div>
            <div className="kpi-value">{kpis.avg}%</div>
            <div className="kpi-sub">Completitud de checklist</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Encaje A</div>
            <div className="kpi-value">{kpis.fitA}</div>
            <div className="kpi-sub">Mejor prioridad comercial</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">En riesgo</div>
            <div className={`kpi-value${kpis.stalled ? ' warn' : ''}`}>{kpis.stalled}</div>
            <div className="kpi-sub">Baja indagación fuera de fase 0</div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-card-head">
            <h3>Por vendedor</h3>
            <span className="panel-card-sub">Nivel personal según calidad de indagación</span>
          </div>
          <table className="team-table">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Oportunidades</th>
                <th>Indagación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {byVendor.map((v) => (
                <tr key={v.name}>
                  <td>{v.name}</td>
                  <td>{v.count}</td>
                  <td>
                    <span className="mini-bar-track"><span className="mini-bar-fill" style={{ width: `${v.avg}%` }} /></span>
                    {v.avg}%
                  </td>
                  <td>
                    <span className={`alert-pill ${v.avg >= 50 ? 'ok' : 'warn'}`}>
                      {v.avg >= 50 ? 'En ritmo' : 'Acompañar'}
                    </span>
                  </td>
                </tr>
              ))}
              {!byVendor.length && (
                <tr><td colSpan={4} style={{ color: 'var(--text-muted)' }}>Sin datos todavía.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="panel-card">
          <div className="panel-card-head">
            <h3>Distribución de encaje</h3>
            <span className="panel-card-sub">Todas las oportunidades activas</span>
          </div>
          <div className="fit-bars">
            {(['A', 'B', 'C'] as const).map((f) => (
              <div className="fit-bar-row" key={f}>
                <div className="fbr-label">Encaje {f}</div>
                <span className="fbr-track">
                  <span
                    className="fbr-fill"
                    style={{
                      width: `${(fitDist[f] / totalFit) * 100}%`,
                      background: f === 'A' ? 'var(--status-good)' : f === 'B' ? 'var(--status-warning)' : 'var(--status-serious)',
                    }}
                  />
                </span>
                <div className="fbr-count">{fitDist[f]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
