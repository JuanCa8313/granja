'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, WifiOff, Home } from 'lucide-react';

interface LoginScreenProps {
  isOnline: boolean;
}

export default function LoginScreen({ isOnline }: LoginScreenProps) {
  const { loginWithGoogle, loginRapido, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado */}
        <div className="text-center space-y-2 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-emerald-600 text-white shadow-lg mb-2">
            <Home className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Granja OS Hub
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Portal Maestro de Negocios & Balance General a 2.200 msnm
          </p>
        </div>

        {/* Estado Sin Internet */}
        {!isOnline && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs p-3.5 rounded-2xl flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] leading-normal">
              Sin conexión a internet. Puedes entrar en Modo Granja Offline abajo.
            </span>
          </div>
        )}

        {/* Botón Google Login */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={isLoading || !isOnline}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold text-sm py-3.5 px-4 rounded-2xl hover:bg-gray-100 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          {/* Acceso Rápido Modo Granja Offline */}
          <div className="pt-3 border-t border-slate-700/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-2.5">
              O entra en Modo Granja (Offline)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loginRapido('administrador')}
                className="py-2.5 px-3 bg-slate-700/70 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-600 transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>👑 Dueño</span>
              </button>
              <button
                type="button"
                onClick={() => loginRapido('operador_granja')}
                className="py-2.5 px-3 bg-slate-700/70 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-600 transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>👨‍🌾 Administrador</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Datos protegidos y sincronizados con Supabase</span>
          </p>
        </div>
      </div>
    </div>
  );
}
