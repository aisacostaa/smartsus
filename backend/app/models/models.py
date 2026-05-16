# ============================================================
# SmartSus — Models SQLAlchemy (todos em um único arquivo)
# ============================================================
from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Enum,
    DECIMAL, ForeignKey, SmallInteger, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

class Hospital(Base):
    __tablename__ = "hospitais"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    nome           = Column(String(150), nullable=False)
    endereco       = Column(String(255), nullable=False)
    bairro         = Column(String(100), nullable=False)
    cidade         = Column(String(100), nullable=False, default="São Paulo")
    uf             = Column(String(2),   nullable=False, default="SP")
    lat            = Column(DECIMAL(10, 7), nullable=False)
    lng            = Column(DECIMAL(10, 7), nullable=False)
    capacidade_dia = Column(Integer, nullable=False, default=20)
    ativo          = Column(SmallInteger, nullable=False, default=1)
    criado_em      = Column(DateTime, nullable=False, default=datetime.utcnow)

    pacientes  = relationship("Paciente",  back_populates="hospital")
    alocacoes  = relationship("Alocacao",  back_populates="hospital")


class Paciente(Base):
    __tablename__ = "pacientes"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    nome            = Column(String(150), nullable=False)
    cpf             = Column(String(11),  nullable=False, unique=True)
    telefone        = Column(String(20),  nullable=False)
    data_nascimento = Column(Date,        nullable=False)
    genero          = Column(Enum("M", "F", "O"), nullable=False)
    endereco        = Column(String(255), nullable=False)
    bairro          = Column(String(100), nullable=False)
    cidade          = Column(String(100), nullable=False, default="São Paulo")
    uf              = Column(String(2),   nullable=False, default="SP")
    lat             = Column(DECIMAL(10, 7), nullable=True)
    lng             = Column(DECIMAL(10, 7), nullable=True)
    tipo_cirurgia   = Column(String(150), nullable=False)
    gravidade       = Column(Enum("P1", "P2", "P3", "P4", "P5"), nullable=False)
    data_entrada    = Column(Date,        nullable=False, default=date.today)
    status          = Column(Enum("aguardando", "agendado", "realizado", "cancelado"),
                             nullable=False, default="aguardando")
    hospital_id     = Column(Integer, ForeignKey("hospitais.id", ondelete="SET NULL"), nullable=True)
    data_cirurgia   = Column(Date, nullable=True)
    score           = Column(DECIMAL(8, 4), nullable=False, default=0)
    criado_em       = Column(DateTime, nullable=False, default=datetime.utcnow)
    atualizado_em   = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    hospital = relationship("Hospital", back_populates="pacientes")

    @property
    def idade(self):
        today = date.today()
        dob = self.data_nascimento
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    @property
    def dias_na_fila(self):
        return (date.today() - self.data_entrada).days


class Alocacao(Base):
    __tablename__ = "alocacoes"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    hospital_id     = Column(Integer, ForeignKey("hospitais.id"), nullable=False)
    data_cirurgia   = Column(Date,    nullable=False)
    total_agendado  = Column(Integer, nullable=False, default=0)
    criado_em       = Column(DateTime, nullable=False, default=datetime.utcnow)
    atualizado_em   = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("hospital_id", "data_cirurgia", name="uq_hospital_data"),
    )

    hospital = relationship("Hospital", back_populates="alocacoes")
