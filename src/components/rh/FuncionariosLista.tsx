"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { brl, dataBR } from "@/lib/formato";
import { beneficiosMensais, mesCurto, type Funcionario } from "./rh-util";

type Filtro = "ativos" | "desligados" | "todos";

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function FuncionariosLista({ funcionarios }: { funcionarios: (Funcionario & { ultimo_mes: string | null })[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("ativos");
  const [busca, setBusca] = useState("");

  const contagem = {
    ativos: funcionarios.filter((f) => f.ativo).length,
    desligados: funcionarios.filter((f) => !f.ativo).length,
    todos: funcionarios.length,
  };

  const lista = useMemo(() => {
    const termo = sem(busca.trim());
    return funcionarios.filter((f) => {
      if (filtro === "ativos" && !f.ativo) return false;
      if (filtro === "desligados" && f.ativo) return false;
      if (!termo) return true;
      return sem([f.nome, f.apelido, f.funcao, f.documento, f.telefone].filter(Boolean).join(" ")).includes(termo);
    });
  }, [funcionarios, filtro, busca]);

  const abrir = (id: string) => router.push(`/rh/${id}`);

  return (
    <>
      <div className="filters">
        <div className="tabs rh-tabs">
          {(["ativos", "desligados", "todos"] as const).map((f) => (
            <button key={f} type="button" className={filtro === f ? "active" : ""} onClick={() => setFiltro(f)}>
              {f === "ativos" ? "Ativos" : f === "desligados" ? "Desligados" : "Todos"} ({contagem[f]})
            </button>
          ))}
        </div>
        <input type="search" placeholder="Buscar por nome, função, documento..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table className="rh-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Função</th>
              <th className="num">Salário</th>
              <th className="num hide-sm">VR/dia</th>
              <th className="num hide-sm">VT/dia</th>
              <th className="num hide-sm">VA mensal</th>
              <th className="num hide-sm">Benefícios/mês</th>
              <th className="hide-sm">Admissão</th>
              <th className="hide-sm">Última folha</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((f) => (
              <tr
                key={f.id}
                className="rh-linha"
                tabIndex={0}
                onClick={() => abrir(f.id)}
                onKeyDown={(e) => e.key === "Enter" && abrir(f.id)}
              >
                <td>
                  <strong>{f.nome}</strong>
                  {f.apelido && <span className="muted small"> · {f.apelido}</span>}
                </td>
                <td>{f.funcao ?? <span className="muted">—</span>}</td>
                <td className="num">{brl(f.salario)}</td>
                <td className="num hide-sm">{brl(f.vr_dia)}</td>
                <td className="num hide-sm">{brl(f.vt_dia)}</td>
                <td className="num hide-sm">{brl(f.va_mensal)}</td>
                <td className="num hide-sm">{brl(beneficiosMensais(f))}</td>
                <td className="hide-sm">{dataBR(f.admissao)}</td>
                <td className="hide-sm">{f.ultimo_mes ? mesCurto(f.ultimo_mes) : <span className="muted">—</span>}</td>
                <td>
                  {f.ativo ? (
                    <span className="badge novo">Ativo</span>
                  ) : (
                    <span className="badge baixa" title={f.demissao ? `Desligado em ${dataBR(f.demissao)}` : undefined}>
                      Desligado{f.demissao ? ` ${dataBR(f.demissao)}` : ""}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr>
                <td colSpan={10} className="muted">Nenhum funcionário encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
