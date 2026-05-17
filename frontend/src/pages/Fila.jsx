import { useEffect, useState } from "react";
import { filaAPI, pacientesAPI, hospitaisAPI } from "../services/api";
import { AlertTriangle, Clock, RefreshCw, Search, CheckCircle, ArrowUpDown, X, Hospital } from "lucide-react";

const CORES = { P1: "#ef4444", P2: "#f97316", P3: "#eab308", P4: "#22c55e", P5: "#3b82f6" };
const LABELS = { P1: "Imediato", P2: "Muito Urgente", P3: "Urgente", P4: "Pouco Urgente", P5: "Não Urgente" };

function BadgeGravidade({ nivel }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
      style={{ background: CORES[nivel] }}>
      {nivel} — {LABELS[nivel]}
    </span>
  );
}

function ScoreBarra({ score }) {
  const pct = Math.min((score / 80) * 100, 100);
  const cor = pct > 80 ? "#ef4444" : pct > 50 ? "#f97316" : "#3b82f6";
  return (
    <div className="flex items-center gap-2 min-w-28">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cor }} />
      </div>
      <span className="text-xs font-bold text-white w-8 text-right">{score.toFixed(1)}</span>
    </div>
  );
}

// Modal encaminhar para hospital
function ModalEncaminhar({ paciente, onConfirm, onClose }) {
  const [selecionado, setSelecionado] = useState(null);
  const [hospitais, setHospitais] = useState([]);
  const [loadingH, setLoadingH] = useState(true);

  useEffect(() => {
    hospitaisAPI.listar().then(r => {
      setHospitais(r.data);
      setLoadingH(false);
    });
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="card p-6 w-full max-w-lg fade-in max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold">Encaminhar para Hospital</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-slate-400 text-sm mb-6">{paciente.nome} — {paciente.gravidade} · {paciente.tipo_cirurgia}</p>

        {loadingH ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}
        <div className="space-y-2 mb-6">
          {hospitais.map(h => (
            <button key={h.id} onClick={() => setSelecionado(h.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selecionado === h.id
                  ? "border-blue-500 bg-blue-600/20"
                  : "border-blue-900/30 bg-slate-800/40 hover:border-blue-700/40"
              } ${!h.disponivel ? "opacity-40 cursor-not-allowed" : ""}`}
              disabled={!h.disponivel}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{h.nome}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{h.bairro} · {h.endereco}</p>
                </div>
                <div className="text-right ml-4">
                  <p className={`text-sm font-bold ${h.disponivel ? "text-green-400" : "text-red-400"}`}>
                    {h.vagas_hoje}/{h.capacidade_dia}
                  </p>
                  <p className="text-slate-500 text-xs">vagas</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => selecionado && onConfirm(selecionado)} disabled={!selecionado}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-40">
            Confirmar Encaminhamento
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white text-sm transition-all">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Fila() {
  const [filaAlgoritmo, setFilaAlgoritmo] = useState([]);
  const [filaFIFO, setFilaFIFO] = useState([]);
  const [hospitais, setHospitais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroGravidade, setFiltroGravidade] = useState("todos");
  const [recalculando, setRecalculando] = useState(false);
  const [modoOtimizado, setModoOtimizado] = useState(true);
  const [modalEncaminhar, setModalEncaminhar] = useState(null);
  const [realizando, setRealizando] = useState(null);
  const [encaminhando, setEncaminhando] = useState(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const [filaRes, hospRes] = await Promise.all([filaAPI.listar(), hospitaisAPI.listar()]);
      const dados = filaRes.data;
      setFilaAlgoritmo(dados);
      // FIFO: ordenar por data de entrada (quem chegou primeiro)
      const fifo = [...dados].sort((a, b) => new Date(a.data_entrada) - new Date(b.data_entrada))
        .map((p, i) => ({ ...p, posicaoFIFO: i + 1, posicaoAlgoritmo: dados.findIndex(d => d.id === p.id) + 1 }));
      setFilaFIFO(fifo);
      setHospitais(hospRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); const t = setInterval(carregar, 30000); return () => clearInterval(t); }, []);

  const recalcular = async () => {
    setRecalculando(true);
    await pacientesAPI.recalcular();
    await carregar();
    setRecalculando(false);
  };

  const realizarCirurgia = async (id) => {
    setRealizando(id);
    await pacientesAPI.atualizar(id, { status: "realizado" });
    await carregar();
    setRealizando(null);
  };

  const encaminharHospital = async (pacienteId, hospitalId) => {
    setEncaminhando(pacienteId);
    await pacientesAPI.atualizar(pacienteId, { hospital_id: hospitalId });
    await carregar();
    setEncaminhando(null);
    setModalEncaminhar(null);
  };

  const filaAtual = modoOtimizado ? filaAlgoritmo : filaFIFO;
  const criticos = filaAlgoritmo.filter(p => p.critico).length;

  const filtrado = filaAtual.filter(p => {
    const buscaOk = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.id.toString().includes(busca);
    const gravOk = filtroGravidade === "todos" || p.gravidade === filtroGravidade;
    return buscaOk && gravOk;
  });

  return (
    <div className="space-y-6 fade-in">
      {modalEncaminhar && (
        <ModalEncaminhar
          paciente={modalEncaminhar}
          onConfirm={(hId) => encaminharHospital(modalEncaminhar.id, hId)}
          onClose={() => setModalEncaminhar(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Fila de Espera</h2>
          <p className="text-slate-400 text-sm mt-1">{filaAlgoritmo.length} pacientes aguardando</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={recalcular} disabled={recalculando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-50">
            <RefreshCw size={15} className={recalculando ? "animate-spin" : ""} />
            Recalcular
          </button>
        </div>
      </div>

      {/* Toggle otimizado vs FIFO */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/60 border border-blue-900/30 w-fit">
        <button onClick={() => setModoOtimizado(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            modoOtimizado ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
          ✨ Fila Otimizada (Algoritmo)
        </button>
        <button onClick={() => setModoOtimizado(false)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            !modoOtimizado ? "bg-slate-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
          <Clock size={14} /> Fila Manual (FIFO)
        </button>
      </div>

      {/* Banner explicativo */}
      {!modoOtimizado ? (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-500/30 bg-slate-500/10 fade-in">
          <Clock size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-200 text-sm font-medium">Modo FIFO — Sem Otimização</p>
            <p className="text-slate-400 text-xs mt-1">Pacientes ordenados por data de chegada. Casos graves que chegaram depois ficam atrás de casos leves. A coluna "Pos. Alg." mostra onde o algoritmo colocaria cada paciente.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 fade-in">
          <CheckCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-200 text-sm font-medium">Modo Otimizado — Algoritmo de Priorização Ativo</p>
            <p className="text-blue-400 text-xs mt-1">Pacientes ordenados por score: S = α·Manchester + β·Idade + γ·Tempo + δ·Cirurgia. Compare com o modo FIFO para ver a diferença.</p>
          </div>
        </div>
      )}

      {/* Alerta críticos */}
      {criticos > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">
            <span className="font-bold">{criticos} paciente{criticos > 1 ? "s" : ""}</span> com mais de 150 dias na fila — próximos do limite de 180 dias!
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-blue-900/30 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all" />
        </div>
        {["todos","P1","P2","P3","P4","P5"].map(g => (
          <button key={g} onClick={() => setFiltroGravidade(g)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filtroGravidade === g ? "bg-blue-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white border border-blue-900/30"}`}>
            {g === "todos" ? "Todos" : g}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-900/30">
                {[
                  modoOtimizado ? "# Alg." : "# FIFO",
                  !modoOtimizado ? "Pos. Alg." : null,
                  "Paciente", "Gravidade", "Cirurgia", "Score", "Dias na Fila", "Hospital", "Ações"
                ].filter(Boolean).map(h => (
                  <th key={h} className="text-left px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500">Carregando...</td></tr>
              ) : filtrado.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500">Nenhum paciente encontrado.</td></tr>
              ) : filtrado.map((p, idx) => {
                const posAtual = modoOtimizado ? p.posicao : p.posicaoFIFO;
                const posAlg = modoOtimizado ? null : p.posicaoAlgoritmo;
                const ganho = !modoOtimizado && p.posicaoFIFO - p.posicaoAlgoritmo;
                return (
                  <tr key={p.id}
                    className={`border-b border-blue-900/10 hover:bg-blue-900/10 transition-all ${p.critico ? "bg-red-900/10" : ""}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${modoOtimizado ? "text-blue-400" : "text-slate-400"}`}>#{posAtual}</span>
                        {p.critico && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                      </div>
                    </td>
                    {!modoOtimizado && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-400 font-bold text-sm">#{posAlg}</span>
                          {ganho > 0 && (
                            <span className="text-xs text-green-400 font-medium">↑{ganho}</span>
                          )}
                          {ganho < 0 && (
                            <span className="text-xs text-red-400 font-medium">↓{Math.abs(ganho)}</span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <p className="text-white font-medium text-sm whitespace-nowrap">{p.nome}</p>
                      <p className="text-slate-500 text-xs">ID #{p.id}</p>
                    </td>
                    <td className="px-4 py-4"><BadgeGravidade nivel={p.gravidade} /></td>
                    <td className="px-4 py-4 text-slate-300 text-sm whitespace-nowrap">{p.tipo_cirurgia}</td>
                    <td className="px-4 py-4"><ScoreBarra score={p.score} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className={p.critico ? "text-red-400" : "text-slate-400"} />
                        <span className={`text-sm font-medium ${p.critico ? "text-red-400" : "text-slate-300"}`}>{p.dias_na_fila}d</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-xs max-w-32 truncate">{p.hospital_atribuido || "—"}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setModalEncaminhar(p)}
                          disabled={encaminhando === p.id}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-xs font-medium transition-all border border-blue-600/30 whitespace-nowrap flex items-center gap-1 disabled:opacity-50">
                          <Hospital size={11} />
                          Encaminhar
                        </button>
                        <button onClick={() => realizarCirurgia(p.id)} disabled={realizando === p.id}
                          className="px-2.5 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-300 text-xs font-medium transition-all border border-green-600/30 whitespace-nowrap flex items-center gap-1 disabled:opacity-50">
                          <CheckCircle size={11} />
                          {realizando === p.id ? "..." : "Realizar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
