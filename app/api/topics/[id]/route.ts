import { db, initDb, getBreadcrumbs } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const { id } = await params;

    const topic = db.prepare('SELECT id, name, slug, parent_id, color, banner_image, created_at FROM topics WHERE id = ?').get(id) as any;

    if (!topic) {
      return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 });
    }

    const breadcrumbs = getBreadcrumbs(id);

    // Immediate children
    const children = db
      .prepare('SELECT id, name, slug, parent_id, color, banner_image, created_at FROM topics WHERE parent_id = ? ORDER BY name ASC')
      .all(id) as any[];

    // Count direct and descendant posts
    const descendantIds = db.prepare(`
      WITH RECURSIVE descendant_cte AS (
        SELECT id FROM topics WHERE id = ?
        UNION ALL
        SELECT t.id FROM topics t
        JOIN descendant_cte d ON t.parent_id = d.id
      )
      SELECT id FROM descendant_cte;
    `).all(id) as { id: string }[];

    const ids = descendantIds.map((d) => d.id);
    const placeholders = ids.map(() => '?').join(',');
    
    const countResult = db
      .prepare(`SELECT COUNT(*) as count FROM posts WHERE topic_id IN (${placeholders})`)
      .get(...ids) as { count: number };

    return NextResponse.json({
      topic: {
        ...topic,
        post_count: countResult.count,
        children,
        breadcrumbs,
      },
    });
  } catch (error) {
    console.error('Error fetching topic detail:', error);
    return NextResponse.json({ error: 'Erro ao carregar tópico' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const { id } = await params;
    const body = await req.json();

    const { name, color, banner_image } = body;

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

    const stmt = db.prepare('UPDATE topics SET name = ?, slug = ?, color = ?, banner_image = ? WHERE id = ?');
    const result = stmt.run(name.trim(), slug, color || 'sky', banner_image || null, id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json({ error: 'Erro ao atualizar tópico' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const { id } = await params;

    const result = db.prepare('DELETE FROM topics WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json({ error: 'Erro ao excluir tópico' }, { status: 500 });
  }
}
