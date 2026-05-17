from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.models.models import Paciente, Hospital, Alocacao
from app.services.priorizacao import calcular_score_total, dias_na_fila, is_critico
from app.services.roteamento import distancia_simples
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class PacienteCreate(BaseModel):
    nome: str
    cpf: str
    telefone: str
    data_nascimento: date
    genero: str
    endereco: str
    bairro: str
    cidade: str = "São Paulo"
    uf: str = "SP"
    lat: Optional[float] = None
    lng: Optional[float] = None
    tipo_cirurgia: str
    gravidade: str
    data_entrada: Optional[date] = None

class PacienteUpdate(BaseModel):
    gravidade: Optional[str] = None
    status: Optional[str] = None
    tipo_cirurgia: Optional[str] = None
    hospital_id: Optional[int] = None

def _serializar(p: Paciente) -> dict:
    return {
        "id": p.id,
        "nome": p.nome,
        "cpf": p.cpf,
        "telefone": p.telefone,
        "data_nascimento": p.data_nascimento.isoformat(),
        "idade": p.idade,
        "genero": p.genero,
        "endereco": p.endereco,
        "bairro": p.bairro,
        "cidade": p.cidade,
        "uf": p.uf,
        "lat": float(p.lat) if p.lat else None,
        "lng": float(p.lng) if p.lng else None,
        "tipo_cirurgia": p.tipo_cirurgia,
        "gravidade": p.gravidade,
        "data_entrada": p.data_entrada.isoformat(),
        "status": p.status,
        "hospital_id": p.hospital_id,
        "hospital_atribuido": p.hospital.nome if p.hospital else None,
        "data_cirurgia": p.data_cirurgia.isoformat() if p.data_cirurgia else None,
        "score": float(p.score),
        "dias_na_fila": dias_na_fila(p.data_entrada),
        "critico": is_critico(p.data_entrada),
    }

def _alocar_hospital(paciente: Paciente, db: Session):
    hospitais = db.query(Hospital).filter(Hospital.ativo == 1).all()
    if not paciente.lat or not paciente.lng:
        return
    melhor = None
    menor_dist = float("inf")
    for h in hospitais:
        total = db.query(Paciente).filter(
            Paciente.hospital_id == h.id,
            Paciente.status.in_(["aguardando", "agendado"])
        ).count()
        if total >= h.capacidade_dia:
            continue
        dist = distancia_simples(float(paciente.lat), float(paciente.lng), float(h.lat), float(h.lng))
        if dist["distancia_km"] < menor_dist:
            menor_dist = dist["distancia_km"]
            melhor = h
    if melhor:
        paciente.hospital_id = melhor.id
        paciente.data_cirurgia = date.today()

@router.post("", status_code=201)
def criar_paciente(dados: PacienteCreate, db: Session = Depends(get_db)):
    existente = db.query(Paciente).filter(Paciente.cpf == dados.cpf).first()
    if existente:
        raise HTTPException(400, "CPF já cadastrado")
    entrada = dados.data_entrada or date.today()
    score = calcular_score_total(dados.gravidade, dados.data_nascimento, entrada, dados.tipo_cirurgia)
    p = Paciente(**{**dados.model_dump(), "data_entrada": entrada, "score": score})
    db.add(p)
    db.flush()
    _alocar_hospital(p, db)
    db.commit()
    db.refresh(p)
    return _serializar(p)

@router.get("")
def listar_pacientes(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Paciente)
    if status:
        q = q.filter(Paciente.status == status)
    return [_serializar(p) for p in q.order_by(Paciente.score.desc()).all()]

@router.get("/{paciente_id}")
def buscar_paciente(paciente_id: int, db: Session = Depends(get_db)):
    p = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not p:
        raise HTTPException(404, "Paciente não encontrado")
    return _serializar(p)

@router.put("/{paciente_id}")
def atualizar_paciente(paciente_id: int, dados: PacienteUpdate, db: Session = Depends(get_db)):
    p = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not p:
        raise HTTPException(404, "Paciente não encontrado")

    if dados.gravidade:
        p.gravidade = dados.gravidade
    if dados.status:
        p.status = dados.status
    if dados.tipo_cirurgia:
        p.tipo_cirurgia = dados.tipo_cirurgia
    if dados.hospital_id is not None:
        p.hospital_id = dados.hospital_id
        p.data_cirurgia = date.today()

    p.score = calcular_score_total(p.gravidade, p.data_nascimento, p.data_entrada, p.tipo_cirurgia)
    db.commit()
    db.refresh(p)
    return _serializar(p)

@router.delete("/{paciente_id}", status_code=204)
def deletar_paciente(paciente_id: int, db: Session = Depends(get_db)):
    p = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not p:
        raise HTTPException(404, "Paciente não encontrado")
    db.delete(p)
    db.commit()

@router.post("/recalcular-scores")
def recalcular_scores(db: Session = Depends(get_db)):
    pacientes = db.query(Paciente).filter(Paciente.status == "aguardando").all()
    for p in pacientes:
        p.score = calcular_score_total(p.gravidade, p.data_nascimento, p.data_entrada, p.tipo_cirurgia)
    db.commit()
    return {"recalculados": len(pacientes)}
