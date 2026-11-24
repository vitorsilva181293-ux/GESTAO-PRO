/**
 * Store global do Gestão PRO.
 * - Local-first: salva no localStorage a cada mudança.
 * - Se o Supabase estiver configurado, carrega de lá na abertura
 *   e espelha cada alteração (best-effort, sem travar a tela).
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppData, Gestao, Operacao, Registro } from './types';
import { dadosDemo, gestaoVazia } from './seed';
import {
  carregarDoSupabase, excluirOperacao, excluirRegistro, salvarGestao,
  salvarOperacao as persistirOperacaoRemota, salvarRegistro as persistirRegistroRemoto, substituirTudo, supabaseConfigurado,
} from './supabase';

const CHAVE_LOCAL = 'gestao-pro:v1';

export interface Preferencias {
  semCentavos: boolean;
}

interface Store {
  dados: AppData;
  carregando: boolean;
  modo: 'supabase' | 'local';
  erroSync: string | null;
  prefs: Preferencias;
  setPrefs: (p: Preferencias) => void;
  atualizarGestao: (g: Gestao) => void;
  salvarRegistro: (r: Registro) => void;
  removerRegistro: (id: string) => void;
  salvarOperacao: (o: Operacao) => void;
  removerOperacao: (id: string) => void;
  restaurarDemo: () => void;
  limparTudo: () => void;
  importarDados: (d: AppData) => void;
}

const Ctx = createContext<Store | null>(null);

function lerLocal(): AppData | null {
  try {
    const raw = localStorage.getItem(CHAVE_LOCAL);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed?.gestao) return null;
    return parsed;
  } catch {
    return null;
  }
}

function gravarLocal(d: AppData) {
  try {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(d));
  } catch {
    /* armazenamento cheio/indisponível — ignora */
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [dados, setDados] = useState<AppData>(() => lerLocal() ?? { gestao: gestaoVazia(), registros: [], operacoes: [] });
  const [carregando, setCarregando] = useState(true);
  const [erroSync, setErroSync] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Preferencias>({ semCentavos: false });

  // Carga inicial: tenta Supabase; se vazio, usa demo/local.
  useEffect(() => {
    (async () => {
      if (supabaseConfigurado) {
        try {
          const remoto = await carregarDoSupabase();
          if (remoto) {
            setDados(remoto);
            gravarLocal(remoto);
          } else {
            const demo = dadosDemo();
            setDados(demo);
            gravarLocal(demo);
            await substituirTudo(demo).catch(() => undefined);
          }
        } catch (e) {
          setErroSync(e instanceof Error ? e.message : 'Falha ao sincronizar com o Supabase.');
        }
      } else if (!lerLocal()) {
        const demo = dadosDemo();
        setDados(demo);
        gravarLocal(demo);
      }
      setCarregando(false);
    })();
  }, []);

  const persistir = useCallback((proximo: AppData) => {
    setDados(proximo);
    gravarLocal(proximo);
  }, []);

  const sincronizar = useCallback(async (fn: () => Promise<void>) => {
    if (!supabaseConfigurado) return;
    try {
      await fn();
      setErroSync(null);
    } catch (e) {
      setErroSync(e instanceof Error ? e.message : 'Falha ao sincronizar.');
    }
  }, []);

  const atualizarGestao = useCallback((g: Gestao) => {
    persistir({ ...dados, gestao: g });
    void sincronizar(() => salvarGestao(g));
  }, [dados, persistir, sincronizar]);

  const salvarRegistro = useCallback((r: Registro) => {
    const existe = dados.registros.some((x) => x.id === r.id);
    const registros = existe
      ? dados.registros.map((x) => (x.id === r.id ? r : x))
      : [...dados.registros, r];
    persistir({ ...dados, registros });
    void sincronizar(() => persistirRegistroRemoto(r));
  }, [dados, persistir, sincronizar]);

  const removerRegistro = useCallback((id: string) => {
    persistir({ ...dados, registros: dados.registros.filter((x) => x.id !== id) });
    void sincronizar(() => excluirRegistro(id));
  }, [dados, persistir, sincronizar]);

  const salvarOperacao = useCallback((o: Operacao) => {
    const existe = dados.operacoes.some((x) => x.id === o.id);
    const operacoes = existe
      ? dados.operacoes.map((x) => (x.id === o.id ? o : x))
      : [o, ...dados.operacoes];
    persistir({ ...dados, operacoes });
    void sincronizar(() => persistirOperacaoRemota(o));
  }, [dados, persistir, sincronizar]);

  const removerOperacao = useCallback((id: string) => {
    persistir({ ...dados, operacoes: dados.operacoes.filter((x) => x.id !== id) });
    void sincronizar(() => excluirOperacao(id));
  }, [dados, persistir, sincronizar]);

  const restaurarDemo = useCallback(() => {
    const demo = dadosDemo();
    persistir(demo);
    void sincronizar(() => substituirTudo(demo));
  }, [persistir, sincronizar]);

  const limparTudo = useCallback(() => {
    const vazio: AppData = { gestao: gestaoVazia(), registros: [], operacoes: [] };
    persistir(vazio);
    void sincronizar(() => substituirTudo(vazio));
  }, [persistir, sincronizar]);

  const importarDados = useCallback((d: AppData) => {
    persistir(d);
    void sincronizar(() => substituirTudo(d));
  }, [persistir, sincronizar]);

  const value = useMemo<Store>(() => ({
    dados, carregando, modo: supabaseConfigurado ? 'supabase' : 'local', erroSync,
    prefs, setPrefs, atualizarGestao, salvarRegistro, removerRegistro,
    salvarOperacao, removerOperacao, restaurarDemo, limparTudo, importarDados,
  }), [dados, carregando, erroSync, prefs, atualizarGestao, salvarRegistro, removerRegistro,
    salvarOperacao, removerOperacao, restaurarDemo, limparTudo, importarDados]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore deve ser usado dentro de <StoreProvider>');
  return ctx;
}
