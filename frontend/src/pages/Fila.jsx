import { useEffect, useState } from "react";
import { pacientesAPI, hospitaisAPI, roteamentoAPI, simulacaoAPI, otimizacaoAPI, agendamentoAPI } from "../services/api";
import { useApp } from "../context/AppContext";
import {
  AlertTriangle, Clock, RefreshCw, Search, CheckCircle,
  X, Hospital, Play, Trash2, ChevronDown, ChevronUp,
  Activity, Users, FlaskConical
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

const CORES = { P1: "#ef4444", P2: "#f97316", P3: "#eab308", P4: "#22c55e", P5: "#3b82f6" };
const LABELS = { P1: "Imediato", P2: "Muito Urgente", P3: "Urgente", P4: "Pouco Urgente", P5: "Não Urgente" };
const SCORE_M = { P1: 100, P2: 80, P3: 60, P4: 40, P5: 20 };

// ─── Badge de gravidade ───────────────────────────────────────────────────────
function BadgeGravidade({ nivel }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
      style={{ background: CORES[nivel] }}>
      {nivel} — {LABELS[nivel]}
    </span>
  );
}

// ─── Barra de score ───────────────────────────────────────────────────────────
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

// ─── Modal de detalhes do paciente ───────────────────────────────────────────
function ModalDetalhes({ paciente: pacienteInicial, onClose }) {
  const [paciente, setPaciente] = useState(pacienteInicial);
  const [loadingP, setLoadingP] = useState(true);

  useEffect(() => {
    if (pacienteInicial?.id) {
      pacientesAPI.buscar(pacienteInicial.id)
        .then(r => setPaciente(r.data))
        .catch(() => setPaciente(pacienteInicial))
        .finally(() => setLoadingP(false));
    } else {
      setLoadingP(false);
    }
  }, [pacienteInicial?.id]);

  if (!paciente) return null;
  const total = paciente.score || 0;
  const M = (SCORE_M[paciente.gravidade] || 0) * 0.45;
  const I = Math.min(Math.max(((paciente.idade || 0) - 40) * 0.5, 0), 20) * 0.20;
  const D = (30 * Math.min((paciente.dias_na_fila || 0) / 180, 1)) * 0.25;
  const C = Math.max(total - M - I - D, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="card p-6 w-full max-w-lg fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">{paciente.nome}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {loadingP && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">Dados do Paciente</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: "Idade",            value: paciente.idade ? `${paciente.idade} anos` : "—" },
            { label: "Gênero",           value: paciente.genero === "M" ? "Masculino" : paciente.genero === "F" ? "Feminino" : "Outro" },
            { label: "Data Nascimento",  value: paciente.data_nascimento || "—" },
            { label: "CPF",              value: paciente.cpf ? `***${paciente.cpf.slice(-3)}` : "—" },
            { label: "Telefone",         value: paciente.telefone || "—" },
            { label: "Endereço",         value: paciente.endereco || "—" },
            { label: "Bairro",           value: paciente.bairro || "—" },
            { label: "Cidade",           value: paciente.cidade || "São Paulo" },
            { label: "Tipo de Cirurgia", value: paciente.tipo_cirurgia },
            { label: "Entrada na Fila",  value: paciente.data_entrada || "—" },
            { label: "Dias na Fila",     value: `${paciente.dias_na_fila} dias` },
            { label: "Hospital",         value: paciente.hospital_atribuido || "—" },
          ].map(item => (
            <div key={item.label} className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-slate-400 text-xs">{item.label}</p>
              <p className="text-white font-medium text-sm mt-0.5 break-words">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 p-3 rounded-xl border"
          style={{ borderColor: CORES[paciente.gravidade] + "44", background: CORES[paciente.gravidade] + "11" }}>
          <p className="text-xs text-slate-400 mb-1">Gravidade Manchester</p>
          <p className="font-bold" style={{ color: CORES[paciente.gravidade] }}>
            {paciente.gravidade} — {LABELS[paciente.gravidade]}
          </p>
        </div>

        <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Por que score {total.toFixed(1)}?
        </p>
        <div className="bg-slate-900/60 rounded-xl p-3 mb-4 font-mono text-xs text-slate-400">
          S = α·M + β·I + γ·D + δ·C = {M.toFixed(2)} + {I.toFixed(2)} + {D.toFixed(2)} + {C.toFixed(2)} = <span className="text-white font-bold">{total.toFixed(2)}</span>
        </div>
        <div className="space-y-3">
          {[
            { label: "α×Manchester", valor: M.toFixed(2), desc: `${paciente.gravidade} = ${SCORE_M[paciente.gravidade]} pts × 0.45`, cor: "#ef4444", pct: (M / total) * 100 },
            { label: "β×Idade",      valor: I.toFixed(2), desc: `${paciente.idade || 0} anos × fator etário × 0.20`,                cor: "#a78bfa", pct: (I / total) * 100 },
            { label: "γ×Tempo",      valor: D.toFixed(2), desc: `${paciente.dias_na_fila} dias na fila × 0.25`,                     cor: "#f97316", pct: (D / total) * 100 },
            { label: "δ×Cirurgia",   valor: C.toFixed(2), desc: `${paciente.tipo_cirurgia} × 0.10`,                                 cor: "#22c55e", pct: (C / total) * 100 },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <div>
                  <span className="text-slate-300">{item.label}</span>
                  <p className="text-slate-500">{item.desc}</p>
                </div>
                <span className="text-white font-bold ml-4">+{item.valor}</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.max(item.pct, 0)}%`, background: item.cor }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── Modal de agendamento ─────────────────────────────────────────────────────
function ModalAgendamento({ paciente, onConfirm, onClose }) {
  const [hospitais, setHospitais] = useState([]);
  const [hospitalSelecionado, setHospitalSelecionado] = useState(null);
  const [disponibilidade, setDisponibilidade] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [loadingH, setLoadingH] = useState(true);
  const [loadingD, setLoadingD] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    hospitaisAPI.listar().then(r => {
      setHospitais(r.data);
      setLoadingH(false);
      // Se já tem hospital, carrega disponibilidade
      if (paciente.hospital_id) {
        setHospitalSelecionado(paciente.hospital_id);
        carregarDisponibilidade(paciente.hospital_id);
      }
    });
  }, []);

  const carregarDisponibilidade = async (hospitalId) => {
    setLoadingD(true);
    setDataSelecionada("");
    setDisponibilidade(null);
    try {
      const res = await agendamentoAPI.disponibilidade(hospitalId);
      setDisponibilidade(res.data);
      if (res.data.proxima_data_disponivel) {
        setDataSelecionada(res.data.proxima_data_disponivel);
      }
    } finally {
      setLoadingD(false);
    }
  };

  const selecionarHospital = (id) => {
    setHospitalSelecionado(id);
    carregarDisponibilidade(id);
  };

  const confirmar = async () => {
    if (!hospitalSelecionado || !dataSelecionada) return;
    setAgendando(true);
    setErro(null);
    try {
      await agendamentoAPI.agendar({
        paciente_id: paciente.id,
        hospital_id: hospitalSelecionado,
        data_cirurgia: dataSelecionada,
      });
      onConfirm();
      onClose();
    } catch (e) {
      const detail = e.response?.data?.detail;
      if (typeof detail === "object") {
        setErro(`Sem vagas nesta data. Próxima disponível: ${detail.proxima_data_disponivel || "—"}`);
        if (detail.proxima_data_disponivel) setDataSelecionada(detail.proxima_data_disponivel);
      } else {
        setErro(detail || "Erro ao agendar");
      }
    } finally {
      setAgendando(false);
    }
  };

  const diaInfo = disponibilidade?.dias?.find(d => d.data === dataSelecionada);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="card p-6 w-full max-w-2xl fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold text-lg">Agendar Cirurgia</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-slate-400 text-sm mb-6">{paciente.nome} · {paciente.gravidade} · {paciente.tipo_cirurgia}</p>

        {erro && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
            {erro}
          </div>
        )}

        {/* Seleção do hospital */}
        <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">1. Selecione o Hospital</p>
        {loadingH ? (
          <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-2 mb-6 max-h-48 overflow-y-auto pr-1">
            {hospitais.map(h => (
              <button key={h.id} onClick={() => selecionarHospital(h.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  hospitalSelecionado === h.id
                    ? "border-blue-500 bg-blue-600/20"
                    : "border-blue-900/30 bg-slate-800/40 hover:border-blue-700/40"
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{h.nome}</p>
                    <p className="text-slate-400 text-xs">{h.bairro}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${h.disponivel ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {h.agendados_hoje}/{h.capacidade_dia} hoje
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Seleção da data */}
        {hospitalSelecionado && (
          <>
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">2. Selecione a Data</p>
            {loadingD ? (
              <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : disponibilidade ? (
              <>
                {disponibilidade.proxima_data_disponivel && (
                  <div className="mb-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-xs">
                    Próxima data disponível: <span className="font-bold">{new Date(disponibilidade.proxima_data_disponivel + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                  </div>
                )}
                <div className="grid grid-cols-5 gap-2 mb-4 max-h-48 overflow-y-auto pr-1">
                  {disponibilidade.dias.map(d => {
                    const dataFormatada = new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                    return (
                      <button key={d.data} onClick={() => d.disponivel && setDataSelecionada(d.data)}
                        disabled={!d.disponivel}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          dataSelecionada === d.data
                            ? "border-blue-500 bg-blue-600/30"
                            : d.disponivel
                            ? "border-blue-900/30 bg-slate-800/40 hover:border-blue-700/40"
                            : "border-red-900/20 bg-red-900/10 opacity-40 cursor-not-allowed"
                        }`}>
                        <p className="text-white text-xs font-medium">{dataFormatada}</p>
                        <p className={`text-xs mt-0.5 ${d.disponivel ? "text-green-400" : "text-red-400"}`}>
                          {d.vagas}/{d.capacidade}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {diaInfo && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-800/50 border border-blue-900/30">
                    <p className="text-slate-300 text-sm">
                      Data selecionada: <span className="text-white font-bold">
                        {new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                      </span>
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {diaInfo.agendados} agendados · <span className="text-green-400">{diaInfo.vagas} vagas disponíveis</span>
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </>
        )}

        <div className="flex gap-3 mt-2">
          <button onClick={confirmar} disabled={!hospitalSelecionado || !dataSelecionada || agendando}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {agendando ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Agendando...</> : "✓ Confirmar Agendamento"}
          </button>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 hover:text-white text-sm transition-all">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de encaminhar ──────────────────────────────────────────────────────
function ModalEncaminhar({ paciente, onConfirm, onClose }) {
  const [selecionado, setSelecionado] = useState(null);
  const [hospitais, setHospitais] = useState([]);
  const [rotas, setRotas] = useState({});
  const [loadingH, setLoadingH] = useState(true);

  useEffect(() => {
    hospitaisAPI.listar().then(async r => {
      const lista = r.data;
      setHospitais(lista);
      setLoadingH(false);
      if (paciente.id) {
        const resultados = await Promise.all(
          lista.map(h =>
            roteamentoAPI.calcular(paciente.id, h.id)
              .then(res => ({ id: h.id, ...res.data }))
              .catch(() => ({ id: h.id, distancia_km: null, duracao_min: null }))
          )
        );
        const mapa = {};
        resultados.forEach(r => { mapa[r.id] = r; });
        setRotas(mapa);
      }
    });
  }, []);

  const hospitaisOrdenados = [...hospitais].sort((a, b) => {
    const da = rotas[a.id]?.distancia_km ?? 9999;
    const db2 = rotas[b.id]?.distancia_km ?? 9999;
    return da - db2;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="card p-6 w-full max-w-xl fade-in max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold">Encaminhar para Hospital</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-slate-400 text-sm mb-1">{paciente.nome} — {paciente.gravidade} · {paciente.tipo_cirurgia}</p>
        <p className="text-blue-400 text-xs mb-5">Ordenados por proximidade · distância via OpenRouteService</p>

        {loadingH && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="space-y-2 mb-6">
          {hospitaisOrdenados.map((h, idx) => {
            const rota = rotas[h.id];
            const temRota = rota?.distancia_km != null;
            const maisProximo = idx === 0 && temRota;
            return (
              <button key={h.id} onClick={() => setSelecionado(h.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selecionado === h.id ? "border-blue-500 bg-blue-600/20"
                  : maisProximo ? "border-green-500/40 bg-green-900/10 hover:border-green-500/60"
                  : "border-blue-900/30 bg-slate-800/40 hover:border-blue-700/40"
                } ${!h.disponivel ? "opacity-40 cursor-not-allowed" : ""}`}
                disabled={!h.disponivel}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-medium text-sm truncate">{h.nome}</p>
                      {maisProximo && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium whitespace-nowrap">+ próximo</span>}
                    </div>
                    <p className="text-slate-400 text-xs">{h.bairro} · {h.endereco}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {temRota ? (
                        <>
                          <span className="text-xs text-blue-300">📍 {rota.distancia_km} km</span>
                          <span className="text-xs text-slate-400">🕐 {rota.duracao_min} min</span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500">calculando rota...</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${h.disponivel ? "text-green-400" : "text-red-400"}`}>
                      {h.agendados_hoje}/{h.capacidade_dia}
                    </p>
                    <p className="text-slate-500 text-xs">agendados</p>
                  </div>
                </div>
              </button>
            );
          })}
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

// ─── Painel de simulação ──────────────────────────────────────────────────────
function PainelSimulacao({ onSimulado, onClose }) {
  const [quantidade, setQuantidade] = useState(100);
  const [status, setStatus] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [mostrarTabela, setMostrarTabela] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [limpando, setLimpando] = useState(false);

  const simular = async () => {
    setStatus("loading");
    setResultado(null);
    setPacientes([]);
    try {
      const res = await simulacaoAPI.simular(quantidade);
      setResultado(res.data);
      const pacRes = await pacientesAPI.listar("aguardando");
      // Mostrar em ordem de chegada para demonstrar estado ANTES da otimização
      const ordenadosPorChegada = [...pacRes.data].sort(
        (a, b) => new Date(a.data_entrada) - new Date(b.data_entrada)
      );
      setPacientes(ordenadosPorChegada);
      setStatus("success");
      setMostrarTabela(true);
      onSimulado();
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
    onSimulado();
  };

  const gravidadeData = resultado
    ? Object.entries(resultado.por_gravidade).map(([k, v]) => ({ name: k, value: v, fill: CORES[k] }))
    : [];

  return (
    <div className="card p-6 fade-in space-y-6">
      {modalDetalhes && <ModalDetalhes paciente={modalDetalhes} onClose={() => setModalDetalhes(null)} />}

      {/* Header painel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical size={18} className="text-blue-400" />
          <h3 className="text-white font-semibold">Simulação Inteligente</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
      </div>

      {/* Controles */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-6 p-4 rounded-xl bg-slate-800/40 border border-blue-900/30">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quantidade de Pacientes: <span className="text-blue-400 font-bold">{quantidade}</span>
          </label>
          <input type="range" min={10} max={500} value={quantidade}
            onChange={e => setQuantidade(Number(e.target.value))}
            className="w-full accent-blue-500" />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>10</span><span>250</span><span>500</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={simular} disabled={status === "loading"}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-50 glow">
            {status === "loading"
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Simulando...</>
              : <><Play size={14} />Simular</>}
          </button>
          <button onClick={limpar} disabled={limpando}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all disabled:opacity-50">
            <Trash2 size={14} />
            {limpando ? "Limpando..." : "Limpar"}
          </button>
        </div>
      </div>

      {/* Como funciona */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { step: "1", text: "Gera pacientes com dados realistas de SP" },
          { step: "2", text: "Distribui por diferentes regiões da cidade" },
          { step: "3", text: "Aplica algoritmo de score Manchester" },
          { step: "4", text: "Aloca no hospital mais próximo com vaga" },
        ].map(s => (
          <div key={s.step} className="flex items-start gap-2 p-3 rounded-xl bg-blue-900/20 border border-blue-900/30">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{s.step}</span>
            <p className="text-slate-300 text-xs leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>

      {status === "error" && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
          Erro ao executar simulação. Verifique se o backend está rodando.
        </div>
      )}

      {resultado && (
        <div className="space-y-4 fade-in">
          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Users,         label: "Criados",       value: resultado.pacientes_criados,             color: "text-blue-400" },
              { icon: FlaskConical,  label: "Total na Fila", value: resultado.total_na_fila,                 color: "text-purple-400" },
              { icon: Clock,         label: "Média Espera",  value: `${resultado.tempo_medio_espera_dias}d`, color: "text-yellow-400" },
              { icon: AlertTriangle, label: "Críticos",      value: resultado.criticos,                      color: "text-red-400" },
            ].map(m => (
              <div key={m.label} className="p-4 rounded-xl bg-slate-800/50 border border-blue-900/20 text-center">
                <m.icon size={18} className={`${m.color} mx-auto mb-1`} />
                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Gráfico */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-blue-900/20">
            <p className="text-white font-semibold text-sm mb-4">Distribuição por Gravidade (Manchester)</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={gravidadeData} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #3b82f6", borderRadius: 10, color: "#f1f5f9" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {gravidadeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela pacientes */}
          {pacientes.length > 0 && (
            <div className="rounded-xl border border-blue-900/30 overflow-hidden">
              <button onClick={() => setMostrarTabela(!mostrarTabela)}
                className="w-full flex items-center justify-between p-4 bg-slate-800/40 hover:bg-blue-900/10 transition-all">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-400" />
                  <span className="text-white font-semibold text-sm">Pacientes na Fila Otimizada</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 text-xs">{pacientes.length}</span>
                </div>
                {mostrarTabela ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {mostrarTabela && (
                <div className="overflow-x-auto fade-in">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-blue-900/30 bg-slate-900/40">
                        {["Pos.", "Nome", "Idade", "Bairro", "Gravidade", "Cirurgia", "Dias", "Score", "Hospital", ""].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pacientes.map((p, i) => (
                        <tr key={p.id} className={`border-b border-blue-900/10 hover:bg-blue-900/10 transition-all ${p.critico ? "bg-red-900/10" : ""}`}>
                          <td className="px-4 py-3 text-blue-400 font-bold text-sm">#{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="text-white text-sm font-medium whitespace-nowrap">{p.nome}</p>
                            <p className="text-slate-500 text-xs">ID #{p.id}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm whitespace-nowrap">{p.idade ?? "—"} anos</td>
                          <td className="px-4 py-3 text-slate-400 text-sm whitespace-nowrap">{p.bairro || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap" style={{ background: CORES[p.gravidade] }}>
                              {p.gravidade} — {LABELS[p.gravidade]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm whitespace-nowrap">{p.tipo_cirurgia}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${p.critico ? "text-red-400" : "text-slate-300"}`}>
                              {p.dias_na_fila}d {p.critico ? "⚠️" : ""}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white font-bold text-sm">{p.score?.toFixed(1)}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{p.hospital_atribuido || "—"}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => setModalDetalhes(p)}
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
          <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-900/20">
            <p className="text-white font-semibold text-sm mb-2">Fórmula de Priorização</p>
            <p className="font-mono text-blue-300 text-sm">S = α·M + β·I + γ·D + δ·C</p>
            <div className="mt-2 space-y-0.5 text-xs text-slate-400">
              <p><span className="text-red-400">α=0.45</span> · M = Manchester (P1=100 → P5=20)</p>
              <p><span className="text-purple-400">β=0.20</span> · I = Idade (bônus acima de 40 anos)</p>
              <p><span className="text-orange-400">γ=0.25</span> · D = Tempo na fila (exponencial após 120d)</p>
              <p><span className="text-green-400">δ=0.10</span> · C = Tipo de cirurgia</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal da Fila ─────────────────────────────────────────────────
export default function Fila() {
  const { fila: filaCtx, agendados, realizados, recarregarTudo } = useApp();
  const [filtroStatus, setFiltroStatus]         = useState("aguardando");
  const [busca, setBusca]                       = useState("");
  const [filtroGravidade, setFiltroGravidade]   = useState("todos");
  const [recalculando, setRecalculando]         = useState(false);
  const [modoOtimizado, setModoOtimizado]       = useState(false);
  const [modalEncaminhar, setModalEncaminhar]   = useState(null);
  const [modalDetalhes, setModalDetalhes]       = useState(null);
  const [otimizando, setOtimizando]             = useState(false);
  const [realizando, setRealizando]             = useState(null);
  const [resultadoOtimizacao, setResultadoOtimizacao] = useState(null);
  const [mostrarSimulacao, setMostrarSimulacao] = useState(false);

  // Dados por status vindos do contexto global
  const dadosPorStatus = {
    aguardando: filaCtx,
    agendado:   agendados,
    realizado:  realizados,
    todos:      [...filaCtx, ...agendados, ...realizados],
  };
  const dadosStatus = dadosPorStatus[filtroStatus] || filaCtx;
  const filaAlgoritmo = dadosStatus.slice().sort((a,b) => b.score - a.score);
  const filaFIFO = dadosStatus.slice()
    .sort((a,b) => new Date(a.data_entrada) - new Date(b.data_entrada))
    .map((p,i) => ({...p, posicaoFIFO: i+1, posicaoAlgoritmo: filaAlgoritmo.findIndex(d=>d.id===p.id)+1}));

  const carregar = async () => { await recarregarTudo(); };

  const recalcular = async () => {
    setRecalculando(true);
    await pacientesAPI.recalcular();
    await recarregarTudo();
    setRecalculando(false);
  };





  const realizarCirurgia = async (id) => {
    setRealizando(id);
    await agendamentoAPI.realizar(id);
    await recarregarTudo();
    setRealizando(null);
  };

  const otimizarFila = async () => {
    setOtimizando(true);
    setResultadoOtimizacao(null);
    try {
      const res = await otimizacaoAPI.otimizarFila();
      setResultadoOtimizacao(res.data);
      setModoOtimizado(true);
      await recarregarTudo();
      setFiltroStatus("agendado");
    } finally {
      setOtimizando(false);
    }
  };

  const filaAtual = modoOtimizado ? filaAlgoritmo : filaFIFO;
  const criticos  = filaAlgoritmo.filter(p => p.critico).length;

  const filtrado = filaAtual.filter(p => {
    const buscaOk = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.id.toString().includes(busca);
    const gravOk  = filtroGravidade === "todos" || p.gravidade === filtroGravidade;
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
      {modalDetalhes && <ModalDetalhes paciente={modalDetalhes} onClose={() => setModalDetalhes(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Fila de Espera</h2>
          <p className="text-slate-400 text-sm mt-1">{filaAlgoritmo.length} pacientes aguardando</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setMostrarSimulacao(!mostrarSimulacao)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              mostrarSimulacao ? "bg-purple-600 text-white" : "border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"}`}>
            <FlaskConical size={15} />
            {mostrarSimulacao ? "Fechar Simulação" : "Simular Sistema"}
          </button>
          <button onClick={otimizarFila} disabled={otimizando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-all disabled:opacity-50">
            <CheckCircle size={15} className={otimizando ? "animate-spin" : ""} />
            {otimizando ? "Otimizando..." : "Otimizar Fila"}
          </button>
          <button onClick={recalcular} disabled={recalculando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-50">
            <RefreshCw size={15} className={recalculando ? "animate-spin" : ""} />
            Recalcular
          </button>
        </div>
      </div>

      {/* Painel simulação */}
      {mostrarSimulacao && (
        <PainelSimulacao
          onSimulado={carregar}
          onClose={() => setMostrarSimulacao(false)}
        />
      )}

      {/* Resultado otimização PuLP */}
      {resultadoOtimizacao && (
        <div className="p-5 rounded-xl border border-green-500/30 bg-green-500/10 fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 text-sm font-medium">Fila otimizada com PuLP — Pesquisa Operacional</p>
                <p className="text-green-400/70 text-xs mt-0.5">{resultadoOtimizacao.metodo || "PuLP CBC"}</p>
              </div>
            </div>
            <button onClick={() => setResultadoOtimizacao(null)} className="text-slate-400 hover:text-white flex-shrink-0">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: "Status PuLP",        value: resultadoOtimizacao.status_pulp || "—",               cor: resultadoOtimizacao.status_pulp === "Optimal" ? "#22c55e" : "#fbbf24" },
              { label: "Pacientes Agendados", value: resultadoOtimizacao.pacientes_agendados,              cor: "#38bdf8" },
              { label: "Variáveis x_ij",     value: resultadoOtimizacao.num_variaveis || "—",             cor: "#a78bfa" },
              { label: "Restrições ativas",   value: resultadoOtimizacao.num_restricoes || "—",            cor: "#f97316" },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-xl text-center"
                style={{ background: "rgba(15,23,42,0.5)", border: `1px solid ${m.cor}33` }}>
                <p className="text-lg font-bold" style={{ color: m.cor }}>{m.value}</p>
                <p className="text-xs mt-0.5 text-slate-400">{m.label}</p>
              </div>
            ))}
          </div>
          {resultadoOtimizacao.valor_objetivo > 0 && (
            <p className="text-xs text-slate-500 mt-3">
              Valor da função objetivo Z = {resultadoOtimizacao.valor_objetivo} · Min Z = Σᵢ Σⱼ cᵢⱼ · xᵢⱼ
            </p>
          )}
        </div>
      )}

      {/* Toggle só aparece se já houve otimização */}
      {resultadoOtimizacao && (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/60 border border-blue-900/30 w-fit">
          <button onClick={() => setModoOtimizado(true)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              modoOtimizado ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
            ✨ Fila Otimizada (Algoritmo)
          </button>
          <button onClick={() => setModoOtimizado(false)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              !modoOtimizado ? "bg-slate-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
            <Clock size={14} /> Ordem de Chegada (FIFO)
          </button>
        </div>
      )}

      {/* Banner modo — só após otimização */}
      {resultadoOtimizacao && (
        !modoOtimizado ? (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-500/30 bg-slate-500/10 fade-in">
            <Clock size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-200 text-sm font-medium">Ordem de Chegada (FIFO) — Sem Otimização</p>
              <p className="text-slate-400 text-xs mt-1">Pacientes em ordem de chegada. Veja como seria sem o algoritmo — casos graves podem ficar atrás de casos leves.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 fade-in">
            <CheckCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-200 text-sm font-medium">Fila Otimizada — Algoritmo de Priorização Ativo</p>
              <p className="text-blue-400 text-xs mt-1">S = α·Manchester + β·Idade + γ·Tempo + δ·Cirurgia. Compare com "Ordem de Chegada" para ver a diferença.</p>
            </div>
          </div>
        )
      )}

      {/* Alerta críticos */}
      {criticos > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">
            <span className="font-bold">{criticos} paciente{criticos > 1 ? "s" : ""}</span> com mais de 150 dias — próximos do limite de 180 dias!
          </p>
        </div>
      )}

      {/* Filtro de status */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm">Status:</span>
        <div className="flex gap-1 p-1 rounded-xl bg-slate-800/60 border border-blue-900/30">
          {[
            { value: "aguardando", label: "Aguardando", color: "text-blue-300" },
            { value: "agendado",   label: "Agendados",  color: "text-yellow-300" },
            { value: "realizado",  label: "Realizados", color: "text-green-300" },
            { value: "todos",      label: "Todos",      color: "text-slate-300" },
          ].map(s => (
            <button key={s.value} onClick={() => setFiltroStatus(s.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                filtroStatus === s.value ? "bg-blue-600 text-white" : `${s.color} hover:text-white`}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

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
                  "Paciente","Gravidade","Cirurgia","Score","Dias na Fila","Hospital",
                  filtroStatus !== "aguardando" ? "Data Cirurgia" : null,
                  "Status","Ações"
                ].filter(Boolean).map(h => (
                  <th key={h} className="text-left px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrado.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500">Nenhum paciente encontrado.</td></tr>
              ) : filtrado.map((p) => {
                const pos    = modoOtimizado ? p.posicao : p.posicaoFIFO;
                const posAlg = modoOtimizado ? null : p.posicaoAlgoritmo;
                const ganho  = !modoOtimizado ? (p.posicaoFIFO - p.posicaoAlgoritmo) : 0;
                return (
                  <tr key={p.id} className={`border-b border-blue-900/10 hover:bg-blue-900/10 transition-all ${p.critico ? "bg-red-900/10" : ""}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${modoOtimizado ? "text-blue-400" : "text-slate-400"}`}>#{pos}</span>
                        {p.critico && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                      </div>
                    </td>
                    {!modoOtimizado && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-400 font-bold text-sm">#{posAlg}</span>
                          {ganho > 0 && <span className="text-xs text-green-400 font-medium">↑{ganho}</span>}
                          {ganho < 0 && <span className="text-xs text-red-400 font-medium">↓{Math.abs(ganho)}</span>}
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
                    {filtroStatus !== "aguardando" && (
                      <td className="px-4 py-4 text-slate-300 text-sm whitespace-nowrap">
                        {p.data_cirurgia ? new Date(p.data_cirurgia + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === "agendado" ? "bg-yellow-500/20 text-yellow-300" :
                        p.status === "realizado" ? "bg-green-500/20 text-green-300" :
                        "bg-blue-500/20 text-blue-300"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setModalDetalhes(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-600/20 hover:bg-slate-600/40 text-slate-300 text-xs font-medium transition-all border border-slate-600/30 whitespace-nowrap">
                          Detalhes
                        </button>
                        {p.status === "agendado" && (
                          <button onClick={() => realizarCirurgia(p.id)} disabled={realizando === p.id}
                            className="px-2.5 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-300 text-xs font-medium transition-all border border-green-600/30 whitespace-nowrap flex items-center gap-1 disabled:opacity-50">
                            <CheckCircle size={11} />{realizando === p.id ? "..." : "Realizado"}
                          </button>
                        )}
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
