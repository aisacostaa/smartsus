import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Hospital, ChevronLeft, ChevronRight, Calendar, Users, CheckCircle } from "lucide-react";

const CORES = { P1: "#ef4444", P2: "#f97316", P3: "#eab308", P4: "#22c55e", P5: "#3b82f6" };

function diasDoMes(ano, mes) {
  const primeiro = new Date(ano, mes, 1);
  const ultimo = new Date(ano, mes + 1, 0);
  const dias = [];
  // Dias em branco antes do primeiro dia
  for (let i = 0; i < primeiro.getDay(); i++) dias.push(null);
  for (let d = 1; d <= ultimo.getDate(); d++) dias.push(new Date(ano, mes, d));
  return dias;
}

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export default function Agenda() {
  const { hospitais, agendados, loading } = useApp();
  const [hospitalId, setHospitalId] = useState(null);
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  const hospital = hospitais.find(h => h.id === hospitalId);

  // Agrupa agendados por hospital e data
  const pacientesPorDataHospital = (hId, data) => {
    // Formata a data do calendário como YYYY-MM-DD sem problemas de timezone
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    const dataStr = `${ano}-${mes}-${dia}`;
    return agendados.filter(p =>
      p.hospital_id === hId && p.data_cirurgia === dataStr
    ).sort((a, b) => (b.score || 0) - (a.score || 0));
  };

  const pacientesDia = diaSelecionado && hospitalId
    ? pacientesPorDataHospital(hospitalId, diaSelecionado)
    : [];

  const diasMes = diasDoMes(ano, mes);

  const mesAnterior = () => {
    if (mes === 0) { setMes(11); setAno(ano - 1); }
    else setMes(mes - 1);
    setDiaSelecionado(null);
  };

  const proximoMes = () => {
    if (mes === 11) { setMes(0); setAno(ano + 1); }
    else setMes(mes + 1);
    setDiaSelecionado(null);
  };

  const totalMes = hospitalId ? agendados.filter(p => {
    if (p.hospital_id !== hospitalId || !p.data_cirurgia) return false;
    const partes = p.data_cirurgia.split("-");
    const pMes = parseInt(partes[1]) - 1;
    const pAno = parseInt(partes[0]);
    return pMes === mes && pAno === ano;
  }).length : 0;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Agenda Hospitalar</h2>
        <p className="text-slate-400 text-sm mt-1">Visualize as cirurgias agendadas por hospital e dia</p>
      </div>

      {/* Seleção de hospital */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {hospitais.map(h => {
          const totalH = agendados.filter(p => p.hospital_id === h.id).length;
          return (
            <button key={h.id} onClick={() => { setHospitalId(h.id); setDiaSelecionado(null); }}
              className={`p-3 rounded-xl border text-left transition-all ${
                hospitalId === h.id
                  ? "border-blue-500 bg-blue-600/20"
                  : "border-blue-900/30 bg-slate-800/40 hover:border-blue-700/40"}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${h.disponivel ? "bg-green-500/20" : "bg-red-500/20"}`}>
                <Hospital size={14} className={h.disponivel ? "text-green-400" : "text-red-400"} />
              </div>
              <p className="text-white text-xs font-medium leading-tight truncate">{h.nome.replace("Hospital ", "")}</p>
              <p className="text-slate-400 text-xs mt-1">{totalH} agendados</p>
            </button>
          );
        })}
      </div>

      {!hospitalId ? (
        <div className="card p-12 text-center">
          <Calendar size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Selecione um hospital acima para ver a agenda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendário */}
          <div className="xl:col-span-2 card p-6">
            {/* Header calendário */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-semibold">{hospital?.nome}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{totalMes} cirurgias em {MESES[mes]}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={mesAnterior}
                  className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-white font-medium text-sm min-w-32 text-center">
                  {MESES[mes]} {ano}
                </span>
                <button onClick={proximoMes}
                  className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 mb-2">
              {SEMANA.map(d => (
                <div key={d} className="text-center text-xs text-slate-500 font-medium py-2">{d}</div>
              ))}
            </div>

            {/* Grid do calendário */}
            <div className="grid grid-cols-7 gap-1">
              {diasMes.map((dia, i) => {
                if (!dia) return <div key={`empty-${i}`} />;
                const pacientesDo = pacientesPorDataHospital(hospitalId, dia);
                const total = pacientesDo.length;
                const eHoje = dia.toDateString() === hoje.toDateString();
                const eSelecionado = diaSelecionado?.toDateString() === dia.toDateString();
                const pct = Math.round((total / (hospital?.capacidade_dia || 20)) * 100);
                const cor = pct >= 100 ? "#ef4444" : pct >= 70 ? "#f97316" : pct > 0 ? "#22c55e" : null;

                return (
                  <button key={dia.toISOString()} onClick={() => setDiaSelecionado(dia)}
                    className={`p-1.5 rounded-xl border transition-all flex flex-col items-center min-h-16 ${
                      eSelecionado ? "border-blue-500 bg-blue-600/20" :
                      eHoje ? "border-blue-400/40 bg-blue-900/20" :
                      total > 0 ? "border-blue-900/30 bg-slate-800/30 hover:border-blue-700/40" :
                      "border-transparent hover:border-slate-700/40"}`}>
                    <span className={`text-xs font-medium ${eHoje ? "text-blue-400" : "text-slate-300"}`}>
                      {dia.getDate()}
                    </span>
                    {total > 0 && (
                      <>
                        <span className="text-xs font-bold mt-1" style={{ color: cor }}>{total}</span>
                        <div className="w-full h-1 rounded-full mt-1 bg-slate-700 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: cor }} />
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-blue-900/30">
              {[
                { cor: "#22c55e", label: "< 70% ocupado" },
                { cor: "#f97316", label: "70–99% ocupado" },
                { cor: "#ef4444", label: "Lotado (20/20)" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: l.cor }} />
                  <span className="text-slate-400 text-xs">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Painel do dia selecionado */}
          <div className="card p-6">
            {!diaSelecionado ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <Calendar size={28} className="text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm text-center">Clique em um dia no calendário para ver os pacientes agendados</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h4 className="text-white font-semibold">
                    {diaSelecionado.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                  </h4>
                  <p className="text-slate-400 text-xs mt-1">
                    {pacientesDia.length}/{hospital?.capacidade_dia || 20} cirurgias agendadas
                  </p>
                  {/* Barra de ocupação */}
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mt-2">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((pacientesDia.length / (hospital?.capacidade_dia || 20)) * 100, 100)}%`,
                        background: pacientesDia.length >= 20 ? "#ef4444" : pacientesDia.length >= 14 ? "#f97316" : "#22c55e"
                      }} />
                  </div>
                </div>

                {pacientesDia.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <CheckCircle size={24} className="text-slate-600 mb-2" />
                    <p className="text-slate-500 text-sm">Nenhuma cirurgia agendada</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {pacientesDia.map((p, i) => (
                      <div key={p.id} className="p-3 rounded-xl bg-slate-800/50 border border-blue-900/20">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-blue-400 font-bold text-xs flex-shrink-0">#{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium truncate">{p.nome}</p>
                              <p className="text-slate-400 text-xs">{p.tipo_cirurgia}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                              style={{ background: CORES[p.gravidade] }}>{p.gravidade}</span>
                            <span className="text-white text-xs font-bold">{p.score?.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span>{p.dias_na_fila}d na fila</span>
                          <span>{p.idade} anos</span>
                          <span>{p.bairro}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
