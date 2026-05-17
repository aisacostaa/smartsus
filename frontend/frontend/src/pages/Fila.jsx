import { useEffect, useState } from "react";
import { filaAPI, pacientesAPI } from "../services/api";
import { AlertTriangle, Clock, RefreshCw, Search, CheckCircle, ArrowUpDown, BarChart2, X } from "lucide-react";

const CORES = { P1: "#ef4444", P2: "#f97316", P3: "#eab308", P4: "#22c55e", P5: "#3b82f6" };
const LABELS = { P1: "Imediato", P2: "Muito Urgente", P3: "Urgente", P4: "Pouco Urgente", P5: "Não Urgente" };

function BadgeGravidade({ nivel }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
      style={{ background: CORES[nivel] }}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
      {nivel} — {LABELS[nivel]}
    </span>
  );
}

function ScoreBarra({ score }) {
  const pct = Math.min((score / 80) * 100, 100);
  const cor = pct > 80 ? "#ef4444" : pct > 50 ? "#f97316" : "#3b82f6";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cor }} />
      </div>
      <span className="text-xs font-bold text-white w-10 text-right">{score.toFixed(1)}</span>
    </div>
  );
}

function ModalReordenar({ paciente, posicaoAtual, totalFila, onConfirm, onClose }) {
  const [novaPosicao, setNovaPosicao] = useState(posicaoAtual);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="card p-6 w-full max-w-md fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold">Reordenar Paciente</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-slate-300 text-sm mb-2">{paciente.nome}</p>
        <p className="text-slate-400 text-xs mb-6">Posição atual: <span className="text-blue-400 font-bold">#{posicaoAtual}</span></p>
        <label className="block text-sm font-medium text-slate-300 mb-2">Nova posição na fila</label>
        <input type="number" min={1} max={totalFila} value={novaPosicao}
          onChange={e => setNovaPosicao(Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-blue-900/30 text-white text-sm focus:outline-none focus:border-blue-500 mb-6" />
        <div className="flex gap-3">
          <button onClick={() => onConfirm(novaPosicao)}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all">
            Confirmar
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
  const [fila, setFila] = useState([]);
  const [filaManual, setFilaManual] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroGravidade, setFiltroGravidade] = useState("todos");
  const [recalculando, setRecalculando] = useState(false);
  const [modoComparacao, setModoComparacao] = useState(false);
  const [modalReordenar, setModalReordenar] = useState(null);
  const [realizando, setRealizando] = useState(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await filaAPI.listar();
      setFila(res.data);
      if (filaManual.length === 0) setFilaManual(res.data.map((p, i) => ({ ...p, posicaoManual: i + 1 })));
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

  const reordenarManual = (pacienteId, novaPosicao) => {
    setFilaManual(prev => {
      const lista = [...prev];
      const idx = lista.findIndex(p => p.id === pacienteId);
      if (idx === -1) return lista;
      const [item] = lista.splice(idx, 1);
      lista.splice(Math.max(0, novaPosicao - 1), 0, item);
      return lista.map((p, i) => ({ ...p, posicaoManual: i + 1 }));
    });
    setModalReordenar(null);
  };

  const filtrado = (modoComparacao ? filaManual : fila).filter(p => {
    const buscaOk = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.id.toString().includes(busca);
    const gravOk = filtroGravidade === "todos" || p.gravidade === filtroGravidade;
    return buscaOk && gravOk;
  });

  const criticos = fila.filter(p => p.critico).length;

  return (
    <div className="space-y-6 fade-in">
      {modalReordenar && (
        <ModalReordenar
          paciente={modalReordenar}
          posicaoAtual={modalReordenar.posicao || modalReordenar.posicaoManual}
          totalFila={fila.length}
          onConfirm={(pos) => reordenarManual(modalReordenar.id, pos)}
          onClose={() => setModalReordenar(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Fila de Espera</h2>
          <p className="text-slate-400 text-sm mt-1">{fila.length} pacientes · atualiza a cada 30s</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setModoComparacao(!modoComparacao)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              modoComparacao ? "bg-purple-600 text-white" : "border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"}`}>
            <BarChart2 size={15} />
            {modoComparacao ? "Modo Manual Ativo" : "Ordenação Manual"}
          </button>
          <button onClick={recalcular} disabled={recalculando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-50">
            <RefreshCw size={15} className={recalculando ? "animate-spin" : ""} />
            Recalcular Scores
          </button>
        </div>
      </div>

      {/* Banner modo comparação */}
      {modoComparacao && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 fade-in">
          <ArrowUpDown size={18} className="text-purple-400 flex-shrink-0" />
          <div>
            <p className="text-purple-300 text-sm font-medium">Modo de Ordenação Manual Ativo</p>
            <p className="text-purple-400 text-xs mt-0.5">Clique em "Reordenar" para mover um paciente. Compare com a ordenação do algoritmo desativando o modo.</p>
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
                {["#", "Paciente", "Gravidade", "Cirurgia", "Score", "Dias na Fila", "Hospital", "Ações"].map(h => (
                  <th key={h} className="text-left px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">Carregando...</td></tr>
              ) : filtrado.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">Nenhum paciente encontrado.</td></tr>
              ) : filtrado.map((p) => {
                const pos = modoComparacao ? p.posicaoManual : p.posicao;
                const posAlgoritmo = fila.find(f => f.id === p.id)?.posicao;
                const mudou = modoComparacao && pos !== posAlgoritmo;
                return (
                  <tr key={p.id}
                    className={`border-b border-blue-900/10 hover:bg-blue-900/10 transition-all ${p.critico ? "bg-red-900/10" : ""} ${mudou ? "bg-purple-900/10" : ""}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${mudou ? "text-purple-400" : "text-blue-400"}`}>#{pos}</span>
                        {mudou && <span className="text-xs text-purple-400">(alg: #{posAlgoritmo})</span>}
                        {p.critico && <span className="w-2 h-2 rounded-full bg-red-500 pulse-blue" />}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white font-medium text-sm">{p.nome}</p>
                      <p className="text-slate-500 text-xs">ID #{p.id}</p>
                    </td>
                    <td className="px-4 py-4"><BadgeGravidade nivel={p.gravidade} /></td>
                    <td className="px-4 py-4 text-slate-300 text-sm">{p.tipo_cirurgia}</td>
                    <td className="px-4 py-4 min-w-32"><ScoreBarra score={p.score} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className={p.critico ? "text-red-400" : "text-slate-400"} />
                        <span className={`text-sm font-medium ${p.critico ? "text-red-400" : "text-slate-300"}`}>{p.dias_na_fila}d</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-sm max-w-32 truncate">{p.hospital_atribuido || "—"}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {modoComparacao && (
                          <button onClick={() => setModalReordenar(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-medium transition-all border border-purple-600/30 whitespace-nowrap">
                            Reordenar
                          </button>
                        )}
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
