/**
 * Formatação pt-BR / BRL — convenção única do app.
 *
 * ⚠️ CONVENÇÃO DE PERCENTUAIS (auditada no Comparador):
 * - `formatPercent(fracao)` recebe FRAÇÃO (0–1): 0,05 → "5,00%".
 * - `formatPercentPoints(pontos)` recebe PONTOS percentuais: 20 → "20%".
 * Misturar as duas é o erro clássico de escala (exibir 500% em vez de 5%).
 * Regra: resultados de cálculo (ROI, taxa de acerto, drawdown) são frações;
 * parâmetros da gestão (meta %, stop %) são pontos percentuais.
 */

export const LOCALE = 'pt-BR';

const brl = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL' });
const brlSemCentavos = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const numero = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat(LOCALE, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dataBR = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Protege contra NaN/Infinity — o app nunca deve exibir "NaN". */
export function safeNumber(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Valor em reais. `semCentavos` respeita a opção de Ajustes. */
export function formatBRL(v: number, semCentavos = false): string {
  return (semCentavos ? brlSemCentavos : brl).format(safeNumber(v));
}

/** Fração (0–1) → "5,00%". */
export function formatPercent(fracao: number): string {
  return percent.format(safeNumber(fracao));
}

/** Pontos percentuais (ex.: 20) → "20%". */
export function formatPercentPoints(pontos: number): string {
  return `${numero.format(safeNumber(pontos))}%`;
}

/** Número genérico pt-BR. */
export function formatNumber(v: number): string {
  return numero.format(safeNumber(v));
}

/** "2026-11-23" → "23/11/2026". */
export function formatDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '—';
  return dataBR.format(new Date(y, m - 1, d));
}

/** Hoje em yyyy-mm-dd (horário local). */
export function hojeISO(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Diferença em dias entre duas datas ISO (b - a). */
export function diffDias(aISO: string, bISO: string): number {
  const [ay, am, ad] = aISO.split('-').map(Number);
  const [by, bm, bd] = bISO.split('-').map(Number);
  const a = new Date(ay, am - 1, ad).getTime();
  const b = new Date(by, bm - 1, bd).getTime();
  return Math.round((b - a) / 86400000);
}

/** Gera um id simples e único. */
export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
