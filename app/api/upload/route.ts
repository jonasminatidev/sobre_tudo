import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado.' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Apenas arquivos de imagem são permitidos.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = file.name.split('.').pop() || 'png';
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '-');
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    // 1. Try uploading to Supabase Storage if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(uniqueFileName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('uploads')
            .getPublicUrl(uniqueFileName);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json(
              { url: publicUrlData.publicUrl },
              { status: 201 }
            );
          }
        } else {
          console.warn('Supabase storage upload error:', error);
        }
      } catch (sbErr) {
        console.warn('Supabase storage exception:', sbErr);
      }
    }

    // 2. Try saving locally to public/uploads (Local Development)
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      const destinationPath = path.join(uploadDir, uniqueFileName);
      await writeFile(destinationPath, buffer);

      return NextResponse.json(
        { url: `/uploads/${uniqueFileName}` },
        { status: 201 }
      );
    } catch (fsErr) {
      console.warn('Local disk write failed (expected on Serverless/Vercel):', fsErr);
    }

    // 3. Fallback: Convert image to Data URL so uploads NEVER fail on Vercel
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    return NextResponse.json({ url: dataUrl }, { status: 201 });
  } catch (error: any) {
    console.error('Error during image upload:', error);
    return NextResponse.json(
      { error: `Erro ao realizar upload: ${error?.message || 'Falha no processamento.'}` },
      { status: 500 }
    );
  }
}
