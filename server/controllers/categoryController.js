'use strict';

const db = require('../db');

/** GET /api/categories */
function list(req, res) {
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) AS post_count
    FROM categories c
    LEFT JOIN posts p ON p.category_id = c.id AND p.published = 1
    GROUP BY c.id
    ORDER BY post_count DESC
  `).all();
  res.json(categories);
}

/** POST /api/categories */
function create(req, res) {
  const { name, slug, color, icon } = req.body;
  if (!name || !slug) return res.status(400).json({ error: '名称和 slug 不能为空' });

  const result = db.prepare(
    'INSERT INTO categories (name, slug, color, icon) VALUES (?, ?, ?, ?)',
  ).run(name, slug, color || '#e8673c', icon || '🍜');
  res.status(201).json({ id: result.lastInsertRowid, message: '分类创建成功' });
}

/** DELETE /api/categories/:id */
function remove(req, res) {
  const changes = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id).changes;
  if (!changes) return res.status(404).json({ error: '分类不存在' });
  res.json({ message: '删除成功' });
}

module.exports = { list, create, remove };
