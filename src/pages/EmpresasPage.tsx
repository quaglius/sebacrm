import { useState, type FormEvent } from 'react'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useEmpresas, useIcp } from '../hooks/useData'
import { calcFit } from '../lib/heuristics'
import type { Empresa } from '../types'

const empty = { nombre: '', rubro: '', tamano: '', ubicacion: '' }

export function EmpresasPage() {
  const { data: empresas, loading } = useEmpresas()
  const icp = useIcp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Empresa | null>(null)
  const [form, setForm] = useState(empty)

  function openNew() {
    setEditing(null)
    setForm(empty)
    setOpen(true)
  }

  function openEdit(e: Empresa) {
    setEditing(e)
    setForm({ nombre: e.nombre, rubro: e.rubro, tamano: e.tamano, ubicacion: e.ubicacion })
    setOpen(true)
  }

  async function onSave(ev: FormEvent) {
    ev.preventDefault()
    const fit = calcFit(form, icp)
    const payload = { ...form, fit: fit.fit, fitReason: fit.reason }
    if (editing) {
      await updateDoc(doc(db, 'empresas', editing.id), payload)
    } else {
      await addDoc(collection(db, 'empresas'), { ...payload, createdAt: new Date().toISOString() })
    }
    setOpen(false)
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Empresas</h1>
          <p>Prospectos y clientes con encaje ICP calculado por reglas.</p>
        </div>
        <button type="button" className="btn-primary" style={{ width: 'auto' }} onClick={openNew}>
          Nueva empresa
        </button>
      </div>
      <div className="table-wrap">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Rubro</th>
                <th>Tamaño</th>
                <th>Ubicación</th>
                <th>Encaje</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {empresas.map((e) => (
                <tr key={e.id}>
                  <td><b>{e.nombre}</b></td>
                  <td>{e.rubro}</td>
                  <td>{e.tamano}</td>
                  <td>{e.ubicacion}</td>
                  <td><span className={`fit-badge fit-${e.fit}`}>{e.fit}</span></td>
                  <td className="toolbar">
                    <button type="button" className="btn-secondary" onClick={() => openEdit(e)}>Editar</button>
                    <button type="button" className="btn-secondary" onClick={() => deleteDoc(doc(db, 'empresas', e.id))}>Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={onSave}>
            <h2>{editing ? 'Editar empresa' : 'Nueva empresa'}</h2>
            {(['nombre', 'rubro', 'tamano', 'ubicacion'] as const).map((k) => (
              <div className="form-field" key={k}>
                <label>{k[0]!.toUpperCase() + k.slice(1)}</label>
                <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required />
              </div>
            ))}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Guardar</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
