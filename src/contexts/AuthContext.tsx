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

export function getUserAlias(user?: AuthUserGranja | null): 'Juanca' | 'Alex' | string {
  if (!user) return 'Juanca';
  const email = (user.email || '').toLowerCase().trim();
  const name = (user.name || '').toLowerCase().trim();

  if (email.includes('alex') || name.includes('alex') || name.includes('zapata') || name.includes('fredy')) {
    return 'Alex';
  }
  if (
    email.includes('juanca') ||
    email.includes('camilo') ||
    name.includes('juan') ||
    name.includes('camilo') ||
    name.includes('dueño')
  ) {
    return 'Juanca';
  }
  return user.name || 'Juanca';
}

interface AuthContextType {
  user: AuthUserGranja | null;
  userAlias: string;
  isLoading: boolean;
  isAdmin: boolean;
  isOperador: boolean;
  loginRapido: (rol: AppRoleGranja, socio?: 'Juanca' | 'Alex') => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildAuthUserFromSupabase(supabaseUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): AuthUserGranja {
  const email = (supabaseUser.email || '').toLowerCase().trim();
  const fullName =
    typeof supabaseUser.user_metadata?.full_name === 'string'
      ? supabaseUser.user_metadata.full_name
      : '';
  const name = fullName || email.split('@')[0] || 'Usuario';
  const isOwner = AUTHORIZED_EMAILS.includes(email);
  return {
    id: supabaseUser.id,
    email,
    name,
    roles: isOwner ? ['administrador'] : ['operador_granja'],
    granjaNombre: 'Granja Matriz 2.200 msnm',
    fincaNombre: 'Granja Matriz 2.200 msnm',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserGranja | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isLoggingOutRef = React.useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // 1. Cargar sesión guardada en localStorage (acceso 100% inmediato en offline)
    const savedUser = localStorage.getItem('granja_auth_user') || localStorage.getItem('finca_auth_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          setUser(parsed);
        }
      } catch (e) {
        console.error('Error parseando usuario guardado', e);
      }
    }
    setIsLoading(false);

    // 2. Supabase Auth listener (resiliente a modo offline)
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    const verificarSesionRemota = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
      }
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        type SessionResult = Awaited<ReturnType<typeof supabase.auth.getSession>> | null;
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<null>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Auth timeout')), 3500);
        });
        const result = (await Promise.race([sessionPromise, timeoutPromise])) as SessionResult;
        const session = result?.data?.session;
        if (isMounted && session?.user) {
          const newUser = buildAuthUserFromSupabase(session.user);
          setUser(newUser);
          localStorage.setItem('granja_auth_user', JSON.stringify(newUser));
        }
      } catch {
        // Ignorar errores de red en modo offline y conservar la sesión local
      } finally {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      }
    };

    verificarSesionRemota();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        // Solo cerrar sesión local si fue un logout explícito del usuario (evita expulsión cuando falla refresh offline)
        if (isLoggingOutRef.current) {
          setUser(null);
          localStorage.removeItem('granja_auth_user');
          localStorage.removeItem('finca_auth_user');
          isLoggingOutRef.current = false;
        }
      } else if (session?.user) {
        const newUser = buildAuthUserFromSupabase(session.user);
        setUser(newUser);
        localStorage.setItem('granja_auth_user', JSON.stringify(newUser));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginRapido = (rol: AppRoleGranja, socio?: 'Juanca' | 'Alex') => {
    isLoggingOutRef.current = false;
    if (rol === 'administrador') {
      const isAlex = socio === 'Alex';
      const newUser: AuthUserGranja = {
        id: isAlex ? 'usr-alex-admin' : 'usr-juanca-admin',
        email: isAlex ? 'alex@alexzapata.com' : 'juanca.arcilav@gmail.com',
        name: isAlex ? 'Fredy Alexander Zapata (Socio Admin)' : 'Juan Carlos Arcila (Socio Admin)',
        roles: ['administrador'],
        granjaNombre: 'Granja Matriz 2.200 msnm',
        fincaNombre: 'Granja Matriz 2.200 msnm',
      };
      setUser(newUser);
      localStorage.setItem('granja_auth_user', JSON.stringify(newUser));
      return;
    }

    const newUser: AuthUserGranja = {
      id: 'usr-operador',
      email: 'mayordomo@granja.com',
      name: 'Operador de Granja',
      roles: ['operador_granja'],
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
    isLoggingOutRef.current = true;
    setUser(null);
    localStorage.removeItem('granja_auth_user');
    localStorage.removeItem('finca_auth_user');
    const supabase = getSupabaseClient();
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignorar errores de red al cerrar sesión
      }
    }
  };

  const isAdmin = !!user?.roles.includes('administrador');
  const isOperador = !!user?.roles.includes('operador_granja');
  const userAlias = getUserAlias(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        userAlias,
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
