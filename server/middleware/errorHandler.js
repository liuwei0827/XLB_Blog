'use strict';

const config = require('../config');

/**
 * 全局错误处理中间件（必须放在所有路由之后注册）
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isDev = config.server.env === 'development';
  const status = err.status || err.statusCode || 500;

  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  if (isDev) console.error(err.stack);

  res.status(status).json({
    error: err.message || '服务器内部错误',
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
