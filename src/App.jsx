import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NuevoJustificante from './pages/NuevoJustificante';
import Alumnos from './pages/Alumnos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas — requieren sesión activa */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="nuevo-justificante" element={<NuevoJustificante />} />
            <Route path="alumnos" element={<Alumnos />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
