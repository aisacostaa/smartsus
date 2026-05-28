# ============================================================
# SmartSus — Serviço de Simulação com dados completos
# ============================================================
import random
from datetime import date, timedelta
from app.services.priorizacao import calcular_score_total, CIRURGIAS

NOMES_M = ["Carlos","João","Ricardo","Pedro","Marcos","Bruno","Diego","Rafael","Thiago","Gustavo","André","Felipe","Lucas","Rodrigo","Eduardo","Vinicius","Alexandre","Roberto","Paulo","Sergio"]
NOMES_F = ["Ana","Maria","Juliana","Fernanda","Beatriz","Camila","Larissa","Priscila","Tatiane","Lucia","Gabriela","Patricia","Renata","Carla","Sandra","Vanessa","Claudia","Mariana","Aline","Cristina"]
SOBRENOMES = ["Silva","Oliveira","Santos","Pereira","Costa","Alves","Lima","Souza","Ferreira","Rocha","Carvalho","Martins","Araújo","Gomes","Barbosa","Ribeiro","Mendes","Freitas","Castro","Nascimento"]

REGIOES = [
    { "bairro": "Santana",       "lat": -23.5050, "lng": -46.6280, "ruas": ["Rua Voluntários da Pátria","Av. Cruzeiro do Sul","Rua Coronel Mursa","Rua Alfredo Pujol"] },
    { "bairro": "Mooca",         "lat": -23.5490, "lng": -46.5980, "ruas": ["Rua da Mooca","Av. Paes de Barros","Rua Taquari","Rua Catumbi"] },
    { "bairro": "Santo André",   "lat": -23.6564, "lng": -46.5329, "ruas": ["Av. Industrial","Rua Senador Flaquer","Av. Dom Pedro II","Rua Giovanni Battista Pirelli"] },
    { "bairro": "Guarulhos",     "lat": -23.4543, "lng": -46.5333, "ruas": ["Av. Monteiro Lobato","Rua Sete de Setembro","Av. Tiradentes","Rua Marechal Deodoro"] },
    { "bairro": "Itaquera",      "lat": -23.5380, "lng": -46.4550, "ruas": ["Av. Itaquera","Rua Itacolomi","Av. Líder","Rua Itaquera"] },
    { "bairro": "Campo Limpo",   "lat": -23.6360, "lng": -46.7580, "ruas": ["Av. Guilherme Dumont Villares","Rua Luís Gushiken","Estrada do Campo Limpo","Rua Waldemar Morgado"] },
    { "bairro": "Taipas",        "lat": -23.4752, "lng": -46.6891, "ruas": ["Rua Voluntários da Pátria","Av. Deputado Emílio Carlos","Rua Goiás","Rua Pará"] },
    { "bairro": "Grajaú",        "lat": -23.7175, "lng": -46.6958, "ruas": ["Av. Inácio Dias da Silva","Rua Grajaú","Estrada do Grajaú","Rua Piraporinha"] },
    { "bairro": "Cotia",         "lat": -23.6036, "lng": -46.9191, "ruas": ["Av. João Paulo II","Rua Amador Bueno","Estrada Deputado João Leopoldo Coutinho","Rua Comendador Antônio Prado"] },
    { "bairro": "Carapicuíba",   "lat": -23.5249, "lng": -46.8355, "ruas": ["Av. Inocêncio Seráfico","Rua Sete de Setembro","Av. Antártica","Rua Itapevi"] },
    { "bairro": "Vila Mariana",  "lat": -23.5880, "lng": -46.6360, "ruas": ["Rua Domingos de Morais","Av. Ibirapuera","Rua Vergueiro","Rua Botucatu"] },
    { "bairro": "Penha",         "lat": -23.5230, "lng": -46.5430, "ruas": ["Av. Penha","Rua Padre Adelino","Av. Amador Bueno da Veiga","Rua Curuçá"] },
    { "bairro": "Lapa",          "lat": -23.5210, "lng": -46.7050, "ruas": ["Rua Guaicurus","Av. Antártica","Rua Catão","Rua Barão de Jundiaí"] },
    { "bairro": "Jabaquara",     "lat": -23.6470, "lng": -46.6450, "ruas": ["Av. Jabaquara","Rua Afonso Celso","Rua Dr. Lund","Rua Amaro Cavalheiro"] },
    { "bairro": "Osasco",        "lat": -23.5329, "lng": -46.7919, "ruas": ["Av. dos Autonomistas","Rua Ângelo Franzini","Av. Franz Voegeli","Rua Lício da Costa Ramos"] },
]

GRAVIDADES      = ["P1","P2","P3","P4","P5"]
PESOS_GRAVIDADE = [8, 20, 40, 22, 10]  # mais P1/P2 para realismo hospitalar

COMPLEMENTOS = ["Apto 12","Apto 34","Casa 2","Fundos","Apto 101","Casa","Bloco B Apto 5",""]

def _gerar_cpf() -> str:
    return "".join([str(random.randint(0,9)) for _ in range(11)])

def _gerar_telefone() -> str:
    return f"11{random.randint(90000,99999)}{random.randint(1000,9999)}"

def _gerar_data_nascimento(idade: int) -> date:
    ano = date.today().year - idade
    mes = random.randint(1, 12)
    dia = random.randint(1, 28)
    return date(ano, mes, dia)

def gerar_paciente_ficticio(index: int) -> dict:
    genero = random.choice(["M", "F"])
    nome_proprio = random.choice(NOMES_M if genero == "M" else NOMES_F)
    sobrenome1 = random.choice(SOBRENOMES)
    sobrenome2 = random.choice(SOBRENOMES)
    nome = f"{nome_proprio} {sobrenome1} {sobrenome2}"

    idade = random.randint(18, 85)
    data_nasc = _gerar_data_nascimento(idade)

    # Pesos diferentes por região para simular concentração populacional real de SP
    pesos_regioes = [8, 6, 7, 9, 8, 5, 4, 6, 3, 4, 10, 7, 5, 6, 5]
    regiao = random.choices(REGIOES, weights=pesos_regioes[:len(REGIOES)])[0]
    rua = random.choice(regiao["ruas"])
    numero = random.randint(10, 2500)
    complemento = random.choice(COMPLEMENTOS)
    endereco = f"{rua}, {numero}" + (f", {complemento}" if complemento else "")

    lat = regiao["lat"] + random.uniform(-0.015, 0.015)
    lng = regiao["lng"] + random.uniform(-0.015, 0.015)

    tipo = random.choice(list(CIRURGIAS.keys()))
    gravidade = random.choices(GRAVIDADES, weights=PESOS_GRAVIDADE)[0]
    # Distribuição exponencial para simular fila real (mais pacientes recentes)
    if random.random() < 0.3:
        dias_atras = random.randint(150, 179)  # críticos
    elif random.random() < 0.4:
        dias_atras = random.randint(30, 149)   # aguardando há tempo
    else:
        dias_atras = random.randint(1, 29)     # recém-entrados
    data_entrada = date.today() - timedelta(days=dias_atras)
    score = calcular_score_total(gravidade, data_nasc, data_entrada, tipo)

    return {
        "nome":            nome,
        "cpf":             _gerar_cpf(),
        "telefone":        _gerar_telefone(),
        "data_nascimento": data_nasc.isoformat(),
        "genero":          genero,
        "endereco":        endereco,
        "bairro":          regiao["bairro"],
        "cidade":          "São Paulo",
        "uf":              "SP",
        "lat":             round(lat, 7),
        "lng":             round(lng, 7),
        "tipo_cirurgia":   tipo,
        "gravidade":       gravidade,
        "data_entrada":    data_entrada.isoformat(),
        "score":           score,
        "status":          "aguardando",
    }
