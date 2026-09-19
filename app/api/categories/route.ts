import { db, initDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    initDb();

    // Fetch all categories
    const categories = db
      .prepare('SELECT id, name, slug, color, created_at FROM categories ORDER BY created_at ASC')
      .all() as any[];

    // Fetch subcategories for each category
    const subcategories = db
      .prepare('SELECT id, category_id, name, slug, created_at FROM subcategories ORDER BY name ASC')
      .all() as any[];

    // Post counts per category
    const postCounts = db
      .prepare('SELECT category_id, subcategory_id, COUNT(*) as count FROM posts GROUP BY category_id, subcategory_id')
      .all() as any[];

    const result = categories.map((cat) => {
      const subs = subcategories
        .filter((sub) => sub.category_id === cat.id)
        .map((sub) => {
          const subCount = postCounts
            .filter((p) => p.category_id === cat.id && p.subcategory_id === sub.id)
            .reduce((acc, p) => acc + p.count, 0);
          return { ...sub, post_count: subCount };
        });

      const catTotalPosts = postCounts
        .filter((p) => p.category_id === cat.id)
        .reduce((acc, p) => acc + p.count, 0);

      return {
        ...cat,
        post_count: catTotalPosts,
        subcategories: subs,
      };
    });

    return NextResponse.json({ categories: result });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    initDb();
    const body = await req.json();

    const { type, name, category_id, color } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (type === 'subcategory') {
      if (!category_id) {
        return NextResponse.json({ error: 'category_id é obrigatório para subcategoria' }, { status: 400 });
      }
      const id = `sub-${Date.now()}`;
      db.prepare('INSERT INTO subcategories (id, category_id, name, slug) VALUES (?, ?, ?, ?)').run(
        id,
        category_id,
        name,
        slug
      );
      return NextResponse.json({ success: true, subcategory: { id, category_id, name, slug } }, { status: 201 });
    } else {
      const id = `cat-${Date.now()}`;
      db.prepare('INSERT INTO categories (id, name, slug, color) VALUES (?, ?, ?, ?)').run(
        id,
        name,
        slug,
        color || 'sky'
      );
      return NextResponse.json({ success: true, category: { id, name, slug, color: color || 'sky' } }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating category/subcategory:', error);
    return NextResponse.json({ error: 'Erro ao criar categoria/subcategoria' }, { status: 500 });
  }
}
