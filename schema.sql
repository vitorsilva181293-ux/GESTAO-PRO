-- ============================================================
-- Gestão PRO — schema do Supabase
-- Rode este SQL no painel do Supabase (SQL Editor) para criar
-- as tabelas. O app usa apenas a chave ANON (publishable).
-- ============================================================

create table if not exists public.gestao (
  id text primary key default 'principal',
  nome text not null default 'Minha Gestão',
  saldo_inicial numeric not null default 0,
  meta_percentual numeric not null default 20,
  stop_percentual numeric not null default 10,
  data_inicial date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.registros (
  id text primary key,
  data date not null,
  -- Único campo persistido do fluxo "saldo final" (o saldo é derivado na tela).
  resultado_real numeric not null default 0,
  observacao text,
  created_at timestamptz default now()
);

create table if not exists public.operacoes (
  id text primary key,
  data date not null,
  descricao text not null default '',
  valor numeric not null default 0,
  tipo text not null default 'operacao' check (tipo in ('operacao', 'saque')),
  created_at timestamptz default now()
);

create index if not exists registros_data_idx on public.registros (data);
create index if not exists operacoes_data_idx on public.operacoes (data desc);

-- ------------------------------------------------------------
-- RLS: app pessoal. As políticas abaixo liberam acesso total
-- para a chave anon. Se for publicar para outras pessoas,
-- troque por autenticação + políticas por usuário.
-- ------------------------------------------------------------
alter table public.gestao enable row level security;
alter table public.registros enable row level security;
alter table public.operacoes enable row level security;

drop policy if exists "gestao_all" on public.gestao;
drop policy if exists "registros_all" on public.registros;
drop policy if exists "operacoes_all" on public.operacoes;

create policy "gestao_all" on public.gestao for all using (true) with check (true);
create policy "registros_all" on public.registros for all using (true) with check (true);
create policy "operacoes_all" on public.operacoes for all using (true) with check (true);
