'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RichTextEditor from '@/components/Editor/RichTextEditor';
import MultiImageUploader, { UploadedImage } from '@/components/MultiImageUploader';
import { TopicNode } from '@/lib/db';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Editor } from '@tiptap/react';

function NewPostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTopicId = searchParams.get('topic_id');

  const [tree, setTree] = useState<TopicNode[]>([]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [topicId, setTopicId] = useState(defaultTopicId || '');
  const [contentHtml, setContentHtml] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Topic Tree
  useEffect(() => {
    async function loadTree() {
      try {
        const res = await fetch('/api/topics');
        if (res.ok) {
          const data = await res.json();
          const t = data.tree || [];
          setTree(t);

          if (!topicId && t.length > 0) {
            setTopicId(t[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar tópicos:', err);
      }
    }
    loadTree();
  }, [topicId]);

  // Flatten tree for topic selection
  const flattenTopics = (nodes: TopicNode[], depth = 0): { id: string; name: string; depth: number }[] => {
    let result: { id: string; name: string; depth: number }[] = [];
    nodes.forEach((n) => {
      result.push({ id: n.id, name: n.name, depth });
      if (n.children && n.children.length > 0) {
        result = result.concat(flattenTopics(n.children, depth + 1));
      }
    });
    return result;
  };

  const flatTopics = flattenTopics(tree);

  // Programmatically insert image at cursor in TipTap
  const handleInsertImageToEditor = (url: string) => {
    if (editorInstance) {
      editorInstance.chain().focus().setImage({ src: url }).run();
    }
  };

  // Convert @img1, @img2 tokens in text to actual <img> tags
  const handleReplaceImageTokens = () => {
    if (!contentHtml || uploadedImages.length === 0) return;
    let newHtml = contentHtml;
    let replacedCount = 0;

    uploadedImages.forEach((img, idx) => {
      const num = idx + 1;
      const regex1 = new RegExp(`@img${num}\\b`, 'gi');
      const regex2 = new RegExp(`@imagem${num}\\b`, 'gi');
      const imgHtml = `<img src="${img.url}" alt="${img.name || 'Imagem ' + num}" />`;

      if (regex1.test(newHtml) || regex2.test(newHtml)) {
        newHtml = newHtml.replace(regex1, imgHtml).replace(regex2, imgHtml);
        replacedCount++;
      }
    });

    if (replacedCount > 0) {
      setContentHtml(newHtml);
      if (editorInstance) {
        editorInstance.commands.setContent(newHtml);
      }
      alert(`${replacedCount} marcador(es) @img convertido(s) em imagem(ns) no texto!`);
    } else {
      alert('Nenhum marcador tipo @img1 ou @img2 foi encontrado no texto para substituição.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Por favor, informe o título da anotação.');
      return;
    }

    if (!topicId) {
      alert('Por favor, selecione um tópico.');
      return;
    }

    if (!contentHtml.trim() || contentHtml === '<p></p>') {
      alert('Por favor, escreva o conteúdo da anotação.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          topic_id: topicId,
          content_html: contentHtml,
          cover_image: coverImage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/post/${data.id}`);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Erro ao criar anotação.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao salvar a anotação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Botão de Voltar */}
      <div className="flex items-center justify-between">
        <Link
          href={topicId ? `/?topic_id=${topicId}` : '/'}
          className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao feed</span>
        </Link>
        <span className="text-xs font-mono text-stone-500">Nova Anotação</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Painel do Formulário Principal */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-1">
              Título da Anotação *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Sintaxe e Casos de Uso do Laço While"
              className="w-full bg-stone-50 text-stone-900 text-lg font-bold px-4 py-3 rounded-xl border border-stone-200 focus:bg-white focus:border-stone-400 outline-none transition-all placeholder:text-stone-400 placeholder:font-normal"
              required
            />
          </div>

          {/* Subtítulo */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              Subtítulo / Resumo Rápido (Opcional)
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ex: Análise de estruturas condicionais de repetição"
              className="w-full bg-stone-50 text-stone-800 text-sm px-4 py-2.5 rounded-xl border border-stone-200 focus:bg-white focus:border-stone-400 outline-none transition-all placeholder:text-stone-400"
            />
          </div>

          {/* Seleção de Tópico na Árvore */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Tópico de Destino (Árvore de Conhecimento) *
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full bg-stone-50 text-stone-800 text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:bg-white focus:border-stone-400 outline-none cursor-pointer font-medium"
              required
            >
              {flatTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {'\u00A0'.repeat(t.depth * 3)} {t.depth > 0 ? '└ ' : ''}{t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Galeria de Multi-Upload de Imagens */}
        <MultiImageUploader
          images={uploadedImages}
          coverImage={coverImage}
          onImagesChange={setUploadedImages}
          onCoverImageChange={setCoverImage}
          onInsertImageToEditor={handleInsertImageToEditor}
          onReplaceImageTokens={handleReplaceImageTokens}
        />

        {/* Editor TipTap */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-stone-900">
            Conteúdo da Anotação *
          </label>
          <RichTextEditor
            content={contentHtml}
            onChange={setContentHtml}
            onEditorReady={setEditorInstance}
          />
        </div>

        {/* Botão de Envio */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-100 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold shadow-xs hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Salvando...' : 'Salvar Anotação'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Carregando formulário...</div>}>
      <NewPostForm />
    </Suspense>
  );
}
