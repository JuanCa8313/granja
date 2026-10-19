'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  db,
  type GastoHogar,
  type RetiroUtilidad,
  type AbonoSocio,
  type CategoriaGastoHogar,
  cargarHistorialWhatsAppEnDexie,
} from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { pushCambiosLocalesASupabase, notificarCambioDatos, eliminarRegistroRemoto, sincronizarTodo } from '../lib/syncService';
import {
  formatCOP,
  formatFechaCorta,
  formatFechaCompleta,
  getFechaLocalYYYYMMDD,
  ordenarMovimientosRecientesPrimero,
  formatNumeroMiles,
  parseNumeroMiles,
} from '../lib/utils';
import {
  Wallet,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  ShoppingCart,
  Zap,
  GraduationCap,
  HeartPulse,
  Wrench,
  Car,
  AlertCircle,
  Trash2,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Scale,
  Sparkles,
  RefreshCw,
  Fish,
  Egg,
  Sprout,
  Milk,
  CreditCard,
  Pencil,
  X,
} from 'lucide-react';

const MESES = [
  { id: 'todos', label: 'Todos los meses' },
  { id: '01', label: 'Enero' },
  { id: '02', label: 'Febrero' },
  { id: '03', label: 'Marzo' },
  { id: '04', label: 'Abril' },
  { id: '05', label: 'Mayo' },
  { id: '06', label: 'Junio' },
  { id: '07', label: 'Julio' },
  { id: '08', label: 'Agosto' },
  { id: '09', label: 'Septiembre' },
  { id: '10', label: 'Octubre' },
  { id: '11', label: 'Noviembre' },
  { id: '12', label: 'Diciembre' },
];

export function CuentasCasaTab() {
  const { userAlias } = useAuth();
  const [gastos, setGastos] = useState<GastoHogar[]>([]);
  const [retiros, setRetiros] = useState<RetiroUtilidad[]>([]);
  const [abonos, setAbonos] = useState<AbonoSocio[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'gastos' | 'abonos' | 'retiros'>('gastos');
  const [tipoListaFiltro, setTipoListaFiltro] = useState<'todos' | 'gastos' | 'abonos' | 'retiros'>('todos');

  // Filtros de fecha
  const hoy = new Date();
  const fechaHoyLocal = getFechaLocalYYYYMMDD(hoy);
  const mesActual = String(hoy.getMonth() + 1).padStart(2, '0');
  const anioActual = hoy.getFullYear().toString();
  const [filtroAnio, setFiltroAnio] = useState<string>(anioActual);
  const [filtroMes, setFiltroMes] = useState<string>(mesActual);

  // Formulario de Gasto
  const [montoGasto, setMontoGasto] = useState('');
  const [fechaGasto, setFechaGasto] = useState<string>(fechaHoyLocal);
  const [categoriaGasto, setCategoriaGasto] = useState<CategoriaGastoHogar>('mercado');
  const [descGasto, setDescGasto] = useState('');
  const [metodoPagoGasto, setMetodoPagoGasto] = useState<'efectivo' | 'banco'>('efectivo');
  const [pagadoPorGasto, setPagadoPorGasto] = useState<string>('Juanca');

  // Formulario de Abono
  const [montoAbono, setMontoAbono] = useState('');
  const [fechaAbono, setFechaAbono] = useState<string>(fechaHoyLocal);
  const [pagadoPorAbono, setPagadoPorAbono] = useState<string>('Camilo');
  const [recibidoPorAbono, setRecibidoPorAbono] = useState<string>('Alex');
  const [descAbono, setDescAbono] = useState('');
  const [metodoPagoAbono, setMetodoPagoAbono] = useState<'efectivo' | 'banco'>('banco');

  // Formulario de Retiro
  const [montoRetiro, setMontoRetiro] = useState('');
  const [fechaRetiro, setFechaRetiro] = useState<string>(fechaHoyLocal);
  const [origenRetiro, setOrigenRetiro] = useState<'gallinas' | 'pollos' | 'cultivos' | 'pescados' | 'general'>('gallinas');
  const [descRetiro, setDescRetiro] = useState('');
  const [metodoPagoRetiro, setMetodoPagoRetiro] = useState<'efectivo' | 'banco'>('efectivo');
  const [destinatarioRetiro, setDestinatarioRetiro] = useState<string>('Juanca');

  // Estado de edición de registro existente
  const [itemEnEdicion, setItemEnEdicion] = useState<{
    id: string;
    tipo: 'gasto' | 'abono' | 'retiro';
    item: GastoHogar | AbonoSocio | RetiroUtilidad;
  } | null>(null);

  const handleCancelarEdicion = () => {
    setItemEnEdicion(null);
    setMontoGasto('');
    setDescGasto('');
    setFechaGasto(fechaHoyLocal);
    setMontoAbono('');
    setDescAbono('');
    setFechaAbono(fechaHoyLocal);
    setMontoRetiro('');
    setDescRetiro('');
    setFechaRetiro(fechaHoyLocal);
  };

  // Sincronizar alias del usuario conectado por defecto
  useEffect(() => {
    if (userAlias) {
      const aliasNorm = normalizarAlias(userAlias);
      setPagadoPorGasto(aliasNorm);
      setDestinatarioRetiro(aliasNorm);
      if (aliasNorm === 'Alex') {
        setPagadoPorAbono('Alex');
        setRecibidoPorAbono('Camilo');
      } else {
        setPagadoPorAbono('Camilo');
        setRecibidoPorAbono('Alex');
      }
    }
  }, [userAlias]);

  const cargarDatos = async () => {
    const [g, r, a] = await Promise.all([
      db.gastosHogar.toArray(),
      db.retirosUtilidad.toArray(),
      db.abonosSocios.toArray(),
    ]);
    setGastos(ordenarMovimientosRecientesPrimero(g));
    setRetiros(ordenarMovimientosRecientesPrimero(r));
    setAbonos(ordenarMovimientosRecientesPrimero(a));
  };

  useEffect(() => {
    cargarDatos();
    const handleSync = (event: Event) => {
      const origen = (event as CustomEvent<{ origen?: string }>).detail?.origen || '';
      if (origen.startsWith('local-') || origen.startsWith('delete-')) {
        return;
      }
      cargarDatos();
    };
    window.addEventListener('granja-db-synced', handleSync);
    return () => window.removeEventListener('granja-db-synced', handleSync);
  }, []);

  const normalizarAlias = (nombre?: string): 'Juanca' | 'Alex' => {
    if (!nombre) return 'Juanca';
    const n = nombre.toLowerCase().trim();
    if (n.includes('alex') || n.includes('zapata') || n.includes('fredy')) return 'Alex';
    return 'Juanca'; // 'Camilo', 'Juanca', 'Juan'
  };

  // Obtener años disponibles a partir de los datos
  const aniosDisponibles = useMemo(() => {
    const setAnios = new Set<string>();
    setAnios.add(anioActual);
    gastos.forEach((g) => g.fecha && setAnios.add(g.fecha.split('-')[0]));
    abonos.forEach((a) => a.fecha && setAnios.add(a.fecha.split('-')[0]));
    retiros.forEach((r) => r.fecha && setAnios.add(r.fecha.split('-')[0]));
    return Array.from(setAnios).sort((a, b) => b.localeCompare(a));
  }, [gastos, abonos, retiros, anioActual]);

  // Función de coincidencia de fecha con el filtro seleccionado
  const coincideFiltro = (fechaStr?: string) => {
    if (!fechaStr) return true;
    const [y, m] = fechaStr.split('-');
    if (filtroAnio !== 'todos' && y !== filtroAnio) return false;
    if (filtroMes !== 'todos' && m !== filtroMes) return false;
    return true;
  };

  // Datos filtrados por fecha
  const gastosFiltrados = useMemo(() => gastos.filter((g) => coincideFiltro(g.fecha)), [gastos, filtroAnio, filtroMes]);
  const abonosFiltrados = useMemo(() => abonos.filter((a) => coincideFiltro(a.fecha)), [abonos, filtroAnio, filtroMes]);
  const retirosFiltrados = useMemo(() => retiros.filter((r) => coincideFiltro(r.fecha)), [retiros, filtroAnio, filtroMes]);

  // Cálculos de liquidación entre socios (Exactos como en Excel)
  const calcularLiquidacion = (listaGastos: GastoHogar[], listaAbonos: AbonoSocio[]) => {
    const gastosAlex = listaGastos
      .filter((g) => normalizarAlias(g.pagadoPor) === 'Alex')
      .reduce((sum, g) => sum + g.monto, 0);

    const gastosCamilo = listaGastos
      .filter((g) => normalizarAlias(g.pagadoPor) === 'Juanca')
      .reduce((sum, g) => sum + g.monto, 0);

    const totalGastos = gastosAlex + gastosCamilo;
    const mitad = totalGastos / 2;

    // Abonos hechos por Camilo hacia Alex
    const abonosCamiloAAlex = listaAbonos
      .filter((a) => normalizarAlias(a.pagadoPor) === 'Juanca' && normalizarAlias(a.recibidoPor) === 'Alex')
      .reduce((sum, a) => sum + a.monto, 0);

    // Abonos hechos por Alex hacia Camilo
    const abonosAlexACamilo = listaAbonos
      .filter((a) => normalizarAlias(a.pagadoPor) === 'Alex' && normalizarAlias(a.recibidoPor) === 'Juanca')
      .reduce((sum, a) => sum + a.monto, 0);

    // Saldo Alex: Aporte en exceso de Alex menos los abonos recibidos de Camilo más abonos dados a Camilo
    // Si saldoAlex > 0: Camilo le debe a Alex
    // Si saldoAlex < 0: Alex le debe a Camilo
    const saldoAlex = (gastosAlex - gastosCamilo) / 2 - abonosCamiloAAlex + abonosAlexACamilo;
    const saldoCamilo = -saldoAlex;

    return {
      gastosAlex,
      gastosCamilo,
      totalGastos,
      mitad,
      abonosCamiloAAlex,
      abonosAlexACamilo,
      totalAbonos: abonosCamiloAAlex + abonosAlexACamilo,
      saldoAlex,
      saldoCamilo,
    };
  };

  const liquidacionPeriodo = useMemo(
    () => calcularLiquidacion(gastosFiltrados, abonosFiltrados),
    [gastosFiltrados, abonosFiltrados]
  );

  const liquidacionHistorica = useMemo(
    () => calcularLiquidacion(gastos, abonos),
    [gastos, abonos]
  );

  const totalRetirosPeriodo = useMemo(
    () => retirosFiltrados.reduce((sum, r) => sum + r.monto, 0),
    [retirosFiltrados]
  );

  const flujoLibrePeriodo = totalRetirosPeriodo - liquidacionPeriodo.totalGastos;

  const categoriasMeta: Record<CategoriaGastoHogar, { label: string; icon: any; color: string }> = {
    mercado: { label: 'Mercado', icon: ShoppingCart, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    servicios: { label: 'Servicios', icon: Zap, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    salud: { label: 'Salud', icon: HeartPulse, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    educacion: { label: 'Educación', icon: GraduationCap, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    transporte: { label: 'Transporte', icon: Car, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    mantenimiento: { label: 'Mantenimiento', icon: Wrench, color: 'text-slate-600 bg-slate-50 border-slate-200' },
    imprevisto: { label: 'Imprevisto', icon: AlertCircle, color: 'text-slate-600 bg-slate-50 border-slate-200' },
    gallinas: { label: 'Gallinas', icon: Egg, color: 'text-amber-700 bg-amber-50 border-amber-300' },
    pollos: { label: 'Pollos', icon: Egg, color: 'text-orange-700 bg-orange-50 border-orange-300' },
    trucha: { label: 'Trucha', icon: Fish, color: 'text-cyan-700 bg-cyan-50 border-cyan-300' },
    tilapia: { label: 'Tilapia', icon: Fish, color: 'text-teal-700 bg-teal-50 border-teal-300' },
    vaca: { label: 'Vaca', icon: Milk, color: 'text-lime-700 bg-lime-50 border-lime-300' },
    cultivo: { label: 'Cultivo', icon: Sprout, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
    creditos: { label: 'Créditos', icon: CreditCard, color: 'text-violet-700 bg-violet-50 border-violet-300' },
  };

  const sincronizarFiltroConFecha = (fechaRegistro: string) => {
    const [anio, mes] = fechaRegistro.split('-');
    if (anio && filtroAnio !== 'todos' && filtroAnio !== anio) {
      setFiltroAnio(anio);
    }
    if (mes && filtroMes !== 'todos' && filtroMes !== mes) {
      setFiltroMes(mes);
    }
  };

  const generarIdLocal = (prefijo: 'gh' | 'ab' | 'ret'): string =>
    `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const handleGuardarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseNumeroMiles(montoGasto);
    if (!valor || valor <= 0) return;

    const fechaFinal = fechaGasto || getFechaLocalYYYYMMDD();

    if (itemEnEdicion && itemEnEdicion.tipo === 'gasto') {
      const gastoOriginal = itemEnEdicion.item as GastoHogar;
      await db.gastosHogar.update(itemEnEdicion.id, {
        fecha: fechaFinal,
        categoria: categoriaGasto,
        descripcion: descGasto.trim() || `Gasto de ${categoriasMeta[categoriaGasto].label}`,
        monto: valor,
        metodoPago: metodoPagoGasto,
        pagadoPor: pagadoPorGasto,
        registradoPor: gastoOriginal.registradoPor || userAlias,
        synced: false,
      });
      handleCancelarEdicion();
      sincronizarFiltroConFecha(fechaFinal);
      await cargarDatos();
      notificarCambioDatos('local-gasto');
      pushCambiosLocalesASupabase();
      return;
    }

    const nuevoGasto: GastoHogar = {
      id: generarIdLocal('gh'),
      fecha: fechaFinal,
      categoria: categoriaGasto,
      descripcion: descGasto.trim() || `Gasto de ${categoriasMeta[categoriaGasto].label}`,
      monto: valor,
      metodoPago: metodoPagoGasto,
      pagadoPor: pagadoPorGasto,
      registradoPor: userAlias,
      synced: false,
      createdAt: new Date().toISOString(),
    };

    await db.gastosHogar.add(nuevoGasto);
    setMontoGasto('');
    setDescGasto('');
    sincronizarFiltroConFecha(fechaFinal);
    await cargarDatos();
    notificarCambioDatos('local-gasto');
    pushCambiosLocalesASupabase();
  };

  const handleGuardarAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseNumeroMiles(montoAbono);
    if (!valor || valor <= 0) return;

    const emisor = pagadoPorAbono;
    const receptor = recibidoPorAbono === emisor ? (emisor === 'Alex' ? 'Camilo' : 'Alex') : recibidoPorAbono;
    const fechaFinal = fechaAbono || getFechaLocalYYYYMMDD();

    if (itemEnEdicion && itemEnEdicion.tipo === 'abono') {
      await db.abonosSocios.update(itemEnEdicion.id, {
        fecha: fechaFinal,
        monto: valor,
        pagadoPor: emisor,
        recibidoPor: receptor,
        metodoPago: metodoPagoAbono,
        descripcion: descAbono.trim() || `Abono de ${emisor} para ${receptor}`,
        synced: false,
      });
      handleCancelarEdicion();
      sincronizarFiltroConFecha(fechaFinal);
      await cargarDatos();
      notificarCambioDatos('local-abono');
      pushCambiosLocalesASupabase();
      return;
    }

    const nuevoAbono: AbonoSocio = {
      id: generarIdLocal('ab'),
      fecha: fechaFinal,
      monto: valor,
      pagadoPor: emisor,
      recibidoPor: receptor,
      metodoPago: metodoPagoAbono,
      descripcion: descAbono.trim() || `Abono de ${emisor} para ${receptor}`,
      synced: false,
      createdAt: new Date().toISOString(),
    };

    await db.abonosSocios.add(nuevoAbono);
    setMontoAbono('');
    setDescAbono('');
    sincronizarFiltroConFecha(fechaFinal);
    await cargarDatos();
    notificarCambioDatos('local-abono');
    pushCambiosLocalesASupabase();
  };

  const handleGuardarRetiro = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseNumeroMiles(montoRetiro);
    if (!valor || valor <= 0) return;

    const fechaFinal = fechaRetiro || getFechaLocalYYYYMMDD();

    if (itemEnEdicion && itemEnEdicion.tipo === 'retiro') {
      await db.retirosUtilidad.update(itemEnEdicion.id, {
        fecha: fechaFinal,
        origenNegocio: origenRetiro,
        monto: valor,
        descripcion: descRetiro.trim() || `Retiro de utilidades de ${origenRetiro}`,
        metodoPago: metodoPagoRetiro,
        destinatario: destinatarioRetiro,
        synced: false,
      });
      handleCancelarEdicion();
      sincronizarFiltroConFecha(fechaFinal);
      await cargarDatos();
      notificarCambioDatos('local-retiro');
      pushCambiosLocalesASupabase();
      return;
    }

    const nuevoRetiro: RetiroUtilidad = {
      id: generarIdLocal('ret'),
      fecha: fechaFinal,
      origenNegocio: origenRetiro,
      monto: valor,
      descripcion: descRetiro.trim() || `Retiro de utilidades de ${origenRetiro}`,
      metodoPago: metodoPagoRetiro,
      destinatario: destinatarioRetiro,
      synced: false,
      createdAt: new Date().toISOString(),
    };

    await db.retirosUtilidad.add(nuevoRetiro);
    setMontoRetiro('');
    setDescRetiro('');
    sincronizarFiltroConFecha(fechaFinal);
    await cargarDatos();
    notificarCambioDatos('local-retiro');
    pushCambiosLocalesASupabase();
  };

  const handleIniciarEdicion = (m: {
    id: string;
    tipo: 'gasto' | 'abono' | 'retiro';
    item: GastoHogar | AbonoSocio | RetiroUtilidad;
  }) => {
    setItemEnEdicion(m);
    if (m.tipo === 'gasto') {
      const g = m.item as GastoHogar;
      setActiveSubTab('gastos');
      setMontoGasto(formatNumeroMiles(g.monto));
      setFechaGasto(g.fecha);
      setCategoriaGasto(g.categoria);
      setDescGasto(g.descripcion);
      setMetodoPagoGasto(g.metodoPago);
      setPagadoPorGasto(normalizarAlias(g.pagadoPor) === 'Alex' ? 'Alex' : 'Juanca');
    } else if (m.tipo === 'abono') {
      const a = m.item as AbonoSocio;
      setActiveSubTab('abonos');
      setMontoAbono(formatNumeroMiles(a.monto));
      setFechaAbono(a.fecha);
      setPagadoPorAbono(normalizarAlias(a.pagadoPor) === 'Alex' ? 'Alex' : 'Camilo');
      setRecibidoPorAbono(normalizarAlias(a.recibidoPor) === 'Alex' ? 'Alex' : 'Camilo');
      setDescAbono(a.descripcion || '');
      setMetodoPagoAbono(a.metodoPago);
    } else {
      const r = m.item as RetiroUtilidad;
      setActiveSubTab('retiros');
      setMontoRetiro(formatNumeroMiles(r.monto));
      setFechaRetiro(r.fecha);
      setOrigenRetiro(r.origenNegocio);
      setDescRetiro(r.descripcion);
      setMetodoPagoRetiro(r.metodoPago);
      setDestinatarioRetiro(normalizarAlias(r.destinatario) === 'Alex' ? 'Alex' : 'Juanca');
    }
    // Desplazar suavemente hacia el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminarGasto = async (id: string) => {
    if (confirm('¿Eliminar este registro de gasto?')) {
      await db.gastosHogar.delete(id);
      await cargarDatos();
      notificarCambioDatos('delete-gasto');
      eliminarRegistroRemoto('granja_gastos_hogar', id);
    }
  };

  const handleEliminarAbono = async (id: string) => {
    if (confirm('¿Eliminar este registro de abono?')) {
      await db.abonosSocios.delete(id);
      await cargarDatos();
      notificarCambioDatos('delete-abono');
      eliminarRegistroRemoto('granja_abonos_socios', id);
    }
  };

  const handleEliminarRetiro = async (id: string) => {
    if (confirm('¿Eliminar este retiro de utilidad?')) {
      await db.retirosUtilidad.delete(id);
      await cargarDatos();
      notificarCambioDatos('delete-retiro');
      eliminarRegistroRemoto('granja_retiros_utilidad', id);
    }
  };

  const prepararAbonoRapido = (deudor: 'Camilo' | 'Alex', acreedor: 'Alex' | 'Camilo', monto: number) => {
    setActiveSubTab('abonos');
    setPagadoPorAbono(deudor);
    setRecibidoPorAbono(acreedor);
    setMontoAbono(formatNumeroMiles(Math.round(monto)));
    setDescAbono(`Abono para saldar cuentas (${deudor} a ${acreedor})`);
  };

  const [isReloading, setIsReloading] = useState<boolean>(false);

  const handleRecargarWhatsApp = async () => {
    setIsReloading(true);
    try {
      await cargarHistorialWhatsAppEnDexie();
      await sincronizarTodo();
      await cargarDatos();
    } finally {
      setIsReloading(false);
    }
  };

  // Consolidar lista de movimientos ordenada por fecha descendente y timestamp de creación descendente
  const movimientosConsolidados = useMemo(() => {
    const items: Array<{
      id: string;
      tipo: 'gasto' | 'abono' | 'retiro';
      fecha: string;
      createdAt?: string;
      synced?: boolean;
      monto: number;
      titulo: string;
      subtitulo: string;
      responsable: string;
      metodo: string;
      item: GastoHogar | AbonoSocio | RetiroUtilidad;
    }> = [];

    if (tipoListaFiltro === 'todos' || tipoListaFiltro === 'gastos') {
      gastosFiltrados.forEach((g) => {
        items.push({
          id: g.id,
          tipo: 'gasto',
          fecha: g.fecha,
          createdAt: g.createdAt,
          synced: g.synced,
          monto: g.monto,
          titulo: g.descripcion,
          subtitulo: `${categoriasMeta[g.categoria]?.label || g.categoria} • ${g.metodoPago}`,
          responsable: normalizarAlias(g.pagadoPor) === 'Alex' ? 'Alex' : 'Camilo',
          metodo: g.metodoPago,
          item: g,
        });
      });
    }

    if (tipoListaFiltro === 'todos' || tipoListaFiltro === 'abonos') {
      abonosFiltrados.forEach((a) => {
        const pagador = normalizarAlias(a.pagadoPor) === 'Alex' ? 'Alex' : 'Camilo';
        const receptor = normalizarAlias(a.recibidoPor) === 'Alex' ? 'Alex' : 'Camilo';
        items.push({
          id: a.id,
          tipo: 'abono',
          fecha: a.fecha,
          createdAt: a.createdAt,
          synced: a.synced,
          monto: a.monto,
          titulo: a.descripcion || `Abono de ${pagador} para ${receptor}`,
          subtitulo: `Transferencia entre socios: ${pagador} ➔ ${receptor} • ${a.metodoPago}`,
          responsable: `${pagador} ➔ ${receptor}`,
          metodo: a.metodoPago,
          item: a,
        });
      });
    }

    if (tipoListaFiltro === 'todos' || tipoListaFiltro === 'retiros') {
      retirosFiltrados.forEach((r) => {
        const dest = normalizarAlias(r.destinatario) === 'Alex' ? 'Alex' : 'Camilo';
        items.push({
          id: r.id,
          tipo: 'retiro',
          fecha: r.fecha,
          createdAt: r.createdAt,
          synced: r.synced,
          monto: r.monto,
          titulo: r.descripcion,
          subtitulo: `Utilidad de ${r.origenNegocio} • Entregado a ${dest}`,
          responsable: dest,
          metodo: r.metodoPago,
          item: r,
        });
      });
    }

    return ordenarMovimientosRecientesPrimero(items);
  }, [gastosFiltrados, abonosFiltrados, retirosFiltrados, tipoListaFiltro]);

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4 pb-12">
      {/* 1. Barra de Filtro de Mes y Año */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-slate-700">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Periodo:</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Mes */}
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {MESES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Selector de Año */}
          <select
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="todos">Todos los años</option>
            {aniosDisponibles.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Botón para sincronizar con la nube y recargar historial sin perder datos */}
          <button
            type="button"
            disabled={isReloading}
            onClick={handleRecargarWhatsApp}
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Sincronizar registros con la nube y WhatsApp"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Tarjeta Destacada de Liquidación (Quién le debe a quién - Exacto como en Excel) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-3xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
        {/* Glow decorativo */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-indigo-200">
              Liquidación entre Socios (50/50)
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
            {filtroMes === 'todos' ? 'Todo el año' : MESES.find((m) => m.id === filtroMes)?.label} {filtroAnio}
          </span>
        </div>

        {/* Cartel principal: Quién le debe a quién */}
        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block mb-0.5">
            Estado de Cuentas del Periodo
          </span>

          {Math.abs(liquidacionPeriodo.saldoAlex) < 1 ? (
            <div className="flex items-center justify-center gap-1.5 text-emerald-300 py-1">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-black text-sm">¡Cuentas al día! Ambos están a mano</span>
            </div>
          ) : liquidacionPeriodo.saldoAlex > 0 ? (
            <div>
              <div className="text-sm sm:text-base font-black text-amber-300">
                Camilo le debe a Alex: <span className="underline decoration-amber-400">{formatCOP(liquidacionPeriodo.saldoAlex)}</span>
              </div>
              <button
                type="button"
                onClick={() => prepararAbonoRapido('Camilo', 'Alex', liquidacionPeriodo.saldoAlex)}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded-xl shadow-xs transition cursor-pointer"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Registrar Abono de Camilo a Alex</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="text-sm sm:text-base font-black text-indigo-300">
                Alex le debe a Camilo: <span className="underline decoration-indigo-400">{formatCOP(liquidacionPeriodo.saldoCamilo)}</span>
              </div>
              <button
                type="button"
                onClick={() => prepararAbonoRapido('Alex', 'Camilo', liquidacionPeriodo.saldoCamilo)}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-[11px] rounded-xl shadow-xs transition cursor-pointer"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Registrar Abono de Alex a Camilo</span>
              </button>
            </div>
          )}
        </div>

        {/* Tabla tipo Excel: Alex vs Camilo */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          {/* Columna Alex */}
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
            <span className="text-[11px] uppercase font-black text-emerald-400 block mb-1">
              💼 Alexander (Alex)
            </span>
            <div className="space-y-1 text-left text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Gastó:</span>
                <b className="text-white">{formatCOP(liquidacionPeriodo.gastosAlex)}</b>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Su 50%:</span>
                <span className="text-slate-400">{formatCOP(liquidacionPeriodo.mitad)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Abonó a Camilo:</span>
                <span className="text-slate-400">{formatCOP(liquidacionPeriodo.abonosAlexACamilo)}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-700 flex justify-between font-black">
                <span className="text-slate-200">Saldo:</span>
                <span className={liquidacionPeriodo.saldoAlex >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                  {formatCOP(liquidacionPeriodo.saldoAlex)}
                </span>
              </div>
            </div>
          </div>

          {/* Columna Camilo */}
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
            <span className="text-[11px] uppercase font-black text-amber-400 block mb-1">
              👑 Camilo (Juanca)
            </span>
            <div className="space-y-1 text-left text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Gastó:</span>
                <b className="text-white">{formatCOP(liquidacionPeriodo.gastosCamilo)}</b>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Su 50%:</span>
                <span className="text-slate-400">{formatCOP(liquidacionPeriodo.mitad)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Abonó a Alex:</span>
                <span className="text-amber-300 font-bold">{formatCOP(liquidacionPeriodo.abonosCamiloAAlex)}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-700 flex justify-between font-black">
                <span className="text-slate-200">Saldo:</span>
                <span className={liquidacionPeriodo.saldoCamilo >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                  {formatCOP(liquidacionPeriodo.saldoCamilo)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de totales del periodo */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-center">
          <div className="p-1.5">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Gastos Casa</span>
            <span className="text-xs font-black text-rose-400">{formatCOP(liquidacionPeriodo.totalGastos)}</span>
          </div>
          <div className="p-1.5">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Abonos Cruzados</span>
            <span className="text-xs font-black text-indigo-300">{formatCOP(liquidacionPeriodo.totalAbonos)}</span>
          </div>
          <div className="p-1.5">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Retiro Utilidad Granja</span>
            <span className="text-xs font-black text-emerald-400">{formatCOP(totalRetirosPeriodo)}</span>
          </div>
        </div>

        {/* Mini indicador de Saldo Histórico Acumulado si está filtrando un mes */}
        {(filtroMes !== 'todos' || filtroAnio !== 'todos') && (
          <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-center text-[10px] text-slate-300">
            <span>Saldo acumulado histórico total: </span>
            {Math.abs(liquidacionHistorica.saldoAlex) < 1 ? (
              <b className="text-emerald-300">Totalmente al día</b>
            ) : liquidacionHistorica.saldoAlex > 0 ? (
              <b className="text-amber-300">Camilo le debe {formatCOP(liquidacionHistorica.saldoAlex)} a Alex (Histórico)</b>
            ) : (
              <b className="text-indigo-300">Alex le debe {formatCOP(liquidacionHistorica.saldoCamilo)} a Camilo (Histórico)</b>
            )}
          </div>
        )}
      </div>

      {/* 3. Selector de 3 Acciones: Gasto, Abono o Retiro */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveSubTab('gastos')}
          className={`py-2 px-2 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
            activeSubTab === 'gastos'
              ? 'bg-white text-rose-700 shadow-xs ring-1 ring-rose-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          <span>Gasto Casa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('abonos')}
          className={`py-2 px-2 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
            activeSubTab === 'abonos'
              ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-indigo-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
          <span>Abonar Socio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('retiros')}
          className={`py-2 px-2 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
            activeSubTab === 'retiros'
              ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
          <span>Utilidad Granja</span>
        </button>
      </div>

      {/* 4. Formulario 1: Gasto del Hogar */}
      {activeSubTab === 'gastos' && (
        <form onSubmit={handleGuardarGasto} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
              {itemEnEdicion?.tipo === 'gasto' ? (
                <>
                  <Pencil className="w-4 h-4 text-amber-600" />
                  <span>Modificar Gasto del Hogar</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-rose-600" />
                  <span>Nuevo Gasto Familiar</span>
                </>
              )}
            </h3>
            {itemEnEdicion?.tipo === 'gasto' ? (
              <button
                type="button"
                onClick={handleCancelarEdicion}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full font-bold cursor-pointer transition"
              >
                <X className="w-3 h-3" />
                <span>Cancelar edición</span>
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 font-semibold">Se divide 50/50</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Valor del Gasto (COP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={montoGasto}
                  onChange={(e) => setMontoGasto(formatNumeroMiles(e.target.value))}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Fecha del Gasto
              </label>
              <input
                type="date"
                required
                value={fechaGasto}
                onChange={(e) => setFechaGasto(e.target.value)}
                className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Categoría
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(categoriasMeta) as CategoriaGastoHogar[]).map((cat) => {
                const meta = categoriasMeta[cat];
                const isSelected = categoriaGasto === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaGasto(cat)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? `${meta.color} font-black shadow-xs ring-2 ring-rose-400`
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Quién puso el dinero (Socio) */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
              <span>¿Quién pagó este gasto?</span>
              <span className="text-[9px] text-slate-400">suma a favor del socio</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPagadoPorGasto('Alex')}
                className={`py-2 px-3 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-2 cursor-pointer ${
                  pagadoPorGasto === 'Alex'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>💼 Alexander (Alex)</span>
              </button>
              <button
                type="button"
                onClick={() => setPagadoPorGasto('Juanca')}
                className={`py-2 px-3 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-2 cursor-pointer ${
                  pagadoPorGasto === 'Juanca'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-950 ring-2 ring-amber-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>👑 Camilo (Juanca)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Método de Pago
              </label>
              <select
                value={metodoPagoGasto}
                onChange={(e) => setMetodoPagoGasto(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="banco">📱 Nequi / Bancolombia</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Detalle / Nota
              </label>
              <input
                type="text"
                value={descGasto}
                onChange={(e) => setDescGasto(e.target.value)}
                placeholder="Ej. Recibo de luz"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3 font-black text-xs rounded-2xl shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
              itemEnEdicion?.tipo === 'gasto'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {itemEnEdicion?.tipo === 'gasto' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Cambios del Gasto</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4" />
                <span>Registrar Salida de Dinero ({pagadoPorGasto === 'Alex' ? 'Alex' : 'Camilo'})</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* 5. Formulario 2: Registrar Abono entre Socios */}
      {activeSubTab === 'abonos' && (
        <form onSubmit={handleGuardarAbono} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
              {itemEnEdicion?.tipo === 'abono' ? (
                <>
                  <Pencil className="w-4 h-4 text-indigo-600" />
                  <span>Modificar Abono entre Socios</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                  <span>Abono Directo entre Socios</span>
                </>
              )}
            </h3>
            {itemEnEdicion?.tipo === 'abono' ? (
              <button
                type="button"
                onClick={handleCancelarEdicion}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full font-bold cursor-pointer transition"
              >
                <X className="w-3 h-3" />
                <span>Cancelar edición</span>
              </button>
            ) : (
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                Saldar Deuda 50/50
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Monto del Abono (COP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(formatNumeroMiles(e.target.value))}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Fecha del Abono
              </label>
              <input
                type="date"
                required
                value={fechaAbono}
                onChange={(e) => setFechaAbono(e.target.value)}
                className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quién entrega a quién */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                ¿Quién Entrega el Abono?
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setPagadoPorAbono('Camilo');
                    setRecibidoPorAbono('Alex');
                  }}
                  className={`flex-1 py-2 px-1 text-xs font-black rounded-xl border transition cursor-pointer text-center ${
                    pagadoPorAbono === 'Camilo'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-900 ring-2 ring-amber-400'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  👑 Camilo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPagadoPorAbono('Alex');
                    setRecibidoPorAbono('Camilo');
                  }}
                  className={`flex-1 py-2 px-1 text-xs font-black rounded-xl border transition cursor-pointer text-center ${
                    pagadoPorAbono === 'Alex'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  💼 Alex
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                ¿Quién Recibe el Dinero?
              </label>
              <div className="w-full py-2 px-3 bg-slate-100 rounded-xl text-xs font-black text-slate-700 text-center border border-slate-200">
                {pagadoPorAbono === 'Camilo' ? '💼 Alexander (Alex)' : '👑 Camilo (Juanca)'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Método de Pago
              </label>
              <select
                value={metodoPagoAbono}
                onChange={(e) => setMetodoPagoAbono(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="banco">📱 Transferencia Nequi/Banco</option>
                <option value="efectivo">💵 Efectivo</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Concepto / Nota
              </label>
              <input
                type="text"
                value={descAbono}
                onChange={(e) => setDescAbono(e.target.value)}
                placeholder="Ej. Abono gastos quincena, Dinero deb"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3 font-black text-xs rounded-2xl shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
              itemEnEdicion?.tipo === 'abono'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {itemEnEdicion?.tipo === 'abono' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Cambios del Abono</span>
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4" />
                <span>Registrar Abono ({pagadoPorAbono} ➔ {recibidoPorAbono})</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* 6. Formulario 3: Retiro de Utilidad de la Granja */}
      {activeSubTab === 'retiros' && (
        <form onSubmit={handleGuardarRetiro} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
              {itemEnEdicion?.tipo === 'retiro' ? (
                <>
                  <Pencil className="w-4 h-4 text-emerald-600" />
                  <span>Modificar Retiro de Utilidades</span>
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  <span>Retiro de Utilidades hacia la Casa</span>
                </>
              )}
            </h3>
            {itemEnEdicion?.tipo === 'retiro' && (
              <button
                type="button"
                onClick={handleCancelarEdicion}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full font-bold cursor-pointer transition"
              >
                <X className="w-3 h-3" />
                <span>Cancelar edición</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Monto a Retirar (COP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={montoRetiro}
                  onChange={(e) => setMontoRetiro(formatNumeroMiles(e.target.value))}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Fecha del Retiro
              </label>
              <input
                type="date"
                required
                value={fechaRetiro}
                onChange={(e) => setFechaRetiro(e.target.value)}
                className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Selector de Quién recibe la utilidad */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              ¿Quién recibe esta utilidad?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDestinatarioRetiro('Juanca')}
                className={`py-2 px-3 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-2 cursor-pointer ${
                  destinatarioRetiro === 'Juanca'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-900 ring-2 ring-amber-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>👑 Camilo (Juanca)</span>
              </button>
              <button
                type="button"
                onClick={() => setDestinatarioRetiro('Alex')}
                className={`py-2 px-3 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-2 cursor-pointer ${
                  destinatarioRetiro === 'Alex'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>💼 Alexander (Alex)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Origen del Negocio
              </label>
              <select
                value={origenRetiro}
                onChange={(e) => setOrigenRetiro(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="gallinas">🐔 Gallinas (Huevos)</option>
                <option value="pollos">🍗 Pollos de Engorde</option>
                <option value="cultivos">🌱 Cultivos & Huerto</option>
                <option value="pescados">🐟 Piscicultura (Trucha/Tilapia)</option>
                <option value="general">🚜 Caja General Granja</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Método de Entrega
              </label>
              <select
                value={metodoPagoRetiro}
                onChange={(e) => setMetodoPagoRetiro(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="banco">📱 Transferencia Banco/Nequi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Motivo / Destino
            </label>
            <input
              type="text"
              value={descRetiro}
              onChange={(e) => setDescRetiro(e.target.value)}
              placeholder="Ej. Ganancia semana huevos para gastos casa"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 font-black text-xs rounded-2xl shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
              itemEnEdicion?.tipo === 'retiro'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {itemEnEdicion?.tipo === 'retiro' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Cambios del Retiro</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Ingresar Utilidad al Hogar</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* 7. Historial y Detalle de Movimientos con Filtros de Lista */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <span>Movimientos del Periodo</span>
            <span className="text-[10px] text-slate-400 font-semibold">({movimientosConsolidados.length})</span>
          </h4>

          {/* Filtro rápido por tipo de registro */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
            <button
              onClick={() => setTipoListaFiltro('todos')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                tipoListaFiltro === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTipoListaFiltro('gastos')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                tipoListaFiltro === 'gastos' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Gastos
            </button>
            <button
              onClick={() => setTipoListaFiltro('abonos')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                tipoListaFiltro === 'abonos' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Abonos
            </button>
            <button
              onClick={() => setTipoListaFiltro('retiros')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                tipoListaFiltro === 'retiros' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Utilidades
            </button>
          </div>
        </div>

        {movimientosConsolidados.length === 0 ? (
          <div className="bg-slate-50 p-6 rounded-2xl text-center text-slate-400 text-xs border border-slate-200/60">
            No hay registros para este periodo seleccionado ({filtroMes === 'todos' ? 'Todo' : MESES.find(m => m.id === filtroMes)?.label} {filtroAnio}).
          </div>
        ) : (
          <div className="space-y-2">
            {movimientosConsolidados.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs shadow-xs transition ${
                  m.tipo === 'gasto'
                    ? 'bg-white border-slate-200'
                    : m.tipo === 'abono'
                    ? 'bg-indigo-50/50 border-indigo-200/80'
                    : 'bg-emerald-50/50 border-emerald-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl font-bold ${
                      m.tipo === 'gasto'
                        ? 'bg-rose-50 text-rose-600'
                        : m.tipo === 'abono'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {m.tipo === 'gasto' ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : m.tipo === 'abono' ? (
                      <ArrowLeftRight className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-slate-800">{m.titulo}</p>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider ${
                          m.tipo === 'abono'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : m.responsable.toLowerCase().includes('alex')
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        👤 {m.responsable}
                      </span>
                      {m.synced === false && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-amber-50 text-amber-700 border border-amber-200"
                          title="Guardado localmente en el dispositivo. Se sincronizará cuando haya internet."
                        >
                          ⏳ Local
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                      {formatFechaCorta(m.fecha)} • {m.subtitulo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                  <span
                    className={`font-black text-xs sm:text-sm ${
                      m.tipo === 'gasto'
                        ? 'text-rose-600'
                        : m.tipo === 'abono'
                        ? 'text-indigo-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {m.tipo === 'gasto' ? '-' : '+'}
                    {formatCOP(m.monto)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleIniciarEdicion(m)}
                      className="p-1 text-slate-300 hover:text-amber-600 transition cursor-pointer"
                      title="Modificar este registro"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (m.tipo === 'gasto') handleEliminarGasto(m.id);
                        else if (m.tipo === 'abono') handleEliminarAbono(m.id);
                        else handleEliminarRetiro(m.id);
                      }}
                      className="p-1 text-slate-300 hover:text-rose-500 transition cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
