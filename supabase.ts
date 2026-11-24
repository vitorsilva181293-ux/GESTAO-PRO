/**
 * Cliente Supabase + persistência.
 * Sem variáveis de ambiente, o app roda em modo local (localStorage).
 * Com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY, sincroniza com o Supabase.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppData, Gestao, Operacao, Registro } from './types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigurado = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseConfigurado
  ? createClient(url as string, anonKey as string)
  : null;

// ------------------------------------------------------------------
// Conversão snake_case (banco) <-> camelCase (app)
// ------------------------------------------------------------------

type GestaoRow = {
  id: string; nome: string; saldo_inicial: number; meta_percentual: number;
  stop_percentual: number; data_inicial: string; created_at?: string; updated_at?: string;
};
type RegistroRow = { id: string; data: string; resultado_real: number; observacao?: string | null; created_at?: string };
type OperacaoRow = { id: string; data: string; descricao: string; valor: number; tipo: string; created_at?: string };

const gestaoToRow = (g: Gestao): GestaoRow => ({
  id: g.id, nome: g.nome, saldo_inicial: g.saldoInicial,
  meta_percentual: g.metaPercentual, stop_percentual: g.stopPercentual,
  data_inicial: g.dataInicial, created_at: g.createdAt, updated_at: new Date().toISOString(),
});
const rowToGestao = (r: GestaoRow): Gestao => ({
  id: r.id, nome: r.nome, saldoInicial: Number(r.saldo_inicial),
  metaPercentual: Number(r.meta_percentual), stopPercentual: Number(r.stop_percentual),
  dataInicial: r.data_inicial, createdAt: r.created_at, updatedAt: r.updated_at,
});
const registroToRow = (r: Registro): RegistroRow => ({
  id: r.id, data: r.data, resultado_real: r.resultadoReal, observacao: r.observacao ?? null, created_at: r.createdAt,
});
const rowToRegistro = (r: RegistroRow): Registro => ({
  id: r.id, data: r.data, resultadoReal: Number(r.resultado_real),
  observacao: r.observacao ?? undefined, createdAt: r.created_at,
});
const operacaoToRow = (o: Operacao): OperacaoRow => ({
  id: o.id, data: o.data, descricao: o.descricao, valor: o.valor, tipo: o.tipo, created_at: o.createdAt,
});
const rowToOperacao = (r: OperacaoRow): Operacao => ({
  id: r.id, data: r.data, descricao: r.descricao, valor: Number(r.valor),
  tipo: r.tipo === 'saque' ? 'saque' : 'operacao', createdAt: r.created_at,
});

// ------------------------------------------------------------------
// Operações de leitura/escrita
// ------------------------------------------------------------------

export async function carregarDoSupabase(): Promise<AppData | null> {
  if (!supabase) return null;
  const [g, r, o] = await Promise.all([
    supabase.from('gestao').select('*').limit(1),
    supabase.from('registros').select('*').order('data', { ascending: true }),
    supabase.from('operacoes').select('*').order('data', { ascending: false }),
  ]);
  if (g.error || r.error || o.error) throw g.error ?? r.error ?? o.error;
  if (!g.data || g.data.length === 0) return null;
  return {
    gestao: rowToGestao(g.data[0] as GestaoRow),
    registros: (r.data as RegistroRow[]).map(rowToRegistro),
    operacoes: (o.data as OperacaoRow[]).map(rowToOperacao),
  };
}

export async function salvarGestao(g: Gestao): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('gestao').upsert(gestaoToRow(g));
  if (error) throw error;
}

export async function salvarRegistro(r: Registro): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('registros').upsert(registroToRow(r));
  if (error) throw error;
}

export async function excluirRegistro(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('registros').delete().eq('id', id);
  if (error) throw error;
}

export async function salvarOperacao(o: Operacao): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('operacoes').upsert(operacaoToRow(o));
  if (error) throw error;
}

export async function excluirOperacao(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('operacoes').delete().eq('id', id);
  if (error) throw error;
}

/** Substitui todos os dados no Supabase (usado em importar/restaurar). */
export async function substituirTudo(dados: AppData): Promise<void> {
  if (!supabase) return;
  await supabase.from('operacoes').delete().neq('id', '');
  await supabase.from('registros').delete().neq('id', '');
  await supabase.from('gestao').delete().neq('id', '');
  const { error: eg } = await supabase.from('gestao').insert(gestaoToRow(dados.gestao));
  if (eg) throw eg;
  if (dados.registros.length) {
    const { error } = await supabase.from('registros').insert(dados.registros.map(registroToRow));
    if (error) throw error;
  }
  if (dados.operacoes.length) {
    const { error } = await supabase.from('operacoes').insert(dados.operacoes.map(operacaoToRow));
    if (error) throw error;
  }
}
