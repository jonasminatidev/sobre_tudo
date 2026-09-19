'use client';

import { getCategoryTheme } from '@/lib/category-theme';
import { Layers } from 'lucide-react';

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  post_count?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  post_count?: number;
  subcategories: Subcategory[];
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectSubcategory: (subcategoryId: string | null) => void;
  totalPostsCount: number;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
  totalPostsCount,
}: CategoryFilterProps) {
  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="space-y-4 my-6">
      {/* Abas Principais de Categoria */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 scrollbar-none">
        <button
          onClick={() => {
            onSelectCategory(null);
            onSelectSubcategory(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === null
              ? 'bg-stone-900 text-white border-stone-900 font-semibold shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Todas as Anotações</span>
          <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono">
            {totalPostsCount}
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const theme = getCategoryTheme(cat.color);

          return (
            <button
              key={cat.id}
              onClick={() => {
                if (isSelected) {
                  onSelectCategory(null);
                  onSelectSubcategory(null);
                } else {
                  onSelectCategory(cat.id);
                  onSelectSubcategory(null);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? theme.activeTab
                  : `bg-white text-stone-700 border-stone-200 ${theme.borderHover}`
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${theme.dotBg}`} />
              <span>{cat.name}</span>
              {typeof cat.post_count === 'number' && (
                <span
                  className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-mono ${
                    isSelected ? 'bg-white/80 text-stone-800' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {cat.post_count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pílulas Secundárias de Subcategoria */}
      {activeCategoryObj && activeCategoryObj.subcategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 animate-fade-in">
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider mr-1">
            Subcategorias:
          </span>
          <button
            onClick={() => onSelectSubcategory(null)}
            className={`px-3 py-1 rounded-full text-xs transition-all border cursor-pointer ${
              selectedSubcategory === null
                ? 'bg-stone-800 text-white border-stone-800 font-medium'
                : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
            }`}
          >
            Todas
          </button>
          {activeCategoryObj.subcategories.map((sub) => {
            const isSubSelected = selectedSubcategory === sub.id;
            const theme = getCategoryTheme(activeCategoryObj.color);

            return (
              <button
                key={sub.id}
                onClick={() =>
                  onSelectSubcategory(isSubSelected ? null : sub.id)
                }
                className={`px-3 py-1 rounded-full text-xs transition-all border cursor-pointer ${
                  isSubSelected
                    ? theme.activePill
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
