'use strict';

const db = require('../db');

/** GET /api/comments/:postId */
function listByPost(req, res) {
  const comments = db.prepare(
    'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC',
  ).all(req.params.postId);
  res.json(comments);
}

/** POST /api/comments */
function create(req, res) {
  const { post_id, author_name, author_email, content } = req.body;
  if (!author_name?.trim()) return res.status(400).json({ error: '昵称不能为空' });
  if (!content?.trim())     return res.status(400).json({ error: '评论内容不能为空' });

  // 确认文章存在
  const post = db.prepare('SELECT id FROM posts WHERE id = ? AND published = 1').get(post_id);
  if (!post) return res.status(404).json({ error: '文章不存在' });

  const result = db.prepare(
    'INSERT INTO comments (post_id, author_name, author_email, content) VALUES (?, ?, ?, ?)',
  ).run(post_id, author_name.trim(), author_email?.trim() || '', content.trim());

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(comment);
}

/** DELETE /api/comments/:id  (需要登录) */
function remove(req, res) {
  const changes = db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id).changes;
  if (!changes) return res.status(404).json({ error: '评论不存在' });
  res.json({ message: '删除成功' });
}

module.exports = { listByPost, create, remove };
