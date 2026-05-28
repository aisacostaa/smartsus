# ============================================================
# SmartSus — Router: Agendamento e Otimização com PuLP
# ============================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.database import get_db
from app.models.models import Paciente, Hospital
from app.services.otimizacao_pulp import otimizar_com_pulp
from app.services.priorizacao import calcular_score_total, dias_na_fila
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


# ── Endpoints de disponibilidade ─────────────────────────────

@router.get("/disponibilidade/{hospital_id}")
def disponibilidade_hospital(hospital_id: int, db: Session = Depends(get_db)):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(404, "Hospital não encontrado")

    hoje = date.today()
    dias = []
    for i in range(30):
        data = hoje + timedelta(days=i)
        agendados_dia = db.query(Paciente).filter(
            Paciente.hospital_id == hospital_id,
            Paciente.data_cirurgia == data,
            Paciente.status.in_(["agendado", "realizado"])
        ).count()
        vagas = max(hospital.capacidade_dia - agendados_dia, 0)
        dias.append({
            "data": data.isoformat(),
            "vagas": vagas,
            "agendados": agendados_dia,
            "capacidade": hospital.capacidade_dia,
            "disponivel": vagas > 0,
        })

    proxima = next((d["data"] for d in dias if d["disponivel"]), None)
    return {
        "hospital_id": hospital_id,
        "hospital_nome": hospital.nome,
        "proxima_data_disponivel": proxima,
        "dias": dias,
    }


# ── Endpoint de realização ────────────────────────────────────

@router.put("/realizar/{paciente_id}")
def realizar_cirurgia(paciente_id: int, db: Session = Depends(get_db)):
    p = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not p:
        raise HTTPException(404, "Paciente não encontrado")
    p.status = "realizado"
    db.commit()
    return {"mensagem": "Cirurgia realizada com sucesso", "paciente": p.nome}


# ── Endpoint principal: Otimização com PuLP ──────────────────

@router.post("/otimizar-fila")
def otimizar_fila(db: Session = Depends(get_db)):
    """
    Otimiza a fila usando PuLP (Programação Linear Inteira).

    Modelo:
      Min Z = Σᵢ Σⱼ cᵢⱼ · xᵢⱼ
      s.a.
        Σⱼ xᵢⱼ = 1          (R1: unicidade por paciente)
        Σᵢ xᵢⱼ ≤ 20         (R2: capacidade diária)
        xᵢⱼ ∈ {0,1}          (R3: binariedade)
        T_i ≤ 180 dias        (R4: restrição temporal)
    """
    # Recalcular scores antes de otimizar
    pacientes_db = db.query(Paciente).filter(
        Paciente.status == "aguardando"
    ).all()

    for p in pacientes_db:
        p.score = calcular_score_total(
            p.gravidade, p.data_nascimento, p.data_entrada, p.tipo_cirurgia
        )
    db.flush()

    # Preparar dados para o PuLP
    # Limitar a 80 pacientes por vez para o solver não demorar demais
    pacientes_ordenados = sorted(pacientes_db, key=lambda p: float(p.score), reverse=True)
    LOTE = 80
    lotes = [pacientes_ordenados[i:i+LOTE] for i in range(0, len(pacientes_ordenados), LOTE)]

    hospitais_db = db.query(Hospital).filter(Hospital.ativo == 1).all()

    # Pré-carregar alocações existentes em memória
    alocacoes_existentes = {}
    ja_agendados = db.query(Paciente).filter(
        Paciente.status.in_(["agendado", "realizado"]),
        Paciente.data_cirurgia != None
    ).all()
    for p in ja_agendados:
        key = (p.hospital_id, p.data_cirurgia)
        alocacoes_existentes[key] = alocacoes_existentes.get(key, 0) + 1

    total_alocados = 0
    resultado_pulp = None

    for lote in lotes:
        pacientes_input = [
            {
                "id": p.id,
                "score": float(p.score),
                "dias_na_fila": dias_na_fila(p.data_entrada),
                "hospital_id": p.hospital_id,
            }
            for p in lote
        ]

        hospitais_input = [
            {"id": h.id, "capacidade_dia": h.capacidade_dia}
            for h in hospitais_db
        ]

        resultado = otimizar_com_pulp(
            pacientes_input,
            hospitais_input,
            alocacoes_existentes,
            horizonte_dias=60,
        )

        if resultado_pulp is None:
            resultado_pulp = resultado

        if resultado["status"] == "ok":
            for aloc in resultado["alocacoes"]:
                p = db.query(Paciente).filter(Paciente.id == aloc["paciente_id"]).first()
                if p:
                    data_cirurgia = date.fromisoformat(aloc["data_cirurgia"])
                    p.hospital_id   = aloc["hospital_id"]
                    p.data_cirurgia = data_cirurgia
                    p.status        = "agendado"
                    total_alocados += 1
                    # Atualiza contador em memória
                    key = (aloc["hospital_id"], data_cirurgia)
                    alocacoes_existentes[key] = alocacoes_existentes.get(key, 0) + 1

    db.commit()

    return {
        "mensagem": "Fila otimizada com PuLP",
        "status_pulp": resultado_pulp.get("status_pulp", "N/A") if resultado_pulp else "N/A",
        "pacientes_agendados": total_alocados,
        "total_processados": len(pacientes_db),
        "valor_objetivo": resultado_pulp.get("valor_objetivo", 0) if resultado_pulp else 0,
        "num_variaveis": resultado_pulp.get("num_variaveis", 0) if resultado_pulp else 0,
        "num_restricoes": resultado_pulp.get("num_restricoes", 0) if resultado_pulp else 0,
        "metodo": "PuLP CBC — Programação Linear Inteira Mista",
    }
