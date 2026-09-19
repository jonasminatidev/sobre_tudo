'use client';

import { useState, useEffect } from 'react';
import { X, FolderPlus, Edit3 } from 'lucide-react';
import { TopicNode } from '@/lib/db';
import { TOPIC_COLOR_OPTIONS } from '@/lib/category-theme';
import ImageUploader from './ImageUploader';

export interface TopicDataToEdit {
  id: string;
  name: string;
  color: string;
  banner_image?: string | null;
  parent_id?: string | null;
}

interface NewTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultParentId?: string | null;
  topicToEdit?: TopicDataToEdit | null;
  tree: TopicNode[];
  onTopicSaved: (savedTopicId: string) => void;
}

export default function NewTopicModal({
  isOpen,
  onClose,
  defaultParentId = null,
  topicToEdit = null,
  tree,
  onTopicSaved,
}: NewTopicModalProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [color, setColor] = useState('blue');
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (topicToEdit) {
      setName(topicToEdit.name || '');
      setParentId(topicToEdit.parent_id || null);
      setColor(topicToEdit.color || 'blue');
      setBannerImage(topicToEdit.banner_image || null);
    } else {
      setName('');
      setParentId(defaultParentId);
      setColor('blue');
      setBannerImage(null);
    }
  }, [topicToEdit, defaultParentId, isOpen]);

  if (!isOpen) return null;

  // Flatten tree for parent selection dropdown
  const flattenTopics = (nodes: TopicNode[], depth = 0): { id: string; name: string; depth: number }[] => {
    let result: { id: string; name: string; depth: number }[] = [];
    nodes.forEach((n) => {
      // Don't allow setting self as parent when editing
      if (!topicToEdit || n.id !== topicToEdit.id) {
        result.push({ id: n.id, name: n.name, depth });
        if (n.children && n.children.length > 0) {
          result = result.concat(flattenTopics(n.children, depth + 1));
        }
      }
    });
    return result;
  };

  const flatTopics = flattenTopics(tree);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const isEditMode = !!topicToEdit;
      const url = isEditMode ? `/api/topics/${topicToEdit.id}` : '/api/topics';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          parent_id: parentId || null,
          color,
          banner_image: bannerImage,
        }),
      });

      if (res.ok) {
        const data = isEditMode ? { topic: { id: topicToEdit.id } } : await res.json();
        setName('');
        onTopicSaved(isEditMode ? topicToEdit.id : data.topic.id);
        onClose();
      } else {
        alert('Erro ao salvar tópico.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar tópico.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-none">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-stone-100 rounded-xl text-stone-800">
              {topicToEdit ? <Edit3 className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <h3 className="text-base font-bold text-stone-900">
              {topicToEdit ? 'Editar Tópico' : 'Novo Tópico de Conhecimento'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Nome do Tópico *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Biologia & Natureza, Carros & Motores, etc."
              className="w-full bg-stone-50 text-stone-900 text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-stone-200 focus:bg-white focus:border-stone-400 outline-none"
              autoFocus
              required
            />
          </div>

          {/* Tópico Pai */}
          {!topicToEdit && (
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Tópico Pai (Localização na Árvore)
              </label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full bg-stone-50 text-stone-800 text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:bg-white focus:border-stone-400 outline-none cursor-pointer"
              >
                <option value="">Nenhum (Tópico Raiz - Nível 1)</option>
                {flatTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {'\u00A0'.repeat(t.depth * 3)} {t.depth > 0 ? '└ ' : ''}{t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tema de Cor Expandido */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-2">
              Cor do Tópico (Identidade Visual)
            </label>
            <div className="grid grid-cols-6 gap-2">
              {TOPIC_COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`w-9 h-9 rounded-xl ${c.bg} transition-all flex items-center justify-center cursor-pointer ${
                    color === c.id
                      ? `ring-3 ${c.ring} ring-offset-2 scale-110 shadow-md`
                      : 'opacity-75 hover:opacity-100 hover:scale-105'
                  }`}
                  title={c.label}
                >
                  {color === c.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Imagem de Capa do Tópico */}
          <div className="pt-2 border-t border-stone-100">
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Imagem de Fundo / Capa do Tópico (Banner)
            </label>
            <p className="text-[11px] text-stone-500 mb-2">
              Sua imagem será exibida como cabeçalho de destaque ao abrir este tópico.
            </p>
            <ImageUploader value={bannerImage} onChange={setBannerImage} />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Salvando...' : topicToEdit ? 'Salvar Alterações' : 'Criar Tópico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
