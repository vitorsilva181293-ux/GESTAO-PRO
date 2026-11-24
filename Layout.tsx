import React from 'react';
import { BarChart3, Cloud, CloudOff, History, LayoutDashboard, Settings, ArrowLeftRight, Wallet } from 'lucide-react';
import type { TabId } from '../lib/types';
import { useStore } from '../lib/store';

const ITENS: { id: TabId; label: string; icone: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icone: <LayoutDashboard size={20} /> },
  { id: 'operacoes', label: 'Operações', icone: <Wallet size={20} /> },
  { id: 'historico', label: 'Histórico', icone: <History size={20} /> },
  { id: 'comparador', label: 'Comparador', icone: <ArrowLeftRight size={20} /> },
  { id: 'relatorio', label: 'Relatório', icone: <BarChart3 size={20} /> },
  { id: 'ajustes', label: 'Ajustes', icone: <Settings size={20} /> },
];

export function Layout({
  tab, setTab, children,
}: {
  tab: TabId; setTab: (t: TabId) => void; children: React.ReactNode;
}) {
  const { dados, modo, erroSync } = useStore();
  const nome = dados.gestao.nome || 'Gestão PRO';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Topo */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold tracking-tight">
              Gestão <span className="text-emerald-400">PRO</span>
            </h1>
            <p className="truncate text-xs text-slate-400">{nome}</p>
          </div>
          <div className="flex items-center gap-2">
            {erroSync && (
              <span className="hidden rounded-full bg-rose-500/15 px-2 py-1 text-xs text-rose-400 sm:block">
                Falha de sincronização
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
              {modo === 'supabase' ? <Cloud size={14} className="text-emerald-400" /> : <CloudOff size={14} className="text-amber-400" />}
              {modo === 'supabase' ? 'Supabase' : 'Local'}
            </span>
          </div>
        </div>
        {/* Navegação desktop */}
        <nav className="mx-auto hidden max-w-6xl items-center gap-1 px-4 pb-2 md:flex">
          {ITENS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                tab === item.id ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              {item.icone}
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-4 md:pb-10">{children}</main>

      {/* Navegação mobile (estilo PWA) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-6">
          {ITENS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                tab === item.id ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {item.icone}
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
