'use client';

import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Image as ImageIcon,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';
import { useRef } from 'react';

interface ToolbarProps {
  editor: Editor | null;
  onImageUpload: (file: File) => void;
}

export default function Toolbar({ editor, onImageUpload }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const btnClass = (active: boolean) =>
    `p-1.5 rounded transition-colors ${
      active
        ? 'bg-stone-200 text-stone-900 font-semibold'
        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 bg-stone-50/80 p-2 text-sm">
      {/* Histórico */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={btnClass(false)}
        title="Desfazer (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={btnClass(false)}
        title="Refazer (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-5 bg-stone-300 mx-1" />

      {/* Títulos */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive('heading', { level: 1 }))}
        title="Título Principal (H1)"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
        title="Subtítulo (H2)"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive('heading', { level: 3 }))}
        title="Seção (H3)"
      >
        <Heading3 className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-5 bg-stone-300 mx-1" />

      {/* Formatação Básica */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="Negrito (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="Itálico (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))}
        title="Sublinhado (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-5 bg-stone-300 mx-1" />

      {/* Alinhamentos */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={btnClass(editor.isActive({ textAlign: 'left' }))}
        title="Alinhar à Esquerda"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={btnClass(editor.isActive({ textAlign: 'center' }))}
        title="Centralizar"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={btnClass(editor.isActive({ textAlign: 'right' }))}
        title="Alinhar à Direita"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={btnClass(editor.isActive({ textAlign: 'justify' }))}
        title="Justificado"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-5 bg-stone-300 mx-1" />

      {/* Listas e Citação */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
        title="Lista com Marcadores"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
        title="Lista Numerada"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive('blockquote'))}
        title="Citação / Destaque"
      >
        <Quote className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-5 bg-stone-300 mx-1" />

      {/* Inserir Imagem */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={btnClass(false)}
        title="Inserir Imagem no Texto"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
