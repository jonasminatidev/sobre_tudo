'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getCategoryTheme } from '@/lib/category-theme';
import { ArrowLeft, Calendar, Edit3, Trash2, Folder, BookOpen } from 'lucide-react';

interface PostDetail {
  id: string;
  title: string;
  subtitle?: string | null;
  topic_id: string;
  content_html: string;
  cover_image?: string | null;
  created_at: string;
  updated_at: string;
  topic_name: string;
  topic_slug: string;
  topic_color: string;
  breadcrumbs: any[];
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function loadPost() {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data.post);
        } else {
          setPost(null);
        }
      } catch (err) {
        console.error('Erro ao carregar anotação:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push(post?.topic_id ? `/?topic_id=${post.topic_id}` : '/');
      } else {
        alert('Erro ao excluir anotação.');
        setIsDeleting(false);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao excluir.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-4 animate-pulse">
        <div className="h-4 bg-stone-200 rounded w-1/4" />
        <div className="h-10 bg-stone-200 rounded w-3/4" />
        <div className="h-64 bg-stone-200 rounded-2xl w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-white p-8 rounded-2xl border border-stone-200 shadow-xs">
        <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-stone-900">Anotação não encontrada</h2>
        <p className="mt-2 text-sm text-stone-500">
          Esta anotação pode ter sido excluída ou o link está incorreto.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Feed</span>
        </Link>
      </div>
    );
  }

  const theme = getCategoryTheme(post.topic_color);

  const formattedCreated = new Date(post.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <article className="max-w-4xl mx-auto space-y-6">
      {/* Navegação e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 px-4 py-2 shadow-2xs flex-1">
          <Breadcrumbs items={post.breadcrumbs || []} currentTitle={post.title} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/post/${post.id}/editar`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 hover:border-stone-300 transition-all shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-stone-600" />
            <span>Editar</span>
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-all shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      {/* Cartão do Cabeçalho */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        {/* Capa */}
        {post.cover_image && (
          <div className="relative h-64 sm:h-80 w-full bg-stone-100 border-b border-stone-200">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-4">
          {/* Tópico Badge */}
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${theme.badge}`}
            >
              <Folder className="w-3 h-3" />
              {post.topic_name}
            </span>
          </div>

          {/* Título Principal */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Subtítulo */}
          {post.subtitle && (
            <p className="text-base sm:text-lg text-stone-600 font-normal leading-relaxed border-l-2 border-stone-300 pl-3">
              {post.subtitle}
            </p>
          )}

          {/* Data e Metadados */}
          <div className="pt-2 border-t border-stone-100 flex items-center gap-4 text-xs font-mono text-stone-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Criado em {formattedCreated}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo HTML / Prose */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-10 shadow-xs">
        <div
          className="prose prose-stone max-w-none prose-headings:font-bold prose-headings:text-stone-900 prose-p:text-stone-800 prose-p:leading-relaxed prose-a:text-sky-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-stone-900">Excluir anotação?</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Tem certeza de que deseja excluir &quot;<strong>{post.title}</strong>&quot;? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
