'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import TreeView from '@/components/TreeView';
import Breadcrumbs from '@/components/Breadcrumbs';
import TopicFolderCard from '@/components/TopicFolderCard';
import PostCard, { Post } from '@/components/PostCard';
import NewTopicModal, { TopicDataToEdit } from '@/components/NewTopicModal';
import { TopicNode } from '@/lib/db';
import { getCategoryTheme } from '@/lib/category-theme';
import {
  FolderPlus,
  FilePlus,
  SearchX,
  Sparkles,
  Edit3,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTopicId = searchParams.get('topic_id');
  const searchQuery = searchParams.get('search');

  const [tree, setTree] = useState<TopicNode[]>([]);
  const [activeTopicDetail, setActiveTopicDetail] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [includeSubtopics, setIncludeSubtopics] = useState(true);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalParentId, setModalParentId] = useState<string | null>(null);
  const [topicToEdit, setTopicToEdit] = useState<TopicDataToEdit | null>(null);

  // Fetch Tree
  const fetchTree = useCallback(async () => {
    try {
      const res = await fetch('/api/topics');
      if (res.ok) {
        const data = await res.json();
        setTree(data.tree || []);
      }
    } catch (err) {
      console.error('Erro ao carregar árvore:', err);
    }
  }, []);

  // Fetch Active Topic Details & Breadcrumbs
  const fetchTopicDetail = useCallback(async () => {
    if (!activeTopicId) {
      setActiveTopicDetail(null);
      return;
    }
    try {
      const res = await fetch(`/api/topics/${activeTopicId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveTopicDetail(data.topic);
      }
    } catch (err) {
      console.error('Erro ao carregar detalhe do tópico:', err);
    }
  }, [activeTopicId]);

  // Fetch Posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTopicId) params.set('topic_id', activeTopicId);
      params.set('include_subtopics', includeSubtopics ? 'true' : 'false');
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Erro ao carregar anotações:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTopicId, includeSubtopics, searchQuery]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  useEffect(() => {
    fetchTopicDetail();
  }, [fetchTopicDetail]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSelectTopic = (topicId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (topicId) {
      params.set('topic_id', topicId);
    } else {
      params.delete('topic_id');
    }
    router.push(`/?${params.toString()}`);
  };

  const handleOpenNewModal = (parentId: string | null = null) => {
    setTopicToEdit(null);
    setModalParentId(parentId !== undefined ? parentId : activeTopicId);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!activeTopicDetail) return;
    setTopicToEdit({
      id: activeTopicDetail.id,
      name: activeTopicDetail.name,
      color: activeTopicDetail.color,
      banner_image: activeTopicDetail.banner_image,
      parent_id: activeTopicDetail.parent_id,
    });
    setIsModalOpen(true);
  };

  const theme = getCategoryTheme(activeTopicDetail?.color || 'sky');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Coluna Esquerda: Tree View (Sidebar) */}
      <div className="lg:col-span-1">
        <TreeView
          tree={tree}
          activeTopicId={activeTopicId}
          onSelectTopic={handleSelectTopic}
          onOpenNewTopicModal={handleOpenNewModal}
        />
      </div>

      {/* Coluna Direita: Área Central de Conteúdo */}
      <div className="lg:col-span-3 space-y-6">
        {/* Breadcrumbs */}
        <div className="bg-white rounded-2xl border border-stone-200 px-4 py-2.5 shadow-2xs">
          <Breadcrumbs
            items={activeTopicDetail?.breadcrumbs || []}
          />
        </div>

        {/* Cabeçalho de Destaque / Banner do Tópico */}
        <div
          className={`relative rounded-2xl border border-stone-200 overflow-hidden shadow-xs transition-all ${
            activeTopicDetail?.banner_image
              ? 'min-h-[220px] flex items-end'
              : `bg-gradient-to-r ${theme.bannerGradient} p-6 sm:p-8`
          }`}
        >
          {/* Se houver imagem de fundo personalizada */}
          {activeTopicDetail?.banner_image && (
            <>
              <img
                src={activeTopicDetail.banner_image}
                alt={activeTopicDetail.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/60 to-stone-900/20" />
            </>
          )}

          <div
            className={`relative z-10 w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${
              activeTopicDetail?.banner_image ? 'p-6 sm:p-8 text-white' : ''
            }`}
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {activeTopicDetail ? 'Tópico Selecionado' : 'Visão Geral do Conhecimento'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-xs">
                {activeTopicDetail ? activeTopicDetail.name : 'Todas as Anotações'}
              </h1>
              <p className="text-xs font-mono opacity-90">
                {activeTopicDetail
                  ? `${activeTopicDetail.post_count || 0} anotações nesta ramificação`
                  : 'Navegue pela árvore ou busque suas anotações'}
              </p>
            </div>

            {/* Ações do Tópico */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {activeTopicDetail && (
                <button
                  onClick={handleOpenEditModal}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-semibold transition-all cursor-pointer border border-white/20"
                  title="Editar cor ou capa deste tópico"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Tópico</span>
                </button>
              )}

              <button
                onClick={() => handleOpenNewModal(activeTopicId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-semibold transition-all cursor-pointer border border-white/20"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Novo Subtópico</span>
              </button>

              <Link
                href={activeTopicId ? `/novo?topic_id=${activeTopicId}` : '/novo'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-stone-900 text-xs font-bold shadow-md hover:bg-stone-100 active:scale-[0.98] transition-all"
              >
                <FilePlus className="w-4 h-4" />
                <span>Criar Conteúdo Aqui</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Seção de Subtópicos Imediatos (Pastas Filhas) */}
        {activeTopicDetail && activeTopicDetail.children && activeTopicDetail.children.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Subtópicos Imediatos ({activeTopicDetail.children.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeTopicDetail.children.map((child: any) => (
                <TopicFolderCard
                  key={child.id}
                  id={child.id}
                  name={child.name}
                  color={child.color}
                  onSelect={handleSelectTopic}
                />
              ))}
            </div>
          </div>
        )}

        {/* Opção de Filtro (Incluir descendentes) */}
        <div className="flex items-center justify-between pt-2">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            Anotações ({posts.length})
          </h3>

          {activeTopicId && (
            <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSubtopics}
                onChange={(e) => setIncludeSubtopics(e.target.checked)}
                className="rounded border-stone-300 text-stone-900 focus:ring-0 cursor-pointer"
              />
              <span>Incluir anotações de sub-ramificações</span>
            </label>
          )}
        </div>

        {/* Grid de Anotações (PostCards) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-stone-200 h-56 animate-pulse p-5 space-y-3"
              >
                <div className="h-4 bg-stone-200 rounded w-1/3" />
                <div className="h-6 bg-stone-200 rounded w-3/4" />
                <div className="h-4 bg-stone-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center my-6 shadow-2xs">
            <SearchX className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">
              Nenhuma anotação neste nó
            </h3>
            <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
              Você pode adicionar anotações neste tópico ou criar subtópicos para ramificar seu estudo.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href={activeTopicId ? `/novo?topic_id=${activeTopicId}` : '/novo'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors shadow-2xs"
              >
                <FilePlus className="w-4 h-4" />
                <span>Criar Anotação Aqui</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modal para criar / editar tópico */}
      <NewTopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultParentId={modalParentId}
        topicToEdit={topicToEdit}
        tree={tree}
        onTopicSaved={(savedTopicId) => {
          fetchTree();
          fetchTopicDetail();
          handleSelectTopic(savedTopicId);
        }}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Carregando árvore de estudos...</div>}>
      <HomeContent />
    </Suspense>
  );
}
