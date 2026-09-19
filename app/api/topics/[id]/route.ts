import { db, initDb, getBreadcrumbs } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Supabase Query if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: topic, error: topicErr } = await supabase
          .from('topics')
          .select('*')
          .eq('id', id)
          .single();

        if (!topicErr && topic) {
          // Fetch immediate children
          const { data: children } = await supabase
            .from('topics')
            .select('*')
            .eq('parent_id', id)
            .order('name', { ascending: true });

          // Fetch all descendant IDs to count posts
          const { data: allTopics } = await supabase.from('topics').select('id, parent_id');
          const descendantIds = new Set<string>([id]);
          let added = true;
          while (added) {
            added = false;
            if (allTopics) {
              allTopics.forEach((t: any) => {
                if (t.parent_id && descendantIds.has(t.parent_id) && !descendantIds.has(t.id)) {
                  descendantIds.add(t.id);
                  added = true;
                }
              });
            }
          }

          const descArray = Array.from(descendantIds);
          const { count } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .in('topic_id', descArray);

          // Build breadcrumbs
          const breadcrumbs: any[] = [];
          let currentId: string | null = id;
          const topicMap = new Map<string, any>();
          if (allTopics) {
            const { data: fullTopics } = await supabase.from('topics').select('id, name, slug, parent_id, color, banner_image');
            if (fullTopics) {
              fullTopics.forEach((t: any) => topicMap.set(t.id, t));
            }
          }

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

          return NextResponse.json({
            topic: {
              ...topic,
              post_count: count || 0,
              children: children || [],
              breadcrumbs,
            },
          });
        }
      } catch (sbErr) {
        console.warn('Supabase topic detail error, falling back to SQLite:', sbErr);
      }
    }

    // 2. Fallback SQLite
    try {
      initDb();
      const topic = db.prepare('SELECT id, name, slug, parent_id, color, banner_image, created_at FROM topics WHERE id = ?').get(id) as any;

      if (!topic) {
        return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 });
      }

      const breadcrumbs = getBreadcrumbs(id);
      const children = db
        .prepare('SELECT id, name, slug, parent_id, color, banner_image, created_at FROM topics WHERE parent_id = ? ORDER BY name ASC')
        .all(id) as any[];

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
    } catch (dbErr) {
      console.warn('SQLite error:', dbErr);
      return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 });
    }
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
    const { id } = await params;
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

    // 1. Supabase update if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('topics')
          .update({
            name: name.trim(),
            slug,
            parent_id: parent_id !== undefined ? (parent_id || null) : undefined,
            color: color || 'sky',
            banner_image: banner_image !== undefined ? (banner_image || null) : undefined,
          })
          .eq('id', id);

        if (!error) {
          return NextResponse.json({ success: true });
        }
        console.warn('Supabase topic update failed:', error);
      } catch (sbErr) {
        console.warn('Supabase update exception:', sbErr);
      }
    }

    // 2. Fallback SQLite
    try {
      initDb();
      const stmt = db.prepare('UPDATE topics SET name = ?, slug = ?, parent_id = ?, color = ?, banner_image = ? WHERE id = ?');
      const result = stmt.run(name.trim(), slug, parent_id || null, color || 'sky', banner_image || null, id);

      if (result.changes === 0) {
        return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    } catch (dbErr) {
      console.warn('SQLite topic update error:', dbErr);
      return NextResponse.json({ success: true });
    }
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
    const { id } = await params;

    // 1. Supabase delete if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('topics').delete().eq('id', id);
        if (!error) {
          return NextResponse.json({ success: true });
        }
      } catch (sbErr) {
        console.warn('Supabase topic delete exception:', sbErr);
      }
    }

    // 2. Fallback SQLite
    try {
      initDb();
      const result = db.prepare('DELETE FROM topics WHERE id = ?').run(id);

      if (result.changes === 0) {
        return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    } catch (dbErr) {
      console.warn('SQLite topic delete error:', dbErr);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json({ error: 'Erro ao excluir tópico' }, { status: 500 });
  }
}
