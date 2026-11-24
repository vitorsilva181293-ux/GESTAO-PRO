/**
 * MOTOR DE CÁLCULO CENTRALIZADO do Gestão PRO.
 *
 * Todas as telas (Dashboard, Comparador, Histórico, Relatório) consomem
 * estas funções — nenhuma fórmula é duplicada nas telas.
 * Funções puras: mesma entrada → mesma saída, sem efeitos colaterais.
 */
import type { Gestao, Registro } from './types';
import { safeNumber, diffDias, hojeISO } from './format';

// ------------------------------------------------------------------
// Níveis da banca
// ------------------------------------------------------------------

/** Banca necessária para atingir a meta: inicial × (1 + meta%/100). */
export function bancaNecessaria(g: Gestao): number {
  return safeNumber(g.saldoInicial) * (1 + safeNumber(g.metaPercentual) / 100);
}

/** Nível de stop: inicial × (1 − stop%/100). */
export function nivelStop(g: Gestao): number {
  return safeNumber(g.saldoInicial) * (1 - safeNumber(g.stopPercentual) / 100);
}

/** Soma de todos os resultados reais. */
export function lucroTotal(registros: Registro[]): number {
  return registros.reduce((acc, r) => acc + safeNumber(r.resultadoReal), 0);
}

/** Banca real atual: inicial + lucro acumulado. */
export function bancaReal(g: Gestao, registros: Registro[]): number {
  return safeNumber(g.saldoInicial) + lucroTotal(registros);
}

/** ROI como FRAÇÃO (0,05 = 5%). Use com formatPercent(). */
export function roi(g: Gestao, registros: Registro[]): number {
  const inicial = safeNumber(g.saldoInicial);
  if (inicial <= 0) return 0;
  return lucroTotal(registros) / inicial;
}

// ------------------------------------------------------------------
// Progresso da meta (regra oficial do app)
// ------------------------------------------------------------------

/**
 * (banca real − banca inicial) ÷ (banca necessária − banca inicial),
 * limitado entre 0% e 100%. Sem crescimento, fica em 0%.
 * Retorna FRAÇÃO (0–1).
 */
export function progressoMeta(g: Gestao, registros: Registro[]): number {
  const inicial = safeNumber(g.saldoInicial);
  const necessaria = bancaNecessaria(g);
  const real = bancaReal(g, registros);
  const denominador = necessaria - inicial;
  if (denominador <= 0) return 0;
  const p = (real - inicial) / denominador;
  if (!Number.isFinite(p)) return 0;
  return Math.min(1, Math.max(0, p));
}

/** Distância (R$) que falta para a meta. Negativo = meta ultrapassada. */
export function distanciaParaMeta(g: Gestao, registros: Registro[]): number {
  return bancaNecessaria(g) - bancaReal(g, registros);
}

/** Distância (R$) até o nível de stop. */
export function distanciaParaStop(g: Gestao, registros: Registro[]): number {
  return bancaReal(g, registros) - nivelStop(g);
}

// ------------------------------------------------------------------
// Séries temporais
// ------------------------------------------------------------------

export interface PontoSerie {
  data: string;
  banca: number;
}

export interface PontoDrawdown extends PontoSerie {
  pico: number;
  /** Drawdown como FRAÇÃO (0,10 = 10% abaixo do pico). */
  drawdown: number;
}

export function registrosOrdenados(registros: Registro[]): Registro[] {
  return [...registros].sort((a, b) => a.data.localeCompare(b.data));
}

/** Curva da banca: saldo após cada dia com registro. */
export function serieBanca(g: Gestao, registros: Registro[]): PontoSerie[] {
  let saldo = safeNumber(g.saldoInicial);
  return registrosOrdenados(registros).map((r) => {
    saldo += safeNumber(r.resultadoReal);
    return { data: r.data, banca: saldo };
  });
}

/** Série de drawdown a partir da curva da banca. */
export function serieDrawdown(g: Gestao, registros: Registro[]): PontoDrawdown[] {
  let pico = safeNumber(g.saldoInicial);
  return serieBanca(g, registros).map((p) => {
    pico = Math.max(pico, p.banca);
    const dd = pico > 0 ? (pico - p.banca) / pico : 0;
    return { ...p, pico, drawdown: dd };
  });
}

/** Maior drawdown do período, como FRAÇÃO. */
export function maxDrawdown(registros: Registro[], g: Gestao): number {
  const serie = serieDrawdown(g, registros);
  return serie.reduce((m, p) => Math.max(m, p.drawdown), 0);
}

/**
 * Projeção linear: ritmo médio por dia com registro, projetado
 * do primeiro ao último dia da série. Serve para o "Real × Projetado".
 */
export function serieProjetada(g: Gestao, registros: Registro[]): PontoSerie[] {
  const ord = registrosOrdenados(registros);
  if (ord.length === 0) return [];
  const dias = Math.max(1, ord.length);
  const media = lucroTotal(ord) / dias;
  let saldo = safeNumber(g.saldoInicial);
  return ord.map((r) => {
    saldo += media;
    return { data: r.data, banca: saldo };
  });
}

// ------------------------------------------------------------------
// Estatísticas do relatório
// ------------------------------------------------------------------

export interface Estatisticas {
  dias: number;
  diasPositivos: number;
  diasNegativos: number;
  diasNeutros: number;
  /** Fração de dias com lucro (0–1). */
  taxaAcerto: number;
  mediaDiaria: number;
  mediaPositivos: number;
  mediaNegativos: number;
  melhorDia: number;
  piorDia: number;
  /** Desvio padrão dos resultados diários (R$). */
  desvioPadrao: number;
  /** Amplitude: melhor − pior dia (R$). */
  amplitude: number;
  maiorSeqLucro: number;
  maiorSeqPrejuizo: number;
  lucro: number;
  roi: number;
  maxDrawdown: number;
}

function maiorSequencia(valores: number[], positivo: boolean): number {
  let maior = 0;
  let atual = 0;
  for (const v of valores) {
    const ok = positivo ? v > 0 : v < 0;
    atual = ok ? atual + 1 : 0;
    maior = Math.max(maior, atual);
  }
  return maior;
}

export function estatisticas(g: Gestao, registros: Registro[]): Estatisticas {
  const valores = registrosOrdenados(registros).map((r) => safeNumber(r.resultadoReal));
  const dias = valores.length;
  const positivos = valores.filter((v) => v > 0);
  const negativos = valores.filter((v) => v < 0);
  const lucro = valores.reduce((a, b) => a + b, 0);
  const media = dias > 0 ? lucro / dias : 0;
  const variancia = dias > 0 ? valores.reduce((a, v) => a + (v - media) ** 2, 0) / dias : 0;

  return {
    dias,
    diasPositivos: positivos.length,
    diasNegativos: negativos.length,
    diasNeutros: dias - positivos.length - negativos.length,
    taxaAcerto: dias > 0 ? positivos.length / dias : 0,
    mediaDiaria: media,
    mediaPositivos: positivos.length ? positivos.reduce((a, b) => a + b, 0) / positivos.length : 0,
    mediaNegativos: negativos.length ? negativos.reduce((a, b) => a + b, 0) / negativos.length : 0,
    melhorDia: valores.length ? Math.max(...valores) : 0,
    piorDia: valores.length ? Math.min(...valores) : 0,
    desvioPadrao: Math.sqrt(variancia),
    amplitude: valores.length ? Math.max(...valores) - Math.min(...valores) : 0,
    maiorSeqLucro: maiorSequencia(valores, true),
    maiorSeqPrejuizo: maiorSequencia(valores, false),
    lucro,
    roi: roi(g, registros),
    maxDrawdown: maxDrawdown(registros, g),
  };
}

// ------------------------------------------------------------------
// Datas e período
// ------------------------------------------------------------------

/** Dias decorridos desde a data inicial até hoje (mínimo 0). */
export function diasDecorridos(g: Gestao, hoje = hojeISO()): number {
  return Math.max(0, diffDias(g.dataInicial, hoje));
}

/** Menor data com registro — usada na proteção de edição da data inicial. */
export function primeiraDataRegistro(registros: Registro[]): string | null {
  if (registros.length === 0) return null;
  return registrosOrdenados(registros)[0].data;
}

/**
 * Banca anterior a uma data (inicial + resultados de dias anteriores).
 * Base do fluxo "registro pelo saldo final": resultado = saldoFinal − bancaAnterior.
 */
export function bancaAnteriorA(g: Gestao, registros: Registro[], dataISO: string, excluirId?: string): number {
  const soma = registros
    .filter((r) => r.data < dataISO && r.id !== excluirId)
    .reduce((acc, r) => acc + safeNumber(r.resultadoReal), 0);
  return safeNumber(g.saldoInicial) + soma;
}
