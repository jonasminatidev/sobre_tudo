const Database = require('./node_modules/better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

// Drop and recreate tables cleanly
db.exec(`
  DROP TABLE IF EXISTS posts;
  DROP TABLE IF EXISTS topics;

  CREATE TABLE topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    parent_id TEXT,
    color TEXT DEFAULT 'sky',
    banner_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES topics(id) ON DELETE CASCADE
  );

  CREATE TABLE posts (
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

  CREATE INDEX idx_topics_parent ON topics(parent_id);
  CREATE INDEX idx_posts_topic ON posts(topic_id);
  CREATE INDEX idx_posts_created ON posts(created_at DESC);
`);

console.log('Database tables cleared and reset.');

const insertTopic = db.prepare(
  'INSERT INTO topics (id, name, slug, parent_id, color, banner_image) VALUES (?, ?, ?, ?, ?, ?)'
);

// Main Top-Level Categories Only
const mainCategories = [
  { id: 'top-eng-comp', name: 'Engenharia da Computação', slug: 'engenharia-da-computacao', color: 'amber' },
  { id: 'top-meteorologia', name: 'Meteorologia & Clima', slug: 'meteorologia-clima', color: 'sky' },
  { id: 'top-fisica', name: 'Física & Ciências', slug: 'fisica-ciencias', color: 'indigo' },
  { id: 'top-biologia', name: 'Biologia & Natureza', slug: 'biologia-natureza', color: 'emerald' },
  { id: 'top-curiosidades', name: 'Curiosidades Gerais', slug: 'curiosidades-gerais', color: 'rose' },
];

for (const cat of mainCategories) {
  insertTopic.run(cat.id, cat.name, cat.slug, null, cat.color, null);
}

console.log('Main root categories seeded. Posts table is 100% empty.');
