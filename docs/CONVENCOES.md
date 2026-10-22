# Convenções do projeto (leia antes de codar)

App Next.js 15 (App Router) + React 19 + TypeScript 5, banco Neon Postgres. Textos da interface em **português do Brasil**.
Raiz: `C:\Users\MATHEUS AMAIS\Desktop\ESTOQUE\estoque-app`. Windows + PowerShell 5.1.

## Banco
- Schema em `db/schema.sql` (idempotente). Aplicar com `npm run db:setup`.
  Mudanças só **aditivas** (`create table if not exists`, `alter table ... add column if not exists`), no fim do arquivo,
  numa seção com o seu nome. Leia o arquivo logo antes de editar (outras pessoas também editam).
- Consultas: `import { query, db } from "@/lib/db"` → `query<T>("select ... where id = $1", [id])` (driver HTTP da Neon).
  Transação: `const sql = db(); await sql.transaction([sql.query("...", [..]), sql.query("...", [..])])`.
  Ids que um comando seguinte precisa: gere antes com `crypto.randomUUID()`.
- Colunas `date`: selecione como texto (`vencimento::text as vencimento`) — trafegam como "AAAA-MM-DD".
- Números são `double precision` (o driver devolve number). Contagens: `count(*)::int`.
- Regras e helpers do financeiro: `src/lib/financeiro.ts` (saldo, baixa, estorno, recorrências, tipos). Não altere
  as funções que já existem; pode adicionar novas.

## Login, permissões, empresa
- Toda página e toda server action começam com `await exigirAcesso("<chave>")` (`@/lib/auth`), que devolve o usuário
  (`{ id, email, nome, admin, permissoes }`). Chaves dos módulos em `src/lib/modulos.ts` (o menu já lista todos).
- Empresa (CNPJ) do financeiro: `const { atual, todas } = await empresaAtual()` (`@/lib/empresa`).
  Se `atual` for null, mostre um aviso com link para `/financeiro/empresas`. Todo dado financeiro filtra por `empresa_id`.
- Fornecedores e clientes são compartilhados entre empresas.

## Código
- Server actions em arquivos `src/app/acoes-<modulo>.ts` com `"use server"`. Retorne `{ erro: string }` ou `{ ok: ... }`
  (não jogue exceção para a tela). Depois de gravar: `revalidatePath(...)`.
- Formulários no cliente com `useActionState` (veja `src/components/ContaForms.tsx`, `src/components/UsuariosAdmin.tsx`).
- Páginas são server components com `export const dynamic = "force-dynamic"`.
- Formatação: `@/lib/formato` (`brl`, `dataBR`, `hojeISO`, `formatarDocumento`, `soDigitos`).
- Ícones: `<Icone nome="..." tamanho={16} />` de `@/components/Icone` (SVG; adicione novos desenhos do Lucide lá se
  precisar). **Nada de emoji** na interface.
- Gráficos simples: `Barras` e `Colunas` de `@/components/Graficos` (uma série cada).

## Visual (classes globais em `src/app/globals.css` — não edite esse arquivo)
`card`, `stats` + `stat` (`.label`/`.value`), `table-wrap` + `table` (`td.num` p/ valores), `btn` (`primary`, `small`,
`danger`), `badge` (`novo`, `usado`, `a_revisar`, `pronto`, `anunciado`, `vendido`, `baixa`, `media`, `alta`), `alert`
(`warn`, `error`, `ok`), `label.field > span` + input, `label.check`, `grid2`, `grid4`, `filters`, `actions`, `tabs`
(botões com `.active`), `muted`, `small`, `diff-pos`/`diff-neg`. Cores só por variáveis CSS (`var(--primary)`,
`var(--surface)`, `var(--border)`, `var(--muted)`, `var(--ok)`, `var(--warn)`, `var(--danger)`...) — o site tem modo escuro.
CSS novo: crie um arquivo seu (ex.: `src/app/(app)/notas/notas.css`) e importe na sua página.

## Testes
- `npx tsc --noEmit` precisa passar. **Não rode `next build` nem `next dev`** (outras pessoas trabalham em paralelo na
  mesma pasta e o `.next` conflita).
- Teste a lógica de banco com scripts Node no seu scratchpad que importam `@neondatabase/serverless` e leem
  `DATABASE_URL` do `.env.local` (veja `scripts/env.mjs`). Apague os dados de teste no fim.
- Não faça commit nem push (git).
