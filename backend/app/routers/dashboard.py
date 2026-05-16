# ============================================================
# SmartSus — Router: Dashboard
# ============================================================
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.database import get_db
from app.models.models import Paciente, Hospital, Alocacao
from app.services.priorizacao import dias_na_fila

router = APIRouter()

@router.get("")
def dashboard(db: Session = Depends(get_db)):
    hoje = date.today()
    limite_critico = hoje - timedelta(days=150)

    total = db.query(Paciente).count()
    aguardando = db.query(Paciente).filter(Paciente.status == "aguardando").count()
    agendados  = db.query(Paciente).filter(Paciente.status == "agendado").count()
    realizados = db.query(Paciente).filter(Paciente.status == "realizado").count()
    criticos   = db.query(Paciente).filter(
        Paciente.status == "aguardando",
        Paciente.data_entrada <= limite_critico
    ).count()

    # Por gravidade
    gravidades = {}
    for nivel in ["P1","P2","P3","P4","P5"]:
        gravidades[nivel] = db.query(Paciente).filter(
            Paciente.gravidade == nivel,
            Paciente.status == "aguardando"
        ).count()

    # Tempo médio de espera
    pacientes_aguardando = db.query(Paciente).filter(Paciente.status == "aguardando").all()
    if pacientes_aguardando:
        media_dias = sum(dias_na_fila(p.data_entrada) for p in pacientes_aguardando) / len(pacientes_aguardando)
    else:
        media_dias = 0

    # Hospitais
    hospitais = db.query(Hospital).filter(Hospital.ativo == 1).all()
    total_hospitais = len(hospitais)
    lotados = 0
    disponiveis = 0
    for h in hospitais:
        aloc = db.query(Alocacao).filter(
            Alocacao.hospital_id == h.id,
            Alocacao.data_cirurgia == hoje
        ).first()
        agendados_h = aloc.total_agendado if aloc else 0
        if agendados_h >= h.capacidade_dia:
            lotados += 1
        else:
            disponiveis += 1

    return {
        "total_pacientes": total,
        "aguardando": aguardando,
        "agendados": agendados,
        "realizados": realizados,
        "criticos_180_dias": criticos,
        "por_gravidade": gravidades,
        "tempo_medio_espera_dias": round(media_dias, 1),
        "hospitais": {
            "total": total_hospitais,
            "lotados": lotados,
            "disponiveis": disponiveis,
        }
    }
