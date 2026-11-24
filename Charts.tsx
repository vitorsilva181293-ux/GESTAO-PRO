/**
 * Gráficos SVG leves (sem dependência extra).
 * Todos aceitam séries já calculadas pelo motor (calc.ts).
 */
import type { PontoDrawdown, PontoSerie } from '../lib/calc';
import { formatBRL, formatDate, formatPercent } from '../lib/format';

const LARGURA = 720;
const ALTURA = 240;
const PAD = { t: 12, r: 12, b: 28, l: 56 };

function escalaX(i: number, n: number) {
  if (n <= 1) return PAD.l + (LARGURA - PAD.l - PAD.r) / 2;
  return PAD.l + (i / (n - 1)) * (LARGURA - PAD.l - PAD.r);
}

function escalaY(v: number, min: number, max: number) {
  const h = ALTURA - PAD.t - PAD.b;
  if (max === min) return PAD.t + h / 2;
  return PAD.t + (1 - (v - min) / (max - min)) * h;
}

function grade(min: number, max: number, rotulos = 3) {
  const linhas = [];
  for (let i = 0; i <= rotulos; i++) {
    const v = min + ((max - min) * i) / rotulos;
    const y = escalaY(v, min, max);
    linhas.push(
      <g key={i}>
        <line x1={PAD.l} x2={LARGURA - PAD.r} y1={y} y2={y} stroke="#1e293b" strokeWidth="1" />
        <text x={PAD.l - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
          {formatBRL(v, true)}
        </text>
      </g>,
    );
  }
  return linhas;
}

/** Linha dupla: Real × Projetado. */
export function GraficoRealProjetado({ real, projetado }: { real: PontoSerie[]; projetado: PontoSerie[] }) {
  if (real.length === 0) return <p className="text-sm text-slate-400">Sem dados para exibir.</p>;
  const todos = [...real.map((p) => p.banca), ...projetado.map((p) => p.banca)];
  const min = Math.min(...todos);
  const max = Math.max(...todos);
  const n = real.length;
  const caminho = (serie: PontoSerie[]) =>
    serie.map((p, i) => `${i === 0 ? 'M' : 'L'}${escalaX(i, n)},${escalaY(p.banca, min, max)}`).join(' ');
  const area = `${caminho(real)} L${escalaX(n - 1, n)},${escalaY(min, min, max)} L${escalaX(0, n)},${escalaY(min, min, max)} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full" role="img" aria-label="Gráfico Real × Projetado">
        {grade(min, max)}
        <path d={area} fill="#10b981" opacity="0.12" />
        {projetado.length > 0 && (
          <path d={caminho(projetado)} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" />
        )}
        <path d={caminho(real)} fill="none" stroke="#34d399" strokeWidth="2.5" />
        {real.map((p, i) => (
          <circle key={p.data} cx={escalaX(i, n)} cy={escalaY(p.banca, min, max)} r="3" fill="#34d399">
            <title>{`${formatDate(p.data)} — ${formatBRL(p.banca)}`}</title>
          </circle>
        ))}
        <text x={PAD.l} y={ALTURA - 8} fontSize="11" fill="#64748b">{formatDate(real[0].data)}</text>
        <text x={LARGURA - PAD.r} y={ALTURA - 8} textAnchor="end" fontSize="11" fill="#64748b">
          {formatDate(real[n - 1].data)}
        </text>
      </svg>
      <div className="mt-1 flex gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-emerald-400" /> Real</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-amber-400" /> Projetado</span>
      </div>
    </div>
  );
}

/** Barras dos resultados diários (verde = lucro, vermelho = prejuízo). */
export function GraficoBarras({ dados }: { dados: { data: string; valor: number }[] }) {
  if (dados.length === 0) return <p className="text-sm text-slate-400">Sem dados para exibir.</p>;
  const max = Math.max(...dados.map((d) => Math.abs(d.valor)), 1);
  const larguraBarra = Math.max(4, (LARGURA - PAD.l - PAD.r) / dados.length - 3);
  const meio = ALTURA / 2;

  return (
    <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full" role="img" aria-label="Resultados diários">
      <line x1={PAD.l} x2={LARGURA - PAD.r} y1={meio} y2={meio} stroke="#334155" strokeWidth="1" />
      {dados.map((d, i) => {
        const h = (Math.abs(d.valor) / max) * (ALTURA / 2 - PAD.t - 8);
        const x = PAD.l + i * ((LARGURA - PAD.l - PAD.r) / dados.length);
        const y = d.valor >= 0 ? meio - h : meio;
        return (
          <rect key={d.data} x={x} y={y} width={larguraBarra} height={Math.max(2, h)} rx="2"
            fill={d.valor >= 0 ? '#34d399' : '#fb7185'}>
            <title>{`${formatDate(d.data)} — ${formatBRL(d.valor)}`}</title>
          </rect>
        );
      })}
      <text x={PAD.l} y={ALTURA - 8} fontSize="11" fill="#64748b">{formatDate(dados[0].data)}</text>
      <text x={LARGURA - PAD.r} y={ALTURA - 8} textAnchor="end" fontSize="11" fill="#64748b">
        {formatDate(dados[dados.length - 1].data)}
      </text>
    </svg>
  );
}

/** Área de drawdown (% abaixo do pico). */
export function GraficoDrawdown({ dados }: { dados: PontoDrawdown[] }) {
  if (dados.length === 0) return <p className="text-sm text-slate-400">Sem dados para exibir.</p>;
  const max = Math.max(...dados.map((d) => d.drawdown), 0.01);
  const n = dados.length;
  const caminho = dados
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${escalaX(i, n)},${escalaY(p.drawdown, 0, max)}`)
    .join(' ');
  const area = `${caminho} L${escalaX(n - 1, n)},${escalaY(0, 0, max)} L${escalaX(0, n)},${escalaY(0, 0, max)} Z`;

  return (
    <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full" role="img" aria-label="Drawdown">
      {[0, 0.5, 1].map((f) => {
        const v = max * f;
        const y = escalaY(v, 0, max);
        return (
          <g key={f}>
            <line x1={PAD.l} x2={LARGURA - PAD.r} y1={y} y2={y} stroke="#1e293b" strokeWidth="1" />
            <text x={PAD.l - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">{formatPercent(v)}</text>
          </g>
        );
      })}
      <path d={area} fill="#fb7185" opacity="0.25" />
      <path d={caminho} fill="none" stroke="#fb7185" strokeWidth="2" />
      {dados.map((p, i) => (
        <circle key={p.data} cx={escalaX(i, n)} cy={escalaY(p.drawdown, 0, max)} r="3" fill="#fb7185">
          <title>{`${formatDate(p.data)} — DD ${formatPercent(p.drawdown)} (banca ${formatBRL(p.banca)})`}</title>
        </circle>
      ))}
      <text x={PAD.l} y={ALTURA - 8} fontSize="11" fill="#64748b">{formatDate(dados[0].data)}</text>
      <text x={LARGURA - PAD.r} y={ALTURA - 8} textAnchor="end" fontSize="11" fill="#64748b">
        {formatDate(dados[n - 1].data)}
      </text>
    </svg>
  );
}
