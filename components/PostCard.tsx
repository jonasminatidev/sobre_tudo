'use client';

import Link from 'next/link';
import { getCategoryTheme } from '@/lib/category-theme';
import { Calendar, ArrowRight, Folder } from 'lucide-react';

export interface Post {
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
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const theme = getCategoryTheme(post.topic_color);

  // Format date
  const formattedDate = new Date(post.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Strip HTML snippet for preview
  const plainText = post.content_html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <Link
      href={`/post/${post.id}`}
      className="group block bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col h-full"
    >
      {/* Imagem de Capa (se houver) */}
      {post.cover_image ? (
        <div className="relative h-44 w-full overflow-hidden bg-stone-100 border-b border-stone-100">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs ${theme.badge}`}
            >
              <Folder className="w-3 h-3" />
              {post.topic_name}
            </span>
          </div>
        </div>
      ) : (
        <div className={`p-4 pb-0 ${theme.cardTopBorder}`}>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${theme.badge}`}
          >
            <Folder className="w-3 h-3" />
            {post.topic_name}
          </span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Título */}
          <h3 className="text-lg font-bold text-stone-900 group-hover:text-stone-700 transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>

          {/* Subtítulo ou excerto */}
          {post.subtitle ? (
            <p className="mt-1 text-sm text-stone-600 line-clamp-2 leading-relaxed">
              {post.subtitle}
            </p>
          ) : (
            <p className="mt-1 text-sm text-stone-500 line-clamp-2 leading-relaxed">
              {plainText || 'Sem conteúdo adicional...'}
            </p>
          )}
        </div>

        {/* Rodapé do Card */}
        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1 text-stone-700 group-hover:translate-x-0.5 transition-transform font-sans font-medium text-xs">
            <span>Ler anotação</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
