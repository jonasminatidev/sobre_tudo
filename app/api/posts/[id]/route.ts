import { db, initDb, getBreadcrumbs } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Supabase query if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: post, error: postErr } = await supabase
          .from('posts')
          .select(`
            id, title, subtitle, topic_id, content_html, cover_image, created_at, updated_at,
            topics ( name, slug, color )
          `)
          .eq('id', id)
          .single();

        if (!postErr && post) {
          // Fetch breadcrumbs for topic_id
          const { data: fullTopics } = await supabase
            .from('topics')
            .select('id, name, slug, parent_id, color, banner_image');

          const topicMap = new Map<string, any>();
          if (fullTopics) {
            fullTopics.forEach((t: any) => topicMap.set(t.id, t));
          }

          const breadcrumbs: any[] = [];
          let currentId: string | null = post.topic_id;
          while (currentId && topicMap.has(currentId)) {
            const curr = topicMap.get(currentId);
            breadcrumbs.unshift({
              id: curr.id,
              name: curr.name,
              slug: curr.slug,
              parent_id: curr.parent_id,
              color: curr.color,
              banner_image: curr.banner_image,
            });
            currentId = curr.parent_id;
          }

          const topicData = Array.isArray((post as any).topics)
            ? (post as any).topics[0]
            : (post as any).topics;

          const formattedPost = {
            ...post,
            topic_name: topicData?.name,
            topic_slug: topicData?.slug,
            topic_color: topicData?.color,
            breadcrumbs,
          };

          return NextResponse.json({ post: formattedPost });
        }
      } catch (sbErr) {
        console.warn('Supabase post by ID fetch failed, falling back to SQLite:', sbErr);
      }
    }

    // 2. Fallback SQLite
    try {
      initDb();
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
    } catch (dbErr) {
      console.warn('SQLite post by ID query error:', dbErr);
      return NextResponse.json({ error: 'Anotação não encontrada' }, { status: 404 });
    }
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

    // 1. Supabase update if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('posts')
          .update({
            title: title.trim(),
            subtitle: subtitle ? subtitle.trim() : null,
            topic_id,
            content_html,
            cover_image: cover_image || null,
            updated_at: now,
          })
          .eq('id', id);

        if (!error) {
          return NextResponse.json({ success: true, id });
        }
        console.warn('Supabase post update failed:', error);
      } catch (sbErr) {
        console.warn('Supabase post update exception:', sbErr);
      }
    }

    // 2. Fallback SQLite
    try {
      initDb();
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
    } catch (dbErr) {
      console.warn('SQLite post update error:', dbErr);
      return NextResponse.json({ success: true, id });
    }
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
    const { id } = await params;

    // 1. Supabase delete if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (!error) {
          return NextResponse.json({ success: true });
        }
      } catch (sbErr) {
        console.warn('Supabase post delete exception:', sbErr);
      }
    }

    // 2. Fallback SQLite
    try {
      initDb();
      const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id);

      if (result.changes === 0) {
        return NextResponse.json({ error: 'Anotação não encontrada' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    } catch (dbErr) {
      console.warn('SQLite post delete error:', dbErr);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Erro ao excluir anotação' }, { status: 500 });
  }
}
