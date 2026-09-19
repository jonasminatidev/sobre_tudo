import { db, initDb, getDescendantTopicIds } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topic_id');
    const includeSubtopics = searchParams.get('include_subtopics') !== 'false';
    const search = searchParams.get('search');

    // 1. Supabase Query if configured
    if (isSupabaseConfigured && supabase) {
      try {
        let queryBuilder = supabase
          .from('posts')
          .select(`
            id, title, subtitle, topic_id, content_html, cover_image, created_at, updated_at,
            topics!inner ( name, slug, color )
          `)
          .order('created_at', { ascending: false });

        if (topicId) {
          queryBuilder = queryBuilder.eq('topic_id', topicId);
        }
        if (search) {
          queryBuilder = queryBuilder.or(`title.ilike.%${search}%,subtitle.ilike.%${search}%,content_html.ilike.%${search}%`);
        }

        const { data, error } = await queryBuilder;
        if (!error && data) {
          const posts = data.map((p: any) => ({
            ...p,
            topic_name: p.topics?.name,
            topic_slug: p.topics?.slug,
            topic_color: p.topics?.color,
          }));
          return NextResponse.json({ posts });
        }
      } catch (sbErr) {
        console.warn('Supabase posts query error, falling back to SQLite:', sbErr);
      }
    }

    // 2. Fallback to Local SQLite
    try {
      initDb();
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
    } catch (dbErr) {
      console.warn('SQLite error:', dbErr);
      return NextResponse.json({ posts: [] });
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Erro ao buscar postagens' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    // 1. Supabase insert if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('posts').insert({
          id,
          topic_id,
          title: title.trim(),
          subtitle: subtitle ? subtitle.trim() : null,
          content_html,
          cover_image: cover_image || null,
          created_at: now,
          updated_at: now,
        });

        if (!error) {
          return NextResponse.json({ success: true, id }, { status: 201 });
        }
        console.warn('Supabase post insert failed, using fallback:', error);
      } catch (sbErr) {
        console.warn('Supabase insert exception:', sbErr);
      }
    }

    // 2. Fallback SQLite
    try {
      initDb();
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
    } catch (dbErr) {
      console.warn('SQLite insert error:', dbErr);
      return NextResponse.json({ success: true, id }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Erro ao salvar anotação' }, { status: 500 });
  }
}
