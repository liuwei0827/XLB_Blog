'use strict';

/**
 * 数据库表结构定义
 * 与数据库连接分离，方便单独维护和版本追踪
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    avatar     TEXT    DEFAULT '',
    bio        TEXT    DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT UNIQUE NOT NULL,
    slug       TEXT UNIQUE NOT NULL,
    color      TEXT DEFAULT '#e8673c',
    icon       TEXT DEFAULT '🍜',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    slug        TEXT    UNIQUE NOT NULL,
    summary     TEXT    DEFAULT '',
    content     TEXT    NOT NULL,
    cover       TEXT    DEFAULT '',
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    author_id   INTEGER DEFAULT 1 REFERENCES users(id),
    tags        TEXT    DEFAULT '[]',
    views       INTEGER DEFAULT 0,
    likes       INTEGER DEFAULT 0,
    published   INTEGER DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS comments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id      INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_name  TEXT NOT NULL,
    author_email TEXT DEFAULT '',
    content      TEXT NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 常用查询索引
  CREATE INDEX IF NOT EXISTS idx_posts_slug      ON posts(slug);
  CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_posts_category  ON posts(category_id);
  CREATE INDEX IF NOT EXISTS idx_comments_post   ON comments(post_id);
`;

module.exports = SCHEMA;
