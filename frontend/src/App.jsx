import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Fila from "./pages/Fila";
import Cadastro from "./pages/Cadastro";
import Hospitais from "./pages/Hospitais";
import FilaHospital from "./pages/FilaHospital";
import Agenda from "./pages/Agenda";
import Modelagem from "./pages/Modelagem";
import { AppProvider } from "./context/AppContext";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/fila"          element={<Fila />} />
            <Route path="/fila-hospital" element={<FilaHospital />} />
            <Route path="/agenda"        element={<Agenda />} />
            <Route path="/pacientes"     element={<Cadastro />} />
            <Route path="/hospitais"     element={<Hospitais />} />
            <Route path="/modelagem"     element={<Modelagem />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}
