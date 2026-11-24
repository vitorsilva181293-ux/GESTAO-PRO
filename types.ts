/**
 * Tipos centrais do Gestão PRO.
 * O banco (Supabase) usa snake_case; o app usa camelCase.
 * A conversão acontece em src/lib/supabase.ts.
 */

export interface Gestao {
  id: string;
  nome: string;
  /** Saldo inicial da banca (R$). Travado após o primeiro resultado. */
  saldoInicial: number;
  /** Meta em pontos percentuais (ex.: 20 = 20%). */
  metaPercentual: number;
  /** Stop em pontos percentuais (ex.: 10 = 10%). */
  stopPercentual: number;
  /** Data inicial da gestão (yyyy-mm-dd). */
  dataInicial: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Registro {
  id: string;
  /** Dia do resultado (yyyy-mm-dd). */
  data: string;
  /** Resultado real do dia (R$). Único campo persistido do fluxo "saldo final". */
  resultadoReal: number;
  observacao?: string;
  createdAt?: string;
}

export type TipoOperacao = 'operacao' | 'saque';

export interface Operacao {
  id: string;
  data: string; // yyyy-mm-dd
  descricao: string;
  /** Valor em R$. Saques costumam ser negativos (retirada). */
  valor: number;
  tipo: TipoOperacao;
  createdAt?: string;
}

export interface AppData {
  gestao: Gestao;
  registros: Registro[];
  operacoes: Operacao[];
}

export type TabId = 'dashboard' | 'operacoes' | 'historico' | 'comparador' | 'relatorio' | 'ajustes';
