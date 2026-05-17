import { useState } from "react";
import { simulacaoAPI, pacientesAPI } from "../services/api";
import { FlaskConical, Play, Trash2, Users, Clock, AlertTriangle, Activity, X, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

const CORES = { P1: "#ef4444", P2: "#f97316", P3: "#eab308", P4: "#22c55e", P5: "#3b82f6" };
const LABELS = { P1: "Imediato", P2: "Muito Urgente", P3: "Urgente", P4: "Pouco Urgente", P5: "Não Urgente" };

function Modal({ paciente, onClose }) {
  if (!paciente) return null;
  const scoreM = { P1: 100, P2: 80, P3: 60, P4: 40, P5: 20 }[paciente.gravidade] * 0.45;
  const scoreI = Math.min(Math.max((paciente.idade - 40) * 0.5, 0), 20) * 0.20;
  const scoreD = (30 * Math.min(paciente.dias_na_fila / 180, 1)) * 0.25;
  const scoreC = paciente.score - scoreM - scoreI - scoreD;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="card p-6 w-full max-w-lg fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">{paciente.nome}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Dados pessoais */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: "Idade", value: `${paciente.idade} anos` },
            { label: "Gênero", value: paciente.genero === "M" ? "Masculino" : paciente.genero === "F" ? "Feminino" : "Outro" },
            { label: "Cirurgia", value: paciente.tipo_cirurgia },
            { label: "Bairro", value: paciente.bairro },
            { label: "Dias na Fila", value: `${paciente.dias_na_fila} dias` },
            { label: "Hospital", value: paciente.hospital_atribuido || "—" },
          ].map(item => (
            <div key={item.label} className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-slate-400 text-xs">{item.label}</p>
              <p className="text-white font-medium text-sm mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Gravidade */}
        <div className="mb-6 p-3 rounded-xl border"
          style={{ borderColor: CORES[paciente.gravidade] + "44", background: CORES[paciente.gravidade] + "11" }}>
          <p className="text-xs text-slate-400 mb-1">Gravidade Manchester</p>
          <p className="font-bold" style={{ color: CORES[paciente.gravidade] }}>
            {paciente.gravidade} — {LABELS[paciente.gravidade]}
          </p>
        </div>

        {/* Decomposição do score */}
        <div>
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Por que este score? — Total: {paciente.score?.toFixed(1) ?? "—"}
          </p>
          <div className="space-y-2">
            {[
              { label: "α × Manchester (gravidade)", valor: scoreM.toFixed(2), pct: (scoreM / paciente.score) * 100, cor: "#ef4444" },
              { label: "β × Idade", valor: scoreI.toFixed(2), pct: (scoreI / paciente.score) * 100, cor: "#a78bfa" },
              { label: "γ × Tempo na fila", valor: scoreD.toFixed(2), pct: (scoreD / paciente.score) * 100, cor: "#f97316" },
              { label: "δ × Tipo de cirurgia", valor: Math.max(scoreC, 0).toFixed(2), pct: (Math.max(scoreC, 0) / paciente.score) * 100, cor: "#22c55e" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-white font-medium">+{item.valor}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(item.pct, 0)}%`, background: item.cor }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Simulacao() {
  const [quantidade, setQuantidade] = useState(50);
  const [resultado, setResultado] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [status, setStatus] = useState(null);
  const [limpando, setLimpando] = useState(false);
  const [modalPaciente, setModalPaciente] = useState(null);
  const [mostrarTabela, setMostrarTabela] = useState(false);

  const simular = async () => {
    setStatus("loading");
    setResultado(null);
    setPacientes([]);
    try {
      const res = await simulacaoAPI.simular(quantidade);
      setResultado(res.data);
      // Buscar pacientes da fila após simulação
      const filaRes = await pacientesAPI.listar("aguardando");
      setPacientes(filaRes.data.slice(0, quantidade));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const limpar = async () => {
    setLimpando(true);
    await simulacaoAPI.limpar();
    setResultado(null);
    setPacientes([]);
    setStatus(null);
    setMostrarTabela(false);
    setLimpando(false);
  };

  const gravidadeData = resultado
    ? Object.entries(resultado.por_gravidade).map(([k, v]) => ({ name: k, value: v, fill: CORES[k] }))
    : [];

  return (
    <div className="space-y-8 fade-in">
      {modalPaciente && <Modal paciente={modalPaciente} onClose={() => setModalPaciente(null)} />}

      <div>
        <h2 className="text-2xl font-bold text-white">Simulação Inteligente</h2>
        <p className="text-slate-400 text-sm mt-1">Gere pacientes fictícios e veja o algoritmo de priorização em ação</p>
      </div>

      {/* Painel de controle */}
      <div className="card p-8">
        <h3 className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-6">Configurar Simulação</h3>
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Quantidade de Pacientes: <span className="text-blue-400 font-bold">{quantidade}</span>
            </label>
            <input type="range" min={10} max={200} value={quantidade}
              onChange={e => setQuantidade(Number(e.target.value))}
              className="w-full accent-blue-500" />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>10</span><span>100</span><span>200</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={simular} disabled={status === "loading"}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-50 glow">
              {status === "loading"
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Simulando...</>
                : <><Play size={16} />Simular Sistema</>}
            </button>
            <button onClick={limpar} disabled={limpando}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium transition-all disabled:opacity-50">
              <Trash2 size={16} />
              {limpando ? "Limpando..." : "Limpar"}
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-blue-900/30">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Como funciona</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { step: "1", text: "Gera pacientes com dados realistas de SP" },
              { step: "2", text: "Distribui por diferentes regiões da cidade" },
              { step: "3", text: "Aplica o algoritmo de score Manchester" },
              { step: "4", text: "Aloca no hospital mais próximo com vaga" },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3 p-3 rounded-xl bg-blue-900/20 border border-blue-900/30">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{s.step}</span>
                <p className="text-slate-300 text-xs leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {status === "error" && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
          Erro ao executar simulação. Verifique se o backend está rodando.
        </div>
      )}

      {resultado && (
        <div className="space-y-6 fade-in">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Activity size={18} className="text-blue-400" />
            Resultado da Simulação
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users,         label: "Pacientes Criados",     value: resultado.pacientes_criados,             color: "text-blue-400" },
              { icon: FlaskConical,  label: "Total na Fila",         value: resultado.total_na_fila,                 color: "text-purple-400" },
              { icon: Clock,         label: "Tempo Médio de Espera", value: `${resultado.tempo_medio_espera_dias}d`, color: "text-yellow-400" },
              { icon: AlertTriangle, label: "Pacientes Críticos",    value: resultado.criticos,                      color: "text-red-400" },
            ].map(m => (
              <div key={m.label} className="card p-5 text-center">
                <m.icon size={22} className={`${m.color} mx-auto mb-2`} />
                <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-slate-400 text-xs mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h4 className="text-white font-semibold mb-6">Distribuição por Gravidade (Escala Manchester)</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gravidadeData} barSize={40}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #3b82f6", borderRadius: 12, color: "#f1f5f9" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {gravidadeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela de pacientes */}
          {pacientes.length > 0 && (
            <div className="card overflow-hidden">
              <button onClick={() => setMostrarTabela(!mostrarTabela)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-blue-900/10 transition-all">
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-blue-400" />
                  <span className="text-white font-semibold">Pacientes Gerados — Fila Otimizada</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 text-xs">{pacientes.length}</span>
                </div>
                {mostrarTabela ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>

              {mostrarTabela && (
                <div className="overflow-x-auto border-t border-blue-900/30">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-blue-900/30">
                        {["Pos.", "Paciente", "Idade", "Gravidade", "Cirurgia", "Score", "Dias na Fila", "Hospital", ""].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pacientes.map((p, i) => (
                        <tr key={p.id} className="border-b border-blue-900/10 hover:bg-blue-900/10 transition-all">
                          <td className="px-4 py-3 text-blue-400 font-bold text-sm">#{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="text-white text-sm font-medium">{p.nome}</p>
                            <p className="text-slate-500 text-xs">ID #{p.id}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm">{p.idade} anos</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-bold text-white"
                              style={{ background: CORES[p.gravidade] }}>
                              {p.gravidade} — {LABELS[p.gravidade]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm">{p.tipo_cirurgia}</td>
                          <td className="px-4 py-3 text-white font-bold text-sm">{p.score?.toFixed(1)}</td>
                          <td className="px-4 py-3 text-slate-300 text-sm">{p.dias_na_fila}d</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{p.hospital_id ? `Hospital #${p.hospital_id}` : "—"}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => setModalPaciente({ ...p, hospital_atribuido: p.hospital_id ? `Hospital #${p.hospital_id}` : "—" })}
                              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-xs font-medium transition-all border border-blue-600/30 whitespace-nowrap">
                              Detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Fórmula */}
          <div className="card p-6">
            <h4 className="text-white font-semibold mb-4">Fórmula de Priorização Aplicada</h4>
            <div className="bg-slate-900/60 rounded-xl p-4 font-mono text-sm">
              <p className="text-blue-300">S<sub>i</sub> = α·M<sub>i</sub> + β·I<sub>i</sub> + γ·D<sub>i</sub> + δ·C<sub>i</sub></p>
              <div className="mt-4 space-y-1 text-xs text-slate-400">
                <p><span className="text-blue-400">α = 0.45</span> · M = Score Manchester (P1=100 → P5=20)</p>
                <p><span className="text-blue-400">β = 0.20</span> · I = Score Idade (bônus para idosos)</p>
                <p><span className="text-blue-400">γ = 0.25</span> · D = Score Tempo na fila (exponencial após 120 dias)</p>
                <p><span className="text-blue-400">δ = 0.10</span> · C = Score Tipo de Cirurgia (urgência)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
