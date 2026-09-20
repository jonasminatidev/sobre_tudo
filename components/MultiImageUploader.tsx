'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Check,
  Plus,
  ArrowDownToLine,
  Sparkles,
  Star,
  Copy,
} from 'lucide-react';
import { compressImage } from '@/lib/imageCompressor';

export interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

interface MultiImageUploaderProps {
  images: UploadedImage[];
  coverImage: string | null;
  onImagesChange: (images: UploadedImage[]) => void;
  onCoverImageChange: (url: string | null) => void;
  onInsertImageToEditor: (url: string) => void;
  onReplaceImageTokens?: () => void;
}

export default function MultiImageUploader({
  images,
  coverImage,
  onImagesChange,
  onCoverImageChange,
  onInsertImageToEditor,
  onReplaceImageTokens,
}: MultiImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    setIsUploading(true);

    const uploadedList: UploadedImage[] = [];

    for (const file of validFiles) {
      try {
        const compressedFile = await compressImage(file);
        const formData = new FormData();
        formData.append('file', compressedFile);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            uploadedList.push({
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              url: data.url,
              name: file.name,
            });
          }
        }
      } catch (err) {
        console.error('Erro ao enviar imagem:', err);
      }
    }

    if (uploadedList.length > 0) {
      const newImages = [...images, ...uploadedList];
      onImagesChange(newImages);
    }

    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (id: string, url: string) => {
    const filtered = images.filter((img) => img.id !== id);
    onImagesChange(filtered);
    if (coverImage === url) {
      onCoverImageChange(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
        <div>
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-stone-700" />
            <span>Galeria de Imagens da Anotação</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Faça upload de várias imagens. Escolha a imagem de capa (opcional) e insira imagens em locais específicos do texto usando os botões ou as marcadores <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700 font-mono">@img1</code>, <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700 font-mono">@img2</code>.
          </p>
        </div>

        {onReplaceImageTokens && images.length > 0 && (
          <button
            type="button"
            onClick={onReplaceImageTokens}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors shrink-0 cursor-pointer shadow-2xs"
            title="Substituir automaticamente tags @img1, @img2 digitadas no texto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Converter @img1, @img2 no texto</span>
          </button>
        )}
      </div>

      {/* Área de Drop e Seleção Múltipla */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-stone-600 bg-stone-100/90'
            : 'border-stone-300 hover:border-stone-400 bg-stone-50/60 hover:bg-stone-50'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 bg-white rounded-full border border-stone-200 shadow-2xs">
            <Upload className="w-5 h-5 text-stone-600" />
          </div>
          <div className="text-xs text-stone-700">
            <span className="font-bold text-stone-900">Clique para selecionar várias imagens</span> ou arraste os arquivos até aqui
          </div>
          <p className="text-[11px] text-stone-400 font-mono">
            {isUploading ? 'Enviando e compactando arquivos...' : 'Selecione várias fotos (PNG, JPG, WEBP, GIF)'}
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUploadFiles(e.target.files);
          }
        }}
      />

      {/* Lista de Imagens Anexadas */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
            Imagens Carregadas ({images.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {images.map((img, idx) => {
              const isCover = coverImage === img.url;
              const tag = `@img${idx + 1}`;

              return (
                <div
                  key={img.id}
                  className={`relative rounded-xl border overflow-hidden p-2.5 bg-white transition-all flex items-center gap-3 ${
                    isCover
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-100">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                    {isCover && (
                      <div
                        className="absolute top-1 left-1 bg-amber-500 text-white p-0.5 rounded-full shadow-xs"
                        title="Imagem de Capa Atual"
                      >
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      </div>
                    )}
                  </div>

                  {/* Informações e Ações */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-stone-900 truncate">
                        Imagem {idx + 1}
                      </span>
                      <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-bold">
                        {tag}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Botão: Inserir no Texto */}
                      <button
                        type="button"
                        onClick={() => onInsertImageToEditor(img.url)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-900 text-white text-[11px] font-semibold hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
                        title="Inserir esta imagem na posição atual do cursor no editor"
                      >
                        <ArrowDownToLine className="w-3 h-3" />
                        <span>Inserir no texto</span>
                      </button>

                      {/* Botão: Marcar / Desmarcar Capa */}
                      {!isCover ? (
                        <button
                          type="button"
                          onClick={() => onCoverImageChange(img.url)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 text-stone-700 text-[11px] font-medium hover:bg-stone-200 transition-colors cursor-pointer border border-stone-200"
                          title="Definir como imagem de capa do card"
                        >
                          <Star className="w-3 h-3 text-amber-500" />
                          <span>Definir Capa</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onCoverImageChange(null)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500 text-white text-[11px] font-semibold hover:bg-amber-600 active:scale-[0.97] transition-all cursor-pointer shadow-2xs"
                          title="Clique para desmarcar esta imagem como capa"
                        >
                          <Star className="w-3 h-3 fill-white text-white" />
                          <span>Capa Atual (Desmarcar)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Botão Excluir */}
                  <button
                    type="button"
                    onClick={() => removeImage(img.id, img.url)}
                    className="text-stone-400 hover:text-rose-600 p-1 rounded-md transition-colors shrink-0"
                    title="Remover da galeria"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
