import { Target } from 'lucide-react';
import { bancaNecessaria, bancaReal, distanciaParaMeta, progressoMeta } from '../lib/calc';
import { formatBRL, formatDate, formatPercent, formatPercentPoints, hojeISO } from '../lib/format';
import { useStore } from '../lib/store';
import { Card, ProgressBar, Badge } from './ui';

/**
 * Meta do Dia — destaque principal do Dashboard:
 * card grande, em largura total, antes dos demais cards.
 * Progresso pela regra oficial: (real − inicial) ÷ (necessária − inicial),
 * limitado entre 0% e 100%.
 */
export function MetaDoDia() {
  const { dados, prefs } = useStore();
  const { gestao, registros } = dados;
  const real = bancaReal(gestao, registros);
  const necessaria = bancaNecessaria(gestao);
  const progresso = progressoMeta(gestao, registros);
  const falta = distanciaParaMeta(gestao, registros);
  const hoje = registros.find((r) => r.data === hojeISO());
  const metaAtingida = progresso >= 1;
  const semCrescimento = real <= gestao.saldoInicial;

  return (
    <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
            <Target size={24} />
          </span>
          <div>
            <h2 className="text-lg font-bold">Meta do Dia</h2>
            <p className="text-xs text-slate-400">
              Meta de {formatPercentPoints(gestao.metaPercentual)} sobre a banca inicial
            </p>
          </div>
        </div>
        {metaAtingida ? (
          <Badge cor="emerald">Meta atingida 🎉</Badge>
        ) : semCrescimento ? (
          <Badge cor="amber">Sem crescimento ainda</Badge>
        ) : (
          <Badge cor="slate">Em andamento</Badge>
        )}
      </div>

      <div className="mt-5">
        <ProgressBar fracao={progresso} rotulo={formatPercent(progresso)} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-400">Banca inicial</p>
          <p className="text-base font-bold">{formatBRL(gestao.saldoInicial, prefs.semCentavos)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Banca atual</p>
          <p className="text-base font-bold text-emerald-400">{formatBRL(real, prefs.semCentavos)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Banca necessária</p>
          <p className="text-base font-bold">{formatBRL(necessaria, prefs.semCentavos)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">{falta > 0 ? 'Falta para a meta' : 'Acima da meta'}</p>
          <p className={`text-base font-bold ${falta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {formatBRL(Math.abs(falta), prefs.semCentavos)}
          </p>
        </div>
      </div>

      <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-400">
        {hoje
          ? `Hoje (${formatDate(hoje.data)}): resultado de ${formatBRL(hoje.resultadoReal, prefs.semCentavos)}.`
          : 'Nenhum resultado registrado hoje — adicione pelo botão "Registrar resultado".'}
      </p>
    </Card>
  );
}
