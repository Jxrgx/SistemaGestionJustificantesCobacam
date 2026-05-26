import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import NuevoJustificante from './pages/NuevoJustificante';
import Alumnos from './pages/Alumnos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="nuevo-justificante" element={<NuevoJustificante />} />
          <Route path="alumnos" element={<Alumnos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
