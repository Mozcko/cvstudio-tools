import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export default function HeroActions() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión al cargar
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    // Un estado de carga sutil para evitar saltos bruscos
    return (
      <div className="flex animate-pulse gap-4">
        <div className="h-14 w-48 rounded-xl bg-slate-800"></div>
        <div className="hidden h-14 w-32 rounded-xl bg-slate-800 sm:block"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {user ? (
        // --- ESTADO LOGUEADO: Ver Dashboard ---
        <a
          href="/app/dashboard"
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-1 hover:bg-emerald-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Ver mis Currículums
        </a>
      ) : (
        // --- ESTADO INVITADO: Crear Gratis ---
        <a
          href="/app/editor"
          className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1 hover:bg-blue-500"
        >
          Crear mi CV Gratis &rarr;
        </a>
      )}

      {/* El botón secundario siempre es igual */}
      <a
        href="#demo"
        className="rounded-xl border border-slate-700 bg-slate-800 px-8 py-4 text-center text-lg font-bold text-white transition-all hover:bg-slate-700"
      >
        Ver Demo
      </a>
    </div>
  );
}
