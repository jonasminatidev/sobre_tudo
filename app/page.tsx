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
  Trash2,
  Layers,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

export function HomeContent({ isAdmin = false }: { isAdmin?: boolean }) {
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

  // Helper to find topic node anywhere in tree
  const findTopicInTree = (nodes: TopicNode[], id: string): TopicNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children && n.children.length > 0) {
        const found = findTopicInTree(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

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
      } else {
        // Fallback to local tree node if route detail fails
        const fallbackNode = findTopicInTree(tree, activeTopicId);
        if (fallbackNode) {
          setActiveTopicDetail({
            id: fallbackNode.id,
            name: fallbackNode.name,
            color: fallbackNode.color,
            banner_image: fallbackNode.banner_image,
            post_count: fallbackNode.total_post_count || 0,
            children: fallbackNode.children || [],
            breadcrumbs: [{ id: fallbackNode.id, name: fallbackNode.name, color: fallbackNode.color }],
          });
        }
      }
    } catch (err) {
      console.error('Erro ao carregar detalhe do tópico:', err);
    }
  }, [activeTopicId, tree]);

  // Fetch Posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTopicId && !searchQuery) params.set('topic_id', activeTopicId);
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
    router.push(isAdmin ? `/admin?${params.toString()}` : `/?${params.toString()}`);
  };

  const handleOpenNewModal = (parentId: string | null = null) => {
    if (!isAdmin) return;
    setTopicToEdit(null);
    setModalParentId(parentId !== undefined ? parentId : activeTopicId);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (targetId?: string) => {
    if (!isAdmin) return;
    const topicIdToUse = targetId || activeTopicId;
    if (!topicIdToUse) return;

    const targetNode = findTopicInTree(tree, topicIdToUse) || activeTopicDetail;
    if (!targetNode) return;

    setTopicToEdit({
      id: targetNode.id,
      name: targetNode.name,
      color: targetNode.color,
      banner_image: targetNode.banner_image,
      parent_id: targetNode.parent_id,
    });
    setIsModalOpen(true);
  };

  const handleDeleteTopic = async () => {
    if (!isAdmin || !activeTopicDetail) return;
    const confirmDelete = confirm(
      `Tem certeza que deseja excluir o tópico "${activeTopicDetail.name}"? Todas as anotações e subtópicos associados serão removidos.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/topics/${activeTopicDetail.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        handleSelectTopic(activeTopicDetail.parent_id || null);
        fetchTree();
      } else {
        alert('Erro ao excluir tópico.');
      }
    } catch (err) {
      console.error('Erro ao excluir tópico:', err);
      alert('Erro de conexão ao excluir tópico.');
    }
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
          onOpenNewTopicModal={isAdmin ? handleOpenNewModal : undefined}
        />
      </div>

      {/* Coluna Direita: Área Central de Conteúdo */}
      <div className="lg:col-span-3 space-y-6">
        {/* Banner de Busca Ativa */}
        {searchQuery && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <SearchX className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="text-xs text-amber-950">
                <span className="font-bold">Exibindo busca global por:</span>{' '}
                <code className="bg-amber-100 px-1.5 py-0.5 rounded font-bold font-mono text-amber-900">
                  "{searchQuery}"
                </code>
                <span className="ml-2 font-mono text-[11px] text-amber-700">
                  ({posts.length} anotação/anotações encontrada(s))
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('search');
                const basePath = isAdmin ? '/admin' : '/';
                router.push(params.toString() ? `${basePath}?${params.toString()}` : basePath);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-stone-700 hover:text-stone-900 border border-stone-200 text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <span>Limpar busca</span>
            </button>
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="bg-white rounded-2xl border border-stone-200 px-4 py-2.5 shadow-2xs">
          <Breadcrumbs
            items={activeTopicDetail?.breadcrumbs || []}
          />
        </div>

        {/* Cabeçalho de Destaque / Banner Dinâmico do Tópico Selecionado */}
        <div
          className={`relative rounded-3xl border border-stone-200 overflow-hidden shadow-xs transition-all ${
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
                  {activeTopicDetail ? 'Tópico Selecionado' : 'Visão Geral do Caderno'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-xs">
                {activeTopicDetail ? activeTopicDetail.name : 'Todas as Anotações'}
              </h1>
              <p className="text-xs font-mono opacity-90">
                {activeTopicDetail
                  ? `${activeTopicDetail.post_count || 0} anotações nesta ramificação`
                  : 'Navegue pelas categorias abaixo ou busque suas anotações'}
              </p>
            </div>

            {/* Ações do Tópico (Somente em Modo Admin) */}
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {activeTopicDetail && (
                  <>
                    <button
                      onClick={() => handleOpenEditModal(activeTopicDetail.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-semibold transition-all cursor-pointer border border-white/20"
                      title="Editar nome, cor ou capa deste tópico"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Tópico</span>
                    </button>

                    <button
                      onClick={handleDeleteTopic}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white backdrop-blur-md text-xs font-semibold transition-all cursor-pointer border border-white/20"
                      title="Excluir este tópico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
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
                  <span>Criar Anotação Aqui</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Visão de Raiz: Exibir Grid de Todos os Tópicos Principais */}
        {!activeTopicId && tree.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-400" />
                <span>Todos os Tópicos Principais ({tree.length})</span>
              </h3>
              {isAdmin && (
                <button
                  onClick={() => handleOpenNewModal(null)}
                  className="text-xs font-semibold text-stone-700 hover:text-stone-900 hover:underline cursor-pointer"
                >
                  + Criar Tópico Raiz
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tree.map((cat) => (
                <TopicFolderCard
                  key={cat.id}
                  id={cat.id}
                  name={cat.name}
                  color={cat.color}
                  bannerImage={cat.banner_image}
                  postCount={cat.total_post_count || 0}
                  subtopicCount={cat.children ? cat.children.length : 0}
                  onSelect={handleSelectTopic}
                  onEdit={isAdmin ? (id, e) => handleOpenEditModal(id) : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* Seção de Subtópicos Imediatos (Pastas Filhas) do Tópico Ativo */}
        {activeTopicDetail && activeTopicDetail.children && activeTopicDetail.children.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-400" />
              <span>Subtópicos em "{activeTopicDetail.name}" ({activeTopicDetail.children.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTopicDetail.children.map((child: any) => (
                <TopicFolderCard
                  key={child.id}
                  id={child.id}
                  name={child.name}
                  color={child.color}
                  bannerImage={child.banner_image}
                  postCount={child.total_post_count || child.direct_post_count || 0}
                  subtopicCount={child.children ? child.children.length : 0}
                  onSelect={handleSelectTopic}
                  onEdit={isAdmin ? (id, e) => handleOpenEditModal(id) : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* Cabeçalho da Seção de Anotações */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
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
                className="bg-white rounded-2xl border border-stone-200 h-56 animate-pulse p-5 space-y-3"
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
              {activeTopicDetail ? `Nenhuma anotação em "${activeTopicDetail.name}"` : 'Nenhuma anotação encontrada'}
            </h3>
            <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
              {isAdmin
                ? 'Você pode adicionar anotações neste tópico ou criar subtópicos para organizar seus estudos.'
                : 'Nenhum conteúdo publicado nesta categoria até o momento.'}
            </p>
            {isAdmin && (
              <div className="mt-5 flex justify-center gap-3">
                <button
                  onClick={() => handleOpenNewModal(activeTopicId)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 text-stone-800 text-xs font-semibold hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Criar Subtópico</span>
                </button>

                <Link
                  href={activeTopicId ? `/novo?topic_id=${activeTopicId}` : '/novo'}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors shadow-2xs"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Criar Anotação Aqui</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para criar / editar tópico (Apenas em Modo Admin) */}
      {isAdmin && (
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
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Carregando caderno digital...</div>}>
      <HomeContent isAdmin={false} />
    </Suspense>
  );
}
