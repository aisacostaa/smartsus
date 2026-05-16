# ============================================================
# SmartSus — Router: Fila de Espera
# ============================================================
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Paciente, Hospital
from app.services.priorizacao import dias_na_fila, is_critico

router = APIRouter()

@router.get("")
def listar_fila(db: Session = Depends(get_db)):
    pacientes = (
        db.query(Paciente)
        .filter(Paciente.status == "aguardando")
        .order_by(Paciente.score.desc())
        .all()
    )
    resultado = []
    for pos, p in enumerate(pacientes, start=1):
        hospital_nome = None
        if p.hospital_id:
            h = db.query(Hospital).filter(Hospital.id == p.hospital_id).first()
            hospital_nome = h.nome if h else None
        resultado.append({
            "posicao": pos,
            "id": p.id,
            "nome": p.nome,
            "gravidade": p.gravidade,
            "tipo_cirurgia": p.tipo_cirurgia,
            "score": float(p.score),
            "dias_na_fila": dias_na_fila(p.data_entrada),
            "data_entrada": p.data_entrada.isoformat(),
            "hospital_atribuido": hospital_nome,
            "hospital_id": p.hospital_id,
            "critico": is_critico(p.data_entrada),
            "status": p.status,
        })
    return resultado

@router.get("/criticos")
def listar_criticos(db: Session = Depends(get_db)):
    from datetime import date, timedelta
    limite = date.today() - timedelta(days=150)
    pacientes = (
        db.query(Paciente)
        .filter(Paciente.status == "aguardando", Paciente.data_entrada <= limite)
        .order_by(Paciente.data_entrada.asc())
        .all()
    )
    return [
        {
            "id": p.id,
            "nome": p.nome,
            "gravidade": p.gravidade,
            "dias_na_fila": dias_na_fila(p.data_entrada),
            "score": float(p.score),
        }
        for p in pacientes
    ]
