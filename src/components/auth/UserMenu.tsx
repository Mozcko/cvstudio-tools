import React, { useEffect, useState, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cerrar menú al hacer click fuera
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <a
        href="/login"
        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
      >
        Iniciar Sesión
      </a>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* BOTÓN AVATAR */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 transition-opacity hover:opacity-80 focus:outline-none"
      >
        <div className="hidden text-right sm:block">
          <div className="max-w-30 truncate text-sm font-medium text-white">
            {user.user_metadata?.full_name || 'Usuario'}
          </div>
        </div>

        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="Profile"
            className={`h-9 w-9 rounded-full border-2 transition-colors ${isOpen ? 'border-blue-500' : 'border-slate-600'}`}
          />
        ) : (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 bg-blue-600 text-xs font-bold text-white ${isOpen ? 'border-blue-300' : 'border-slate-500'}`}
          >
            {(user.email?.[0] || 'U').toUpperCase()}
          </div>
        )}
      </button>

      {/* MENÚ DESPLEGABLE */}
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-3 w-48 rounded-xl border border-slate-700 bg-slate-800 py-2 shadow-xl duration-200">
          {/* Header del menú (móvil) */}
          <div className="border-b border-slate-700 px-4 py-2 sm:hidden">
            <p className="truncate text-sm font-bold text-white">{user.user_metadata?.full_name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>

          {/* Opción 1: Dashboard */}
          <a
            href="/app/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Ir al Dashboard
          </a>

          {/* Opción 2: Nuevo CV */}
          <a
            href="/app/editor"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Crear Nuevo CV
          </a>

          <div className="mx-2 my-1 h-px bg-slate-700"></div>

          {/* Opción 3: Salir */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
