# ============================================================
# SmartSus — Router: Simulação
# ============================================================
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.models.models import Paciente, Alocacao
from app.services.simulacao import gerar_paciente_ficticio
from app.services.priorizacao import dias_na_fila, is_critico
from app.routers.pacientes import _alocar_hospital
from pydantic import BaseModel

router = APIRouter()

class SimulacaoRequest(BaseModel):
    quantidade: int = 50

@router.post("")
def simular(req: SimulacaoRequest, db: Session = Depends(get_db)):
    quantidade = min(req.quantidade, 200)
    criados = 0
    for i in range(quantidade):
        dados = gerar_paciente_ficticio(i)
        cpf = dados["cpf"]
        if db.query(Paciente).filter(Paciente.cpf == cpf).first():
            continue
        from datetime import date as d
        p = Paciente(
            nome=dados["nome"], cpf=cpf, telefone=dados["telefone"],
            data_nascimento=d.fromisoformat(dados["data_nascimento"]),
            genero=dados["genero"], endereco=dados["endereco"],
            bairro=dados["bairro"], cidade=dados["cidade"], uf=dados["uf"],
            lat=dados["lat"], lng=dados["lng"],
            tipo_cirurgia=dados["tipo_cirurgia"], gravidade=dados["gravidade"],
            data_entrada=d.fromisoformat(dados["data_entrada"]),
            score=dados["score"], status="aguardando",
        )
        db.add(p)
        db.flush()
        _alocar_hospital(p, db)
        criados += 1
    db.commit()

    # Métricas pós-simulação
    todos = db.query(Paciente).filter(Paciente.status == "aguardando").all()
    criticos = sum(1 for p in todos if is_critico(p.data_entrada))
    media = sum(dias_na_fila(p.data_entrada) for p in todos) / len(todos) if todos else 0

    gravidades = {nivel: sum(1 for p in todos if p.gravidade == nivel) for nivel in ["P1","P2","P3","P4","P5"]}

    return {
        "pacientes_criados": criados,
        "total_na_fila": len(todos),
        "criticos": criticos,
        "tempo_medio_espera_dias": round(media, 1),
        "por_gravidade": gravidades,
    }

@router.delete("/limpar")
def limpar_simulacao(db: Session = Depends(get_db)):
    db.query(Alocacao).delete()
    db.query(Paciente).delete()
    db.commit()
    return {"mensagem": "Simulação limpa com sucesso"}
