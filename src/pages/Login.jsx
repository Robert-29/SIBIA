import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { Lock, Mail, Loader2, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const cuentasDemo = [
    { email: 'admin@sibia.edu', pass: 'Admin2024!', label: 'Admin' },
    { email: 'director@sibia.edu', pass: 'Director2024!', label: 'Director' },
    { email: 'jefecarrera@sibia.edu', pass: 'Coord2024!', label: 'Jefe de Carrera' },
    { email: 'tutor@sibia.edu', pass: 'Tutor2024!', label: 'Tutor' },
    { email: 'psicologo@sibia.edu', pass: 'Psico2024!', label: 'Psicólogo' },
    { email: 'profesor@sibia.edu', pass: 'Profe2024!', label: 'Profesor' },
    { email: 'alumno@sibia.edu', pass: 'Alumno2024!', label: 'Alumno' }
  ];

  const rellenarCuenta = (cta) => {
    setEmail(cta.email);
    setPassword(cta.pass);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-sm space-y-6">
        
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-surface font-semibold text-2xl mx-auto shadow-sm">
            S
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-text-primary">Iniciar Sesión</h1>
          <p className="text-text-secondary text-sm">
            Sistema Inteligente de Bienestar e Inteligencia Académica
          </p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger text-xs px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Email Institucional
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-text-muted" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@sibia.edu"
                className="w-full bg-bg border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary-dark text-text-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-text-muted" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary-dark text-text-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-surface py-3 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm text-text-primary hover:text-white"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Ingresando...
              </>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </form>

        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
            <Sparkles size={14} className="text-primary-dark" />
            Acceso Rápido (Click para Rellenar)
          </div>
          <div className="flex flex-wrap gap-2">
            {cuentasDemo.map((cta, index) => (
              <button
                key={index}
                type="button"
                onClick={() => rellenarCuenta(cta)}
                className="bg-primary-light hover:bg-accent text-primary-dark font-semibold text-[11px] py-1.5 px-2.5 rounded-xl transition-all border border-primary/10 cursor-pointer"
              >
                {cta.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
