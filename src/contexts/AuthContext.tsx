'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '../lib/supabase';

export type AppRoleGranja = 'administrador' | 'operador_granja';
export type AppRoleFinca = AppRoleGranja;

export interface AuthUserGranja {
  id: string;
  email: string;
  name: string;
  roles: AppRoleGranja[];
  fincaNombre?: string;
  granjaNombre?: string;
}
export type AuthUserFinca = AuthUserGranja;

export const AUTHORIZED_EMAILS = [
  'juanca.arcilav@gmail.com',
  'alex@alexzapata.com',
  'admin@granja.com',
  'admin@finca.com',
];

interface AuthContextType {
  user: AuthUserGranja | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOperador: boolean;
  loginRapido: (rol: AppRoleGranja) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserGranja | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Cargar sesión guardada en localStorage
    const savedUser = localStorage.getItem('granja_auth_user') || localStorage.getItem('finca_auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parseando usuario guardado', e);
      }
    }
    setIsLoading(false);

    // 2. Supabase Auth listener
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const email = (session.user.email || '').toLowerCase().trim();
          const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
          const isOwner = AUTHORIZED_EMAILS.includes(email) || email.includes('juanca') || email.includes('alex');
          const newUser: AuthUserGranja = {
            id: session.user.id,
            email,
            name,
            roles: isOwner ? ['administrador'] : ['operador_granja'],
            granjaNombre: 'Granja Matriz 2.200 msnm',
            fincaNombre: 'Granja Matriz 2.200 msnm',
          };
          setUser(newUser);
          localStorage.setItem('granja_auth_user', JSON.stringify(newUser));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('granja_auth_user');
          localStorage.removeItem('finca_auth_user');
        } else if (session?.user) {
          const email = (session.user.email || '').toLowerCase().trim();
          const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
          const isOwner = AUTHORIZED_EMAILS.includes(email) || email.includes('juanca') || email.includes('alex');
          const newUser: AuthUserGranja = {
            id: session.user.id,
            email,
            name,
            roles: isOwner ? ['administrador'] : ['operador_granja'],
            granjaNombre: 'Granja Matriz 2.200 msnm',
            fincaNombre: 'Granja Matriz 2.200 msnm',
          };
          setUser(newUser);
          localStorage.setItem('granja_auth_user', JSON.stringify(newUser));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const loginRapido = (rol: AppRoleGranja) => {
    const rolesMap: Record<AppRoleGranja, { name: string; email: string }> = {
      administrador: { name: 'Juan Carlos (Dueño)', email: 'admin@granja.com' },
      operador_granja: { name: 'Administrador de Granja', email: 'mayordomo@granja.com' },
    };

    const newUser: AuthUserGranja = {
      id: 'usr-' + rol,
      email: rolesMap[rol].email,
      name: rolesMap[rol].name,
      roles: [rol],
      granjaNombre: 'Granja Matriz 2.200 msnm',
      fincaNombre: 'Granja Matriz 2.200 msnm',
    };

    setUser(newUser);
    localStorage.setItem('granja_auth_user', JSON.stringify(newUser));
  };

  const loginWithGoogle = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      alert('Error: Supabase client no disponible.');
      return;
    }
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (error) {
      console.error('Error al iniciar sesión con Google:', error);
      alert('Error de autenticación con Google: ' + error.message);
    }
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('granja_auth_user');
    localStorage.removeItem('finca_auth_user');
  };

  const isAdmin = !!user?.roles.includes('administrador');
  const isOperador = !!user?.roles.includes('operador_granja');

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isOperador,
        loginRapido,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
