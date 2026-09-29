'use client';

import React, { useState, useEffect } from 'react';
import { db, type GastoHogar, type RetiroUtilidad, type CategoriaGastoHogar } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { pushCambiosLocalesASupabase } from '../lib/syncService';
import { formatCOP, formatFechaCorta } from '../lib/utils';
import {
  Wallet,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Zap,
  GraduationCap,
  HeartPulse,
  Wrench,
  Car,
  AlertCircle,
  Trash2,
  ArrowDownLeft,
  Users,
} from 'lucide-react';

export function CuentasCasaTab() {
  const { userAlias } = useAuth();
  const [gastos, setGastos] = useState<GastoHogar[]>([]);
  const [retiros, setRetiros] = useState<RetiroUtilidad[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'gastos' | 'retiros'>('gastos');

  // Formulario de Gasto
  const [montoGasto, setMontoGasto] = useState('');
  const [categoriaGasto, setCategoriaGasto] = useState<CategoriaGastoHogar>('mercado');
  const [descGasto, setDescGasto] = useState('');
  const [metodoPagoGasto, setMetodoPagoGasto] = useState<'efectivo' | 'banco'>('efectivo');
  const [pagadoPorGasto, setPagadoPorGasto] = useState<string>(userAlias || 'Juanca');

  // Formulario de Retiro
  const [montoRetiro, setMontoRetiro] = useState('');
  const [origenRetiro, setOrigenRetiro] = useState<'gallinas' | 'pollos' | 'cultivos' | 'general'>('gallinas');
  const [descRetiro, setDescRetiro] = useState('');
  const [metodoPagoRetiro, setMetodoPagoRetiro] = useState<'efectivo' | 'banco'>('efectivo');
  const [destinatarioRetiro, setDestinatarioRetiro] = useState<string>(userAlias || 'Juanca');

  // Sincronizar alias del usuario conectado por defecto
  useEffect(() => {
    if (userAlias) {
      setPagadoPorGasto(userAlias);
      setDestinatarioRetiro(userAlias);
    }
  }, [userAlias]);

  const cargarDatos = async () => {
    const g = await db.gastosHogar.reverse().toArray();
    const r = await db.retirosUtilidad.reverse().toArray();
    setGastos(g);
    setRetiros(r);
  };

  useEffect(() => {
    cargarDatos();
    const handleSync = () => cargarDatos();
    window.addEventListener('granja-db-synced', handleSync);
    return () => window.removeEventListener('granja-db-synced', handleSync);
  }, []);

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
  const totalRetiros = retiros.reduce((sum, r) => sum + r.monto, 0);
  const flujoLibre = totalRetiros - totalGastos;

  const normalizarAlias = (nombre?: string): 'Juanca' | 'Alex' | 'Otro' => {
    if (!nombre) return 'Juanca';
    const n = nombre.toLowerCase().trim();
    if (n.includes('alex') || n.includes('zapata') || n.includes('fredy')) return 'Alex';
    if (n.includes('juanca') || n.includes('camilo') || n.includes('juan')) return 'Juanca';
    return 'Otro';
  };

  const gastosJuanca = gastos
    .filter((g) => normalizarAlias(g.pagadoPor) === 'Juanca')
    .reduce((sum, g) => sum + g.monto, 0);

  const gastosAlex = gastos
    .filter((g) => normalizarAlias(g.pagadoPor) === 'Alex')
    .reduce((sum, g) => sum + g.monto, 0);

  const categoriasMeta: Record<CategoriaGastoHogar, { label: string; icon: any; color: string }> = {
    mercado: { label: 'Mercado', icon: ShoppingCart, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    servicios: { label: 'Servicios', icon: Zap, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    salud: { label: 'Salud', icon: HeartPulse, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    educacion: { label: 'Educación', icon: GraduationCap, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    transporte: { label: 'Transporte', icon: Car, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    mantenimiento: { label: 'Casa & Granja', icon: Wrench, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    imprevisto: { label: 'Imprevisto', icon: AlertCircle, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  };

  const handleGuardarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(montoGasto);
    if (!valor || valor <= 0) return;

    const nuevoGasto: GastoHogar = {
      id: 'gh-' + Date.now(),
      fecha: new Date().toISOString().split('T')[0],
      categoria: categoriaGasto,
      descripcion: descGasto.trim() || `Gasto de ${categoriasMeta[categoriaGasto].label}`,
      monto: valor,
      metodoPago: metodoPagoGasto,
      pagadoPor: pagadoPorGasto.trim() || userAlias || 'Juanca',
      registradoPor: userAlias,
      synced: false,
      createdAt: new Date().toISOString(),
    };

    await db.gastosHogar.add(nuevoGasto);
    setMontoGasto('');
    setDescGasto('');
    await cargarDatos();
    pushCambiosLocalesASupabase();
  };

  const handleGuardarRetiro = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(montoRetiro);
    if (!valor || valor <= 0) return;

    const nuevoRetiro: RetiroUtilidad = {
      id: 'ret-' + Date.now(),
      fecha: new Date().toISOString().split('T')[0],
      origenNegocio: origenRetiro,
      monto: valor,
      descripcion: descRetiro.trim() || `Retiro de utilidades de ${origenRetiro}`,
      metodoPago: metodoPagoRetiro,
      destinatario: destinatarioRetiro.trim() || userAlias || 'Juanca',
      synced: false,
      createdAt: new Date().toISOString(),
    };

    await db.retirosUtilidad.add(nuevoRetiro);
    setMontoRetiro('');
    setDescRetiro('');
    await cargarDatos();
    pushCambiosLocalesASupabase();
  };

  const handleEliminarGasto = async (id: string) => {
    if (confirm('¿Eliminar este registro de gasto?')) {
      await db.gastosHogar.delete(id);
      await cargarDatos();
    }
  };

  const handleEliminarRetiro = async (id: string) => {
    if (confirm('¿Eliminar este retiro de utilidad?')) {
      await db.retirosUtilidad.delete(id);
      await cargarDatos();
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-5 pb-8">
      {/* Tarjeta de Balance General del Hogar */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-5 rounded-3xl shadow-xl border border-emerald-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xs font-black uppercase tracking-wider text-emerald-300">
            Balance General del Hogar
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/60 text-center">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Utilidades Granja (+)</span>
            <span className="text-sm font-black text-emerald-400 block mt-0.5">{formatCOP(totalRetiros)}</span>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/60 text-center">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Gastos Casa (-)</span>
            <span className="text-sm font-black text-rose-400 block mt-0.5">{formatCOP(totalGastos)}</span>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/60 text-center">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Ahorro Libre (=)</span>
            <span className={`text-sm font-black block mt-0.5 ${flujoLibre >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
              {formatCOP(flujoLibre)}
            </span>
          </div>
        </div>

        {/* Aporte de gastos por socio */}
        <div className="mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-slate-800/50 p-2.5 rounded-2xl border border-amber-500/30">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">👑 Puesto por Juanca</span>
            <span className="text-sm font-black text-white">{formatCOP(gastosJuanca)}</span>
          </div>
          <div className="bg-slate-800/50 p-2.5 rounded-2xl border border-emerald-500/30">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">💼 Puesto por Alex</span>
            <span className="text-sm font-black text-white">{formatCOP(gastosAlex)}</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-2.5 text-center">
          Regla de Oro: Las utilidades de los negocios cubren el sustento de la familia sin descapitalizar la granja.
        </p>
      </div>

      {/* Switcher entre Registro de Gasto y Retiro de Utilidad */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveSubTab('gastos')}
          className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'gastos'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Registrar Gasto Casa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('retiros')}
          className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'retiros'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Retirar Utilidad Granja</span>
        </button>
      </div>

      {/* Formulario 1: Gasto del Hogar */}
      {activeSubTab === 'gastos' && (
        <form onSubmit={handleGuardarGasto} className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-rose-600" />
            <span>Nuevo Gasto Familiar</span>
          </h3>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Valor del Gasto (COP)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                inputMode="numeric"
                required
                value={montoGasto}
                onChange={(e) => setMontoGasto(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                        : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Quién puso el dinero (Alias) */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
              <span>¿Quién puso este gasto? (Socio)</span>
              <span className="text-[9px] text-slate-400 font-normal">alias activo: <b className="text-slate-600">{userAlias}</b></span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPagadoPorGasto('Juanca')}
                className={`py-2 px-3 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-2 cursor-pointer ${
                  pagadoPorGasto === 'Juanca'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-900 ring-2 ring-amber-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>👑 Juanca</span>
              </button>
              <button
                type="button"
                onClick={() => setPagadoPorGasto('Alex')}
                className={`py-2 px-3 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-2 cursor-pointer ${
                  pagadoPorGasto === 'Alex'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>💼 Alex</span>
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
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <TrendingDown className="w-4 h-4" />
            <span>Registrar Salida de Dinero ({pagadoPorGasto})</span>
          </button>
        </form>
      )}

      {/* Formulario 2: Retiro de Utilidad de la Granja */}
      {activeSubTab === 'retiros' && (
        <form onSubmit={handleGuardarRetiro} className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            <span>Retiro de Utilidades hacia la Casa</span>
          </h3>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Monto a Retirar (COP)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                inputMode="numeric"
                required
                value={montoRetiro}
                onChange={(e) => setMontoRetiro(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <span>👑 Juanca</span>
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
                <span>💼 Alex</span>
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
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ingresar Utilidad al Hogar</span>
          </button>
        </form>
      )}

      {/* Historial de Movimientos Recientes */}
      <div className="space-y-2 pt-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
          <span>Últimos Movimientos del Hogar</span>
          <span className="text-[10px] text-slate-400 font-semibold">{gastos.length + retiros.length} registros</span>
        </h4>

        {gastos.length === 0 && retiros.length === 0 ? (
          <div className="bg-slate-50 p-6 rounded-2xl text-center text-slate-400 text-xs">
            No hay gastos ni retiros registrados aún.
          </div>
        ) : (
          <div className="space-y-2">
            {gastos.slice(0, 5).map((g) => (
              <div
                key={g.id}
                className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600 font-bold">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-slate-800">{g.descripcion}</p>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider ${
                          (g.pagadoPor || '').toLowerCase().includes('alex')
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        👤 {g.pagadoPor || 'Juanca'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                      {formatFechaCorta(g.fecha)} • {g.categoria} • {g.metodoPago}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-black text-rose-600">-{formatCOP(g.monto)}</span>
                  <button
                    onClick={() => handleEliminarGasto(g.id)}
                    className="p-1 text-slate-300 hover:text-rose-500 transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {retiros.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200/60 flex items-center justify-between text-xs shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-slate-800">{r.descripcion}</p>
                      {r.destinatario && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider bg-emerald-200/70 text-emerald-900 border border-emerald-300">
                          👤 {r.destinatario}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-emerald-700 capitalize mt-0.5">
                      {formatFechaCorta(r.fecha)} • Utilidad de {r.origenNegocio}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-black text-emerald-600">+{formatCOP(r.monto)}</span>
                  <button
                    onClick={() => handleEliminarRetiro(r.id)}
                    className="p-1 text-slate-300 hover:text-rose-500 transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
