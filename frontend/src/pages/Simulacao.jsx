import { useState } from "react";
import { simulacaoAPI, pacientesAPI } from "../services/api";
import { FlaskConical, Play, Trash2, Users, Clock, AlertTriangle, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

const CORES = { P1: "#ef4444", P2: "#f97316", P3: "#eab308", P4: "#22c55e", P5: "#3b82f6" };

export default function Simulacao() {
  const [quantidade, setQuantidade] = useState(50);
  const [resultado, setResultado] = useState(null);
  const [status, setStatus] = useState(null);
  const [limpando, setLimpando] = useState(false);

  const simular = async () => {
    setStatus("loading");
    setResultado(null);
    try {
      const res = await simulacaoAPI.simular(quantidade);
      setResultado(res.data);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const limpar = async () => {
    setLimpando(true);
    await simulacaoAPI.limpar();
    setResultado(null);
    setStatus(null);
    setLimpando(false);
  };

  const gravidadeData = resultado
    ? Object.entries(resultado.por_gravidade).map(([k, v]) => ({ name: k, value: v, fill: CORES[k] }))
    : [];

  return (
    <div className="space-y-8 fade-in">
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

        {/* Como funciona */}
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

      {/* Resultado */}
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

          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users,         label: "Pacientes Criados",    value: resultado.pacientes_criados,          color: "text-blue-400" },
              { icon: FlaskConical,  label: "Total na Fila",        value: resultado.total_na_fila,              color: "text-purple-400" },
              { icon: Clock,         label: "Tempo Médio de Espera",value: `${resultado.tempo_medio_espera_dias}d`, color: "text-yellow-400" },
              { icon: AlertTriangle, label: "Pacientes Críticos",   value: resultado.criticos,                   color: "text-red-400" },
            ].map(m => (
              <div key={m.label} className="card p-5 text-center">
                <m.icon size={22} className={`${m.color} mx-auto mb-2`} />
                <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-slate-400 text-xs mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Gráfico por gravidade */}
          <div className="card p-6">
            <h4 className="text-white font-semibold mb-6">Distribuição por Gravidade (Escala Manchester)</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gravidadeData} barSize={40}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #3b82f6", borderRadius: 12, color: "#f1f5f9" }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {gravidadeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Modelagem matemática */}
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
