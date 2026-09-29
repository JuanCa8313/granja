/**
 * Utilidades de formato y fechas para Finca Hub
 */

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFechaCorta(fechaStr: string): string {
  if (!fechaStr) return '';
  const date = new Date(fechaStr);
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatFechaCompleta(fechaStr: string): string {
  if (!fechaStr) return '';
  const date = new Date(fechaStr);
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
