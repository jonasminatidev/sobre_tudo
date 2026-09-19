'use client';

import Link from 'next/link';
import { getCategoryTheme } from '@/lib/category-theme';
import { Folder, ArrowRight } from 'lucide-react';

interface TopicFolderCardProps {
  id: string;
  name: string;
  color: string;
  postCount?: number;
  onSelect: (id: string) => void;
}

export default function TopicFolderCard({
  id,
  name,
  color,
  postCount = 0,
  onSelect,
}: TopicFolderCardProps) {
  const theme = getCategoryTheme(color);

  return (
    <div
      onClick={() => onSelect(id)}
      className={`group bg-white rounded-xl border border-stone-200 p-4 shadow-2xs hover:shadow-md ${theme.borderHover} transition-all cursor-pointer flex items-center justify-between gap-3`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2.5 rounded-xl border ${theme.badge} shrink-0`}>
          <Folder className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-stone-900 group-hover:text-stone-700 transition-colors truncate">
            {name}
          </h4>
          <span className="text-[11px] text-stone-500 font-mono">
            {postCount} {postCount === 1 ? 'anotação' : 'anotações'}
          </span>
        </div>
      </div>

      <div className="text-stone-400 group-hover:text-stone-800 group-hover:translate-x-1 transition-all shrink-0">
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
}
