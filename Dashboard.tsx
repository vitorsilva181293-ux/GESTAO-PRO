import { useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { MetaDoDia } from '../components/MetaDoDia';
import { RegistroForm } from '../components/RegistroForm';
import { GraficoRealProjetado } from '../components/Charts';
import { Badge, Botao, Card, Modal, StatCard, Vazio } from '../components/ui';
import {
  bancaReal, distanciaParaMeta, distanciaParaStop, estatisticas, lucroTotal,
  nivelStop, roi, serieBanca, serieProjetada,
} from '../lib/calc';
import { formatBRL, formatDate, formatPercent } from '../lib/format';
import { useStore } from '../lib/store';

export function Dashboard() {
  const { dados, prefs } = useStore();
  const { gestao, registros, operacoes } = dados;
  const [modalAberto, setModalAberto] = useState(false);

  const real = bancaReal(gestao, registros);
  const lucro = lucroTotal(registros);
  const stats = useMemo(() => estatisticas(gestao, registros), [gestao, registros]);
  const serie = useMemo(() => serieBanca(gestao, registros), [gestao, registros]);
  const projecao = useMemo(() => serieProjetada(gestao, registros), [gestao, registros]);

  const atividade = useMemo(() => {
    const regs = registros.map((r) => ({
      id: r.id, data: r.data, texto: `Resultado do dia: ${formatBRL(r.resultadoReal, prefs.semCentavos)}`,
      valor: r.resultadoReal, tipo: 'registro' as const,
    }));
    const ops = operacoes.map((o) => ({
      id: o.id, data: o.data,
      texto: `${o.tipo === 'saque' ? 'Saque' : 'Operação'}: ${o.descricao || '—'}`,
      valor: o.valor, tipo: o.tipo,
    }));
    return [...regs, ...ops].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 8);
  }, [registros, operacoes, prefs.semCentavos]);

  const totalSaques = operacoes.filter((o) => o.tipo === 'saque').reduce((a, o) => a + o.valor, 0);
  const totalOperacoes = operacoes.filter((o) => o.tipo === 'operacao').reduce((a, o) => a + o.valor, 0);

  return (
    <div className="space-y-4">
      {/* Meta do Dia — largura total, antes dos demais cards */}
      <MetaDoDia />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold">Visão geral</h2>
        <Botao onClick={() => setModalAberto(true)}>
          <PlusCircle size={16} /> Registrar resultado
        </Botao>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Banca atual" valor={formatBRL(real, prefs.semCentavos)} sub={`${registros.length} dias registrados`} />
        <StatCard
          label="Lucro total" valor={formatBRL(lucro, prefs.semCentavos)}
          positivo={lucro > 0} negativo={lucro < 0}
          sub={`ROI ${formatPercent(roi(gestao, registros))}`}
        />
        <StatCard
          label="Distância p/ meta" valor={formatBRL(distanciaParaMeta(gestao, registros), prefs.semCentavos)}
          positivo={distanciaParaMeta(gestao, registros) <= 0}
          sub="Negativo = meta ultrapassada"
        />
        <StatCard
          label="Distância p/ stop" valor={formatBRL(distanciaParaStop(gestao, registros), prefs.semCentavos)}
          sub={`Stop em ${formatBRL(nivelStop(gestao), prefs.semCentavos)}`}
        />
      </div>

      <Card>
        <h3 className="mb-3 font-bold">Real × Projetado</h3>
        <GraficoRealProjetado real={serie} projetado={projecao} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-bold">Atividade recente</h3>
          {atividade.length === 0 ? (
            <Vazio texto="Nenhuma atividade ainda. Registre um resultado ou uma operação." />
          ) : (
            <ul className="divide-y divide-slate-800">
              {atividade.map((a) => (
                <li key={`${a.tipo}-${a.id}`} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{a.texto}</p>
                    <p className="text-xs text-slate-500">{formatDate(a.data)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${a.valor >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatBRL(a.valor, prefs.semCentavos)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 font-bold">Resumo de movimentações</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Operações (entradas/saídas)</span>
              <Badge cor={totalOperacoes >= 0 ? 'emerald' : 'rose'}>{formatBRL(totalOperacoes, prefs.semCentavos)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Saques</span>
              <Badge cor="amber">{formatBRL(totalSaques, prefs.semCentavos)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Taxa de acerto (dias)</span>
              <Badge>{formatPercent(stats.taxaAcerto)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Média diária</span>
              <Badge cor={stats.mediaDiaria >= 0 ? 'emerald' : 'rose'}>{formatBRL(stats.mediaDiaria, prefs.semCentavos)}</Badge>
            </div>
            <p className="pt-1 text-xs text-slate-500">
              Operações e saques alimentam a atividade e este resumo; a banca é calculada pelos resultados diários.
            </p>
          </div>
        </Card>
      </div>

      <Modal aberto={modalAberto} titulo="Registrar resultado" onFechar={() => setModalAberto(false)}>
        <RegistroForm onFechar={() => setModalAberto(false)} onSalvar={() => setModalAberto(false)} />
      </Modal>
    </div>
  );
}
