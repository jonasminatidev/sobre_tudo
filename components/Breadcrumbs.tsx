'use client';

import Link from 'next/link';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { getCategoryTheme } from '@/lib/category-theme';

export interface BreadcrumbItem {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  color: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  currentTitle?: string;
}

export default function Breadcrumbs({ items, currentTitle }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center flex-wrap gap-1.5 text-xs text-stone-600 font-medium py-1">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors px-2 py-1 rounded-lg hover:bg-stone-100"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Início</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1 && !currentTitle;
        const theme = getCategoryTheme(item.color);

        return (
          <div key={item.id} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            {isLast ? (
              <span className={`px-2.5 py-1 rounded-lg font-semibold border ${theme.badge}`}>
                {item.name}
              </span>
            ) : (
              <Link
                href={`/?topic_id=${item.id}`}
                className="hover:text-stone-900 transition-colors px-2 py-1 rounded-lg hover:bg-stone-100 flex items-center gap-1"
              >
                <Folder className="w-3 h-3 text-stone-400" />
                <span>{item.name}</span>
              </Link>
            )}
          </div>
        );
      })}

      {currentTitle && (
        <div className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="text-stone-900 font-semibold truncate max-w-[200px] sm:max-w-[300px]">
            {currentTitle}
          </span>
        </div>
      )}
    </nav>
  );
}
