import { useState } from "react";
import { pacientesAPI } from "../services/api";
import { UserPlus, CheckCircle, AlertCircle } from "lucide-react";

const CIRURGIAS = ["Cardíaca","Neurológica","Oncológica","Ortopédica","Oftalmológica","Urológica","Ginecológica","Gastrointestinal","Vascular","Geral"];
const GRAVIDADES = [
  { value: "P1", label: "P1 — Imediato", color: "text-red-400" },
  { value: "P2", label: "P2 — Muito Urgente", color: "text-orange-400" },
  { value: "P3", label: "P3 — Urgente", color: "text-yellow-400" },
  { value: "P4", label: "P4 — Pouco Urgente", color: "text-green-400" },
  { value: "P5", label: "P5 — Não Urgente", color: "text-blue-400" },
];

const INICIAL = {
  nome:"", cpf:"", telefone:"", data_nascimento:"", genero:"M",
  endereco:"", bairro:"", cidade:"São Paulo", uf:"SP",
  tipo_cirurgia:"Geral", gravidade:"P3",
  data_entrada: new Date().toISOString().split("T")[0],
};

function Campo({ label, children, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-blue-900/30 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all";

export default function Cadastro() {
  const [form, setForm] = useState(INICIAL);
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [msg, setMsg] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const enviar = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await pacientesAPI.criar(form);
      setMsg(`Paciente ${res.data.nome} cadastrado! Score: ${res.data.score.toFixed(1)} · Posição na fila calculada.`);
      setStatus("success");
      setForm(INICIAL);
    } catch (err) {
      setMsg(err.response?.data?.detail || "Erro ao cadastrar paciente.");
      setStatus("error");
    }
  };

  return (
    <div className="max-w-3xl fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Cadastro de Paciente</h2>
        <p className="text-slate-400 text-sm mt-1">Preencha os dados para inserir o paciente na fila de espera</p>
      </div>

      {status === "success" && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl border border-green-500/30 bg-green-500/10">
          <CheckCircle size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-green-300 text-sm">{msg}</p>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl border border-red-500/30 bg-red-500/10">
          <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-300 text-sm">{msg}</p>
        </div>
      )}

      <form onSubmit={enviar} className="card p-8 space-y-6">
        {/* Dados pessoais */}
        <div>
          <h3 className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-4">Dados Pessoais</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Campo label="Nome Completo" required>
                <input value={form.nome} onChange={e => set("nome", e.target.value)}
                  placeholder="Nome do paciente" className={inputCls} required />
              </Campo>
            </div>
            <Campo label="CPF" required>
              <input value={form.cpf} onChange={e => set("cpf", e.target.value.replace(/\D/g,""))}
                placeholder="Somente números" maxLength={11} className={inputCls} required />
            </Campo>
            <Campo label="Telefone" required>
              <input value={form.telefone} onChange={e => set("telefone", e.target.value)}
                placeholder="(11) 99999-9999" className={inputCls} required />
            </Campo>
            <Campo label="Data de Nascimento" required>
              <input type="date" value={form.data_nascimento} onChange={e => set("data_nascimento", e.target.value)}
                className={inputCls} required />
            </Campo>
            <Campo label="Gênero" required>
              <select value={form.genero} onChange={e => set("genero", e.target.value)} className={inputCls}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </Campo>
          </div>
        </div>

        {/* Endereço */}
        <div>
          <h3 className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-4">Endereço</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Campo label="Endereço" required>
                <input value={form.endereco} onChange={e => set("endereco", e.target.value)}
                  placeholder="Rua, número" className={inputCls} required />
              </Campo>
            </div>
            <Campo label="Bairro" required>
              <input value={form.bairro} onChange={e => set("bairro", e.target.value)}
                placeholder="Bairro" className={inputCls} required />
            </Campo>
            <Campo label="Cidade">
              <input value={form.cidade} onChange={e => set("cidade", e.target.value)}
                className={inputCls} />
            </Campo>
          </div>
        </div>

        {/* Dados médicos */}
        <div>
          <h3 className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-4">Dados Médicos</h3>
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Tipo de Cirurgia" required>
              <select value={form.tipo_cirurgia} onChange={e => set("tipo_cirurgia", e.target.value)} className={inputCls}>
                {CIRURGIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Campo>
            <Campo label="Gravidade (Escala Manchester)" required>
              <select value={form.gravidade} onChange={e => set("gravidade", e.target.value)} className={inputCls}>
                {GRAVIDADES.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Data de Entrada na Fila" required>
              <input type="date" value={form.data_entrada} onChange={e => set("data_entrada", e.target.value)}
                className={inputCls} required />
            </Campo>
          </div>
        </div>

        <button type="submit" disabled={status === "loading"}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-50 glow">
          {status === "loading"
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Cadastrando...</>
            : <><UserPlus size={18} /> Cadastrar Paciente</>}
        </button>
      </form>
    </div>
  );
}
