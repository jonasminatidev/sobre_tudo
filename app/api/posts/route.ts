import { db, initDb, getDescendantTopicIds } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    initDb();

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topic_id');
    const includeSubtopics = searchParams.get('include_subtopics') !== 'false'; // default true
    const search = searchParams.get('search');

    let query = `
      SELECT 
        p.id, p.title, p.subtitle, p.topic_id, p.content_html, p.cover_image, p.created_at, p.updated_at,
        t.name as topic_name, t.slug as topic_slug, t.color as topic_color
      FROM posts p
      JOIN topics t ON p.topic_id = t.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (topicId) {
      if (includeSubtopics) {
        const descendantIds = getDescendantTopicIds(topicId);
        if (descendantIds.length > 0) {
          const placeholders = descendantIds.map(() => '?').join(',');
          query += ` AND p.topic_id IN (${placeholders})`;
          params.push(...descendantIds);
        } else {
          query += ` AND p.topic_id = ?`;
          params.push(topicId);
        }
      } else {
        query += ` AND p.topic_id = ?`;
        params.push(topicId);
      }
    }

    if (search) {
      query += ` AND (p.title LIKE ? OR p.subtitle LIKE ? OR p.content_html LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY p.created_at DESC`;

    const posts = db.prepare(query).all(...params);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Erro ao buscar postagens' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    initDb();
    const body = await req.json();

    const { title, subtitle, topic_id, content_html, cover_image } = body;

    if (!title || !topic_id || !content_html) {
      return NextResponse.json(
        { error: 'Título, tópico e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    const id = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO posts (id, topic_id, title, subtitle, content_html, cover_image, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      topic_id,
      title.trim(),
      subtitle ? subtitle.trim() : null,
      content_html,
      cover_image || null,
      now,
      now
    );

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Erro ao salvar anotação' }, { status: 500 });
  }
}
