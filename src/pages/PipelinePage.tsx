import { useMemo, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useContactos, useEmpresas, useOportunidades } from '../hooks/useData'
import { STAGES, STAGE_LABEL_SHORT, type Oportunidad, type StageKey } from '../types'
import { calcCompletitud, suggestNextAction } from '../lib/heuristics'
import { OpportunityDrawer } from '../components/OpportunityDrawer'

export function PipelinePage({ mobileDefault = false }: { mobileDefault?: boolean }) {
  const { data: oportunidades, loading } = useOportunidades()
  const { data: empresas } = useEmpresas()
  const { data: contactos } = useContactos()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobile, setMobile] = useState(mobileDefault)

  const empresaMap = useMemo(() => Object.fromEntries(empresas.map((e) => [e.id, e])), [empresas])
  const contactoMap = useMemo(() => Object.fromEntries(contactos.map((c) => [c.id, c])), [contactos])
  const selected = oportunidades.find((o) => o.id === selectedId) || null

  async function changeStage(op: Oportunidad, etapa: StageKey) {
    const checklist = op.checklist
    await updateDoc(doc(db, 'oportunidades', op.id), {
      etapa,
      completitud: calcCompletitud(checklist),
      sugerencia: suggestNextAction(etapa, checklist),
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>{mobileDefault ? 'Hoy' : 'Pipeline'}</h1>
          <p>
            Cada tarjeta muestra el encaje con el ICP y cuánta información de valor tiene cargada. Hacé clic para ver el detalle de indagación.
          </p>
        </div>
        {!mobileDefault && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="legend">
              <span><span className="chip" style={{ background: 'var(--status-good)' }} /> Encaje A</span>
              <span><span className="chip" style={{ background: 'var(--status-warning)' }} /> Encaje B</span>
              <span><span className="chip" style={{ background: 'var(--status-serious)' }} /> Encaje C</span>
            </div>
            <div className="view-switch">
              <button type="button" className={!mobile ? 'active' : ''} onClick={() => setMobile(false)}>Escritorio</button>
              <button type="button" className={mobile ? 'active' : ''} onClick={() => setMobile(true)}>Mobile</button>
            </div>
          </div>
        )}
      </div>

      {loading && <div style={{ padding: 28, color: 'var(--text-muted)' }}>Cargando pipeline…</div>}

      {!loading && !mobile && (
        <div className="board-wrap">
          <div className="board">
            {STAGES.map((stage) => {
              const cards = oportunidades.filter((o) => o.etapa === stage.key)
              return (
                <div key={stage.key} className={`column${stage.phaseZero ? ' phase-zero' : ''}${stage.postSale ? ' post-sale' : ''}`}>
                  <div className="column-head">
                    <h2>{stage.label}</h2>
                    <span className="column-count">{cards.length}</span>
                  </div>
                  {cards.map((op) => {
                    const emp = empresaMap[op.empresaId]
                    const contact = op.contactoId ? contactoMap[op.contactoId] : null
                    return (
                      <div key={op.id} className="card" onClick={() => setSelectedId(op.id)}>
                        <div className="card-top">
                          <div>
                            <div className="card-empresa">{emp?.nombre || 'Empresa'}</div>
                            <div className="card-contacto">
                              {contact ? `${contact.nombre} · ${contact.cargo}` : 'Contacto aún sin identificar'}
                            </div>
                          </div>
                          {emp && <span className={`fit-badge fit-${emp.fit}`}>{emp.fit}</span>}
                        </div>
                        <div className="progress-row">
                          <div className="progress-label">
                            <span>Indagación</span>
                            <span>{op.completitud}%</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${op.completitud}%` }} />
                          </div>
                        </div>
                        <div className="card-next"><b>Siguiente:</b> {op.sugerencia.slice(0, 90)}{op.sugerencia.length > 90 ? '…' : ''}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && mobile && (
        <div className="mobile-view" style={{ display: 'flex' }}>
          <div>
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-head">
                <h3>Hoy</h3>
                <p>Priorizado por lo que más te conviene tocar ahora</p>
              </div>
              <div className="phone-list">
                {[...oportunidades]
                  .sort((a, b) => a.completitud - b.completitud)
                  .map((op) => {
                    const emp = empresaMap[op.empresaId]
                    return (
                      <div key={op.id} className="phone-card" onClick={() => setSelectedId(op.id)}>
                        <div className="pc-top">
                          <div>
                            <div className="pc-empresa">{emp?.nombre}</div>
                            <div className="pc-stage">{STAGE_LABEL_SHORT[op.etapa]} · {op.vendedorNombre}</div>
                          </div>
                          {emp && <span className={`fit-badge fit-${emp.fit}`}>{emp.fit}</span>}
                        </div>
                        <div className="pc-action">{op.sugerencia}</div>
                      </div>
                    )
                  })}
              </div>
              <div className="phone-tabbar">
                <div className="active"><div className="tab-dot" />Hoy</div>
                <div><div className="tab-dot" />Pipeline</div>
                <div><div className="tab-dot" />Empresas</div>
                <div><div className="tab-dot" />Más</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <OpportunityDrawer
          oportunidad={selected}
          empresa={empresaMap[selected.empresaId]}
          contacto={selected.contactoId ? contactoMap[selected.contactoId] : undefined}
          onClose={() => setSelectedId(null)}
          onChangeStage={(etapa) => changeStage(selected, etapa)}
        />
      )}
    </>
  )
}
