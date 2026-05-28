import { useApp } from "../context/AppContext";
import { Brain, Target, Lock, Scale, TrendingUp, AlertTriangle, CheckCircle, BarChart2 } from "lucide-react";

function Secao({ titulo, icon: Icon, cor = "#3b82f6", children, delay = 0 }) {
  return (
    <div className="card p-6 fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${cor}22`, border: `1px solid ${cor}44` }}>
          <Icon size={16} style={{ color: cor }} />
        </div>
        <h3 className="text-white font-semibold text-base">{titulo}</h3>
      </div>
      {children}
    </div>
  );
}

function Formula({ children }) {
  return (
    <div className="rounded-xl p-4 font-mono text-sm overflow-x-auto"
      style={{ background: "rgba(10,15,46,0.8)", border: "1px solid rgba(56,189,248,0.2)" }}>
      {children}
    </div>
  );
}

function Tag({ label, cor }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: `${cor}22`, border: `1px solid ${cor}44`, color: cor }}>
      {label}
    </span>
  );
}

export default function Modelagem() {
  const { fila, agendados, realizados, dashboard } = useApp();
  const total = fila.length + agendados.length + realizados.length;
  const criticos = fila.filter(p => p.critico).length;

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(180deg, #2563eb, #38bdf8)" }} />
          <h2 className="text-2xl font-bold text-white tracking-tight">Modelagem Matemática</h2>
        </div>
        <p className="text-sm ml-4" style={{ color: "rgba(148,163,184,0.6)" }}>
          Fundamentos de Pesquisa Operacional aplicados ao SmartSus
        </p>
      </div>

      {/* Contexto */}
      <div className="p-4 rounded-2xl flex items-start gap-4"
        style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)" }}>
        <Brain size={20} className="text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-cyan-200 font-medium text-sm">Sobre o modelo</p>
          <p className="text-cyan-400/70 text-xs mt-1 leading-relaxed">
            O SmartSus combina o <strong className="text-cyan-300">Problema de Transporte (TP)</strong> e o <strong className="text-cyan-300">Problema de Designação (AP)</strong> da Pesquisa Operacional
            para minimizar o tempo de espera de pacientes cirúrgicos do SUS, respeitando restrições de capacidade hospitalar e urgência médica.
          </p>
        </div>
      </div>

      {/* Variáveis de decisão */}
      <Secao titulo="Variáveis de Decisão" icon={Target} cor="#38bdf8" delay={50}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-cyan-300 font-mono text-sm mb-2">x<sub>ij</sub> ∈ &#123;0, 1&#125;</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Variável binária: assume valor <span className="text-white font-bold">1</span> se o paciente <em>i</em> é alocado ao hospital <em>j</em>, e <span className="text-white font-bold">0</span> caso contrário.
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-blue-300 font-mono text-sm mb-2">S<sub>i</sub> ∈ ℝ⁺</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Score de prioridade do paciente <em>i</em>. Variável contínua não-negativa que determina a posição na fila. Quanto maior, maior a prioridade.
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-slate-400 text-xs leading-relaxed">
            <span className="text-white font-semibold">Índices:</span>{" "}
            <span className="text-cyan-300 font-mono">i = 1, 2, ..., n</span> representa cada paciente na fila ·{" "}
            <span className="text-blue-300 font-mono">j = 1, 2, ..., 10</span> representa cada um dos 10 hospitais parceiros de SP
          </p>
        </div>
      </Secao>

      {/* Função objetivo */}
      <Secao titulo="Função Objetivo" icon={TrendingUp} cor="#22c55e" delay={100}>
        <p className="text-slate-400 text-xs mb-4 leading-relaxed">
          O objetivo do SmartSus é <span className="text-green-400 font-semibold">minimizar o tempo total ponderado de espera</span> de todos os pacientes,
          garantindo que casos mais graves e urgentes sejam atendidos primeiro.
        </p>
        <Formula>
          <p className="text-green-400 mb-3">{"/* Função Objetivo Principal */"}</p>
          <p className="text-white mb-1">
            <span className="text-yellow-300">Min</span> Z = Σᵢ <span className="text-cyan-300">W</span><sub>i</sub> · <span className="text-blue-300">T</span><sub>i</sub>
          </p>
          <div className="mt-4 pt-4 space-y-1 text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p><span className="text-cyan-300">W</span><sub>i</sub> = peso de urgência do paciente <em>i</em> (derivado do score S<sub>i</sub>)</p>
            <p><span className="text-blue-300">T</span><sub>i</sub> = tempo de espera do paciente <em>i</em> até a cirurgia (em dias)</p>
          </div>
        </Formula>

        <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <p className="text-green-300 text-xs font-semibold mb-2">↳ Como o sistema aplica isso na prática:</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Pacientes são ordenados pelo score S<sub>i</sub> (maior = mais urgente) e alocados às datas mais próximas disponíveis.
            Isso minimiza T<sub>i</sub> para os de maior W<sub>i</sub>, reduzindo o tempo total ponderado Z.
          </p>
        </div>
      </Secao>

      {/* Restrições */}
      <Secao titulo="Restrições do Modelo" icon={Lock} cor="#f97316" delay={150}>
        <p className="text-slate-400 text-xs mb-5 leading-relaxed">
          As restrições garantem que a solução seja <span className="text-orange-400 font-semibold">viável</span> — ou seja, respeite os limites físicos, médicos e legais do sistema.
        </p>

        <div className="space-y-4">
          {/* R1 */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-orange-400"
                style={{ background: "rgba(249,115,22,0.15)" }}>R1</span>
              <p className="text-orange-300 font-semibold text-sm">Unicidade de alocação</p>
            </div>
            <Formula>
              <p className="text-white">Σ<sub>j=1</sub><sup>10</sup> x<sub>ij</sub> ≤ 1 &nbsp;&nbsp;&nbsp; <span className="text-slate-400">para todo paciente i</span></p>
            </Formula>
            <p className="text-slate-400 text-xs mt-3">Cada paciente pode ser alocado a <strong className="text-white">no máximo um hospital</strong>. Não é possível dividir um paciente entre unidades.</p>
          </div>

          {/* R2 */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-orange-400"
                style={{ background: "rgba(249,115,22,0.15)" }}>R2</span>
              <p className="text-orange-300 font-semibold text-sm">Capacidade diária hospitalar</p>
            </div>
            <Formula>
              <p className="text-white">Σ<sub>i</sub> x<sub>ij</sub> · δ(data<sub>i</sub> = d) ≤ 20 &nbsp;&nbsp;&nbsp; <span className="text-slate-400">para todo hospital j e dia d</span></p>
            </Formula>
            <p className="text-slate-400 text-xs mt-3">Cada hospital realiza no máximo <strong className="text-white">20 cirurgias por dia</strong>. A restrição é avaliada por data, distribuindo os agendamentos ao longo dos dias.</p>
          </div>

          {/* R3 */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-red-400"
                style={{ background: "rgba(239,68,68,0.15)" }}>R3</span>
              <p className="text-red-300 font-semibold text-sm">Restrição temporal crítica — 180 dias</p>
              {criticos > 0 && <Tag label={`${criticos} em risco`} cor="#ef4444" />}
            </div>
            <Formula>
              <p className="text-white">T<sub>i</sub> ≤ 180 &nbsp;&nbsp;&nbsp; <span className="text-slate-400">para todo paciente i</span></p>
            </Formula>
            <p className="text-slate-400 text-xs mt-3">
              <strong className="text-red-400">Restrição mais crítica do modelo.</strong> Nenhum paciente pode aguardar mais de 180 dias.
              O sistema monitora continuamente e acelera a prioridade de pacientes acima de 150 dias.
              {criticos > 0 && <span className="text-red-400 font-semibold"> Atualmente {criticos} paciente{criticos > 1 ? "s estão" : " está"} em zona de risco.</span>}
            </p>
          </div>

          {/* R4 */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-orange-400"
                style={{ background: "rgba(249,115,22,0.15)" }}>R4</span>
              <p className="text-orange-300 font-semibold text-sm">Não-negatividade</p>
            </div>
            <Formula>
              <p className="text-white">x<sub>ij</sub> ≥ 0 &nbsp;&nbsp; e &nbsp;&nbsp; x<sub>ij</sub> ∈ &#123;0, 1&#125; &nbsp;&nbsp;&nbsp; <span className="text-slate-400">para todo i, j</span></p>
            </Formula>
            <p className="text-slate-400 text-xs mt-3">As variáveis de decisão são <strong className="text-white">binárias</strong> — um paciente ou está alocado a um hospital (1) ou não está (0). Não existem alocações fracionadas.</p>
          </div>
        </div>
      </Secao>

      {/* Função de Score */}
      <Secao titulo="Função de Score — Priorização Multicritério" icon={Scale} cor="#a78bfa" delay={200}>
        <p className="text-slate-400 text-xs mb-5 leading-relaxed">
          O score S<sub>i</sub> de cada paciente é calculado por uma <span className="text-purple-400 font-semibold">combinação linear ponderada</span> de quatro critérios médicos e sociais.
          Os pesos foram definidos com base em diretrizes clínicas do SUS e literatura de triagem hospitalar.
        </p>

        <Formula>
          <p className="text-purple-300 mb-3">{"/* Fórmula Principal do Score */"}</p>
          <p className="text-white text-base mb-4">
            S<sub>i</sub> = <span className="text-red-400">α</span>·M<sub>i</sub> + <span className="text-purple-400">β</span>·I<sub>i</sub> + <span className="text-orange-400">γ</span>·D<sub>i</sub> + <span className="text-green-400">δ</span>·C<sub>i</sub>
          </p>
          <p className="text-slate-500 text-xs">com α + β + γ + δ = 0.45 + 0.20 + 0.25 + 0.10 = 1.00</p>
        </Formula>

        <div className="mt-5 space-y-4">
          {/* Manchester */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-red-400">α = 0.45</span>
                <span className="text-white font-semibold text-sm">· M<sub>i</sub> — Gravidade Manchester</span>
              </div>
              <Tag label="Maior peso" cor="#ef4444" />
            </div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[["P1","100","Imediato","#ef4444"],["P2","80","Muito Urgente","#f97316"],["P3","60","Urgente","#eab308"],["P4","40","Pouco Urgente","#22c55e"],["P5","20","Não Urgente","#38bdf8"]].map(([nivel,pts,label,cor]) => (
                <div key={nivel} className="text-center p-2 rounded-xl" style={{ background: `${cor}18`, border: `1px solid ${cor}33` }}>
                  <p className="font-bold text-sm" style={{ color: cor }}>{nivel}</p>
                  <p className="text-white font-bold text-lg leading-none mt-1">{pts}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.6)" }}>{label}</p>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              <strong className="text-red-300">Justificativa:</strong> A Escala de Manchester é o protocolo oficial de triagem hospitalar no Brasil.
              Recebe o maior peso (45%) pois representa risco imediato de vida — um paciente P1 sem cirurgia pode ir a óbito.
            </p>
          </div>

          {/* Idade */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-purple-400">β = 0.20</span>
                <span className="text-white font-semibold text-sm">· I<sub>i</sub> — Fator Etário</span>
              </div>
              <Tag label="Critério social" cor="#a78bfa" />
            </div>
            <Formula>
              <p className="text-white text-xs">
                I<sub>i</sub> = 0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span className="text-slate-400">se idade {"<"} 40 anos</span><br/>
                I<sub>i</sub> = (idade − 40) × 0.5 &nbsp; <span className="text-slate-400">se 40 ≤ idade {"<"} 60 anos &nbsp; [0 a 10 pts]</span><br/>
                I<sub>i</sub> = 10 + (idade − 60) × 0.5 <span className="text-slate-400">se idade ≥ 60 anos &nbsp;&nbsp;&nbsp; [10 a 20 pts]</span>
              </p>
            </Formula>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              <strong className="text-purple-300">Justificativa:</strong> Idosos têm menor capacidade de recuperação espontânea e maior risco de complicações com o tempo.
              O critério é progressivo — quanto maior a idade, maior a pontuação, com aceleração acima dos 60 anos.
            </p>
          </div>

          {/* Tempo */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-orange-400">γ = 0.25</span>
                <span className="text-white font-semibold text-sm">· D<sub>i</sub> — Tempo na Fila</span>
              </div>
              <Tag label="Anti-starvation" cor="#f97316" />
            </div>
            <Formula>
              <p className="text-white text-xs">
                D<sub>i</sub> = 30 × (dias / 180) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span className="text-slate-400">se dias ≤ 120</span><br/>
                D<sub>i</sub> = 30 × (dias / 180)² &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span className="text-slate-400">se dias {">"} 120 &nbsp; [crescimento exponencial]</span>
              </p>
            </Formula>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              <strong className="text-orange-300">Justificativa:</strong> Garante <strong className="text-white">justiça na fila</strong> — evita que um paciente fique eternamente na mesma posição (starvation).
              O crescimento exponencial após 120 dias força a subida do paciente antes de atingir o limite de 180 dias.
            </p>
          </div>

          {/* Cirurgia */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-green-400">δ = 0.10</span>
                <span className="text-white font-semibold text-sm">· C<sub>i</sub> — Tipo de Cirurgia</span>
              </div>
              <Tag label="Menor peso" cor="#22c55e" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
              {[["Cardíaca","10"],["Neurológica","10"],["Oncológica","9"],["Vascular","8"],["Gastrointestinal","7"],["Ortopédica","7"],["Urológica","6"],["Ginecológica","6"],["Oftalmológica","6"],["Geral","5"]].map(([tipo,pts]) => (
                <div key={tipo} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                  <span className="text-xs text-slate-300">{tipo}</span>
                  <span className="text-green-400 font-bold text-xs ml-2">{pts}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              <strong className="text-green-300">Justificativa:</strong> Cirurgias cardíacas e neurológicas têm menor margem de adiamento sem risco de vida.
              Recebe o menor peso (10%) pois já é parcialmente coberto pelo critério Manchester.
            </p>
          </div>
        </div>
      </Secao>

      {/* Métricas ao vivo */}
      <Secao titulo="Métricas do Modelo em Tempo Real" icon={BarChart2} cor="#22c55e" delay={250}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pacientes no modelo", value: total, cor: "#38bdf8" },
            { label: "Variáveis x_ij", value: `${total} × 10`, cor: "#a78bfa" },
            { label: "Restrições ativas", value: `${total + 10 * 90 + total}`, cor: "#f97316" },
            { label: "Em zona crítica", value: criticos, cor: criticos > 0 ? "#ef4444" : "#22c55e" },
          ].map(m => (
            <div key={m.label} className="p-4 rounded-xl text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: `1px solid ${m.cor}22` }}>
              <p className="text-2xl font-bold" style={{ color: m.cor }}>{m.value}</p>
              <p className="text-xs mt-1 text-slate-400">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-4 text-slate-500 leading-relaxed">
          * Restrições ativas = R1 (unicidade por paciente) + R2 (capacidade 20/dia × 10 hospitais × 90 dias projetados) + R3 (limite 180 dias por paciente)
        </p>
      </Secao>

      {/* Conexão com PO */}
      <Secao titulo="Conexão com a Pesquisa Operacional" icon={CheckCircle} cor="#38bdf8" delay={300}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              titulo: "Problema de Transporte (TP)",
              cor: "#38bdf8",
              items: [
                "Origens: bairros/endereços dos pacientes",
                "Destinos: 10 hospitais de São Paulo",
                "Custo c_ij: distância calculada via OpenRouteService",
                "Objetivo: minimizar deslocamento total",
                "Restrição de oferta: 1 cirurgia por paciente",
                "Restrição de demanda: ≤ 20 por hospital/dia",
              ]
            },
            {
              titulo: "Problema de Designação (AP)",
              cor: "#a78bfa",
              items: [
                "Designados: pacientes da fila de espera",
                "Tarefas: vagas cirúrgicas por hospital e data",
                "Matriz de custo: score invertido (1/S_i)",
                "Restrição: cada paciente em exatamente 1 hospital",
                "Restrição: cada vaga usada por 1 paciente",
                "Método: heurística gulosa ordenada por score",
              ]
            }
          ].map(s => (
            <div key={s.titulo} className="p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.6)", border: `1px solid ${s.cor}22` }}>
              <p className="font-semibold text-sm mb-3" style={{ color: s.cor }}>{s.titulo}</p>
              <ul className="space-y-1.5">
                {s.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.cor }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Secao>
    </div>
  );
}
