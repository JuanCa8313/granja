import { db, type GastoHogar, type RetiroUtilidad, type MetricasNegocioCache, type AbonoSocio } from './db';
import { getSupabaseClient } from './supabase';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

export function notificarCambioDatos(origen: string = 'sync') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('granja-db-synced', {
        detail: { origen, timestamp: Date.now() },
      })
    );
  }
}

/**
 * Sube registros pendientes locales (gastos, retiros y abonos no sincronizados) hacia Supabase.
 */
export async function pushCambiosLocalesASupabase(): Promise<{ gastosSubidos: number; retirosSubidos: number; abonosSubidos: number }> {
  const supabase = getSupabaseClient();
  if (!supabase || typeof window === 'undefined' || !navigator.onLine) {
    return { gastosSubidos: 0, retirosSubidos: 0, abonosSubidos: 0 };
  }

  let gastosSubidos = 0;
  let retirosSubidos = 0;
  let abonosSubidos = 0;

  try {
    // 1. Gastos pendientes
    const gastosPendientes = await db.gastosHogar.filter((g) => !g.synced).toArray();
    if (gastosPendientes.length > 0) {
      const payload = gastosPendientes.map((g) => ({
        id: g.id,
        fecha: g.fecha,
        categoria: g.categoria,
        descripcion: g.descripcion,
        monto: g.monto,
        metodo_pago: g.metodoPago,
        pagado_por: g.pagadoPor || 'Juanca',
        registrado_por: g.registradoPor || 'Juanca',
        notas: g.notas || null,
        created_at: g.createdAt,
      }));

      const { error } = await supabase.from('granja_gastos_hogar').upsert(payload, { onConflict: 'id' });
      if (!error) {
        await db.gastosHogar.bulkUpdate(
          gastosPendientes.map((g) => ({
            key: g.id,
            changes: { synced: true },
          }))
        );
        gastosSubidos = gastosPendientes.length;
      }
    }

    // 2. Retiros pendientes
    const retirosPendientes = await db.retirosUtilidad.filter((r) => !r.synced).toArray();
    if (retirosPendientes.length > 0) {
      const payload = retirosPendientes.map((r) => ({
        id: r.id,
        fecha: r.fecha,
        origen_negocio: r.origenNegocio,
        monto: r.monto,
        descripcion: r.descripcion,
        metodo_pago: r.metodoPago,
        destinatario: r.destinatario || 'Juanca',
        registrado_por: r.destinatario || 'Juanca',
        created_at: r.createdAt,
      }));

      const { error } = await supabase.from('granja_retiros_utilidad').upsert(payload, { onConflict: 'id' });
      if (!error) {
        await db.retirosUtilidad.bulkUpdate(
          retirosPendientes.map((r) => ({
            key: r.id,
            changes: { synced: true },
          }))
        );
        retirosSubidos = retirosPendientes.length;
      }
    }

    // 3. Abonos entre socios pendientes
    const abonosPendientes = await db.abonosSocios.filter((a) => !a.synced).toArray();
    if (abonosPendientes.length > 0) {
      const payload = abonosPendientes.map((a) => ({
        id: a.id,
        fecha: a.fecha,
        monto: a.monto,
        pagado_por: a.pagadoPor,
        recibido_por: a.recibidoPor,
        metodo_pago: a.metodoPago,
        descripcion: a.descripcion || null,
        notas: a.notas || null,
        created_at: a.createdAt,
      }));

      const { error } = await supabase.from('granja_abonos_socios').upsert(payload, { onConflict: 'id' });
      if (!error) {
        await db.abonosSocios.bulkUpdate(
          abonosPendientes.map((a) => ({
            key: a.id,
            changes: { synced: true },
          }))
        );
        abonosSubidos = abonosPendientes.length;
      }
    }
    if (gastosSubidos + retirosSubidos + abonosSubidos > 0) {
      notificarCambioDatos('push');
    }
  } catch (err) {
    console.warn('Error en pushCambiosLocalesASupabase:', err);
  }

  return { gastosSubidos, retirosSubidos, abonosSubidos };
}

/**
 * Elimina un registro en Supabase cuando hay conexión para evitar que reaparezca en el siguiente pull.
 */
export async function eliminarRegistroRemoto(
  tabla: 'granja_gastos_hogar' | 'granja_retiros_utilidad' | 'granja_abonos_socios',
  id: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || typeof window === 'undefined' || !navigator.onLine) {
    return;
  }
  try {
    await supabase.from(tabla).delete().eq('id', id);
  } catch (err) {
    console.warn(`Error eliminando registro ${id} de ${tabla}:`, err);
  }
}

/**
 * Descarga desde Supabase los gastos, retiros y métricas actualizadas para consolidar Dexie.
 */
export async function descargarDeSupabase(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || typeof window === 'undefined' || !navigator.onLine) {
    return false;
  }

  try {
    // 1. Descargar gastos del hogar
    const { data: remoteGastos, error: errGastos } = await supabase
      .from('granja_gastos_hogar')
      .select('*')
      .order('fecha', { ascending: false });

    if (!errGastos && remoteGastos && remoteGastos.length > 0) {
      const mapGastos: GastoHogar[] = remoteGastos.map((rg: any) => ({
        id: rg.id,
        fecha: rg.fecha,
        categoria: rg.categoria,
        descripcion: rg.descripcion,
        monto: Number(rg.monto),
        metodoPago: rg.metodo_pago,
        pagadoPor: rg.pagado_por,
        registradoPor: rg.registrado_por,
        notas: rg.notas,
        synced: true,
        createdAt: rg.created_at,
      }));

      await db.gastosHogar.bulkPut(mapGastos);
    }

    // 2. Descargar retiros de utilidad
    const { data: remoteRetiros, error: errRetiros } = await supabase
      .from('granja_retiros_utilidad')
      .select('*')
      .order('fecha', { ascending: false });

    if (!errRetiros && remoteRetiros && remoteRetiros.length > 0) {
      const mapRetiros: RetiroUtilidad[] = remoteRetiros.map((rr: any) => ({
        id: rr.id,
        fecha: rr.fecha,
        origenNegocio: rr.origen_negocio,
        monto: Number(rr.monto),
        descripcion: rr.descripcion,
        metodoPago: rr.metodo_pago,
        destinatario: rr.destinatario,
        synced: true,
        createdAt: rr.created_at,
      }));

      await db.retirosUtilidad.bulkPut(mapRetiros);
    }

    // 2.1 Descargar abonos entre socios
    const { data: remoteAbonos, error: errAbonos } = await supabase
      .from('granja_abonos_socios')
      .select('*')
      .order('fecha', { ascending: false });

    if (!errAbonos && remoteAbonos && remoteAbonos.length > 0) {
      const mapAbonos: AbonoSocio[] = remoteAbonos.map((ra: any) => ({
        id: ra.id,
        fecha: ra.fecha,
        monto: Number(ra.monto),
        pagadoPor: ra.pagado_por,
        recibidoPor: ra.recibido_por,
        metodoPago: ra.metodo_pago,
        descripcion: ra.descripcion,
        notas: ra.notas,
        synced: true,
        createdAt: ra.created_at,
      }));

      await db.abonosSocios.bulkPut(mapAbonos);
    }

    // 3. Descargar métricas de negocios
    const { data: remoteMetricas, error: errMetricas } = await supabase
      .from('granja_metricas_negocios')
      .select('*');

    if (!errMetricas && remoteMetricas && remoteMetricas.length > 0) {
      const mapMetricas: MetricasNegocioCache[] = remoteMetricas.map((rm: any) => ({
        id: rm.id,
        nombre: rm.nombre,
        icono: rm.icono,
        tagline: rm.tagline || '',
        colorGradiente: rm.color_gradiente || 'from-slate-700 to-slate-900',
        kpi1Label: rm.kpi1_label || '',
        kpi1Value: rm.kpi1_value || '',
        kpi2Label: rm.kpi2_label || '',
        kpi2Value: rm.kpi2_value || '',
        kpi3Label: rm.kpi3_label || '',
        kpi3Value: rm.kpi3_value || '',
        estadoBadge: rm.estado_badge || 'Activo',
        estadoTipo: rm.estado_tipo || 'activo',
        subdominioUrl: rm.subdominio_url || '',
        puertoLocal: rm.puerto_local || 3000,
        saldoCajaEstimado: Number(rm.saldo_caja_estimado || 0),
        ultimaActualizacion: rm.ultima_actualizacion || new Date().toISOString(),
      }));

      await db.metricasCache.bulkPut(mapMetricas);
    }

    // 4. Intentar calibrar caja de gallinas directamente desde fact_ventas y fact_gastos si existen
    try {
      const { data: ventasGallinas } = await supabase.from('fact_ventas').select('monto');
      const { data: gastosGallinas } = await supabase.from('fact_gastos').select('monto');
      if (ventasGallinas && gastosGallinas) {
        const totalV = ventasGallinas.reduce((acc, v) => acc + (Number(v.monto) || 0), 0);
        const totalG = gastosGallinas.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
        const saldoCajaGallinas = Math.max(0, totalV - totalG);

        const gallinasCache = await db.metricasCache.get('gallinas');
        if (gallinasCache) {
          await db.metricasCache.update('gallinas', {
            saldoCajaEstimado: saldoCajaGallinas,
            ultimaActualizacion: new Date().toISOString(),
          });
        }
      }
    } catch {
      // Ignorar si las tablas aún no están creadas
    }

    notificarCambioDatos('pull');
    return true;
  } catch (err) {
    console.warn('Error en descargarDeSupabase:', err);
    return false;
  }
}

/**
 * Ejecuta ciclo completo de sincronización bidireccional (Push + Pull).
 */
export async function sincronizarTodo(): Promise<boolean> {
  await pushCambiosLocalesASupabase();
  return await descargarDeSupabase();
}
