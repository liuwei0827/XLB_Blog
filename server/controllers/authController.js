'use strict';

const bcrypt = require('bcryptjs');
const db = require('../db');

/** POST /api/auth/login */
async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: '用户名或密码错误' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: '用户名或密码错误' });

  req.session.userId   = user.id;
  req.session.username = user.username;
  res.json({ message: '登录成功', username: user.username });
}

/** POST /api/auth/logout */
function logout(req, res) {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: '退出失败' });
    res.clearCookie('connect.sid');
    res.json({ message: '已退出登录' });
  });
}

/** GET /api/auth/check */
function check(req, res) {
  if (req.session?.userId) {
    return res.json({ loggedIn: true, username: req.session.username });
  }
  res.json({ loggedIn: false });
}

module.exports = { login, logout, check };
