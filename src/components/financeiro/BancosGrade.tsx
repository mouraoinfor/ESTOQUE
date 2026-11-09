"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { salvarOrdemBancos } from "@/app/acoes-bancos";
import type { BancoComSaldo } from "@/lib/financeiro";
import Icone from "@/components/Icone";
import { BancoCard } from "./BancosPainel";

const CHAVE_VER = "bancos-ver-saldos";

// Cartões dos bancos: arrastar (ou setas) muda a ordem, que fica salva; saldos borrados até clicar no olho
export default function BancosGrade({ bancos }: { bancos: BancoComSaldo[] }) {
  const [ordem, setOrdem] = useState(() => bancos.map((b) => b.id));
  const [ver, setVer] = useState(false);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [pegou, setPegou] = useState<string | null>(null); // só a alça libera o arraste (os campos do card continuam normais)
  const [erro, setErro] = useState("");
  const [, iniciar] = useTransition();
  const inicial = useRef(ordem);
  const atual = useRef(ordem);
  atual.current = ordem;

  useEffect(() => {
    try { setVer(localStorage.getItem(CHAVE_VER) === "1"); } catch {}
  }, []);
  // Banco novo/excluído no servidor: mantém a ordem dos que continuam e põe os novos no fim
  useEffect(() => {
    setOrdem((o) => {
      const ids = new Set(bancos.map((b) => b.id));
      const mantidos = o.filter((id) => ids.has(id));
      return [...mantidos, ...bancos.map((b) => b.id).filter((id) => !mantidos.includes(id))];
    });
  }, [bancos]);

  function alternarVer() {
    const novo = !ver;
    setVer(novo);
    try { localStorage.setItem(CHAVE_VER, novo ? "1" : "0"); } catch {}
  }

  function gravar(nova: string[]) {
    if (nova.join() === inicial.current.join()) return;
    inicial.current = nova;
    setErro("");
    iniciar(async () => {
      const r = await salvarOrdemBancos(nova);
      if (r && "erro" in r && r.erro) setErro(r.erro);
    });
  }

  function mover(id: string, delta: number) {
    const i = ordem.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= ordem.length) return;
    const nova = [...ordem];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    setOrdem(nova);
    gravar(nova);
  }

  // Arrastando por cima de outro card: troca de lugar na hora (a grade mostra onde vai cair)
  function sobre(alvo: string) {
    if (!arrastando || arrastando === alvo) return;
    setOrdem((o) => {
      const n = o.filter((x) => x !== arrastando);
      n.splice(o.indexOf(alvo), 0, arrastando);
      return n;
    });
  }

  const porId = new Map(bancos.map((b) => [b.id, b]));
  const lista = ordem.map((id) => porId.get(id)).filter((b): b is BancoComSaldo => !!b);

  return (
    <>
      <div className="bancos-barra">
        <button type="button" className="btn small" onClick={alternarVer} aria-pressed={ver} title={ver ? "Esconder saldos" : "Mostrar saldos"}>
          <Icone nome={ver ? "olhoFechado" : "olho"} tamanho={16} /> {ver ? "Esconder saldos" : "Mostrar saldos"}
        </button>
        {lista.length > 1 && <span className="small muted">Arraste pela alça <Icone nome="arrastar" tamanho={13} /> (ou use as setas) para mudar a ordem.</span>}
      </div>
      {erro && <div className="alert error">Não foi possível salvar a ordem: {erro}</div>}
      <div className="bancos-grade">
        {lista.map((b, k) => (
          <div
            key={b.id}
            className={`banco-arrastavel${arrastando === b.id ? " arrastando" : ""}`}
            draggable={pegou === b.id}
            onDragStart={(e) => { setArrastando(b.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", b.id); }}
            onDragOver={(e) => { if (arrastando) { e.preventDefault(); sobre(b.id); } }}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={() => { setArrastando(null); setPegou(null); gravar(atual.current); }}
          >
            <BancoCard
              b={b}
              oculto={!ver}
              alca={lista.length > 1 && (
                <div className="banco-mover">
                  <button type="button" className="btn small" disabled={k === 0} onClick={() => mover(b.id, -1)} aria-label="Mover para a esquerda" title="Mover para a esquerda">‹</button>
                  <span
                    className="banco-alca"
                    title="Arraste para mudar a posição"
                    onPointerDown={() => setPegou(b.id)}
                    onPointerUp={() => { if (!arrastando) setPegou(null); }}
                  >
                    <Icone nome="arrastar" tamanho={16} />
                  </span>
                  <button type="button" className="btn small" disabled={k === lista.length - 1} onClick={() => mover(b.id, 1)} aria-label="Mover para a direita" title="Mover para a direita">›</button>
                </div>
              )}
            />
          </div>
        ))}
      </div>
    </>
  );
}
