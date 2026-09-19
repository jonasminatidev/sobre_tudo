import { db, initDb, getBreadcrumbs } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const { id } = await params;

    const query = `
      SELECT 
        p.id, p.title, p.subtitle, p.topic_id, p.content_html, p.cover_image, p.created_at, p.updated_at,
        t.name as topic_name, t.slug as topic_slug, t.color as topic_color
      FROM posts p
      JOIN topics t ON p.topic_id = t.id
      WHERE p.id = ?
    `;

    const post = db.prepare(query).get(id) as any;

    if (!post) {
      return NextResponse.json({ error: 'Anotação não encontrada' }, { status: 404 });
    }

    const breadcrumbs = getBreadcrumbs(post.topic_id);

    return NextResponse.json({ post: { ...post, breadcrumbs } });
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    return NextResponse.json({ error: 'Erro ao carregar anotação' }, { status: 500 });
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

    const { title, subtitle, topic_id, content_html, cover_image } = body;

    if (!title || !topic_id || !content_html) {
      return NextResponse.json(
        { error: 'Título, tópico e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE posts 
      SET title = ?, subtitle = ?, topic_id = ?, content_html = ?, cover_image = ?, updated_at = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      title.trim(),
      subtitle ? subtitle.trim() : null,
      topic_id,
      content_html,
      cover_image || null,
      now,
      id
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Anotação não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Erro ao atualizar anotação' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const { id } = await params;

    const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Anotação não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Erro ao excluir anotação' }, { status: 500 });
  }
}
