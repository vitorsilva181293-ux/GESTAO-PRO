import { useMemo } from 'react';
import { GraficoRealProjetado } from '../components/Charts';
import { Card, StatCard } from '../components/ui';
import { bancaNecessaria, bancaReal, distanciaParaMeta, lucroTotal, progressoMeta, roi, serieBanca, serieProjetada } from '../lib/calc';
import { formatBRL, formatPercent, formatPercentPoints } from '../lib/format';
import { useStore } from '../lib/store';

export function Comparador() {
  const { dados, prefs } = useStore();
  const { gestao, registros } = dados;
  const real = bancaReal(gestao, registros);
  const necessario = bancaNecessaria(gestao);
  const falta = distanciaParaMeta(gestao, registros);
  const proj = useMemo(() => serieProjetada(gestao, registros), [gestao, registros]);
  const curva = useMemo(() => serieBanca(gestao, registros), [gestao, registros]);
  const projetadoFinal = proj.at(-1)?.banca ?? gestao.saldoInicial;
  const projetadoLucro = projetadoFinal - gestao.saldoInicial;
  const projetadoProgresso = necessario > gestao.saldoInicial
    ? Math.max(0, Math.min(1, projetadoLucro / (necessario - gestao.saldoInicial))) : 0;

  return <div className="space-y-4">
    <h2 className="text-base font-bold">Comparador Real × Projetado</h2>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Banca real" valor={formatBRL(real, prefs.semCentavos)} sub={`Lucro ${formatBRL(lucroTotal(registros), prefs.semCentavos)}`} />
      <StatCard label="Banca projetada" valor={formatBRL(projetadoFinal, prefs.semCentavos)} sub="Ritmo médio por dia registrado" />
      <StatCard label="Progresso real" valor={formatPercent(progressoMeta(gestao, registros))} sub={`Meta ${formatPercentPoints(gestao.metaPercentual)}`} />
      <StatCard label="Progresso projetado" valor={formatPercent(projetadoProgresso)} sub={`ROI real ${formatPercent(roi(gestao, registros))}`} />
    </div>
    <Card><h3 className="mb-3 font-bold">Curva da banca</h3><GraficoRealProjetado real={curva} projetado={proj} /></Card>
    <Card className="grid gap-3 sm:grid-cols-3">
      <div><p className="text-xs text-slate-400">Meta de banca</p><p className="font-bold">{formatBRL(necessario, prefs.semCentavos)}</p></div>
      <div><p className="text-xs text-slate-400">Distância atual</p><p className="font-bold">{formatBRL(falta, prefs.semCentavos)}</p></div>
      <div><p className="text-xs text-slate-400">Dias com registro</p><p className="font-bold">{registros.length}</p></div>
    </Card>
  </div>;
}
