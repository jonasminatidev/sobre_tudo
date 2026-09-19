import path from 'path';

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

export interface UserRecord {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

// Lazy global database instance to prevent top-level crashes in Serverless/Vercel environments
let dbInstance: any = null;

export function getDb(): any | null {
  if (dbInstance) return dbInstance;
  try {
    // Dynamically require better-sqlite3 so top-level imports don't crash in Serverless lambdas
    const Database = require('better-sqlite3');
    const dbPath = path.join(process.cwd(), 'database.sqlite');
    dbInstance = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });
    dbInstance.pragma('foreign_keys = ON');
    return dbInstance;
  } catch (err) {
    console.warn('SQLite (better-sqlite3) is unavailable in this environment (likely Vercel serverless):', err);
    return null;
  }
}

// Export a lazy proxy for `db` so legacy calls (db.prepare, etc.) work safely without top-level crashes
export const db: any = new Proxy({}, {
  get(_target, prop) {
    const instance = getDb();
    if (!instance) {
      throw new Error(`SQLite is not available in this environment (prop: ${String(prop)})`);
    }
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

// Initialize database schema safely
export function initDb() {
  const sqlite = getDb();
  if (!sqlite) return;

  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

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

    // Seed root user if missing
    const rootUser = sqlite.prepare('SELECT id FROM users WHERE username = ?').get('jonasdev');
    if (!rootUser) {
      sqlite.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(
        'usr-root-01',
        'jonasdev',
        'd5f4e3e94b8f3d8d8450ad8bf4cbedd3ed49b9e90aa0378eae46886b32064400'
      );
    }
  } catch (err) {
    console.warn('SQLite initDb error:', err);
  }
}

export function getUserByUsername(username: string): UserRecord | undefined {
  const sqlite = getDb();
  if (!sqlite) return undefined;
  try {
    initDb();
    return sqlite.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRecord | undefined;
  } catch {
    return undefined;
  }
}

// Helper: Get Breadcrumb trail from any topic up to the root
export function getBreadcrumbs(topicId: string): BreadcrumbItem[] {
  const sqlite = getDb();
  if (!sqlite) return [];
  try {
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
    return sqlite.prepare(query).all(topicId) as BreadcrumbItem[];
  } catch {
    return [];
  }
}

// Helper: Get all descendant topic IDs (including self)
export function getDescendantTopicIds(topicId: string): string[] {
  const sqlite = getDb();
  if (!sqlite) return [topicId];
  try {
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
    const rows = sqlite.prepare(query).all(topicId) as { id: string }[];
    return rows.map((r) => r.id);
  } catch {
    return [topicId];
  }
}

// Helper: Get full topic tree structure with post counts
export function getTopicTree(): TopicNode[] {
  const sqlite = getDb();
  if (!sqlite) return [];
  try {
    initDb();
    
    const allTopics = sqlite
      .prepare('SELECT id, name, slug, parent_id, color, banner_image, created_at FROM topics ORDER BY name ASC')
      .all() as TopicNode[];

    const postCounts = sqlite
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
  } catch {
    return [];
  }
}
