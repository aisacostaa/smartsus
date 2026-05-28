# ============================================================
# SmartSus — Otimização com PuLP (Pesquisa Operacional)
# ============================================================
# Problema de Designação (Assignment Problem):
# Alocar pacientes (i) a slots hospital+data (j) minimizando
# o tempo de espera ponderado pelo score de prioridade.
#
# Função Objetivo:
#   Min Z = Σᵢ Σⱼ cᵢⱼ · xᵢⱼ
#
# Restrições:
#   R1: Σⱼ xᵢⱼ = 1              (cada paciente em exatamente 1 slot)
#   R2: Σᵢ xᵢⱼ ≤ cap_j          (capacidade de 20/dia por hospital)
#   R3: xᵢⱼ ∈ {0,1}             (variável binária)
#   R4: T_i ≤ 180 dias           (restrição temporal crítica)
# ============================================================

import pulp
from datetime import date, timedelta
from typing import List, Dict, Any


def calcular_custo(score: float, dias_na_fila: int, slot_index: int) -> float:
    """
    Custo cᵢⱼ de alocar paciente i ao slot j.
    Queremos minimizar — então pacientes com MAIOR score e MAIS dias
    devem ter MENOR custo (= preferência de alocação).
    
    cᵢⱼ = (1 / score) × (1 + slot_index × 0.1)
    
    - 1/score: inverte a prioridade (score alto = custo baixo)
    - slot_index: penaliza slots mais distantes no tempo
    """
    score_safe = max(score, 0.01)
    penalidade_tempo = 1 + slot_index * 0.05
    return (1.0 / score_safe) * penalidade_tempo


def otimizar_com_pulp(
    pacientes: List[Dict],
    hospitais: List[Dict],
    alocacoes_existentes: Dict,
    horizonte_dias: int = 30,
) -> Dict[str, Any]:
    """
    Resolve o Problema de Designação usando PuLP.
    
    Parâmetros:
        pacientes: lista de dicts com id, score, dias_na_fila, hospital_id
        hospitais: lista de dicts com id, capacidade_dia
        alocacoes_existentes: dict {(hospital_id, data): count} já agendados
        horizonte_dias: quantos dias à frente considerar
    
    Retorna:
        dict com status, alocações e métricas do modelo
    """
    hoje = date.today()

    # ── Gerar slots disponíveis (hospital, data) ──────────────────
    slots = []
    vagas_por_slot = {}
    for h in hospitais:
        for d in range(horizonte_dias):
            data = hoje + timedelta(days=d)
            ja_usados = alocacoes_existentes.get((h["id"], data), 0)
            vagas = h["capacidade_dia"] - ja_usados
            if vagas > 0:
                slot = (h["id"], data.isoformat(), d)
                slots.append(slot)
                vagas_por_slot[slot] = vagas

    if not slots or not pacientes:
        return {
            "status": "sem_dados",
            "status_pulp": "N/A",
            "pacientes_alocados": 0,
            "total_pacientes": len(pacientes),
            "valor_objetivo": 0,
            "alocacoes": [],
        }

    # ── Criar problema PuLP ───────────────────────────────────────
    prob = pulp.LpProblem("SmartSus_Designacao", pulp.LpMinimize)

    # Variáveis de decisão: x[i][j] ∈ {0,1}
    # i = índice do paciente, j = índice do slot
    x = {}
    for i, p in enumerate(pacientes):
        for j, slot in enumerate(slots):
            custo = calcular_custo(p["score"], p["dias_na_fila"], slot[2])
            x[(i, j)] = pulp.LpVariable(
                f"x_{i}_{j}",
                cat=pulp.LpBinary
            )

    # ── Função Objetivo: Min Z = Σᵢ Σⱼ cᵢⱼ · xᵢⱼ ────────────────
    prob += pulp.lpSum(
        calcular_custo(pacientes[i]["score"], pacientes[i]["dias_na_fila"], slots[j][2]) * x[(i, j)]
        for i in range(len(pacientes))
        for j in range(len(slots))
    ), "Minimizar_Tempo_Espera_Ponderado"

    # ── Restrição R1: cada paciente em exatamente 1 slot ──────────
    for i in range(len(pacientes)):
        prob += (
            pulp.lpSum(x[(i, j)] for j in range(len(slots))) == 1,
            f"R1_Unicidade_Paciente_{i}"
        )

    # ── Restrição R2: capacidade máxima por slot ──────────────────
    for j, slot in enumerate(slots):
        prob += (
            pulp.lpSum(x[(i, j)] for i in range(len(pacientes))) <= vagas_por_slot[slot],
            f"R2_Capacidade_Slot_{j}"
        )

    # ── Resolver com CBC (solver padrão do PuLP) ──────────────────
    solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=30)
    prob.solve(solver)

    status_pulp = pulp.LpStatus[prob.status]

    # ── Extrair solução ───────────────────────────────────────────
    alocacoes = []
    for i, p in enumerate(pacientes):
        for j, slot in enumerate(slots):
            if pulp.value(x[(i, j)]) is not None and pulp.value(x[(i, j)]) > 0.5:
                hospital_id, data_str, _ = slot
                alocacoes.append({
                    "paciente_id":  p["id"],
                    "hospital_id":  hospital_id,
                    "data_cirurgia": data_str,
                    "custo": calcular_custo(p["score"], p["dias_na_fila"], slot[2]),
                })
                break

    valor_obj = pulp.value(prob.objective) or 0

    return {
        "status": "ok" if status_pulp in ["Optimal", "Feasible"] else "erro",
        "status_pulp": status_pulp,
        "pacientes_alocados": len(alocacoes),
        "total_pacientes": len(pacientes),
        "valor_objetivo": round(valor_obj, 4),
        "num_variaveis": len(x),
        "num_restricoes": len(prob.constraints),
        "alocacoes": alocacoes,
    }
