import { useMemo, useState } from 'react';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { RegistroForm } from '../components/RegistroForm';
import { Botao, Card, Campo, Modal, Vazio, inputCls } from '../components/ui';
import { bancaAnteriorA } from '../lib/calc';
import { formatBRL, formatDate } from '../lib/format';
import { useStore } from '../lib/store';
import type { Registro } from '../lib/types';

type FiltroTipo = 'todos' | 'lucro' | 'prejuizo' | 'neutro';

export function Historico() {
  const { dados, removerRegistro, prefs } = useStore();
  const { gestao, registros } = dados;
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<FiltroTipo>('todos');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Registro | undefined>(undefined);

  const filtrados = useMemo(() => {
    return [...registros]
      .sort((a, b) => b.data.localeCompare(a.data))
      .filter((r) => {
        if (tipo === 'lucro' && r.resultadoReal <= 0) return false;
        if (tipo === 'prejuizo' && r.resultadoReal >= 0) return false;
        if (tipo === 'neutro' && r.resultadoReal !== 0) return false;
        if (de && r.data < de) return false;
        if (ate && r.data > ate) return false;
        if (busca && !(r.observacao ?? '').toLowerCase().includes(busca.toLowerCase())) return false;
        return true;
      });
  }, [registros, tipo, de, ate, busca]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold">Histórico de resultados</h2>
        <Botao onClick={() => { setEditando(undefined); setModalAberto(true); }}>
          <PlusCircle size={16} /> Novo registro
        </Botao>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Campo label="Buscar na observação">
            <input type="text" className={inputCls} placeholder="Ex.: operação padrão" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </Campo>
          <Campo label="Tipo de resultado">
            <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as FiltroTipo)}>
              <option value="todos">Todos</option>
              <option value="lucro">Lucro</option>
              <option value="prejuizo">Prejuízo</option>
              <option value="neutro">Neutro</option>
            </select>
          </Campo>
          <Campo label="De">
            <input type="date" className={inputCls} value={de} onChange={(e) => setDe(e.target.value)} />
          </Campo>
          <Campo label="Até">
            <input type="date" className={inputCls} value={ate} onChange={(e) => setAte(e.target.value)} />
          </Campo>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {filtrados.length} de {registros.length} registros exibidos.
        </p>
      </Card>

      <Card>
        {filtrados.length === 0 ? (
          <Vazio texto="Nenhum registro encontrado com estes filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-3">Data</th>
                  <th className="pb-2 pr-3">Resultado</th>
                  <th className="pb-2 pr-3">Saldo final</th>
                  <th className="pb-2 pr-3">Observação</th>
                  <th className="pb-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtrados.map((r) => {
                  const saldoFinal = bancaAnteriorA(gestao, registros, r.data, r.id) + r.resultadoReal;
                  return (
                    <tr key={r.id}>
                      <td className="py-2 pr-3 whitespace-nowrap">{formatDate(r.data)}</td>
                      <td className={`py-2 pr-3 font-semibold whitespace-nowrap ${r.resultadoReal > 0 ? 'text-emerald-400' : r.resultadoReal < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {formatBRL(r.resultadoReal, prefs.semCentavos)}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">{formatBRL(saldoFinal, prefs.semCentavos)}</td>
                      <td className="py-2 pr-3 text-slate-400">{r.observacao || '—'}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <button
                          onClick={() => { setEditando(r); setModalAberto(true); }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-100"
                          aria-label="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Excluir o registro de ${formatDate(r.data)}?`)) removerRegistro(r.id); }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400"
                          aria-label="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        aberto={modalAberto}
        titulo={editando ? 'Editar registro' : 'Novo registro'}
        onFechar={() => setModalAberto(false)}
      >
        <RegistroForm
          registro={editando}
          onFechar={() => setModalAberto(false)}
          onSalvar={() => setModalAberto(false)}
        />
      </Modal>
    </div>
  );
}
