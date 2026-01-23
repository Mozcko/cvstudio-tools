import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <a href="/login" className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        Iniciar Sesión
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
        {user.user_metadata?.avatar_url ? (
            <img 
                src={user.user_metadata.avatar_url} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-slate-600"
            />
        ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs border border-slate-500">
                {user.email?.charAt(0).toUpperCase()}
            </div>
        )}
        <button 
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors"
        >
            Salir
        </button>
    </div>
  );
}