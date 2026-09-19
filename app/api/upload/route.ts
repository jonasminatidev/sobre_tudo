import { NextResponse } from 'next/server';
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

    // Basic format validation
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Apenas arquivos de imagem são permitidos.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save physically to public/uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Sanitize file name
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '-');
    const uniqueFileName = `${Date.now()}-${sanitizedName}`;
    const destinationPath = path.join(uploadDir, uniqueFileName);

    await writeFile(destinationPath, buffer);

    return NextResponse.json(
      { url: `/uploads/${uniqueFileName}` },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro na gravação do arquivo local:', error);
    return NextResponse.json(
      { error: 'Erro interno ao salvar o upload local.' },
      { status: 500 }
    );
  }
}
