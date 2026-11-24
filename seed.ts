import type { AppData, Gestao, Operacao, Registro } from './types';
import { hojeISO, uid } from './format';

function isoMenosDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Dados de demonstração: 30 dias de resultados com tendência de alta. */
export function dadosDemo(): AppData {
  const gestao: Gestao = {
    id: 'principal',
    nome: 'Gestão Demo — Banca Principal',
    saldoInicial: 1000,
    metaPercentual: 20,
    stopPercentual: 10,
    dataInicial: isoMenosDias(30),
    createdAt: new Date().toISOString(),
  };

  // Caminhada aleatória com viés positivo (determinística para não mudar a cada reload).
  const resultados = [
    45, -20, 60, 30, -15, 80, 25, 10, -35, 55,
    40, 70, -10, 20, 90, -25, 35, 50, 15, -5,
    65, 30, 75, -20, 45, 55, 10, 85, 40, 60,
  ];
  const registros: Registro[] = resultados.map((resultadoReal, i) => ({
    id: uid(),
    data: isoMenosDias(30 - i),
    resultadoReal,
    observacao: i % 7 === 3 ? 'Operação padrão do dia' : undefined,
    createdAt: new Date().toISOString(),
  }));

  const operacoes: Operacao[] = [
    { id: uid(), data: isoMenosDias(2), descricao: 'Entrada de banca (recarga)', valor: 200, tipo: 'operacao' },
    { id: uid(), data: isoMenosDias(5), descricao: 'Saque de lucro', valor: -150, tipo: 'saque' },
    { id: uid(), data: isoMenosDias(9), descricao: 'Operação combinada', valor: 120, tipo: 'operacao' },
    { id: uid(), data: isoMenosDias(14), descricao: 'Saque semanal', valor: -100, tipo: 'saque' },
    { id: uid(), data: isoMenosDias(20), descricao: 'Ajuste de banca', valor: 50, tipo: 'operacao' },
  ];

  return { gestao, registros, operacoes };
}

export function gestaoVazia(): Gestao {
  return {
    id: 'principal',
    nome: 'Minha Gestão',
    saldoInicial: 1000,
    metaPercentual: 20,
    stopPercentual: 10,
    dataInicial: hojeISO(),
    createdAt: new Date().toISOString(),
  };
}
