export type Role = 'vendedor' | 'gerente'
export type FitLevel = 'A' | 'B' | 'C'
export type StageKey =
  | 'fase0'
  | 'prospeccion'
  | 'oportunidad'
  | 'cotizacion'
  | 'definicion'
  | 'postventa'

export type CaptureSource = 'email' | 'whatsapp' | 'llamada' | 'manual' | 'sistema'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: Role
  active: boolean
}

export interface IcpProfile {
  rubroObjetivo: string
  facturacion: string
  empleados: string
  volumen: string
  senalFuerte: string
  problema: string
  clientesEjemplo: string
  updatedAt?: string
}

export interface ChecklistItem {
  label: string
  done: boolean
  source?: CaptureSource
  verified?: boolean
  capturedValue?: string
  why?: string
}

export interface HistorialItem {
  fecha: string
  nota: string
}

export interface Minuta {
  fecha: string
  origen: CaptureSource
  resumen: string
  proximoVendedor: string
  proximoCliente: string
  enviada: boolean
}

export interface Empresa {
  id: string
  nombre: string
  rubro: string
  tamano: string
  ubicacion: string
  fit: FitLevel
  fitReason: string
  createdAt?: string
}

export interface Contacto {
  id: string
  empresaId: string
  nombre: string
  cargo: string
  email?: string
  telefono?: string
}

export interface Oportunidad {
  id: string
  empresaId: string
  contactoId?: string
  vendedorId: string
  vendedorNombre: string
  etapa: StageKey
  completitud: number
  checklist: ChecklistItem[]
  sugerencia: string
  historial: HistorialItem[]
  minuta?: Minuta | null
  updatedAt?: string
}

export interface ArchivoMeta {
  id: string
  nombre: string
  tipo: string
  tamanio: number
  storagePath: string
  empresaId?: string
  oportunidadId?: string
  uploadedBy: string
  createdAt: string
}

export const STAGES: { key: StageKey; label: string; phaseZero?: boolean; postSale?: boolean }[] = [
  { key: 'fase0', label: 'Fase 0 — Investigación previa', phaseZero: true },
  { key: 'prospeccion', label: 'Prospección' },
  { key: 'oportunidad', label: 'Oportunidad' },
  { key: 'cotizacion', label: 'Cotización' },
  { key: 'definicion', label: 'Definición' },
  { key: 'postventa', label: 'Postventa', postSale: true },
]

export const STAGE_LABEL_SHORT: Record<StageKey, string> = {
  fase0: 'Investigación previa',
  prospeccion: 'Prospección',
  oportunidad: 'Oportunidad',
  cotizacion: 'Cotización',
  definicion: 'Definición',
  postventa: 'Postventa',
}
