'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, AlertCircle, Share, Home } from 'lucide-react';

export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isNonSecure, setIsNonSecure] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    if (!window.isSecureContext) {
      setIsNonSecure(true);
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isAppleDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  if (isNonSecure) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs flex items-center justify-between text-amber-200">
        <div className="flex items-center gap-2 flex-1 pr-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-[11px]">
            Para instalar como App nativa en tu celular, usa <strong>HTTPS</strong> o abre el dominio oficial.
          </span>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-amber-400/80 hover:text-amber-200 p-1 cursor-pointer"
          title="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <div className="bg-gradient-to-r from-amber-600/90 to-yellow-600/90 border-b border-amber-400/30 px-4 py-2.5 text-xs flex items-center justify-between shadow-md text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold backdrop-blur-sm">
            <Home className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <p className="font-bold text-white text-xs">Instalar Granja OS Hub en el celular</p>
            <p className="text-[10px] text-amber-100">Portal maestro y balance familiar en 1 toque</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 bg-white hover:bg-amber-50 text-amber-800 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer shadow active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-amber-200 hover:text-white p-1 cursor-pointer"
            title="Descartar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-2.5 text-xs text-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📲</span>
            <span className="text-[11px]">
              ¿Instalar en iPhone? Toca <Share className="inline w-3.5 h-3.5 text-blue-400" /> y luego <strong>&quot;Agregar a inicio&quot;</strong>.
            </span>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
