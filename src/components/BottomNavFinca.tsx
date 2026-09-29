'use client';

import React from 'react';
import { LayoutGrid, Wallet } from 'lucide-react';

export type GranjaTabType = 'hub' | 'cuentas';
export type FincaTabType = GranjaTabType;

interface BottomNavGranjaProps {
  currentTab: GranjaTabType;
  onTabChange: (tab: GranjaTabType) => void;
}
export type BottomNavFincaProps = BottomNavGranjaProps;

export function BottomNavGranja({ currentTab, onTabChange }: BottomNavGranjaProps) {
  const tabs = [
    {
      id: 'hub' as FincaTabType,
      label: 'Hub Granja',
      icon: LayoutGrid,
      color: 'text-amber-600',
      activeBg: 'bg-amber-50',
    },
    {
      id: 'cuentas' as FincaTabType,
      label: 'Cuentas Casa & Balance',
      icon: Wallet,
      color: 'text-emerald-600',
      activeBg: 'bg-emerald-50',
    },
  ];

  return (
    <nav className="sticky bottom-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? `${tab.activeBg} ${tab.color} font-black shadow-xs ring-1 ring-slate-200/60`
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-bold'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export const BottomNavFinca = BottomNavGranja;
