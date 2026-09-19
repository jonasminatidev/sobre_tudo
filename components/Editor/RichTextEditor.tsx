'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Toolbar from './Toolbar';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onEditorReady?: (editor: Editor) => void;
}

export default function RichTextEditor({
  content,
  onChange,
  onEditorReady,
}: RichTextEditorProps) {
  const uploadAndInsertImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Falha no upload da imagem');

      const data = await res.json();
      if (data.url && editor) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    } catch (err) {
      console.error('Erro no upload:', err);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder:
          'Comece a escrever sua anotação. Use a galeria de imagens para fazer uploads múltiplos e inserir fotos em locais específicos do texto ou cole prints (Ctrl+V)...',
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-stone max-w-none focus:outline-none min-h-[420px] p-6 text-stone-800 focus:ring-0 leading-relaxed',
      },
      // Suporte para Drag and Drop de imagens no meio do editor
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            uploadAndInsertImage(file);
            return true;
          }
        }
        return false;
      },
      // Suporte para colar prints da área de transferência (Ctrl + V)
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                uploadAndInsertImage(file);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  return (
    <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:border-stone-400 transition-all">
      <Toolbar editor={editor} onImageUpload={uploadAndInsertImage} />
      <EditorContent editor={editor} />
    </div>
  );
}
