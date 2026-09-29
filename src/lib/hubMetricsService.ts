import { db, type MetricasNegocioCache, type GastoHogar, type RetiroUtilidad } from './db';
import { getSupabaseClient } from './supabase';

export interface ResumenFinancieroGlobal {
  saldoTotalNegocios: number;
  totalRetirosHogar: number;
  totalGastosHogar: number;
  flujoLibreHogar: number; // Retiros - Gastos
  ahorroGlobalTotal: number; // Saldo en negocios + Flujo libre hogar
}

export async function getMetricasNegocios(): Promise<MetricasNegocioCache[]> {
  try {
    const cached = await db.metricasCache.toArray();
    
    // Si estamos online, intentar consultar Supabase para refrescar datos agregados
    if (typeof window !== 'undefined' && navigator.onLine) {
      const supabase = getSupabaseClient();
      if (supabase) {
        // En un paso futuro, consultar tablas como lotes, registros, cosechas si están disponibles
      }
    }

    return cached;
  } catch (e) {
    console.error('Error obteniendo métricas de negocios', e);
    return [];
  }
}

export async function getResumenFinancieroGlobal(): Promise<ResumenFinancieroGlobal> {
  const metricas = await db.metricasCache.toArray();
  const saldoTotalNegocios = metricas.reduce((acc, m) => acc + (m.saldoCajaEstimado || 0), 0);

  const retiros = await db.retirosUtilidad.toArray();
  const totalRetirosHogar = retiros.reduce((acc, r) => acc + r.monto, 0);

  const gastos = await db.gastosHogar.toArray();
  const totalGastosHogar = gastos.reduce((acc, g) => acc + g.monto, 0);

  const flujoLibreHogar = totalRetirosHogar - totalGastosHogar;
  const ahorroGlobalTotal = saldoTotalNegocios + flujoLibreHogar;

  return {
    saldoTotalNegocios,
    totalRetirosHogar,
    totalGastosHogar,
    flujoLibreHogar,
    ahorroGlobalTotal,
  };
}

export function resolverUrlSubApp(metrica: MetricasNegocioCache): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return `http://localhost:${metrica.puertoLocal}`;
    }
  }
  return metrica.subdominioUrl;
}
