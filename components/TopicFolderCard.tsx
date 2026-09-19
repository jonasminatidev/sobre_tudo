'use client';

import { getCategoryTheme } from '@/lib/category-theme';
import { Folder, ArrowRight, Edit3, Layers } from 'lucide-react';

interface TopicFolderCardProps {
  id: string;
  name: string;
  color: string;
  bannerImage?: string | null;
  postCount?: number;
  subtopicCount?: number;
  onSelect: (id: string) => void;
  onEdit?: (id: string, e: React.MouseEvent) => void;
}

export default function TopicFolderCard({
  id,
  name,
  color,
  bannerImage = null,
  postCount = 0,
  subtopicCount = 0,
  onSelect,
  onEdit,
}: TopicFolderCardProps) {
  const theme = getCategoryTheme(color);

  return (
    <div
      onClick={() => onSelect(id)}
      className={`group relative bg-white rounded-2xl border border-stone-200 shadow-2xs hover:shadow-lg ${theme.borderHover} transition-all cursor-pointer overflow-hidden flex flex-col justify-between`}
    >
      {/* Top Banner / Image Header */}
      <div className={`relative h-28 w-full overflow-hidden ${bannerImage ? 'bg-stone-900' : `bg-gradient-to-r ${theme.bannerGradient}`}`}>
        {bannerImage ? (
          <>
            <img
              src={bannerImage}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/30 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-transparent transition-colors" />
        )}

        {/* Action button overlay: Edit topic */}
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(id, e);
            }}
            title="Editar Tópico"
            className="absolute top-2.5 right-2.5 z-10 p-2 rounded-xl bg-white/80 hover:bg-white text-stone-700 hover:text-stone-900 backdrop-blur-md shadow-xs transition-all opacity-0 group-hover:opacity-100 active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Category Badge */}
        <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-[11px] font-bold text-stone-800 shadow-2xs">
          <div className={`w-2 h-2 rounded-full ${theme.accentBg}`} />
          <span className="truncate max-w-[160px]">{name}</span>
        </div>
      </div>

      {/* Card Content & Stats */}
      <div className="p-4 flex items-center justify-between gap-3 bg-white">
        <div className="space-y-1 min-w-0">
          <h4 className="text-sm font-bold text-stone-900 group-hover:text-stone-700 transition-colors truncate">
            {name}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono">
            <span>{postCount} {postCount === 1 ? 'anotação' : 'anotações'}</span>
            {subtopicCount > 0 && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3 h-3 text-stone-400" />
                  {subtopicCount} sub
                </span>
              </>
            )}
          </div>
        </div>

        <div className="w-8 h-8 rounded-xl bg-stone-50 group-hover:bg-stone-900 group-hover:text-white text-stone-400 flex items-center justify-center transition-all shrink-0">
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
