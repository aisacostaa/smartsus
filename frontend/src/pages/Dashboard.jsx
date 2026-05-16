import { useEffect, useState } from "react";
import { dashboardAPI } from "../services/api";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Users, Clock, Hospital, AlertTriangle, CheckCircle, Activity } from "lucide-react";

const CORES_MANCHESTER = { P1: "#ef4444", P2: "#f97316", P3: "#eab308", P4: "#22c55e", P5: "#3b82f6" };
const LABELS_MANCHESTER = { P1: "Imediato", P2: "Muito Urgente", P3: "Urgente", P4: "Pouco Urgente", P5: "Não Urgente" };

function CardMetrica({ icon: Icon, label, value, sub, color = "blue", alert = false }) {
  return (
    <div className={`card p-6 fade-in flex items-start gap-4 ${alert ? "border-red-500/40" : ""}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
        alert ? "bg-red-500/20" : `bg-${color}-600/20`}`}>
        <Icon size={22} className={alert ? "text-red-400" : `text-${color}-400`} />
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${alert ? "text-red-400" : "text-white"}`}>{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
      </div>
      {alert && value > 0 && (
        <span className="ml-auto w-2 h-2 rounded-full bg-red-500 pulse-blue mt-1" />
      )}
    </div>
  );
}

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardAPI.dados();
        setDados(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!dados) return <p className="text-slate-400">Erro ao carregar dados.</p>;

  const gravidadeData = Object.entries(dados.por_gravidade).map(([k, v]) => ({
    name: k, value: v, label: LABELS_MANCHESTER[k], fill: CORES_MANCHESTER[k]
  }));

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">Visão geral do sistema SmartSus</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-sm font-medium">Sistema Online</span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <CardMetrica icon={Users}         label="Total de Pacientes"     value={dados.total_pacientes}       sub="cadastrados no sistema" />
        <CardMetrica icon={Activity}      label="Aguardando"             value={dados.aguardando}            sub="na fila de espera" color="blue" />
        <CardMetrica icon={CheckCircle}   label="Agendados"              value={dados.agendados}             sub="cirurgia marcada" color="green" />
        <CardMetrica icon={Clock}         label="Tempo Médio de Espera"  value={`${dados.tempo_medio_espera_dias}d`} sub="dias na fila" color="yellow" />
        <CardMetrica icon={Hospital}      label="Hospitais Disponíveis"  value={dados.hospitais.disponiveis} sub={`${dados.hospitais.lotados} lotados hoje`} color="purple" />
        <CardMetrica icon={AlertTriangle} label="Críticos (>150 dias)"   value={dados.criticos_180_dias}     sub="próximos do limite de 180d" alert={dados.criticos_180_dias > 0} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Barra por gravidade */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
            <Activity size={18} className="text-blue-400" />
            Pacientes por Gravidade (Manchester)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gravidadeData} barSize={36}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #3b82f6", borderRadius: 12, color: "#f1f5f9" }}
                formatter={(v, n, p) => [v, p.payload.label]}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {gravidadeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status hospitais */}
        <div className="card p-6">
          <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
            <Hospital size={18} className="text-blue-400" />
            Status dos Hospitais Hoje
          </h3>
          <div className="space-y-4 mt-2">
            {[
              { label: "Disponíveis", value: dados.hospitais.disponiveis, total: dados.hospitais.total, color: "#22c55e" },
              { label: "Lotados", value: dados.hospitais.lotados, total: dados.hospitais.total, color: "#ef4444" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}/{item.total}</span>
                </div>
                <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(item.value / item.total) * 100}%`, background: item.color }} />
                </div>
              </div>
            ))}

            <div className="mt-6 pt-6 border-t border-blue-900/30 grid grid-cols-3 gap-4">
              {[
                { label: "Total", value: dados.hospitais.total, color: "text-white" },
                { label: "Realizados", value: dados.realizados, color: "text-green-400" },
                { label: "Críticos", value: dados.criticos_180_dias, color: "text-red-400" },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-slate-500 text-xs mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
