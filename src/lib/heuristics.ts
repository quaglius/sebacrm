import type { FitLevel, IcpProfile, ChecklistItem, StageKey } from '../types'

function extractEmployeeRange(text: string): { min: number; max: number } | null {
  const nums = [...text.matchAll(/(\d+)/g)].map((m) => Number(m[1]))
  if (nums.length >= 2) return { min: Math.min(nums[0]!, nums[1]!), max: Math.max(nums[0]!, nums[1]!) }
  if (nums.length === 1) return { min: nums[0]!, max: nums[0]! + 40 }
  return null
}

function empresaEmployeeCount(tamano: string): number | null {
  const m = tamano.match(/(\d+)/)
  return m ? Number(m[1]) : null
}

function rubroTokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[,/·\-|y]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 3)
}

export function calcFit(
  empresa: { rubro: string; tamano: string },
  icp: IcpProfile | null,
): { fit: FitLevel; reason: string } {
  if (!icp) {
    return { fit: 'B', reason: 'Sin ICP cargado: encaje provisional B hasta configurar el perfil.' }
  }

  const icpRubros = rubroTokens(icp.rubroObjetivo)
  const empRubro = empresa.rubro.toLowerCase()
  const rubroHit = icpRubros.some((r) => empRubro.includes(r) || r.includes(empRubro.split(' ')[0] || ''))

  const range = extractEmployeeRange(icp.empleados)
  const count = empresaEmployeeCount(empresa.tamano)
  let sizeHit = true
  if (range && count != null) {
    sizeHit = count >= range.min * 0.7 && count <= range.max * 1.3
  }

  if (rubroHit && sizeHit) {
    return {
      fit: 'A',
      reason: `Rubro y tamaño coinciden con el ICP (${icp.rubroObjetivo}; ${icp.empleados}). Señal fuerte: ${icp.senalFuerte || 'alineación general'}.`,
    }
  }
  if (rubroHit || sizeHit) {
    return {
      fit: 'B',
      reason: rubroHit
        ? 'El rubro encaja, pero el tamaño queda fuera del rango ideal del ICP.'
        : 'El tamaño es razonable, pero el rubro no coincide del todo con el ICP.',
    }
  }
  return {
    fit: 'C',
    reason: `El rubro no coincide con el ICP (${icp.rubroObjetivo}) y el tamaño no entra en el rango objetivo.`,
  }
}

export function suggestIcpFromAnswers(problema: string, clientes: string): Omit<IcpProfile, 'problema' | 'clientesEjemplo'> {
  const blob = `${problema} ${clientes}`.toLowerCase()
  const rubros: string[] = []
  const map: Record<string, string> = {
    alimento: 'Industria alimenticia / bebidas',
    bebida: 'Industria alimenticia / bebidas',
    metal: 'Metalmecánica',
    packaging: 'Packaging',
    envase: 'Packaging',
    agro: 'Agroindustria',
    textil: 'Textil',
    constru: 'Construcción',
    frigor: 'Industria alimenticia / bebidas',
  }
  for (const [k, v] of Object.entries(map)) {
    if (blob.includes(k) && !rubros.includes(v)) rubros.push(v)
  }

  const range = extractEmployeeRange(blob)
  return {
    rubroObjetivo: rubros.join(', ') || 'Empresas industriales medianas',
    facturacion: 'USD 500.000 – 5.000.000 anuales',
    empleados: range ? `${range.min} – ${range.max}` : '40 – 100',
    volumen: 'Media–alta demanda continua',
    senalFuerte: blob.includes('expansi') ? 'Expansión reciente de planta' : 'Producción propia + necesidad de proveedor confiable',
  }
}

export function calcCompletitud(checklist: ChecklistItem[]): number {
  if (!checklist.length) return 0
  const done = checklist.filter((c) => c.done && c.verified !== false).length
  const partial = checklist.filter((c) => c.done && c.verified === false).length
  return Math.round(((done + partial * 0.5) / checklist.length) * 100)
}

export function suggestNextAction(etapa: StageKey, checklist: ChecklistItem[]): string {
  const pending = checklist.find((c) => !c.done)
  const unverified = checklist.find((c) => c.done && c.verified === false)

  if (unverified) {
    return `Confirmá el dato capturado: "${unverified.label}". Un toque alcanza para validarlo antes de avanzar.`
  }
  if (pending) {
    const tips: Partial<Record<StageKey, string>> = {
      fase0: `Priorizá: ${pending.label}. Con el contacto correcto el primer mensaje deja de ser genérico.`,
      prospeccion: `Falta: ${pending.label}. Preguntalo en el próximo llamado antes de empujar a cotización.`,
      oportunidad: `Falta: ${pending.label}. Sin eso la propuesta compite solo por precio.`,
      cotizacion: `Falta: ${pending.label}. Anticipalo antes de enviar la cotización final.`,
      definicion: `Falta: ${pending.label}. Prepará el plan B antes de la fecha de decisión.`,
      postventa: `Falta: ${pending.label}. No asumas que "si no se queja, está bien".`,
    }
    return tips[etapa] || `Completá: ${pending.label}.`
  }
  return 'Indagación de esta etapa completa. Evaluá pasar a la siguiente etapa del pipeline.'
}

export function defaultChecklist(etapa: StageKey): ChecklistItem[] {
  const map: Record<StageKey, string[]> = {
    fase0: [
      'Perfil ICP propio cargado y vigente',
      'Investigación del prospecto (rubro, tamaño, señal de entrada)',
      'Nivel de encaje calculado (A/B/C)',
      'Contacto inicial identificado',
    ],
    prospeccion: [
      'Contacto inicial con nombre y cargo confirmado',
      'Cómo llegamos al contacto',
      'Señal de entrada identificada',
      'Primera pregunta de indagación realizada',
    ],
    oportunidad: [
      'Dolor real identificado',
      'Quién decide y quién influye',
      'Criterios de decisión y competencia',
      'Urgencia / timing real',
    ],
    cotizacion: [
      'Presupuesto estimado conocido',
      'Proceso de aprobación interno mapeado',
      'Objeciones esperables anticipadas',
    ],
    definicion: [
      'Fecha estimada de decisión y próximo paso',
      'Riesgos de la operación identificados',
      'Plan de acción si la respuesta es negativa',
    ],
    postventa: [
      'Entrega: llegó como y cuando se prometió',
      'Utilización: lo están usando como esperaban',
      'Conformidad: está satisfecho, qué mejoraría',
      'Puntos de mejora detectados para la próxima compra',
    ],
  }
  return map[etapa].map((label) => ({ label, done: false }))
}
