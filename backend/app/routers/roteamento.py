# ============================================================
# SmartSus — Router: Roteamento (OpenRouteService)
# ============================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Paciente, Hospital
from app.services.roteamento import calcular_rota, distancia_simples

router = APIRouter()

@router.get("/paciente/{paciente_id}/hospital/{hospital_id}")
async def rota_paciente_hospital(paciente_id: int, hospital_id: int, db: Session = Depends(get_db)):
    p = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not p:
        raise HTTPException(404, "Paciente não encontrado")
    h = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not h:
        raise HTTPException(404, "Hospital não encontrado")

    if p.lat and p.lng:
        resultado = await calcular_rota(float(p.lat), float(p.lng), float(h.lat), float(h.lng))
    else:
        resultado = distancia_simples(-23.55, -46.63, float(h.lat), float(h.lng))

    return {
        "paciente": {"id": p.id, "nome": p.nome, "lat": float(p.lat) if p.lat else None, "lng": float(p.lng) if p.lng else None},
        "hospital": {"id": h.id, "nome": h.nome, "lat": float(h.lat), "lng": float(h.lng), "endereco": h.endereco},
        **resultado
    }

@router.get("/hospital/{hospital_id}/mais-proximo")
async def hospital_mais_proximo(lat: float, lng: float, db: Session = Depends(get_db)):
    hospitais = db.query(Hospital).filter(Hospital.ativo == 1).all()
    resultados = []
    for h in hospitais:
        dist = distancia_simples(lat, lng, float(h.lat), float(h.lng))
        resultados.append({
            "hospital_id": h.id,
            "nome": h.nome,
            "bairro": h.bairro,
            **dist
        })
    return sorted(resultados, key=lambda x: x["distancia_km"])
