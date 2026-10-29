"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { escolherEmpresa } from "@/app/acoes-empresa";
import { GRUPOS, MODULOS, moduloDaRota } from "@/lib/modulos";
import Icone, { type NomeIcone } from "./Icone";
import TemaBotao from "./TemaBotao";

interface Props {
  usuario: string;
  admin: boolean;
  temaRosa: boolean; // admin liberou o modo rosa para este usuário
  liberados: string[]; // chaves de módulo que este usuário pode abrir
  empresas: { id: string; nome: string }[];
  empresaId: string | null;
  sair: () => Promise<void>;
}

// Menu recolhido fica em <html data-menu="mini"> (aplicado antes da pintura pelo layout raiz)
function alternarMenu() {
  const html = document.documentElement;
  const mini = html.dataset.menu !== "mini";
  if (mini) html.dataset.menu = "mini";
  else delete html.dataset.menu;
  try { localStorage.setItem("menu", mini ? "mini" : "aberto"); } catch {}
}

function ItemMenu({ href, label, icone, ativo }: { href: string; label: string; icone: NomeIcone; ativo: boolean }) {
  return (
    <Link href={href} className={ativo ? "active" : undefined} title={label}>
      <Icone nome={icone} />
      <span className="rotulo">{label}</span>
    </Link>
  );
}

export default function MenuLateral({ usuario, admin, temaRosa, liberados, empresas, empresaId, sair }: Props) {
  const atual = usePathname();
  const [trocando, start] = useTransition();
  const ativo = moduloDaRota(atual)?.chave;
  const visiveis = MODULOS.filter((m) => liberados.includes(m.chave));
  const temFinanceiro = visiveis.some((m) => m.grupo === "Financeiro");
  // Celular: o menu abre por cima da tela pelo botão do topo e fecha ao navegar
  const [aberto, setAberto] = useState(false);
  useEffect(() => setAberto(false), [atual]);
  useEffect(() => {
    if (!aberto) return;
    document.documentElement.dataset.menuAberto = "1";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", esc);
    return () => {
      delete document.documentElement.dataset.menuAberto;
      window.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <aside className={`sidebar${aberto ? " aberta" : ""}`}>
      <div className="sidebar-topo">
        <Link href="/" className="brand" title="A+ Com — Início">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-amais.png" alt="A+ Com" />
          <span>Gestão</span>
        </Link>
        <button type="button" className="menu-alternar" onClick={alternarMenu} aria-label="Recolher ou expandir o menu" title="Recolher / expandir menu">
          <Icone nome="recolher" className="so-aberto" />
          <Icone nome="expandir" className="so-mini" />
        </button>
        <button type="button" className="menu-celular" onClick={() => setAberto((v) => !v)} aria-label={aberto ? "Fechar menu" : "Abrir menu"} aria-expanded={aberto}>
          <Icone nome={aberto ? "fechar" : "menu"} tamanho={22} />
        </button>
      </div>

      <nav>
        <ItemMenu href="/" label="Início" icone="inicio" ativo={atual === "/"} />
        {GRUPOS.map((g) => {
          const itens = visiveis.filter((m) => m.grupo === g);
          if (!itens.length) return null;
          return (
            <div className="grupo" key={g}>
              <div className="grupo-titulo"><span className="rotulo">{g}</span></div>
              {g === "Financeiro" && temFinanceiro && empresas.length > 1 && (
                <select
                  className="empresa-select"
                  value={empresaId ?? ""}
                  disabled={trocando}
                  onChange={(e) => { const id = e.target.value; start(() => escolherEmpresa(id)); }}
                  title="Empresa (CNPJ) do financeiro"
                  aria-label="Empresa"
                >
                  {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              )}
              {itens.map((m) => <ItemMenu key={m.chave} href={m.href} label={m.label} icone={m.icone} ativo={ativo === m.chave} />)}
            </div>
          );
        })}
        {admin && (
          <div className="grupo">
            <div className="grupo-titulo"><span className="rotulo">Administração</span></div>
            <ItemMenu href="/usuarios" label="Usuários e acessos" icone="escudo" ativo={atual.startsWith("/usuarios")} />
            <ItemMenu href="/configuracoes" label="Configurações" icone="engrenagem" ativo={atual.startsWith("/configuracoes")} />
          </div>
        )}
      </nav>

      <div className="user">
        <TemaBotao rosa={temaRosa} />
        <Link href="/conta" className="user-nome" title="Minha conta">
          <Icone nome="conta" tamanho={16} /> <span className="rotulo">{usuario}</span>
        </Link>
        <form action={sair}>
          <button className="sair" type="submit" title="Sair">
            <Icone nome="sair" />
            <span className="rotulo">Sair</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
