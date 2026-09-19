import { db, initDb, getTopicTree } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    initDb();
    const tree = getTopicTree();
    return NextResponse.json({ tree });
  } catch (error) {
    console.error('Error fetching topic tree:', error);
    return NextResponse.json({ error: 'Erro ao buscar árvore de tópicos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    initDb();
    const body = await req.json();

    const { name, parent_id, color, banner_image } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome do tópico é obrigatório' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const id = `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Inherit color from parent if not specified
    let topicColor = color || 'sky';
    if (!color && parent_id) {
      const parent = db.prepare('SELECT color FROM topics WHERE id = ?').get(parent_id) as { color: string } | undefined;
      if (parent) topicColor = parent.color;
    }

    db.prepare('INSERT INTO topics (id, name, slug, parent_id, color, banner_image) VALUES (?, ?, ?, ?, ?, ?)').run(
      id,
      name.trim(),
      slug,
      parent_id || null,
      topicColor,
      banner_image || null
    );

    return NextResponse.json(
      {
        success: true,
        topic: { id, name: name.trim(), slug, parent_id: parent_id || null, color: topicColor, banner_image: banner_image || null },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json({ error: 'Erro ao criar tópico' }, { status: 500 });
  }
}
