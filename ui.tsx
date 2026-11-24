import React from 'react';

/** Cartão genérico. */
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 ${className}`}>
      {children}
    </section>
  );
}

/** Cartão de estatística (label + valor + opcional). */
export function StatCard({
  label, valor, sub, positivo, negativo,
}: {
  label: string; valor: string; sub?: string; positivo?: boolean; negativo?: boolean;
}) {
  const cor = positivo ? 'text-emerald-400' : negativo ? 'text-rose-400' : 'text-slate-100';
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold sm:text-2xl ${cor}`}>{valor}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}

/** Barra de progresso com % rotulada. `fracao` é 0–1. */
export function ProgressBar({ fracao, rotulo }: { fracao: number; rotulo?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, fracao)) * 100);
  return (
    <div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {rotulo && <p className="mt-2 text-right text-sm font-semibold text-emerald-400">{rotulo}</p>}
    </div>
  );
}

export function Badge({ children, cor = 'slate' }: { children: React.ReactNode; cor?: 'slate' | 'emerald' | 'rose' | 'amber' }) {
  const cores: Record<string, string> = {
    slate: 'bg-slate-800 text-slate-300',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    rose: 'bg-rose-500/15 text-rose-400',
    amber: 'bg-amber-500/15 text-amber-400',
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cores[cor]}`}>{children}</span>;
}

export function Botao({
  children, onClick, variante = 'primario', desabilitado = false, tipo = 'button',
}: {
  children: React.ReactNode; onClick?: () => void; variante?: 'primario' | 'secundario' | 'perigo';
  desabilitado?: boolean; tipo?: 'button' | 'submit';
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50';
  const estilos = {
    primario: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
    secundario: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
    perigo: 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25',
  };
  return (
    <button type={tipo} onClick={onClick} disabled={desabilitado} className={`${base} ${estilos[variante]}`}>
      {children}
    </button>
  );
}

export function Campo({
  label, children, dica,
}: {
  label: string; children: React.ReactNode; dica?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-300">{label}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-slate-500">{dica}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none';

/** Modal simples com overlay. */
export function Modal({
  aberto, titulo, onFechar, children,
}: {
  aberto: boolean; titulo: string; onFechar: () => void; children: React.ReactNode;
}) {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={onFechar}>
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-800 bg-slate-900 p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100">{titulo}</h3>
          <button onClick={onFechar} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100" aria-label="Fechar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Estado vazio amigável. */
export function Vazio({ texto }: { texto: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
      {texto}
    </div>
  );
}
