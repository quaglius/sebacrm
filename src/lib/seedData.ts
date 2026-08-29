import type { IcpProfile, StageKey, ChecklistItem, Minuta, CaptureSource } from '../types'

export interface SeedEmpresa {
  key: string
  nombre: string
  rubro: string
  tamano: string
  ubicacion: string
}

export interface SeedContacto {
  empresaKey: string
  nombre: string
  cargo: string
  email?: string
}

export interface SeedOportunidad {
  empresaKey: string
  contactoNombre?: string
  vendedorEmail: string
  etapa: StageKey
  checklist: ChecklistItem[]
  historial: { fecha: string; nota: string }[]
  minuta?: Minuta
}

export const SEED_ICP: IcpProfile = {
  problema: 'Fabricamos e instalamos sistemas de refrigeración industrial para plantas de alimentos y bebidas medianas.',
  clientesEjemplo: 'Frigorífico del Sur, Envases Patagonia — ambos con más de 50 empleados y producción propia.',
  rubroObjetivo: 'Industria alimenticia / bebidas, metalmecánica, packaging',
  facturacion: 'USD 500.000 – 5.000.000 anuales',
  empleados: '40 – 100',
  volumen: 'Media–alta demanda de refrigeración continua',
  senalFuerte: 'Producción propia + expansión reciente de planta',
}

export const SEED_USERS = [
  { email: 'gerente@encaje.demo', password: 'Encaje2026!', displayName: 'Gerente Demo', role: 'gerente' as const },
  { email: 'ana@encaje.demo', password: 'Encaje2026!', displayName: 'Ana Gómez', role: 'vendedor' as const },
  { email: 'diego@encaje.demo', password: 'Encaje2026!', displayName: 'Diego Paz', role: 'vendedor' as const },
  { email: 'lucia@encaje.demo', password: 'Encaje2026!', displayName: 'Lucía Reyes', role: 'vendedor' as const },
]

export const SEED_EMPRESAS: SeedEmpresa[] = [
  { key: 'metalurgica', nombre: 'Metalúrgica Andina S.A.', rubro: 'Metalmecánica', tamano: '45 empleados', ubicacion: 'Rosario, Santa Fe' },
  { key: 'distribuidora', nombre: 'Distribuidora Centro', rubro: 'Distribución mayorista', tamano: '12 empleados', ubicacion: 'Córdoba' },
  { key: 'frigorifico', nombre: 'Frigorífico del Sur', rubro: 'Alimenticia', tamano: '80 empleados', ubicacion: 'Bahía Blanca' },
  { key: 'textil', nombre: 'Textil Norte', rubro: 'Textil', tamano: '30 empleados', ubicacion: 'Tucumán' },
  { key: 'envases', nombre: 'Envases Patagonia', rubro: 'Packaging', tamano: '60 empleados', ubicacion: 'Neuquén' },
  { key: 'agro', nombre: 'AgroInsumos Litoral', rubro: 'Agroindustria', tamano: '25 empleados', ubicacion: 'Santa Fe' },
  { key: 'vallejo', nombre: 'Construcciones Vallejo', rubro: 'Construcción', tamano: '38 empleados', ubicacion: 'Mendoza' },
  { key: 'ceramica', nombre: 'Cerámica Bellavista', rubro: 'Manufactura', tamano: '55 empleados', ubicacion: 'San Juan' },
  { key: 'herrajes', nombre: 'Herrajes del Plata', rubro: 'Metalmecánica', tamano: '40 empleados', ubicacion: 'La Plata' },
]

export const SEED_CONTACTOS: SeedContacto[] = [
  { empresaKey: 'frigorifico', nombre: 'Marcela Ibáñez', cargo: 'Jefa de Compras', email: 'marcela@frigosur.demo' },
  { empresaKey: 'textil', nombre: 'Roberto Salas', cargo: 'Gerente General' },
  { empresaKey: 'envases', nombre: 'Julián Ferreira', cargo: 'Gerente de Operaciones', email: 'julian@envases.demo' },
  { empresaKey: 'agro', nombre: 'Diego Correa', cargo: 'Encargado de Compras' },
  { empresaKey: 'vallejo', nombre: 'Laura Peña', cargo: 'Administradora' },
  { empresaKey: 'ceramica', nombre: 'Martín Ocampo', cargo: 'Director Comercial' },
  { empresaKey: 'herrajes', nombre: 'Sandra Molina', cargo: 'Jefa de Compras' },
]

function item(label: string, done: boolean, source?: CaptureSource, verified?: boolean, capturedValue?: string, why?: string): ChecklistItem {
  return { label, done, source, verified, capturedValue, why }
}

export const SEED_OPORTUNIDADES: SeedOportunidad[] = [
  {
    empresaKey: 'metalurgica',
    vendedorEmail: 'ana@encaje.demo',
    etapa: 'fase0',
    checklist: [
      item('Perfil ICP propio cargado y vigente', true, 'manual', true),
      item('Investigación del prospecto (rubro, tamaño, señal de entrada)', true, 'manual', true),
      item('Nivel de encaje calculado (A/B/C)', true, 'sistema', true),
      item('Contacto inicial identificado', false),
    ],
    historial: [
      { fecha: '12 ago', nota: 'Señal detectada: búsqueda de proveedor publicada en LinkedIn.' },
      { fecha: '13 ago', nota: 'Encaje calculado automáticamente.' },
    ],
  },
  {
    empresaKey: 'distribuidora',
    vendedorEmail: 'ana@encaje.demo',
    etapa: 'fase0',
    checklist: [
      item('Perfil ICP propio cargado y vigente', true, 'manual', true),
      item('Investigación del prospecto (rubro, tamaño, señal de entrada)', true, 'manual', true),
      item('Nivel de encaje calculado (A/B/C)', true, 'sistema', true),
      item('Contacto inicial identificado', false),
    ],
    historial: [
      { fecha: '10 ago', nota: 'Cargado desde formulario web (entrante).' },
      { fecha: '11 ago', nota: 'Encaje calculado automáticamente.' },
    ],
  },
  {
    empresaKey: 'frigorifico',
    contactoNombre: 'Marcela Ibáñez',
    vendedorEmail: 'diego@encaje.demo',
    etapa: 'prospeccion',
    checklist: [
      item('Contacto inicial con nombre y cargo confirmado', true, 'email', true),
      item('Cómo llegamos al contacto', true, 'manual', true),
      item('Señal de entrada identificada', true, 'manual', true),
      item('Primera pregunta de indagación realizada', false),
    ],
    historial: [
      { fecha: '08 ago', nota: 'Contacto confirmado vía LinkedIn: Marcela Ibáñez, Jefa de Compras.' },
      { fecha: '09 ago', nota: 'Llamada agendada.' },
    ],
  },
  {
    empresaKey: 'textil',
    contactoNombre: 'Roberto Salas',
    vendedorEmail: 'diego@encaje.demo',
    etapa: 'prospeccion',
    checklist: [
      item('Contacto inicial con nombre y cargo confirmado', true, 'whatsapp', false, 'Roberto Salas, mencionado como "gerente general" en el chat de WhatsApp.', 'Con el contacto correcto el próximo mensaje puede ser específico.'),
      item('Cómo llegamos al contacto', true, 'manual', true),
      item('Señal de entrada identificada', false),
      item('Primera pregunta de indagación realizada', false),
    ],
    historial: [{ fecha: '14 ago', nota: 'Referido por cliente actual (Hilados SRL).' }],
  },
  {
    empresaKey: 'envases',
    contactoNombre: 'Julián Ferreira',
    vendedorEmail: 'ana@encaje.demo',
    etapa: 'oportunidad',
    checklist: [
      item('Dolor real identificado', true, 'llamada', false, 'Julián: "hoy perdemos entregas por las demoras del proveedor actual."', 'Cuando vendedor y comprador se alinean sobre el problema real, la tasa de cierre sube.'),
      item('Quién decide y quién influye', true, 'llamada', true),
      item('Criterios de decisión y competencia', false),
      item('Urgencia / timing real', true, 'whatsapp', false, 'WhatsApp: "Necesitamos resolver esto antes de fin de mes."', 'Saber el timing real evita perseguir una oportunidad sin apuro.'),
    ],
    historial: [
      { fecha: '02 ago', nota: 'Reunión de indagación: dolor identificado — demoras de despacho.' },
      { fecha: '07 ago', nota: 'Confirmado que Julián decide; el dueño aprueba.' },
    ],
    minuta: {
      fecha: '07 ago',
      origen: 'llamada',
      resumen: 'Julián confirmó demoras del proveedor actual y necesidad de resolver antes de fin de mes. Él decide lo técnico; el dueño aprueba el gasto.',
      proximoVendedor: 'Enviar comparativo de tiempos de entrega actuales vs. propuestos.',
      proximoCliente: 'Confirmar disponibilidad del dueño para una llamada corta.',
      enviada: true,
    },
  },
  {
    empresaKey: 'agro',
    contactoNombre: 'Diego Correa',
    vendedorEmail: 'lucia@encaje.demo',
    etapa: 'oportunidad',
    checklist: [
      item('Dolor real identificado', true, 'llamada', true),
      item('Quién decide y quién influye', false),
      item('Criterios de decisión y competencia', false),
      item('Urgencia / timing real', true, 'email', false, 'Email: "Nos gustaría avanzar antes de que termine el trimestre."'),
    ],
    historial: [{ fecha: '05 ago', nota: 'Primera reunión: dolor identificado — costo alto del proveedor actual.' }],
  },
  {
    empresaKey: 'vallejo',
    contactoNombre: 'Laura Peña',
    vendedorEmail: 'diego@encaje.demo',
    etapa: 'cotizacion',
    checklist: [
      item('Presupuesto estimado conocido', true, 'whatsapp', false, 'WhatsApp: "Tenemos entre 3800 y 4200 dólares aprobados."', 'Con el presupuesto confirmado, la cotización deja de ser un tiro a ciegas.'),
      item('Proceso de aprobación interno mapeado', true, 'llamada', true),
      item('Objeciones esperables anticipadas', false),
    ],
    historial: [
      { fecha: '28 jul', nota: 'Presupuesto informado: hasta USD 4.200.' },
      { fecha: '01 ago', nota: 'Laura arma la propuesta; el dueño firma.' },
    ],
  },
  {
    empresaKey: 'ceramica',
    contactoNombre: 'Martín Ocampo',
    vendedorEmail: 'lucia@encaje.demo',
    etapa: 'definicion',
    checklist: [
      item('Fecha estimada de decisión y próximo paso', true, 'email', true),
      item('Riesgos de la operación identificados', true, 'llamada', false, 'Martín: "el presupuesto anual capaz ya está comprometido."', 'Anticipar el riesgo permite un plan B.'),
      item('Plan de acción si la respuesta es negativa', false),
    ],
    historial: [
      { fecha: '15 ago', nota: 'Cotización aprobada por el área técnica.' },
      { fecha: '16 ago', nota: 'Fecha de decisión confirmada.' },
    ],
  },
  {
    empresaKey: 'herrajes',
    contactoNombre: 'Sandra Molina',
    vendedorEmail: 'ana@encaje.demo',
    etapa: 'postventa',
    checklist: [
      item('Entrega: llegó como y cuando se prometió', true, 'whatsapp', false, 'Sandra: "llegó todo completo y en fecha, gracias."', 'Confirmar la entrega real evita enterarse tarde de un problema logístico.'),
      item('Utilización: lo están usando como esperaban', true, 'llamada', true),
      item('Conformidad: está satisfecho, qué mejoraría', false),
      item('Puntos de mejora detectados para la próxima compra', false),
    ],
    historial: [
      { fecha: '22 jul', nota: 'Oportunidad ganada — pasa a postventa.' },
      { fecha: '10 ago', nota: 'Entrega confirmada por WhatsApp.' },
    ],
    minuta: {
      fecha: '10 ago',
      origen: 'whatsapp',
      resumen: 'Sandra confirmó entrega completa y en fecha. Pendiente validar utilización y conformidad.',
      proximoVendedor: 'Llamar esta semana para preguntar por utilización y conformidad real.',
      proximoCliente: 'Avisar si surge cualquier inconveniente.',
      enviada: false,
    },
  },
]
