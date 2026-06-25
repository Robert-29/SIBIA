import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { api } from '../lib/api.js';
import { inferRolDemo, inferNombreDemo } from '../lib/demoUsers.js';

const perfilDesdeSesion = (sessionUser) => ({
  email: sessionUser.email,
  auth_id: sessionUser.id,
  nombre: sessionUser.user_metadata?.nombre || inferNombreDemo(sessionUser.email) || sessionUser.email.split('@')[0],
  rol_nombre: sessionUser.user_metadata?.rol || inferRolDemo(sessionUser.email) || 'alumno',
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Validar sesión activa al arrancar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          try {
            // Sincronizar sesión con Express
            const perfil = await api.post('/auth/login', perfilDesdeSesion(session.user));
            setUser(perfil);
          } catch (syncError) {
            console.error('Error al sincronizar sesión con backend:', syncError);
            const fallback = perfilDesdeSesion(session.user);
            setUser({
              id: session.user.id,
              email: fallback.email,
              nombre: fallback.nombre,
              rol: fallback.rol_nombre,
              isFallback: true
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Suscribirse a cambios en Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          const perfil = await api.post('/auth/login', perfilDesdeSesion(session.user));
          setUser(perfil);
          setIsDemo(false);
        } catch (e) {
          const fallback = perfilDesdeSesion(session.user);
          setUser({
            id: session.user.id,
            email: fallback.email,
            nombre: fallback.nombre,
            rol: fallback.rol_nombre,
            isFallback: true
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // 1. Intentar iniciar sesión con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }

      // 2. Sincronizar perfil con Express
      const perfil = await api.post('/auth/login', perfilDesdeSesion(data.user));

      setUser(perfil);
      setIsDemo(false);
      return perfil;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('SignOut de Supabase falló, limpiando sesión local...');
    } finally {
      setUser(null);
      setIsDemo(false);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
