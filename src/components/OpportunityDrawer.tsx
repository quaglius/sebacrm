import { useState } from 'react'
import { doc, updateDoc, addDoc, collection, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useArchivos } from '../hooks/useData'
import { calcCompletitud, suggestNextAction } from '../lib/heuristics'
import {
  STAGES,
  type ArchivoMeta,
  type Contacto,
  type Empresa,
  type Oportunidad,
  type StageKey,
} from '../types'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function OpportunityDrawer({
  oportunidad,
  empresa,
  contacto,
  onClose,
  onChangeStage,
}: {
  oportunidad: Oportunidad
  empresa?: Empresa
  contacto?: Contacto
  onClose: () => void
  onChangeStage: (etapa: StageKey) => void
}) {
  const { profile } = useAuth()
  const { data: archivos } = useArchivos({ oportunidadId: oportunidad.id })
  const [openPanel, setOpenPanel] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<number, string>>({})
  const [toast, setToast] = useState('')
  const [uploading, setUploading] = useState(false)

  async function persistChecklist(checklist: Oportunidad['checklist']) {
    const completitud = calcCompletitud(checklist)
    const sugerencia = suggestNextAction(oportunidad.etapa, checklist)
    await updateDoc(doc(db, 'oportunidades', oportunidad.id), {
      checklist,
      completitud,
      sugerencia,
      updatedAt: new Date().toISOString(),
    })
  }

  async function confirmItem(idx: number, corrected: boolean) {
    const checklist = [...oportunidad.checklist]
    const item = { ...checklist[idx]! }
    item.verified = true
    item.done = true
    if (corrected && editValues[idx]) item.capturedValue = editValues[idx]
    checklist[idx] = item
    await persistChecklist(checklist)
    setOpenPanel(null)
    setToast(corrected ? 'Corrección guardada' : 'Dato confirmado')
    setTimeout(() => setToast(''), 2200)
  }

  async function markDone(idx: number) {
    const checklist = [...oportunidad.checklist]
    checklist[idx] = { ...checklist[idx]!, done: true, verified: true, source: 'manual' }
    await persistChecklist(checklist)
  }

  async function onUpload(file: File) {
    if (!profile) return
    if (file.size > 700_000) {
      setToast('Archivo muy grande (máx ~700 KB en capa free)')
      setTimeout(() => setToast(''), 3000)
      return
    }
    setUploading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      await addDoc(collection(db, 'archivos'), {
        nombre: file.name,
        tipo: file.type,
        tamanio: file.size,
        storagePath: '',
        dataUrl,
        oportunidadId: oportunidad.id,
        empresaId: oportunidad.empresaId,
        uploadedBy: profile.uid,
        createdAt: new Date().toISOString(),
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="backdrop open" onClick={onClose} />
      <div className="drawer open">
        <div className="drawer-head" style={{ position: 'relative' }}>
          <button className="drawer-close" type="button" onClick={onClose}>&times;</button>
          <div className="drawer-empresa">{empresa?.nombre || 'Oportunidad'}</div>
          <div className="drawer-meta">
            {empresa?.rubro} · {empresa?.tamano} · {empresa?.ubicacion} · {oportunidad.vendedorNombre}
          </div>
        </div>
        <div className="drawer-body">
          <div className="section-title">Etapa</div>
          <select
            className="stage-select"
            value={oportunidad.etapa}
            onChange={(e) => onChangeStage(e.target.value as StageKey)}
          >
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          <div className="section-title">Encaje con el ICP</div>
          <div className="fit-panel">
            <span className={`fit-badge fit-${empresa?.fit || 'B'}`}>{empresa?.fit || 'B'}</span>
            <p>{empresa?.fitReason || 'Sin motivo de encaje.'}</p>
          </div>

          <div className="section-title">Contacto</div>
          <div className="contact-row">
            <span>{contacto?.nombre || '—'}</span>
            <span className="role">{contacto?.cargo || 'aún sin identificar'}</span>
          </div>

          <div className="section-title">Indagación de esta etapa ({oportunidad.completitud}% completa)</div>
          {oportunidad.checklist.map((item, idx) => {
            if (item.done && item.verified !== false) {
              return (
                <div key={idx} className="checklist-item">
                  <span className="check-icon done">✓</span>
                  <span className="item-label">
                    <span>{item.label}</span>
                    {item.source && <span className="source-tag">{item.source}</span>}
                  </span>
                </div>
              )
            }
            if (item.done && item.verified === false) {
              return (
                <div key={idx} className="checklist-item unverified-row">
                  <div className="row-top" onClick={() => setOpenPanel(openPanel === idx ? null : idx)}>
                    <span className="check-icon unverified">–</span>
                    <span className="item-label">
                      <span>{item.label}</span>
                      <span className="unverified-tag">Pendiente de confirmar</span>
                    </span>
                  </div>
                  <div className={`confirm-panel${openPanel === idx ? ' open' : ''}`}>
                    <div className="detected-label">Detectado</div>
                    <div className="detected-text">"{item.capturedValue || ''}"</div>
                    <textarea
                      value={editValues[idx] ?? item.capturedValue ?? ''}
                      onChange={(e) => setEditValues((v) => ({ ...v, [idx]: e.target.value }))}
                    />
                    <div className="confirm-actions">
                      <button type="button" className="btn-confirm" onClick={() => confirmItem(idx, false)}>Confirmar</button>
                      <button type="button" className="btn-edit" onClick={() => confirmItem(idx, true)}>Guardar corrección</button>
                    </div>
                  </div>
                </div>
              )
            }
            return (
              <div key={idx} className="checklist-item pending-text" onClick={() => markDone(idx)} style={{ cursor: 'pointer' }}>
                <span className="check-icon pending">•</span>
                <span className="item-label"><span>{item.label} — tocar para marcar</span></span>
              </div>
            )
          })}

          <div className="section-title">Sugerencia del sistema</div>
          <div className="suggestion-box"><b>Próxima acción</b>{oportunidad.sugerencia}</div>

          <div className="section-title">Minuta del último contacto</div>
          {oportunidad.minuta ? (
            <div className="minuta-box">
              <div className="minuta-head">
                <b>{oportunidad.minuta.fecha} · {oportunidad.minuta.origen}</b>
                <span className="minuta-tag">{oportunidad.minuta.enviada ? 'Enviada al cliente' : 'Borrador'}</span>
              </div>
              <p style={{ margin: '0 0 6px' }}>{oportunidad.minuta.resumen}</p>
              <div className="minuta-row"><b>Nuestro próximo paso:</b> {oportunidad.minuta.proximoVendedor}</div>
              <div className="minuta-row"><b>Del lado del cliente:</b> {oportunidad.minuta.proximoCliente}</div>
            </div>
          ) : (
            <div className="minuta-box empty">Todavía no hay minuta generada.</div>
          )}

          <div className="section-title">Historial</div>
          {oportunidad.historial.map((h, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-date">{h.fecha}</div>
              <div className="timeline-note">{h.nota}</div>
            </div>
          ))}

          <div className="section-title">Archivos (Firestore free, máx ~700 KB)</div>
          <input
            type="file"
            accept="image/*,application/pdf,text/*"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onUpload(f)
            }}
          />
          <div className="file-list" style={{ marginTop: 10 }}>
            {archivos.map((a) => {
              const withData = a as ArchivoMeta & { dataUrl?: string }
              return (
                <div key={a.id} className="file-row">
                  <a href={withData.dataUrl || '#'} download={a.nombre} target="_blank" rel="noreferrer">
                    {a.nombre}
                  </a>
                  <button type="button" className="btn-edit" onClick={() => deleteDoc(doc(db, 'archivos', a.id))}>
                    Quitar
                  </button>
                </div>
              )
            })}
            {!archivos.length && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin archivos adjuntos.</div>}
          </div>
        </div>
      </div>
      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
    </>
  )
}
