import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');

// Global singleton instance for Next.js dev server hot-reloading
const globalForDb = global as unknown as { db: Database.Database };

export const db =
  globalForDb.db ||
  new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

// Enable foreign keys
db.pragma('foreign_keys = ON');

export interface TopicNode {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  color: string;
  banner_image?: string | null;
  created_at: string;
  direct_post_count?: number;
  total_post_count?: number;
  children?: TopicNode[];
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  color: string;
  banner_image?: string | null;
}

// Initialize database schema
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      parent_id TEXT,
      color TEXT DEFAULT 'sky',
      banner_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      content_html TEXT NOT NULL,
      cover_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_id);
    CREATE INDEX IF NOT EXISTS idx_posts_topic ON posts(topic_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
  `);
}

// Helper: Get Breadcrumb trail from any topic up to the root
export function getBreadcrumbs(topicId: string): BreadcrumbItem[] {
  initDb();
  const query = `
    WITH RECURSIVE breadcrumb_cte AS (
      SELECT id, name, slug, parent_id, color, banner_image, 0 AS level
      FROM topics WHERE id = ?
      UNION ALL
      SELECT t.id, t.name, t.slug, t.parent_id, t.color, t.banner_image, b.level + 1
      FROM topics t
      JOIN breadcrumb_cte b ON t.id = b.parent_id
    )
    SELECT id, name, slug, parent_id, color, banner_image FROM breadcrumb_cte ORDER BY level DESC;
  `;
  return db.prepare(query).all(topicId) as BreadcrumbItem[];
}

// Helper: Get all descendant topic IDs (including self)
export function getDescendantTopicIds(topicId: string): string[] {
  initDb();
  const query = `
    WITH RECURSIVE descendant_cte AS (
      SELECT id FROM topics WHERE id = ?
      UNION ALL
      SELECT t.id FROM topics t
      JOIN descendant_cte d ON t.parent_id = d.id
    )
    SELECT id FROM descendant_cte;
  `;
  const rows = db.prepare(query).all(topicId) as { id: string }[];
  return rows.map((r) => r.id);
}

// Helper: Get full topic tree structure with post counts
export function getTopicTree(): TopicNode[] {
  initDb();
  
  const allTopics = db
    .prepare('SELECT id, name, slug, parent_id, color, banner_image, created_at FROM topics ORDER BY name ASC')
    .all() as TopicNode[];

  const postCounts = db
    .prepare('SELECT topic_id, COUNT(*) as count FROM posts GROUP BY topic_id')
    .all() as { topic_id: string; count: number }[];

  const countMap = new Map<string, number>();
  postCounts.forEach((pc) => countMap.set(pc.topic_id, pc.count));

  // Map to build hierarchy
  const topicMap = new Map<string, TopicNode>();
  allTopics.forEach((t) => {
    topicMap.set(t.id, {
      ...t,
      direct_post_count: countMap.get(t.id) || 0,
      total_post_count: countMap.get(t.id) || 0,
      children: [],
    });
  });

  // Calculate cumulative descendant post counts
  topicMap.forEach((node) => {
    let currentParentId = node.parent_id;
    while (currentParentId && topicMap.has(currentParentId)) {
      const parentNode = topicMap.get(currentParentId)!;
      parentNode.total_post_count = (parentNode.total_post_count || 0) + (node.direct_post_count || 0);
      currentParentId = parentNode.parent_id;
    }
  });

  // Build tree
  const rootNodes: TopicNode[] = [];
  topicMap.forEach((node) => {
    if (node.parent_id && topicMap.has(node.parent_id)) {
      topicMap.get(node.parent_id)!.children!.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

// Auto-run initDb on load
initDb();
