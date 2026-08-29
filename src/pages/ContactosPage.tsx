import { useState, type FormEvent } from 'react'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useContactos, useEmpresas } from '../hooks/useData'
import type { Contacto } from '../types'

const empty = { empresaId: '', nombre: '', cargo: '', email: '', telefono: '' }

export function ContactosPage() {
  const { data: contactos, loading } = useContactos()
  const { data: empresas } = useEmpresas()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Contacto | null>(null)
  const [form, setForm] = useState(empty)

  const empresaName = Object.fromEntries(empresas.map((e) => [e.id, e.nombre]))

  function openNew() {
    setEditing(null)
    setForm({ ...empty, empresaId: empresas[0]?.id || '' })
    setOpen(true)
  }

  function openEdit(c: Contacto) {
    setEditing(c)
    setForm({
      empresaId: c.empresaId,
      nombre: c.nombre,
      cargo: c.cargo,
      email: c.email || '',
      telefono: c.telefono || '',
    })
    setOpen(true)
  }

  async function onSave(ev: FormEvent) {
    ev.preventDefault()
    if (editing) {
      await updateDoc(doc(db, 'contactos', editing.id), form)
    } else {
      await addDoc(collection(db, 'contactos'), form)
    }
    setOpen(false)
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Contactos</h1>
          <p>Personas de contacto vinculadas a cada empresa.</p>
        </div>
        <button type="button" className="btn-primary" style={{ width: 'auto' }} onClick={openNew} disabled={!empresas.length}>
          Nuevo contacto
        </button>
      </div>
      <div className="table-wrap">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Empresa</th>
                <th>Email</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {contactos.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.nombre}</b></td>
                  <td>{c.cargo}</td>
                  <td>{empresaName[c.empresaId] || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td className="toolbar">
                    <button type="button" className="btn-secondary" onClick={() => openEdit(c)}>Editar</button>
                    <button type="button" className="btn-secondary" onClick={() => deleteDoc(doc(db, 'contactos', c.id))}>Borrar</button>
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
            <h2>{editing ? 'Editar contacto' : 'Nuevo contacto'}</h2>
            <div className="form-field">
              <label>Empresa</label>
              <select value={form.empresaId} onChange={(e) => setForm({ ...form, empresaId: e.target.value })} required>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
            {(['nombre', 'cargo', 'email', 'telefono'] as const).map((k) => (
              <div className="form-field" key={k}>
                <label>{k[0]!.toUpperCase() + k.slice(1)}</label>
                <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={k === 'nombre' || k === 'cargo'} />
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
