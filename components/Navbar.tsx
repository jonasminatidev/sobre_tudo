'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { BookOpen, Plus, Search, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    if (pathname !== '/login') {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setUsername(data.user.username);
          }
        })
        .catch(() => setUsername(null));
    }
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    } else {
      params.delete('search');
    }

    router.push(`/?${params.toString()}`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (pathname === '/login') {
    return null; // Don't show top navbar on login screen for clean presentation
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-stone-800 transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-stone-900 text-lg tracking-tight group-hover:text-stone-700 transition-colors">
                Sobre Tudo
              </span>
              <span className="block text-[10px] font-mono text-stone-600 uppercase tracking-widest -mt-1">
                Caderno Digital
              </span>
            </div>
          </Link>

          {/* Campo de Busca Rápida */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-md mx-4 relative hidden sm:block"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, conceito, fórmulas..."
                className="w-full bg-stone-100/80 hover:bg-stone-100 focus:bg-white text-stone-800 text-sm pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition-all placeholder:text-stone-400 font-sans"
              />
            </div>
          </form>

          {/* Ações */}
          <div className="flex items-center gap-3">
            <Link
              href="/novo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-semibold shadow-xs hover:bg-stone-800 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Anotação</span>
            </Link>

            {username && (
              <div className="flex items-center gap-2 border-l border-stone-200 pl-3 ml-1">
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-mono">
                  <User className="w-3.5 h-3.5 text-stone-500" />
                  <span>@{username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Encerrar sessão (Sair)"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-medium transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Busca em tela pequena */}
        <div className="pb-3 sm:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar anotações..."
              className="w-full bg-stone-100 text-stone-800 text-sm pl-10 pr-4 py-2 rounded-xl border border-stone-200 outline-none"
            />
          </form>
        </div>
      </div>
    </header>
  );
}
