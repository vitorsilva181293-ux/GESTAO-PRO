import { useMemo, useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Badge, Botao, Campo, Card, Modal, StatCard, Vazio, inputCls } from '../components/ui';
import { formatBRL, formatDate, hojeISO, uid } from '../lib/format';
import { useStore } from '../lib/store';
import type { TipoOperacao } from '../lib/types';

export function Operacoes() {
  const { dados, salvarOperacao, removerOperacao, prefs } = useStore();
  const { operacoes } = dados;
  const [modalAberto, setModalAberto] = useState(false);
  const [data, setData] = useState(hojeISO());
  const [tipo, setTipo] = useState<TipoOperacao>('operacao');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState('');

  const ordenadas = useMemo(
    () => [...operacoes].sort((a, b) => b.data.localeCompare(a.data)),
    [operacoes],
  );
  const totalOps = operacoes.filter((o) => o.tipo === 'operacao').reduce((a, o) => a + o.valor, 0);
  const totalSaques = operacoes.filter((o) => o.tipo === 'saque').reduce((a, o) => a + o.valor, 0);

  function adicionar() {
    const v = Number(String(valor).replace(',', '.'));
    if (!data) return setErro('Informe a data.');
    if (valor === '' || !Number.isFinite(v)) return setErro('Informe o valor.');
    salvarOperacao({
      id: uid(), data, tipo, descricao: descricao.trim() || (tipo === 'saque' ? 'Saque' : 'Operação'),
      valor: v, createdAt: new Date().toISOString(),
    });
    setDescricao(''); setValor(''); setErro(''); setModalAberto(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold">Operações e saques</h2>
        <Botao onClick={() => setModalAberto(true)}><PlusCircle size={16} /> Nova movimentação</Botao>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Total operações" valor={formatBRL(totalOps, prefs.semCentavos)} positivo={totalOps >= 0} negativo={totalOps < 0} />
        <StatCard label="Total saques" valor={formatBRL(totalSaques, prefs.semCentavos)} negativo={totalSaques < 0} />
        <StatCard label="Movimentações" valor={String(operacoes.length)} sub="operações + saques" />
      </div>

      <Card>
        {ordenadas.length === 0 ? (
          <Vazio texto="Nenhuma movimentação registrada." />
        ) : (
          <ul className="divide-y divide-slate-800">
            {ordenadas.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge cor={o.tipo === 'saque' ? 'amber' : 'slate'}>{o.tipo === 'saque' ? 'Saque' : 'Operação'}</Badge>
                    <p className="truncate text-sm font-medium">{o.descricao}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(o.data)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${o.valor >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatBRL(o.valor, prefs.semCentavos)}
                  </span>
                  <button
                    onClick={() => { if (confirm('Excluir esta movimentação?')) removerOperacao(o.id); }}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400"
                    aria-label="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal aberto={modalAberto} titulo="Nova movimentação" onFechar={() => setModalAberto(false)}>
        <div className="space-y-4">
          <Campo label="Tipo">
            <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as TipoOperacao)}>
              <option value="operacao">Operação</option>
              <option value="saque">Saque</option>
            </select>
          </Campo>
          <Campo label="Data">
            <input type="date" className={inputCls} value={data} onChange={(e) => setData(e.target.value)} />
          </Campo>
          <Campo label="Descrição">
            <input type="text" className={inputCls} placeholder="Ex.: Saque de lucro" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </Campo>
          <Campo label="Valor (R$)" dica="Use valor negativo para saídas/retiradas.">
            <input type="text" inputMode="decimal" className={inputCls} placeholder="Ex.: -150,00" value={valor} onChange={(e) => setValor(e.target.value)} />
          </Campo>
          {erro && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{erro}</p>}
          <div className="flex justify-end gap-2">
            <Botao variante="secundario" onClick={() => setModalAberto(false)}>Cancelar</Botao>
            <Botao onClick={adicionar}>Adicionar</Botao>
          </div>
        </div>
      </Modal>
    </div>
  );
}
