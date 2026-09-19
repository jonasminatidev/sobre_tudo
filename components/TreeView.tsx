'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TopicNode } from '@/lib/db';
import { getCategoryTheme } from '@/lib/category-theme';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Layers,
  Sparkles,
} from 'lucide-react';

interface TreeViewProps {
  tree: TopicNode[];
  activeTopicId: string | null;
  onSelectTopic: (topicId: string | null) => void;
  onOpenNewTopicModal: (parentId?: string | null) => void;
}

interface TreeNodeItemProps {
  node: TopicNode;
  activeTopicId: string | null;
  onSelectTopic: (topicId: string | null) => void;
  onOpenNewTopicModal: (parentId?: string | null) => void;
  depth?: number;
}

function TreeNodeItem({
  node,
  activeTopicId,
  onSelectTopic,
  onOpenNewTopicModal,
  depth = 0,
}: TreeNodeItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isActive = activeTopicId === node.id;
  const theme = getCategoryTheme(node.color);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="space-y-0.5 select-none">
      <div
        onClick={() => onSelectTopic(node.id)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`group flex items-center justify-between pr-2 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
          isActive
            ? 'bg-stone-900 text-white font-medium shadow-2xs'
            : 'text-stone-700 hover:bg-stone-100/80 hover:text-stone-900'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Seta para expandir/recolher */}
          {hasChildren ? (
            <button
              onClick={toggleOpen}
              className={`p-0.5 rounded hover:bg-stone-200/50 transition-colors cursor-pointer ${
                isActive ? 'text-stone-300 hover:text-white' : 'text-stone-400'
              }`}
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 h-3.5 inline-block" />
          )}

          {/* Ícone de pasta */}
          {isOpen && hasChildren ? (
            <FolderOpen
              className={`w-4 h-4 shrink-0 ${
                isActive ? 'text-amber-300' : 'text-stone-400 group-hover:text-stone-600'
              }`}
            />
          ) : (
            <Folder
              className={`w-4 h-4 shrink-0 ${
                isActive ? 'text-amber-300' : 'text-stone-400 group-hover:text-stone-600'
              }`}
            />
          )}

          {/* Nome do nó */}
          <span className="truncate">{node.name}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {/* Botão para criar filho rápido */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenNewTopicModal(node.id);
            }}
            title={`Adicionar subtópico em ${node.name}`}
            className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ${
              isActive
                ? 'hover:bg-stone-800 text-stone-300'
                : 'hover:bg-stone-200 text-stone-500'
            }`}
          >
            <Plus className="w-3 h-3" />
          </button>

          {/* Contador de posts */}
          {typeof node.total_post_count === 'number' && node.total_post_count > 0 && (
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                isActive
                  ? 'bg-stone-800 text-stone-300'
                  : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200'
              }`}
            >
              {node.total_post_count}
            </span>
          )}
        </div>
      </div>

      {/* Nós Filhos Recursivos */}
      {hasChildren && isOpen && (
        <div className="space-y-0.5 relative before:absolute before:left-[15px] before:top-0 before:bottom-2 before:w-[1px] before:bg-stone-200/60">
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              activeTopicId={activeTopicId}
              onSelectTopic={onSelectTopic}
              onOpenNewTopicModal={onOpenNewTopicModal}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeView({
  tree,
  activeTopicId,
  onSelectTopic,
  onOpenNewTopicModal,
}: TreeViewProps) {
  return (
    <aside className="w-full bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col space-y-3">
      {/* Cabeçalho da Árvore */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Árvore de Conhecimento
          </span>
        </div>
        <button
          onClick={() => onOpenNewTopicModal(null)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
          title="Criar novo tópico raiz"
        >
          <Plus className="w-3 h-3" />
          <span>Novo Tópico</span>
        </button>
      </div>

      {/* Item Raiz "Todos os Tópicos" */}
      <button
        onClick={() => onSelectTopic(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          activeTopicId === null
            ? 'bg-stone-900 text-white shadow-2xs'
            : 'text-stone-700 hover:bg-stone-100'
        }`}
      >
        <Layers className="w-4 h-4" />
        <span>Todos os Tópicos (Raiz)</span>
      </button>

      {/* Lista da Árvore Recursiva */}
      <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-1 scrollbar-none">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.id}
            node={node}
            activeTopicId={activeTopicId}
            onSelectTopic={onSelectTopic}
            onOpenNewTopicModal={onOpenNewTopicModal}
            depth={0}
          />
        ))}
      </div>
    </aside>
  );
}
