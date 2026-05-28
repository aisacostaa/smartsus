import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { pacientesAPI, hospitaisAPI, dashboardAPI } from "../services/api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [dashboard, setDashboard]   = useState(null);
  const [hospitais, setHospitais]   = useState([]);
  const [fila, setFila]             = useState([]);
  const [agendados, setAgendados]   = useState([]);
  const [realizados, setRealizados] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [ultimaAtt, setUltimaAtt]   = useState(null);

  const recarregarTudo = useCallback(async () => {
    try {
      const [dashRes, hospRes, filaRes, agRes, realRes] = await Promise.all([
        dashboardAPI.dados(),
        hospitaisAPI.listar(),
        pacientesAPI.listar("aguardando"),
        pacientesAPI.listar("agendado"),
        pacientesAPI.listar("realizado"),
      ]);
      setDashboard(dashRes.data);
      setHospitais(hospRes.data);
      setFila(filaRes.data);
      setAgendados(agRes.data);
      setRealizados(realRes.data);
      setUltimaAtt(new Date());
    } catch (e) {
      console.error("Erro ao recarregar:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recarregarTudo();
    const t = setInterval(recarregarTudo, 30000);
    return () => clearInterval(t);
  }, [recarregarTudo]);

  return (
    <AppContext.Provider value={{
      dashboard, hospitais, fila, agendados, realizados,
      loading, ultimaAtt, recarregarTudo,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
}
