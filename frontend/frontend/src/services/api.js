import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  timeout: 15000,
});

export const pacientesAPI = {
  listar: (status) => api.get("/api/pacientes", { params: status ? { status } : {} }),
  buscar: (id) => api.get(`/api/pacientes/${id}`),
  criar: (dados) => api.post("/api/pacientes", dados),
  atualizar: (id, dados) => api.put(`/api/pacientes/${id}`, dados),
  deletar: (id) => api.delete(`/api/pacientes/${id}`),
  recalcular: () => api.post("/api/pacientes/recalcular-scores"),
};

export const hospitaisAPI = {
  listar: () => api.get("/api/hospitais"),
  buscar: (id) => api.get(`/api/hospitais/${id}`),
};

export const filaAPI = {
  listar: () => api.get("/api/fila"),
  criticos: () => api.get("/api/fila/criticos"),
};

export const dashboardAPI = {
  dados: () => api.get("/api/dashboard"),
};

export const simulacaoAPI = {
  simular: (quantidade) => api.post("/api/simulacao", { quantidade }),
  limpar: () => api.delete("/api/simulacao/limpar"),
};

export default api;
