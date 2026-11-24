import { useEffect, useMemo, useState } from 'react';
import { bancaAnteriorA } from '../lib/calc';
import { formatBRL, hojeISO, uid } from '../lib/format';
import { useStore } from '../lib/store';
import type { Registro } from '../lib/types';
import { Botao, Campo, inputCls } from './ui';

/**
 * Registro pelo saldo final:
 * - o usuário informa o saldo final da banca;
 * - o resultado é derivado automaticamente (saldoFinal − bancaAnterior);
 * - permite ajuste manual do resultado;
 * - salva SOMENTE resultadoReal (sem alterar motor ou schema).
 */
export function RegistroForm({
  registro, onSalvar, onFechar,
}: {
  registro?: Registro;
  onSalvar: () => void;
  onFechar: () => void;
}) {
  const { dados, salvarRegistro, prefs } = useStore();
  const { gestao, registros } = dados;

  const [data, setData] = useState(registro?.data ?? hojeISO());
  const [saldoFinal, setSaldoFinal] = useState('');
  const [resultado, setResultado] = useState(registro ? String(registro.resultadoReal) : '');
  const [editadoManual, setEditadoManual] = useState(Boolean(registro));
  const [observacao, setObservacao] = useState(registro?.observacao ?? '');
  const [erro, setErro] = useState('');

  const anterior = useMemo(
    () => bancaAnteriorA(gestao, registros, data, registro?.id),
    [gestao, registros, data, registro?.id],
  );

  // Ao trocar a data (novo registro), recalcula a partir do saldo final informado.
  useEffect(() => {
    if (!registro && saldoFinal !== '') {
      const sf = Number(saldoFinal.replace(',', '.'));
      if (Number.isFinite(sf)) setResultado(String(sf - anterior));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function aoDigitarSaldoFinal(v: string) {
    setSaldoFinal(v);
    if (!editadoManual) {
      const sf = Number(v.replace(',', '.'));
      setResultado(v === '' || !Number.isFinite(sf) ? '' : String(sf - anterior));
    }
  }

  function aoDigitarResultado(v: string) {
    setResultado(v);
    setEditadoManual(true);
  }

  function salvar() {
    if (!data) return setErro('Informe a data.');
    const res = Number(String(resultado).replace(',', '.'));
    if (resultado === '' || !Number.isFinite(res)) return setErro('Informe o resultado (ou o saldo final).');
    const duplicado = registros.some((r) => r.data === data && r.id !== registro?.id);
    if (duplicado) return setErro('Já existe um registro nesta data. Edite o registro existente.');
    salvarRegistro({
      id: registro?.id ?? uid(),
      data,
      resultadoReal: res,
      observacao: observacao.trim() || undefined,
      createdAt: registro?.createdAt ?? new Date().toISOString(),
    });
    onSalvar();
  }

  return (
    <div className="space-y-4">
      <Campo label="Data do resultado">
        <input type="date" className={inputCls} value={data} onChange={(e) => setData(e.target.value)} />
      </Campo>

      <Campo
        label="Saldo final da banca (R$)"
        dica={`Banca antes deste dia: ${formatBRL(anterior, prefs.semCentavos)}. O resultado é calculado automaticamente.`}
      >
        <input
          type="text" inputMode="decimal" className={inputCls} placeholder="Ex.: 1150,00"
          value={saldoFinal} onChange={(e) => aoDigitarSaldoFinal(e.target.value)}
        />
      </Campo>

      <Campo label="Resultado real (R$)" dica="Preenchido pelo saldo final; você pode ajustar manualmente.">
        <input
          type="text" inputMode="decimal" className={inputCls} placeholder="Ex.: 150,00"
          value={resultado} onChange={(e) => aoDigitarResultado(e.target.value)}
        />
      </Campo>

      <Campo label="Observação (opcional)">
        <input type="text" className={inputCls} placeholder="Ex.: Operação padrão" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
      </Campo>

      {erro && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{erro}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Botao variante="secundario" onClick={onFechar}>Cancelar</Botao>
        <Botao onClick={salvar}>Salvar resultado</Botao>
      </div>
    </div>
  );
}
