import { db, initDb } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { NextResponse } from 'next/server';

function stripHtmlAndGetSnippet(html: string, query: string): string {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';

  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) {
    return text.length > 90 ? text.substring(0, 90) + '...' : text;
  }

  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + query.length + 50);
  const snippet = text.substring(start, end);

  return (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q) {
      return NextResponse.json({ topics: [], posts: [] });
    }

    let matchingTopics: any[] = [];
    let matchingPosts: any[] = [];

    // 1. Supabase search if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const [topicsRes, postsRes] = await Promise.all([
          supabase
            .from('topics')
            .select('id, name, slug, color, parent_id')
            .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('posts')
            .select(`
              id, title, subtitle, topic_id, content_html, created_at,
              topics ( name, color )
            `)
            .or(`title.ilike.%${q}%,subtitle.ilike.%${q}%,content_html.ilike.%${q}%`)
            .order('created_at', { ascending: false })
            .limit(8),
        ]);

        if (!topicsRes.error && topicsRes.data) {
          matchingTopics = topicsRes.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            color: t.color || 'sky',
          }));
        }

        if (!postsRes.error && postsRes.data) {
          matchingPosts = postsRes.data.map((p: any) => ({
            id: p.id,
            title: p.title,
            subtitle: p.subtitle,
            topic_name: p.topics?.name || 'Tópico',
            topic_color: p.topics?.color || 'sky',
            snippet: stripHtmlAndGetSnippet(p.content_html, q),
          }));
        }

        if (matchingTopics.length > 0 || matchingPosts.length > 0) {
          return NextResponse.json({ topics: matchingTopics, posts: matchingPosts });
        }
      } catch (sbErr) {
        console.warn('Supabase search failed, trying SQLite fallback:', sbErr);
      }
    }

    // 2. Fallback to Local SQLite
    try {
      initDb();
      const searchPattern = `%${q.toLowerCase()}%`;

      // Search Topics
      const topicRows = db
        .prepare(`
          SELECT id, name, slug, color 
          FROM topics 
          WHERE LOWER(name) LIKE ? OR LOWER(slug) LIKE ?
          LIMIT 5
        `)
        .all(searchPattern, searchPattern) as any[];

      matchingTopics = topicRows.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color || 'sky',
      }));

      // Search Posts
      const postRows = db
        .prepare(`
          SELECT 
            p.id, p.title, p.subtitle, p.content_html,
            t.name as topic_name, t.color as topic_color
          FROM posts p
          JOIN topics t ON p.topic_id = t.id
          WHERE LOWER(p.title) LIKE ? OR LOWER(p.subtitle) LIKE ? OR LOWER(p.content_html) LIKE ?
          ORDER BY p.created_at DESC
          LIMIT 8
        `)
        .all(searchPattern, searchPattern, searchPattern) as any[];

      matchingPosts = postRows.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        topic_name: p.topic_name || 'Tópico',
        topic_color: p.topic_color || 'sky',
        snippet: stripHtmlAndGetSnippet(p.content_html, q),
      }));

      return NextResponse.json({ topics: matchingTopics, posts: matchingPosts });
    } catch (dbErr) {
      console.warn('SQLite search error:', dbErr);
      return NextResponse.json({ topics: [], posts: [] });
    }
  } catch (error) {
    console.error('Error during search:', error);
    return NextResponse.json({ error: 'Erro ao realizar busca' }, { status: 500 });
  }
}
