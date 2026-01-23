import React from 'react';
import UserMenu from '../auth/UserMenu';

export default function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 group">
                <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                    CVStudio<span className="text-blue-500">.tools</span>
                </span>
            </a>

            {/* Nav Links + Auth */}
            <div className="flex items-center gap-6">
                <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-300">
                    <a href="/#features" className="hover:text-white transition-colors">Características</a>
                    <a href="/#pricing" className="hover:text-white transition-colors">Precios</a>
                </nav>
                <div className="h-4 w-px bg-white/20 hidden md:block"></div>
                <UserMenu />
            </div>
        </div>
    </header>
  );
}