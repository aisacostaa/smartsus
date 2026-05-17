import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Fila from "./pages/Fila";
import Cadastro from "./pages/Cadastro";
import Hospitais from "./pages/Hospitais";
import Simulacao from "./pages/Simulacao";
import FilaHospital from "./pages/FilaHospital";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"               element={<Dashboard />} />
          <Route path="/fila"           element={<Fila />} />
          <Route path="/fila-hospital"  element={<FilaHospital />} />
          <Route path="/pacientes"      element={<Cadastro />} />
          <Route path="/hospitais"      element={<Hospitais />} />
          <Route path="/simulacao"      element={<Simulacao />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
