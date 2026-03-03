'use strict';

/**
 * 认证中间件：校验 session，未登录则返回 401
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ error: '请先登录', code: 'UNAUTHORIZED' });
}

module.exports = { requireAuth };
