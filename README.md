# Gestão PRO

PWA para acompanhamento de banca, resultados diários e drawdown. Interface em pt-BR, moeda BRL. Desenvolvido com React, TypeScript, Tailwind CSS, Vite e Supabase.

## Rodar localmente

Requer Node.js 20+.

```bash
npm install
npm run dev
```

Para validar a versão de produção: `npm run build` e `npm run preview`.

## Supabase

Sem credenciais o app funciona localmente no navegador (localStorage). Para sincronizar:

1. Crie um projeto Supabase.
2. Execute `supabase/schema.sql` no SQL Editor.
3. Copie `.env.example` para `.env.local` e informe `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Reinicie o servidor.

O SQL configura tabelas e políticas RLS básicas para uso pessoal. Para um app multiusuário/publicado, implemente autenticação e restrinja as políticas por `auth.uid()` antes de armazenar dados reais.

## GitHub → StackBlitz

1. Crie um repositório vazio no GitHub.
2. Na pasta do projeto, rode:

```bash
git init
git add .
git commit -m "feat: Gestão PRO PWA"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

3. Abra `https://stackblitz.com/github/SEU-USUARIO/SEU-REPOSITORIO` para importar e executar.
4. Configure os Secrets/variáveis de ambiente para Supabase se desejar sincronização. Nunca envie `.env.local` ao GitHub.

## Regras importantes

- Progresso da meta: `(banca real − banca inicial) ÷ (banca necessária − banca inicial)`, limitado a 0%–100%; sem crescimento = 0%.
- Cálculos centralizados em `src/lib/calc.ts`; componentes não replicam fórmulas centrais.
- Registro diário aceita saldo final para derivar o resultado real, com ajuste manual. O banco persiste `resultado_real`, sem campo adicional de saldo.
- A banca inicial fica bloqueada depois do primeiro resultado. A data inicial exige confirmação e não pode avançar além do primeiro registro.
- `formatPercent` recebe fração (0–1); `formatPercentPoints` recebe pontos percentuais.
