import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function ProtectedRoute() {
  // undefined = aún verificando; null = sin sesión; objeto = sesión activa
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    // 1. Obtener la sesión inicial (puede venir del localStorage de Supabase)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    // 2. Escuchar cambios en tiempo real (login, logout, expiración)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pantalla de verificación inicial
  if (session === undefined) {
    return (
      <div className="loading-screen">
        <Loader2 size={32} className="spin" />
        <p>Verificando sesión…</p>
      </div>
    );
  }

  // Sin sesión → redirigir a /login (replace evita que quede en el historial)
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Sesión válida → renderizar rutas hijas
  return <Outlet />;
}
