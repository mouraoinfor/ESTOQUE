# Sistema de Estoque — A+ Com (Next.js + Neon + Vercel)

Controle de estoque com conferência, movimentações e anúncios prontos para **Mercado Livre** (itens novos) e **OLX** (itens usados).

## Telas

| Tela | Para que serve |
|---|---|
| Itens | Lista com busca, filtros, totais e exportação para CSV/Excel. |
| Item | Edição completa (abas Estoque, Anúncio, Preço e envio), **anúncio pronto com botões de copiar** (ML/OLX), fotos, movimentação e histórico. |
| Anúncios | Itens à venda agrupados por status: a revisar, pronto, anunciado, vendido. |
| Conferência | Você digita o que contou, o sistema mostra a diferença e ajusta o estoque com um clique. |
| Movimentações | Histórico de entradas, saídas, vendas e ajustes. |
| Minha conta | Troca de senha e cadastro de outros usuários. |

## Arquitetura

- **Banco:** Neon Postgres, com o driver HTTP `@neondatabase/serverless`, que é o indicado para a Vercel. O schema está em `db/schema.sql`.
- **Login:** a tabela `usuarios` guarda as senhas com bcrypt. A sessão fica num cookie JWT assinado com `AUTH_SECRET`.
- **Fotos:** o navegador reduz cada foto para JPEG de até 1600px, e ela é guardada na tabela `fotos`.

## Comandos

```
npm run dev              # desenvolvimento em http://localhost:3000
npm run db:setup         # cria as tabelas e, se o banco estiver vazio, lança os 65 itens do seed
npm run criar-usuario -- email@exemplo.com "Nome" [senha]   # sem senha, gera uma
npm run gerar-seed       # regera db/seed.sql a partir de data/
```

A Neon está ligada pelo `neon init`. O `neon deploy` ou o `neon env pull` preenchem o `DATABASE_URL` no `.env.local`.

## Deploy na Vercel

1. Importe o repositório em vercel.com/new.
2. Configure as variáveis de ambiente:
   - `DATABASE_URL`: a URL **pooled** da Neon.
   - `AUTH_SECRET`: 32 ou mais caracteres aleatórios.
3. Faça o deploy.
