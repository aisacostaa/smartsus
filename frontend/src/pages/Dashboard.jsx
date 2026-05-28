import { useApp } from "../context/AppContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, PieChart, Pie } from "recharts";
import { Users, Clock, Hospital, AlertTriangle, CheckCircle, Activity, RefreshCw, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";

const CORES_M = { P1: "#ef4444", P2: "#f97316", P3: "#fbbf24", P4: "#10b981", P5: "#06b6d4" };
const LABELS_M = { P1: "Imediato", P2: "Muito Urgente", P3: "Urgente", P4: "Pouco Urgente", P5: "Não Urgente" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3 rounded-xl text-xs shadow-xl"
      style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(59,130,246,0.3)", backdropFilter: "blur(12px)" }}>
      <p className="text-slate-300 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => <p key={i} className="font-bold" style={{ color: p.fill || p.color }}>{p.name || "Pacientes"}: {p.value}</p>)}
    </div>
  );
};

function MetricCard({ icon: Icon, label, value, sub, variant = "mc-navy", textColor = "text-white", delay = 0 }) {
  return (
    <div className={`metric-card ${variant} p-5 fade-in`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)" }}>
          <Icon size={18} className="text-white" />
        </div>
        <div className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
      </div>
      <p className={`text-4xl font-bold leading-none count-anim ${textColor}`}>{value}</p>
      <p className="text-sm font-medium mt-2 text-white/90">{label}</p>
      {sub && <p className="text-xs mt-1 text-white/50">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { dashboard, hospitais, fila, agendados, realizados, ultimaAtt, recarregarTudo } = useApp();
  const [atualizando, setAtualizando] = useState(false);
  const atualizar = async () => { setAtualizando(true); await recarregarTudo(); setAtualizando(false); };
  const fmt = (d) => d ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  if (!dashboard) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      <p className="text-slate-500 text-sm">Carregando...</p>
    </div>
  );

  const criticos = fila.filter(p => p.critico).length;
  const total = fila.length + agendados.length + realizados.length;
  const totalLotados = hospitais.filter(h => !h.disponivel).length;
  const totalDisp = hospitais.filter(h => h.disponivel).length;

  const gravidadeData = Object.entries(dashboard.por_gravidade).map(([k, v]) => ({
    name: k, value: v, label: LABELS_M[k], fill: CORES_M[k]
  }));

  const statusData = [
    { name: "Aguardando", value: fila.length,       fill: "#3b82f6" },
    { name: "Agendados",  value: agendados.length,  fill: "#fbbf24" },
    { name: "Realizados", value: realizados.length, fill: "#10b981" },
  ];

  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-7 rounded-full" style={{ background: "linear-gradient(180deg, #3b82f6, #06b6d4)" }} />
            <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard</h2>
          </div>
          <p className="ml-4 text-sm" style={{ color: "rgba(148,163,184,0.6)" }}>
            Última atualização: {fmt(ultimaAtt)} · sincroniza a cada 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={atualizar} disabled={atualizando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#93c5fd" }}>
            <RefreshCw size={13} className={atualizando ? "animate-spin" : ""} />
            Atualizar
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-sm font-semibold">Sistema Online</span>
          </div>
        </div>
      </div>

      {/* Alerta críticos */}
      {criticos > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-2xl fade-in"
          style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.05))", border: "1px solid rgba(239,68,68,0.25)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 pulse-red"
            style={{ background: "rgba(239,68,68,0.2)" }}>
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-red-300 font-bold text-sm">{criticos} paciente{criticos > 1 ? "s" : ""} em situação crítica</p>
            <p className="text-red-400/60 text-xs mt-0.5">Aguardando há mais de 150 dias — próximos do limite de 180 dias</p>
          </div>
          <span className="text-red-400 font-black text-3xl">{criticos}</span>
        </div>
      )}

      {/* Metric cards — linha 1: cards coloridos */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard icon={Users}         label="Total de Pacientes"    value={total}            sub="no sistema"            variant="mc-blue"   delay={0} />
        <MetricCard icon={Activity}      label="Aguardando Cirurgia"   value={fila.length}      sub="na fila"               variant="mc-teal"   delay={60} />
        <MetricCard icon={Clock}         label="Agendados"             value={agendados.length} sub="cirurgia marcada"       variant="mc-amber"  delay={120} />
        <MetricCard icon={CheckCircle}   label="Realizados"            value={realizados.length} sub="cirurgias concluídas" variant="mc-green"  delay={180} />
        <MetricCard icon={Hospital}      label="Hospitais Disponíveis" value={totalDisp}        sub={`${totalLotados} lotados hoje`} variant="mc-purple" delay={240} />
        <MetricCard icon={AlertTriangle} label="Críticos"              value={criticos}         sub=">150 dias na fila"     variant="mc-red"    delay={300} />
      </div>

      {/* Linha 2 — gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Barras gravidade */}
        <div className="xl:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Activity size={16} className="text-blue-400" />
                Pacientes por Gravidade
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>Escala de Manchester — aguardando</p>
            </div>
            <div className="flex gap-2">
              {Object.entries(CORES_M).map(([k, c]) => (
                <div key={k} className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: c + "33", border: `1px solid ${c}55`, color: c }}>{k}</div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gravidadeData} barSize={36} barGap={6}>
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {gravidadeData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut status */}
        <div className="xl:col-span-2 card p-6 flex flex-col">
          <h3 className="text-white font-bold text-base flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-blue-400" />
            Status Geral
          </h3>
          <p className="text-xs mb-4" style={{ color: "rgba(148,163,184,0.5)" }}>{total} pacientes no sistema</p>
          <div className="flex-1 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={42} outerRadius={60}
                  dataKey="value" paddingAngle={4} strokeWidth={0}>
                  {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-2 mt-2">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: s.fill }} />
                    <span className="text-xs text-slate-400">{s.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Linha 3 — Ocupação hospitais (card branco) */}
      <div className="card-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Hospital size={18} className="text-blue-600" />
              Ocupação dos Hospitais Hoje
            </h3>
            <p className="text-xs mt-0.5 text-slate-500">{totalDisp} disponíveis · {totalLotados} lotados</p>
          </div>
          <div className="flex items-center gap-4">
            {[{ cor: "#10b981", label: "Disponível" }, { cor: "#f59e0b", label: "Parcial" }, { cor: "#ef4444", label: "Lotado" }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: l.cor }} />
                <span className="text-xs text-slate-500 font-medium">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {hospitais.map((h, i) => {
            const pct = Math.round((h.agendados_hoje / h.capacidade_dia) * 100);
            const cor = pct >= 100 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981";
            return (
              <div key={h.id} className="flex items-center gap-4 fade-in" style={{ animationDelay: `${i * 25}ms` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cor + "18", border: `1px solid ${cor}44` }}>
                  <Hospital size={13} style={{ color: cor }} />
                </div>
                <p className="text-slate-700 text-xs font-medium w-40 truncate flex-shrink-0">{h.nome.replace("Hospital ", "")}</p>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${cor}cc, ${cor})` }} />
                </div>
                <span className="text-xs font-bold w-14 text-right flex-shrink-0" style={{ color: cor }}>
                  {h.agendados_hoje}/{h.capacidade_dia}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
