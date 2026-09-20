'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Check } from 'lucide-react';
import { compressImage } from '@/lib/imageCompressor';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    setIsUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Falha ao enviar imagem');

      const data = await res.json();
      if (data.url) {
        onChange(data.url);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao realizar upload da imagem de capa.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-700">
        Imagem de Capa (Opcional)
      </label>

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 group">
          <img
            src={value}
            alt="Capa do post"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-stone-900 text-xs font-medium rounded-lg shadow-sm hover:bg-stone-100 transition-colors"
            >
              Trocar imagem
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg shadow-sm hover:bg-rose-700 transition-colors"
              title="Remover capa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-stone-500 bg-stone-100/80'
              : 'border-stone-300 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-3 bg-white rounded-full border border-stone-200 shadow-2xs">
              <Upload className="w-5 h-5 text-stone-500" />
            </div>
            <div className="text-xs text-stone-600">
              <span className="font-semibold text-stone-900">Clique para enviar</span> ou arraste a imagem de capa até aqui
            </div>
            <p className="text-[11px] text-stone-400 font-mono">PNG, JPG, WEBP ou GIF</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
