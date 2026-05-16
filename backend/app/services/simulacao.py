# ============================================================
# SmartSus — Serviço de Simulação
# ============================================================
import random
from datetime import date, timedelta
from app.services.priorizacao import calcular_score_total, CIRURGIAS

NOMES = [
    "Ana Silva","Carlos Oliveira","Maria Santos","João Pereira","Lucia Costa",
    "Pedro Alves","Fernanda Lima","Ricardo Souza","Beatriz Rocha","Marcos Ferreira",
    "Juliana Nascimento","Bruno Carvalho","Camila Martins","Diego Araújo","Tatiane Gomes",
    "Rafael Barbosa","Priscila Ribeiro","Thiago Mendes","Larissa Freitas","Gustavo Castro",
]

BAIRROS_SP = [
    ("Santana", -23.5050, -46.6280),
    ("Mooca", -23.5490, -46.5980),
    ("Santo André", -23.6564, -46.5329),
    ("Guarulhos", -23.4543, -46.5333),
    ("Itaquera", -23.5380, -46.4550),
    ("Campo Limpo", -23.6360, -46.7580),
    ("Taipas", -23.4752, -46.6891),
    ("Grajaú", -23.7175, -46.6958),
    ("Cotia", -23.6036, -46.9191),
    ("Carapicuíba", -23.5249, -46.8355),
]

GRAVIDADES = ["P1","P2","P3","P4","P5"]
PESOS_GRAVIDADE = [5, 15, 35, 30, 15]  # distribuição realista

def gerar_paciente_ficticio(index: int) -> dict:
    nome = random.choice(NOMES) + f" {index}"
    cpf = f"{random.randint(10000000000,99999999999)}"
    telefone = f"11{random.randint(900000000,999999999)}"
    idade = random.randint(18, 85)
    ano_nasc = date.today().year - idade
    data_nasc = date(ano_nasc, random.randint(1,12), random.randint(1,28))
    genero = random.choice(["M","F"])
    bairro, lat, lng = random.choice(BAIRROS_SP)
    tipo = random.choice(list(CIRURGIAS.keys()))
    gravidade = random.choices(GRAVIDADES, weights=PESOS_GRAVIDADE)[0]
    dias_atras = random.randint(1, 179)
    data_entrada = date.today() - timedelta(days=dias_atras)
    score = calcular_score_total(gravidade, data_nasc, data_entrada, tipo)

    return {
        "nome": nome,
        "cpf": cpf,
        "telefone": telefone,
        "data_nascimento": data_nasc.isoformat(),
        "genero": genero,
        "endereco": f"Rua Exemplo, {random.randint(1,999)}",
        "bairro": bairro,
        "cidade": "São Paulo",
        "uf": "SP",
        "lat": lat + random.uniform(-0.01, 0.01),
        "lng": lng + random.uniform(-0.01, 0.01),
        "tipo_cirurgia": tipo,
        "gravidade": gravidade,
        "data_entrada": data_entrada.isoformat(),
        "score": score,
        "status": "aguardando",
    }
