import { useMemo } from 'react';
import { GraficoBarras, GraficoDrawdown } from '../components/Charts';
import { Card, StatCard } from '../components/ui';
import { estatisticas, serieDrawdown } from '../lib/calc';
import { formatBRL, formatPercent } from '../lib/format';
import { useStore } from '../lib/store';

export function Relatorio() {
  const { dados, prefs } = useStore();
  const { gestao, registros } = dados;
  const s = useMemo(() => estatisticas(gestao, registros), [gestao, registros]);
  const drawdown = useMemo(() => serieDrawdown(gestao, registros), [gestao, registros]);
  const barras = useMemo(() => [...registros].sort((a,b) => a.data.localeCompare(b.data)).map(r => ({data:r.data, valor:r.resultadoReal})), [registros]);
  return <div className="space-y-4">
    <h2 className="text-base font-bold">Relatório da gestão</h2>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Lucro total" valor={formatBRL(s.lucro,prefs.semCentavos)} positivo={s.lucro>0} negativo={s.lucro<0} />
      <StatCard label="ROI" valor={formatPercent(s.roi)} />
      <StatCard label="Taxa de acerto" valor={formatPercent(s.taxaAcerto)} sub={`${s.diasPositivos} dias positivos de ${s.dias}`} />
      <StatCard label="Drawdown máximo" valor={formatPercent(s.maxDrawdown)} negativo={s.maxDrawdown>0} />
      <StatCard label="Média diária" valor={formatBRL(s.mediaDiaria,prefs.semCentavos)} positivo={s.mediaDiaria>0} negativo={s.mediaDiaria<0} />
      <StatCard label="Melhor dia" valor={formatBRL(s.melhorDia,prefs.semCentavos)} positivo={s.melhorDia>0} />
      <StatCard label="Pior dia" valor={formatBRL(s.piorDia,prefs.semCentavos)} negativo={s.piorDia<0} />
      <StatCard label="Sequências" valor={`${s.maiorSeqLucro} / ${s.maiorSeqPrejuizo}`} sub="Maior sequência lucro / prejuízo" />
    </div>
    <Card><h3 className="mb-3 font-bold">Resultados diários</h3><GraficoBarras dados={barras} /></Card>
    <Card><h3 className="mb-3 font-bold">Drawdown</h3><GraficoDrawdown dados={drawdown} /></Card>
    <Card className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
      <div><p className="text-slate-400">Dias negativos</p><b>{s.diasNegativos}</b></div>
      <div><p className="text-slate-400">Dias neutros</p><b>{s.diasNeutros}</b></div>
      <div><p className="text-slate-400">Média de lucro</p><b>{formatBRL(s.mediaPositivos,prefs.semCentavos)}</b></div>
      <div><p className="text-slate-400">Média de prejuízo</p><b>{formatBRL(s.mediaNegativos,prefs.semCentavos)}</b></div>
    </Card>
  </div>;
}
