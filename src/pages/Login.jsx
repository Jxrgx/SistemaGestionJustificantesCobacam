import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, XCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function Login() {
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password,
    });

    if (authError) {
      // Mensaje genérico para no revelar si el correo existe o no
      setError('Correo electrónico o contraseña incorrectos. Verifica tus datos.');
    } else {
      navigate('/');
    }

    setLoading(false);
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Marca / Logo */}
        <div className="login-brand">
          <img
            src="/logo-cobacam.png"
            alt="Logotipo COBACAM"
            className="login-logo"
          />
          <h1 className="login-title">COBACAM</h1>
          <p className="login-subtitle">Sistema de Gestión de Justificantes</p>
        </div>

        {/* Error de autenticación */}
        {error && (
          <div className="alerta alerta--error">
            <XCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Correo electrónico
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="usuario@cobacam.edu.mx"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginTop: '.875rem' }}>
            <label className="form-label" htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={!canSubmit}
          >
            {loading
              ? <><Loader2 size={16} className="spin" /> Iniciando sesión…</>
              : 'Iniciar Sesión'
            }
          </button>
        </form>

        <p className="login-footer">Recepción · Plantel 09</p>
      </div>
    </div>
  );
}
