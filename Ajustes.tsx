import { useRef, useState } from 'react';
import { Download, RotateCcw, Trash2, Upload } from 'lucide-react';
import { Botao, Campo, Card, inputCls } from '../components/ui';
import { primeiraDataRegistro } from '../lib/calc';
import { formatBRL, formatDate, safeNumber } from '../lib/format';
import { useStore } from '../lib/store';
import type { AppData } from '../lib/types';

export function Ajustes() {
  const { dados, atualizarGestao, prefs, setPrefs, restaurarDemo, limparTudo, importarDados } = useStore();
  const { gestao, registros } = dados;
  const [erro, setErro] = useState('');
  const arquivo = useRef<HTMLInputElement>(null);
  const temRegistro = registros.length > 0;
  const primeiraData = primeiraDataRegistro(registros);

  function atualizar(campo: keyof typeof gestao, valor: string) {
    const g = {...gestao};
    if (campo === 'nome' || campo === 'dataInicial') {
      (g[campo] as string) = valor;
    } else {
      (g[campo] as number) = safeNumber(valor.replace(',', '.'));
    }
    atualizarGestao(g);
  }

  function mudarData(v: string) {
    if (!v || v === gestao.dataInicial) return;
    if (primeiraData && v > primeiraData) {
      setErro(`A data inicial não pode ser posterior ao primeiro registro (${formatDate(primeiraData)}).`);
      return;
    }
    if (!confirm('Alterar a data inicial da gestão? Confirme que o novo período está correto.')) return;
    setErro(''); atualizar('dataInicial', v);
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(dados, null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gestao-pro-backup.json'; a.click(); URL.revokeObjectURL(a.href);
  }

  async function importar(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as AppData;
      if (!parsed?.gestao || !Array.isArray(parsed.registros) || !Array.isArray(parsed.operacoes)) throw new Error('Formato de backup inválido.');
      importarDados(parsed); setErro('Backup importado com sucesso.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível importar.'); }
    if (arquivo.current) arquivo.current.value = '';
  }

  return <div className="space-y-4">
    <h2 className="text-base font-bold">Ajustes da gestão</h2>
    <Card><h3 className="mb-4 font-bold">Parâmetros</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nome da gestão"><input className={inputCls} value={gestao.nome} onChange={e=>atualizar('nome',e.target.value)} /></Campo>
        <Campo label="Banca inicial (R$)" dica={temRegistro ? 'Bloqueada após o primeiro resultado para preservar o histórico.' : undefined}>
          <input type="number" min="0" step="0.01" className={`${inputCls} ${temRegistro?'opacity-60':''}`} value={gestao.saldoInicial} disabled={temRegistro} onChange={e=>atualizar('saldoInicial',e.target.value)} />
        </Campo>
        <Campo label="Meta (%)"><input type="number" min="0" step="0.1" className={inputCls} value={gestao.metaPercentual} onChange={e=>atualizar('metaPercentual',e.target.value)} /></Campo>
        <Campo label="Stop (%)"><input type="number" min="0" step="0.1" className={inputCls} value={gestao.stopPercentual} onChange={e=>atualizar('stopPercentual',e.target.value)} /></Campo>
        <Campo label="Data inicial" dica={primeiraData ? `Primeiro registro: ${formatDate(primeiraData)}. Não é permitido encurtar o período para ocultar registros.` : undefined}>
          <input type="date" className={inputCls} max={primeiraData || undefined} value={gestao.dataInicial} onChange={e=>mudarData(e.target.value)} />
        </Campo>
      </div>
    </Card>
    <Card><h3 className="mb-4 font-bold">Preferências</h3>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={prefs.semCentavos} onChange={e=>setPrefs({...prefs,semCentavos:e.target.checked})} className="accent-emerald-500" /> Exibir valores sem centavos</label>
    </Card>
    <Card><h3 className="mb-2 font-bold">Dados</h3><p className="mb-4 text-xs text-slate-400">Banca inicial atual: {formatBRL(gestao.saldoInicial)}. Exporte um backup antes de limpar ou restaurar.</p>
      <div className="flex flex-wrap gap-2">
        <Botao variante="secundario" onClick={exportar}><Download size={16}/> Exportar backup</Botao>
        <Botao variante="secundario" onClick={()=>arquivo.current?.click()}><Upload size={16}/> Importar backup</Botao>
        <input ref={arquivo} type="file" accept="application/json,.json" className="hidden" onChange={e=>void importar(e.target.files?.[0])}/>
        <Botao variante="secundario" onClick={()=>{if(confirm('Restaurar os dados demonstrativos? Seus dados atuais serão substituídos.')) restaurarDemo();}}><RotateCcw size={16}/> Restaurar demonstração</Botao>
        <Botao variante="perigo" onClick={()=>{if(confirm('Apagar todos os registros e voltar a uma gestão vazia? Esta ação não pode ser desfeita.')) limparTudo();}}><Trash2 size={16}/> Limpar dados</Botao>
      </div>
    </Card>
    {erro && <p className="rounded-xl bg-slate-800 p-3 text-sm text-slate-300">{erro}</p>}
  </div>;
}
