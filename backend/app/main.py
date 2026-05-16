# ============================================================
# SmartSus — Entrada da aplicação FastAPI
# ============================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base

# Importa routers
from app.routers import pacientes, hospitais, fila, dashboard, simulacao

# Cria tabelas automaticamente se não existirem
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartSus API",
    description="Sistema inteligente de gestão da fila cirúrgica do SUS",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

app.include_router(pacientes.router,  prefix="/api/pacientes",  tags=["Pacientes"])
app.include_router(hospitais.router,  prefix="/api/hospitais",  tags=["Hospitais"])
app.include_router(fila.router,       prefix="/api/fila",        tags=["Fila"])
app.include_router(dashboard.router,  prefix="/api/dashboard",   tags=["Dashboard"])
app.include_router(simulacao.router,  prefix="/api/simulacao",   tags=["Simulação"])

@app.get("/")
def root():
    return {"status": "SmartSus online"}
