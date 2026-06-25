import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import { useRol } from './hooks/useRol.js';

// Layout
import Layout from './components/layout/Layout.jsx';

// Páginas
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AlumnosList from './pages/Alumnos/AlumnosList.jsx';
import AlumnoDetail from './pages/Alumnos/AlumnoDetail.jsx';
import AlertasList from './pages/AlertasList.jsx';
import AdminPanel from './pages/AdminPanel.jsx';

// Componente de ruta protegida
function ProtectedRoute({ children, rolesPermitidos }) {
  const { user, loading } = useContext(AuthContext);
  const { esRol } = useRol();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-surface font-semibold text-xl shadow-sm animate-pulse">
            S
          </div>
          <p className="text-text-secondary font-medium text-sm">Cargando SIBIA...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !esRol(rolesPermitidos)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Componente que redirige si ya estás autenticado
function PublicRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-surface font-semibold text-xl shadow-sm animate-pulse">
            S
          </div>
          <p className="text-text-secondary font-medium text-sm">Cargando SIBIA...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Rutas protegidas dentro del layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard — todos los roles */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Alumnos — todos excepto alumnos (ellos ven su propio dashboard) */}
        <Route
          path="/alumnos"
          element={
            <ProtectedRoute rolesPermitidos={['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo', 'profesor']}>
              <AlumnosList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alumnos/:id"
          element={
            <ProtectedRoute rolesPermitidos={['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo', 'profesor', 'alumno']}>
              <AlumnoDetail />
            </ProtectedRoute>
          }
        />

        {/* Alertas — roles de seguimiento */}
        <Route
          path="/alertas"
          element={
            <ProtectedRoute rolesPermitidos={['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo']}>
              <AlertasList />
            </ProtectedRoute>
          }
        />

        {/* Admin — solo administradores */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute rolesPermitidos={['administrador']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Ruta por defecto — redirigir al dashboard o login */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
