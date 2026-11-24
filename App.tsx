import { useState } from 'react';
import { Layout } from './components/Layout';
import { useStore } from './lib/store';
import type { TabId } from './lib/types';
import { Dashboard } from './pages/Dashboard';
import { Operacoes } from './pages/Operacoes';
import { Historico } from './pages/Historico';
import { Comparador } from './pages/Comparador';
import { Relatorio } from './pages/Relatorio';
import { Ajustes } from './pages/Ajustes';

export default function App() {
  const { carregando } = useStore();
  const [tab, setTab] = useState<TabId>('dashboard');
  if (carregando) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-emerald-400">Carregando Gestão PRO…</div>;
  const conteudo = {
    dashboard: <Dashboard />, operacoes: <Operacoes />, historico: <Historico />,
    comparador: <Comparador />, relatorio: <Relatorio />, ajustes: <Ajustes />,
  }[tab];
  return <Layout tab={tab} setTab={setTab}>{conteudo}</Layout>;
}
