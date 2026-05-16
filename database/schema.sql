-- ============================================================
-- SmartSus — Schema MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS smartsus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartsus;

-- ------------------------------------------------------------
-- HOSPITAIS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospitais (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nome            VARCHAR(150)   NOT NULL,
    endereco        VARCHAR(255)   NOT NULL,
    bairro          VARCHAR(100)   NOT NULL,
    cidade          VARCHAR(100)   NOT NULL DEFAULT 'São Paulo',
    uf              CHAR(2)        NOT NULL DEFAULT 'SP',
    lat             DECIMAL(10,7)  NOT NULL,
    lng             DECIMAL(10,7)  NOT NULL,
    capacidade_dia  INT            NOT NULL DEFAULT 20,
    ativo           TINYINT(1)     NOT NULL DEFAULT 1,
    criado_em       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- PACIENTES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pacientes (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    nome                VARCHAR(150)    NOT NULL,
    cpf                 CHAR(11)        NOT NULL UNIQUE,
    telefone            VARCHAR(20)     NOT NULL,
    data_nascimento     DATE            NOT NULL,
    idade               INT             GENERATED ALWAYS AS (TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE())) STORED,
    genero              ENUM('M','F','O') NOT NULL,
    endereco            VARCHAR(255)    NOT NULL,
    bairro              VARCHAR(100)    NOT NULL,
    cidade              VARCHAR(100)    NOT NULL DEFAULT 'São Paulo',
    uf                  CHAR(2)         NOT NULL DEFAULT 'SP',
    lat                 DECIMAL(10,7)   NULL,
    lng                 DECIMAL(10,7)   NULL,
    tipo_cirurgia       VARCHAR(150)    NOT NULL,
    gravidade           ENUM('P1','P2','P3','P4','P5') NOT NULL,
    data_entrada        DATE            NOT NULL DEFAULT (CURDATE()),
    status              ENUM('aguardando','agendado','realizado','cancelado') NOT NULL DEFAULT 'aguardando',
    hospital_id         INT             NULL,
    data_cirurgia       DATE            NULL,
    score               DECIMAL(8,4)    NOT NULL DEFAULT 0,
    criado_em           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_paciente_hospital FOREIGN KEY (hospital_id) REFERENCES hospitais(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- ALOCAÇÕES DIÁRIAS (controle de vagas por hospital/dia)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alocacoes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id     INT     NOT NULL,
    data_cirurgia   DATE    NOT NULL,
    total_agendado  INT     NOT NULL DEFAULT 0,
    criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_hospital_data (hospital_id, data_cirurgia),
    CONSTRAINT fk_alocacao_hospital FOREIGN KEY (hospital_id) REFERENCES hospitais(id)
);

-- ------------------------------------------------------------
-- ÍNDICES de performance
-- ------------------------------------------------------------
CREATE INDEX idx_pacientes_status    ON pacientes(status);
CREATE INDEX idx_pacientes_score     ON pacientes(score DESC);
CREATE INDEX idx_pacientes_gravidade ON pacientes(gravidade);
CREATE INDEX idx_pacientes_entrada   ON pacientes(data_entrada);
CREATE INDEX idx_pacientes_hospital  ON pacientes(hospital_id);