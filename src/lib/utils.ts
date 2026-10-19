/**
 * Utilidades de formato y fechas para Finca Hub
 */

export function formatCOP(amount: number): string {
  if (!Number.isFinite(amount)) return '$ 0';
  const signo = amount < 0 ? '-' : '';
  const absEntero = Math.round(Math.abs(amount));
  const conPuntos = absEntero.toLocaleString('es-CO');
  return `${signo}$ ${conPuntos}`;
}

/**
 * Formatea un número o string numérico agregando puntos de miles y millones (ej: 1550000 -> "1.550.000").
 */
export function formatNumeroMiles(value: number | string): string {
  if (value === '' || value === null || value === undefined) return '';
  const soloDigitos = String(value).replace(/\D/g, '');
  if (!soloDigitos) return '';
  const num = parseInt(soloDigitos, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('es-CO');
}

/**
 * Convierte un string con puntos de miles o separadores en un número entero limpio.
 */
export function parseNumeroMiles(value: string): number {
  if (!value) return 0;
  const soloDigitos = value.replace(/\D/g, '');
  const parsed = parseInt(soloDigitos, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatFechaCorta(fechaStr: string): string {
  if (!fechaStr) return '';
  const partes = fechaStr.split('T')[0].split('-');
  if (partes.length === 3) {
    const [y, m, d] = partes.map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  }
  const date = new Date(fechaStr);
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatFechaCompleta(fechaStr: string): string {
  if (!fechaStr) return '';
  const partes = fechaStr.split('T')[0].split('-');
  if (partes.length === 3) {
    const [y, m, d] = partes.map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
  const date = new Date(fechaStr);
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Devuelve la fecha en formato YYYY-MM-DD usando la zona horaria local del dispositivo,
 * evitando que después de las 7:00 PM (UTC-5) salte al día siguiente por usar toISOString().
 */
export function getFechaLocalYYYYMMDD(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface MovimientoOrdenable {
  id: string;
  fecha: string;
  createdAt?: string;
}

function extraerTimestampDeId(id: string): number {
  // Registros creados en la app tienen formato "gh-1792418805000" o "gh-1792418805000-x1y2"
  // Registros importados de WhatsApp tienen formato "gh-wa-1328"
  if (id.includes('-wa-')) {
    const num = Number(id.split('-wa-')[1]);
    return Number.isFinite(num) ? num : 0;
  }
  const match = id.match(/^(?:gh|ab|ret)-(\d+)/);
  if (match) {
    return Number(match[1]);
  }
  return 0;
}

/**
 * Ordena de manera inmutable una lista de movimientos mostrando siempre el más reciente primero:
 * 1. Por fecha (YYYY-MM-DD) descendente.
 * 2. Si tienen la misma fecha, por createdAt (ISO timestamp) descendente.
 * 3. Si empatan en createdAt, prioriza los registros creados en la app (mayor timestamp en id).
 */
export function ordenarMovimientosRecientesPrimero<T extends MovimientoOrdenable>(
  movimientos: readonly T[]
): T[] {
  return [...movimientos].sort((a, b) => {
    const cmpFecha = (b.fecha || '').localeCompare(a.fecha || '');
    if (cmpFecha !== 0) return cmpFecha;

    const createdA = a.createdAt || '';
    const createdB = b.createdAt || '';
    const cmpCreated = createdB.localeCompare(createdA);
    if (cmpCreated !== 0) return cmpCreated;

    return extraerTimestampDeId(b.id) - extraerTimestampDeId(a.id);
  });
}


