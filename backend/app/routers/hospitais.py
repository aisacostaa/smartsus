from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Hospital, Paciente

router = APIRouter()

def _contar_pacientes(hospital_id: int, db: Session) -> int:
    """Conta pacientes aguardando ou agendados neste hospital."""
    return db.query(Paciente).filter(
        Paciente.hospital_id == hospital_id,
        Paciente.status.in_(["aguardando", "agendado"])
    ).count()

def _serializar(h: Hospital, ocupados: int = 0) -> dict:
    vagas = max(h.capacidade_dia - ocupados, 0)
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
        "agendados_hoje": ocupados,
        "vagas_hoje": vagas,
        "disponivel": vagas > 0,
        "ativo": bool(h.ativo),
    }

@router.get("")
def listar_hospitais(db: Session = Depends(get_db)):
    hospitais = db.query(Hospital).filter(Hospital.ativo == 1).all()
    resultado = []
    for h in hospitais:
        ocupados = _contar_pacientes(h.id, db)
        resultado.append(_serializar(h, ocupados))
    return resultado

@router.get("/{hospital_id}")
def buscar_hospital(hospital_id: int, db: Session = Depends(get_db)):
    h = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not h:
        raise HTTPException(404, "Hospital não encontrado")
    ocupados = _contar_pacientes(h.id, db)
    return _serializar(h, ocupados)
