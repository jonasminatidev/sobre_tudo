import { db, initDb, getTopicTree } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Supabase Query if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: topics, error: topicsErr } = await supabase
          .from('topics')
          .select('*')
          .order('name', { ascending: true });

        const { data: posts, error: postsErr } = await supabase
          .from('posts')
          .select('topic_id');

        if (!topicsErr && topics) {
          const countMap = new Map<string, number>();
          if (posts) {
            posts.forEach((p: any) => {
              countMap.set(p.topic_id, (countMap.get(p.topic_id) || 0) + 1);
            });
          }

          const topicMap = new Map<string, any>();
          topics.forEach((t: any) => {
            topicMap.set(t.id, {
              ...t,
              direct_post_count: countMap.get(t.id) || 0,
              total_post_count: countMap.get(t.id) || 0,
              children: [],
            });
          });

          // Cumulative descendant counts
          topicMap.forEach((node) => {
            let parentId = node.parent_id;
            while (parentId && topicMap.has(parentId)) {
              const parentNode = topicMap.get(parentId)!;
              parentNode.total_post_count += node.direct_post_count;
              parentId = parentNode.parent_id;
            }
          });

          // Build tree
          const tree: any[] = [];
          topicMap.forEach((node) => {
            if (node.parent_id && topicMap.has(node.parent_id)) {
              topicMap.get(node.parent_id)!.children.push(node);
            } else {
              tree.push(node);
            }
          });

          return NextResponse.json({ tree });
        }
      } catch (sbErr) {
        console.warn('Supabase topics fetch failed, falling back to SQLite:', sbErr);
      }
    }

    // 2. Fallback to SQLite
    try {
      initDb();
      const tree = getTopicTree();
      return NextResponse.json({ tree });
    } catch (dbErr) {
      console.warn('SQLite error:', dbErr);
      return NextResponse.json({ tree: [] });
    }
  } catch (error) {
    console.error('Error fetching topic tree:', error);
    return NextResponse.json({ error: 'Erro ao buscar árvore de tópicos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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
    let topicColor = color || 'sky';

    // 1. Supabase insert if configured
    if (isSupabaseConfigured && supabase) {
      try {
        if (!color && parent_id) {
          const { data: parent } = await supabase
            .from('topics')
            .select('color')
            .eq('id', parent_id)
            .single();
          if (parent?.color) topicColor = parent.color;
        }

        const { error } = await supabase.from('topics').insert({
          id,
          name: name.trim(),
          slug,
          parent_id: parent_id || null,
          color: topicColor,
          banner_image: banner_image || null,
        });

        if (!error) {
          return NextResponse.json(
            {
              success: true,
              topic: { id, name: name.trim(), slug, parent_id: parent_id || null, color: topicColor, banner_image: banner_image || null },
            },
            { status: 201 }
          );
        }
      } catch (sbErr) {
        console.warn('Supabase topic insert failed, using fallback:', sbErr);
      }
    }

    // 2. Fallback SQLite
    try {
      initDb();
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
    } catch (dbErr) {
      console.warn('SQLite insert error:', dbErr);
      return NextResponse.json(
        {
          success: true,
          topic: { id, name: name.trim(), slug, parent_id: parent_id || null, color: topicColor, banner_image: banner_image || null },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json({ error: 'Erro ao criar tópico' }, { status: 500 });
  }
}
