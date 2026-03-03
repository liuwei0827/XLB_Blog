'use strict';

const db = require('../db');
const config = require('../config');

/** GET /api/posts — 列表（分页 + 分类筛选 + 搜索 + 标签） */
function list(req, res) {
  const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    parseInt(req.query.limit, 10) || config.pagination.defaultLimit,
    config.pagination.maxLimit,
  );
  const offset   = (page - 1) * limit;
  const category = req.query.category || '';
  const search   = req.query.search   || '';
  const tag      = req.query.tag      || '';

  const where  = ['p.published = 1'];
  const params = [];

  if (category) { where.push('c.slug = ?');        params.push(category); }
  if (search)   {
    where.push('(p.title LIKE ? OR p.summary LIKE ? OR p.content LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (tag) { where.push('p.tags LIKE ?'); params.push(`%"${tag}"%`); }

  const whereSQL = `WHERE ${where.join(' AND ')}`;

  const { count } = db.prepare(`
    SELECT COUNT(*) AS count FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    ${whereSQL}
  `).get(...params);

  const posts = db.prepare(`
    SELECT p.id, p.title, p.slug, p.summary, p.cover, p.tags,
           p.views, p.likes, p.created_at, p.updated_at,
           c.name AS category_name, c.slug AS category_slug,
           c.color AS category_color, c.icon AS category_icon,
           u.username AS author_name, u.avatar AS author_avatar
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u      ON p.author_id   = u.id
    ${whereSQL}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  posts.forEach(p => { p.tags = parseTags(p.tags); });

  res.json({ posts, total: count, page, totalPages: Math.ceil(count / limit) });
}

/** GET /api/posts/featured — 热门精选（浏览量 Top 3） */
function featured(req, res) {
  const posts = db.prepare(`
    SELECT p.id, p.title, p.slug, p.summary, p.cover, p.tags,
           p.views, p.likes, p.created_at,
           c.name AS category_name, c.slug AS category_slug,
           c.color AS category_color, c.icon AS category_icon
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.published = 1
    ORDER BY p.views DESC, p.created_at DESC
    LIMIT 3
  `).all();
  posts.forEach(p => { p.tags = parseTags(p.tags); });
  res.json(posts);
}

/** GET /api/posts/:slug — 文章详情 */
function show(req, res) {
  const post = db.prepare(`
    SELECT p.*,
           c.name AS category_name, c.slug AS category_slug,
           c.color AS category_color, c.icon AS category_icon,
           u.username AS author_name, u.avatar AS author_avatar, u.bio AS author_bio
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u      ON p.author_id   = u.id
    WHERE p.slug = ? AND p.published = 1
  `).get(req.params.slug);

  if (!post) return res.status(404).json({ error: '文章不存在' });

  // 浏览量 +1
  db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(post.id);
  post.views += 1;
  post.tags    = parseTags(post.tags);
  post.comments = db.prepare(
    'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC',
  ).all(post.id);
  post.related = db.prepare(`
    SELECT id, title, slug, cover, summary, created_at
    FROM posts WHERE category_id = ? AND id != ? AND published = 1
    ORDER BY RANDOM() LIMIT 3
  `).all(post.category_id, post.id);

  res.json(post);
}

/** POST /api/posts — 新建文章 */
function create(req, res) {
  const { title, slug, summary, content, cover, category_id, tags, published } = req.body;
  if (!title || !content) return res.status(400).json({ error: '标题和内容不能为空' });

  const result = db.prepare(`
    INSERT INTO posts (title, slug, summary, content, cover, category_id, tags, published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    slug || slugify(title),
    summary || '',
    content,
    cover   || '',
    category_id || null,
    JSON.stringify(tags || []),
    published !== false ? 1 : 0,
  );
  res.status(201).json({ id: result.lastInsertRowid, message: '文章创建成功' });
}

/** PUT /api/posts/:id — 更新文章 */
function update(req, res) {
  const { title, slug, summary, content, cover, category_id, tags, published } = req.body;
  const changes = db.prepare(`
    UPDATE posts SET title=?, slug=?, summary=?, content=?, cover=?,
    category_id=?, tags=?, published=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(
    title, slug, summary || '', content, cover || '',
    category_id || null, JSON.stringify(tags || []),
    published ? 1 : 0, req.params.id,
  ).changes;

  if (!changes) return res.status(404).json({ error: '文章不存在' });
  res.json({ message: '更新成功' });
}

/** DELETE /api/posts/:id — 删除文章 */
function remove(req, res) {
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
}

/** POST /api/posts/:id/like — 点赞 */
function like(req, res) {
  db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(req.params.id);
  const post = db.prepare('SELECT likes FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  res.json({ likes: post.likes });
}

// ---- helpers ----
function parseTags(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}
function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || `post-${Date.now()}`;
}

module.exports = { list, featured, show, create, update, remove, like };
