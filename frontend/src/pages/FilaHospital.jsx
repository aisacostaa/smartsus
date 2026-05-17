import { useEffect, useState } from "react";
import { hospitaisAPI, filaAPI } from "../services/api";
import { Hospital, Users, Clock, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

const CORES = { P1: "#ef4444", P2: "#f97316", P3: "#eab308", P4: "#22c55e", P5: "#3b82f6" };
const LABELS = { P1: "Imediato", P2: "Muito Urgente", P3: "Urgente", P4: "Pouco Urgente", P5: "Não Urgente" };

function CardHospital({ hospital, pacientes }) {
  const [aberto, setAberto] = useState(false);
  const criticos = pacientes.filter(p => p.critico).length;
  const pct = Math.round((hospital.agendados_hoje / hospital.capacidade_dia) * 100);

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setAberto(!aberto)}
        className="w-full p-5 text-left hover:bg-blue-900/10 transition-all">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${hospital.disponivel ? "bg-green-500/20" : "bg-red-500/20"}`}>
              <Hospital size={18} className={hospital.disponivel ? "text-green-400" : "text-red-400"} />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{hospital.nome}</p>
              <p className="text-slate-400 text-xs">{hospital.bairro} · {hospital.vagas_hoje}/{hospital.capacidade_dia} vagas hoje</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {criticos > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                <AlertTriangle size={11} />
                {criticos} crítico{criticos > 1 ? "s" : ""}
              </span>
            )}
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 text-xs font-medium">
              <Users size={11} />
              {pacientes.length} pacientes
            </span>
            {aberto ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </div>

        {/* Barra de ocupação */}
        <div className="mt-4">
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: pct >= 100 ? "#ef4444" : pct > 70 ? "#f97316" : "#22c55e" }} />
          </div>
        </div>
      </button>

      {aberto && (
        <div className="border-t border-blue-900/30 fade-in">
          {pacientes.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">Nenhum paciente aguardando neste hospital.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-900/20">
                    {["Pos.", "Paciente", "Gravidade", "Cirurgia", "Score", "Dias"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map((p, i) => (
                    <tr key={p.id} className={`border-b border-blue-900/10 hover:bg-blue-900/10 transition-all ${p.critico ? "bg-red-900/10" : ""}`}>
                      <td className="px-4 py-3 text-blue-400 font-bold text-sm">#{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium">{p.nome}</p>
                        <p className="text-slate-500 text-xs">ID #{p.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-bold text-white"
                          style={{ background: CORES[p.gravidade] }}>
                          {p.gravidade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{p.tipo_cirurgia}</td>
                      <td className="px-4 py-3 text-white font-bold text-sm">{p.score?.toFixed(1)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Clock size={11} className={p.critico ? "text-red-400" : "text-slate-400"} />
                          <span className={`text-sm ${p.critico ? "text-red-400 font-bold" : "text-slate-300"}`}>{p.dias_na_fila}d</span>
                          {p.critico && <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-blue ml-1" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilaHospital() {
  const [hospitais, setHospitais] = useState([]);
  const [fila, setFila] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      const [hRes, fRes] = await Promise.all([hospitaisAPI.listar(), filaAPI.listar()]);
      setHospitais(hRes.data);
      setFila(fRes.data);
      setLoading(false);
    };
    carregar();
    const t = setInterval(carregar, 30000);
    return () => clearInterval(t);
  }, []);

  const pacientesPorHospital = (hospitalId) =>
    fila.filter(p => p.hospital_id === hospitalId).sort((a, b) => b.score - a.score);

  const semHospital = fila.filter(p => !p.hospital_id);

  const totalCriticos = fila.filter(p => p.critico).length;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Fila por Hospital</h2>
          <p className="text-slate-400 text-sm mt-1">Distribuição de pacientes por unidade hospitalar</p>
        </div>
        {totalCriticos > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
            <AlertTriangle size={15} className="text-red-400" />
            <span className="text-red-300 text-sm font-medium">{totalCriticos} críticos no total</span>
          </div>
        )}
      </div>

      {/* Resumo geral */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total na Fila", value: fila.length, color: "text-blue-400" },
          { label: "Hospitais Ativos", value: hospitais.length, color: "text-green-400" },
          { label: "Sem Hospital", value: semHospital.length, color: "text-yellow-400" },
          { label: "Críticos", value: totalCriticos, color: "text-red-400" },
        ].map(item => (
          <div key={item.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-slate-400 text-xs mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {hospitais.map(h => (
            <CardHospital key={h.id} hospital={h} pacientes={pacientesPorHospital(h.id)} />
          ))}
          {semHospital.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-yellow-400" />
                <p className="text-yellow-300 font-semibold text-sm">{semHospital.length} pacientes sem hospital atribuído</p>
              </div>
              <p className="text-slate-400 text-xs">Estes pacientes ainda não foram roteados para um hospital. Execute o recálculo de scores para atribuí-los automaticamente.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
