# ============================================================
# SmartSus — Router: Hospitais
# ============================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.models.models import Hospital, Alocacao, Paciente

router = APIRouter()

def _serializar(h: Hospital, agendados: int = 0) -> dict:
    vagas = h.capacidade_dia - agendados
    return {
        "id": h.id,
        "nome": h.nome,
        "endereco": h.endereco,
        "bairro": h.bairro,
        "cidade": h.cidade,
        "uf": h.uf,
        "lat": float(h.lat),
        "lng": float(h.lng),
        "capacidade_dia": h.capacidade_dia,
        "agendados_hoje": agendados,
        "vagas_hoje": max(vagas, 0),
        "disponivel": vagas > 0,
        "ativo": bool(h.ativo),
    }

@router.get("")
def listar_hospitais(db: Session = Depends(get_db)):
    hospitais = db.query(Hospital).filter(Hospital.ativo == 1).all()
    hoje = date.today()
    resultado = []
    for h in hospitais:
        aloc = db.query(Alocacao).filter(
            Alocacao.hospital_id == h.id,
            Alocacao.data_cirurgia == hoje
        ).first()
        agendados = aloc.total_agendado if aloc else 0
        resultado.append(_serializar(h, agendados))
    return resultado

@router.get("/{hospital_id}")
def buscar_hospital(hospital_id: int, db: Session = Depends(get_db)):
    h = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not h:
        raise HTTPException(404, "Hospital não encontrado")
    hoje = date.today()
    aloc = db.query(Alocacao).filter(
        Alocacao.hospital_id == h.id,
        Alocacao.data_cirurgia == hoje
    ).first()
    agendados = aloc.total_agendado if aloc else 0
    pacientes = db.query(Paciente).filter(
        Paciente.hospital_id == h.id,
        Paciente.status == "agendado"
    ).all()
    return {
        **_serializar(h, agendados),
        "pacientes_agendados": len(pacientes),
    }
