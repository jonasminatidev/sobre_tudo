'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Search,
  LogOut,
  User,
  Folder,
  FileText,
  X,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getCategoryTheme } from '@/lib/category-theme';

interface SearchTopicResult {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface SearchPostResult {
  id: string;
  title: string;
  subtitle?: string;
  topic_name: string;
  topic_color: string;
  snippet?: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [username, setUsername] = useState<string | null>(null);

  // Live Autocomplete Search States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    topics: SearchTopicResult[];
    posts: SearchPostResult[];
  }>({ topics: [], posts: [] });

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

  // Click Outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Live Search Fetch
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults({ topics: [], posts: [] });
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults({
            topics: data.topics || [],
            posts: data.posts || [],
          });
          setIsDropdownOpen(true);
        }
      } catch (err) {
        console.error('Erro na busca rápida:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
  };

  const handleSelectTopicResult = (topicId: string) => {
    setIsDropdownOpen(false);
    router.push(`/?topic_id=${topicId}`);
  };

  const handleSelectPostResult = (postId: string) => {
    setIsDropdownOpen(false);
    router.push(`/post/${postId}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
    if (searchParams.get('search')) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('search');
      router.push(params.toString() ? `/?${params.toString()}` : '/');
    }
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
    return null;
  }

  const hasResults =
    searchResults.topics.length > 0 || searchResults.posts.length > 0;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
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

          {/* Campo de Busca Rápida com Dropdown ao Vivo (Desktop) */}
          <div
            ref={searchContainerRef}
            className="flex-1 max-w-md mx-4 relative hidden sm:block"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim() && hasResults) {
                      setIsDropdownOpen(true);
                    }
                  }}
                  placeholder="Buscar por títulos, tópicos, conceitos, texto..."
                  className="w-full bg-stone-100/80 hover:bg-stone-100 focus:bg-white text-stone-800 text-sm pl-10 pr-9 py-2 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition-all placeholder:text-stone-400 font-sans"
                />

                {isSearching ? (
                  <Loader2 className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-700 absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                    title="Limpar busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </form>

            {/* Menu Suspenso de Resultados de Busca Instantânea */}
            {isDropdownOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[75vh] flex flex-col">
                <div className="p-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                  <span>Resultados para "{searchQuery}"</span>
                  <span className="font-mono text-[10px]">Pressione Enter para ver tudo</span>
                </div>

                <div className="overflow-y-auto divide-y divide-stone-100 p-2 space-y-2">
                  {/* Seção 1: Categorias e Tópicos Encontrados */}
                  {searchResults.topics.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 block">
                        Categorias & Tópicos ({searchResults.topics.length})
                      </span>
                      {searchResults.topics.map((t) => {
                        const theme = getCategoryTheme(t.color);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectTopicResult(t.id)}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-lg bg-stone-100 group-hover:bg-white border border-stone-200 transition-colors shrink-0">
                                <Folder className="w-4 h-4 text-stone-700" />
                              </div>
                              <span className="text-sm font-semibold text-stone-900 truncate">
                                {t.name}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${theme.badge} shrink-0`}
                            >
                              Tópico
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Seção 2: Anotações e Conteúdo Encontrado */}
                  {searchResults.posts.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 block">
                        Anotações & Conteúdo ({searchResults.posts.length})
                      </span>
                      {searchResults.posts.map((p) => {
                        const theme = getCategoryTheme(p.topic_color);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPostResult(p.id)}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-stone-50 transition-colors flex flex-col gap-1 group cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-stone-500 shrink-0 group-hover:text-stone-900 transition-colors" />
                                <span className="text-sm font-bold text-stone-900 truncate group-hover:underline">
                                  {p.title}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${theme.badge} shrink-0`}
                              >
                                {p.topic_name}
                              </span>
                            </div>

                            {/* Trecho / Snippet de Texto */}
                            {p.snippet && (
                              <p className="text-xs text-stone-500 line-clamp-2 pl-6 font-sans leading-snug">
                                {p.snippet}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Se NENHUM resultado for encontrado */}
                  {!hasResults && !isSearching && (
                    <div className="p-6 text-center text-xs text-stone-500">
                      Nenhum tópico ou anotação encontrada com a palavra "{searchQuery}".
                    </div>
                  )}
                </div>

                {/* Footer do Dropdown */}
                {hasResults && (
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full p-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Ver todos os resultados no feed completo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Ações da Header */}
          <div className="flex items-center gap-3">
            {username ? (
              <>
                <Link
                  href="/novo"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-semibold shadow-xs hover:bg-stone-800 active:scale-[0.98] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nova Anotação</span>
                </Link>

                <div className="flex items-center gap-2 border-l border-stone-200 pl-3 ml-1">
                  <Link
                    href="/admin"
                    className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                      pathname.startsWith('/admin')
                        ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                    title="Ir para o Painel de Administração"
                  >
                    <User className="w-3.5 h-3.5 text-stone-500" />
                    <span>Modo Admin</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Encerrar sessão (Sair)"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-medium transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-semibold border border-stone-200 transition-all cursor-pointer shadow-2xs"
              >
                <User className="w-4 h-4 text-stone-600" />
                <span>Administração</span>
              </Link>
            )}
          </div>
        </div>

        {/* Busca em tela pequena (Mobile) */}
        <div className="pb-3 sm:hidden relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar anotações e tópicos..."
              className="w-full bg-stone-100 text-stone-800 text-sm pl-10 pr-4 py-2 rounded-xl border border-stone-200 outline-none"
            />
          </form>
        </div>
      </div>
    </header>
  );
}
