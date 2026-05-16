# ============================================================
# SmartSus — Serviço de Priorização (Modelagem Matemática PO)
# ============================================================
# Função de Score:
# S_i = α·M_i + β·I_i + γ·D_i + δ·C_i
# α=0.45, β=0.20, γ=0.25, δ=0.10
# ============================================================
from datetime import date

PESOS = {"alpha": 0.45, "beta": 0.20, "gamma": 0.25, "delta": 0.10}

MANCHESTER = {"P1": 100, "P2": 80, "P3": 60, "P4": 40, "P5": 20}

CIRURGIAS = {
    "Cardíaca":          10,
    "Neurológica":       10,
    "Oncológica":        9,
    "Ortopédica":        7,
    "Oftalmológica":     6,
    "Urológica":         6,
    "Ginecológica":      6,
    "Gastrointestinal":  7,
    "Vascular":          8,
    "Geral":             5,
}

def calcular_score_manchester(gravidade: str) -> float:
    return MANCHESTER.get(gravidade, 20)

def calcular_score_idade(data_nascimento: date) -> float:
    hoje = date.today()
    idade = hoje.year - data_nascimento.year - (
        (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day)
    )
    if idade >= 80:
        return 20.0
    elif idade >= 60:
        return 10.0 + (idade - 60) * 0.5
    elif idade >= 40:
        return (idade - 40) * 0.5
    return 0.0

def calcular_score_tempo(data_entrada: date) -> float:
    dias = (date.today() - data_entrada).days
    if dias >= 180:
        return 30.0
    elif dias > 120:
        # Crescimento exponencial após 120 dias
        return 30.0 * ((dias / 180) ** 2)
    else:
        return 30.0 * (dias / 180)

def calcular_score_cirurgia(tipo_cirurgia: str) -> float:
    return float(CIRURGIAS.get(tipo_cirurgia, 5))

def calcular_score_total(gravidade: str, data_nascimento: date,
                          data_entrada: date, tipo_cirurgia: str) -> float:
    M = calcular_score_manchester(gravidade)
    I = calcular_score_idade(data_nascimento)
    D = calcular_score_tempo(data_entrada)
    C = calcular_score_cirurgia(tipo_cirurgia)

    score = (
        PESOS["alpha"] * M +
        PESOS["beta"]  * I +
        PESOS["gamma"] * D +
        PESOS["delta"] * C
    )
    return round(score, 4)

def dias_na_fila(data_entrada: date) -> int:
    return (date.today() - data_entrada).days

def is_critico(data_entrada: date) -> bool:
    return dias_na_fila(data_entrada) >= 150
