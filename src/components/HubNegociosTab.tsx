'use client';

import React, { useState, useEffect } from 'react';
import { db, type MetricasNegocioCache } from '../lib/db';
import { getResumenFinancieroGlobal, resolverUrlSubApp, type ResumenFinancieroGlobal } from '../lib/hubMetricsService';
import { sincronizarTodo } from '../lib/syncService';
import { formatCOP } from '../lib/utils';
import {
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  CircleCheck,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export function HubNegociosTab() {
  const [metricas, setMetricas] = useState<MetricasNegocioCache[]>([]);
  const [resumen, setResumen] = useState<ResumenFinancieroGlobal | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const cargarDatos = async (forzarSync = false) => {
    setIsRefreshing(true);
    if (forzarSync && typeof window !== 'undefined' && navigator.onLine) {
      await sincronizarTodo();
    }
    const m = await db.metricasCache.toArray();
    const r = await getResumenFinancieroGlobal();
    setMetricas(m);
    setResumen(r);
    setIsRefreshing(false);
  };

  useEffect(() => {
    cargarDatos();
    const handleSync = () => cargarDatos(false);
    window.addEventListener('granja-db-synced', handleSync);
    return () => window.removeEventListener('granja-db-synced', handleSync);
  }, []);

  return (
    <div className="max-w-xl mx-auto p-4 space-y-5 pb-8">
      {/* Banner Principal de Tesorería Consolidada */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white p-5 rounded-3xl shadow-xl border border-amber-500/20">
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚜</span>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-300">
                Granja OS • Hub Central
              </h2>
              <p className="text-[11px] text-slate-400">Resumen consolidado a 2.200 msnm</p>
            </div>
          </div>
          <button
            onClick={() => cargarDatos(true)}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 transition"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
              Caja en Negocios
            </span>
            <span className="text-lg font-black text-amber-400 block mt-0.5">
              {formatCOP(resumen?.saldoTotalNegocios || 0)}
            </span>
            <span className="text-[10px] text-slate-400">Generado en galpones y campo</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
              Retirado a la Casa
            </span>
            <span className="text-lg font-black text-emerald-400 block mt-0.5">
              {formatCOP(resumen?.totalRetirosHogar || 0)}
            </span>
            <span className="text-[10px] text-slate-400">Utilidad transferida al hogar</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold">Flujo Libre Disponible Hogar:</span>
          <span className={`font-black text-sm ${(resumen?.flujoLibreHogar || 0) >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
            {formatCOP(resumen?.flujoLibreHogar || 0)}
          </span>
        </div>
      </div>

      {/* Alerta de Acción Zootécnica Inmediata */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-amber-900">Acciones Prioritarias de Cosecha (Hoy):</p>
          <ul className="text-amber-800/90 text-[11px] space-y-0.5 list-disc list-inside">
            <li><strong>Pollos (60 días):</strong> Vender/sacrificar lote actual para frenar gasto de purina y evitar ascitis.</li>
            <li><strong>Cilantro (8 kg):</strong> Cosechar y entregar a tiendas locales hoy mismo.</li>
            <li><strong>Truchas (5 meses):</strong> Muestreo de talla comercial plato (250-300g).</li>
          </ul>
        </div>
      </div>

      {/* Título de la Sección de Lanzador */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
          <span>Líneas Productivas & Aplicaciones</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
            {metricas.length}
          </span>
        </h3>
        <span className="text-[11px] text-slate-400 font-semibold">Toca para abrir la PWA</span>
      </div>

      {/* Grid de Tarjetas de Negocio */}
      <div className="space-y-3.5">
        {metricas.map((m) => {
          const targetUrl = resolverUrlSubApp(m);
          const isUrgente = m.estadoTipo === 'urgente';

          return (
            <div
              key={m.id}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
            >
              {/* Barra superior de la tarjeta */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${m.colorGradiente} flex items-center justify-center text-xl text-white shadow-sm`}>
                    {m.icono}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-tight">{m.nombre}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{m.tagline}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isUrgente
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                    }`}
                  >
                    {isUrgente && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                    {m.estadoBadge}
                  </span>
                </div>
              </div>

              {/* KPIs de la Línea */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 mb-3 text-center">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">{m.kpi1Label}</span>
                  <span className="text-xs font-black text-slate-800 block truncate">{m.kpi1Value}</span>
                </div>
                <div className="space-y-0.5 border-x border-slate-200/60 px-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">{m.kpi2Label}</span>
                  <span className="text-xs font-black text-slate-800 block truncate">{m.kpi2Value}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">{m.kpi3Label}</span>
                  <span className="text-xs font-black text-slate-800 block truncate">{m.kpi3Value}</span>
                </div>
              </div>

              {/* Botón de Lanzador hacia la PWA */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-slate-400" />
                  <span>PWA 100% Offline</span>
                </div>

                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-xs cursor-pointer active:scale-95 ${
                    isUrgente
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>Abrir {m.nombre.split(' ')[0]}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nota de pie */}
      <div className="text-center pt-2 text-[11px] text-slate-400 space-y-1">
        <p>Granja OS Suite • Diseñado para operar en galpones y campo sin internet</p>
        <p className="text-[10px]">Cada aplicación funciona de manera autónoma en su propio subdominio</p>
      </div>
    </div>
  );
}
