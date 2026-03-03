'use strict';

const config = require('../config');

/**
 * 简易请求日志（开发环境使用，生产可替换为 morgan/winston）
 */
function logger(req, res, next) {
  if (config.server.env === 'test') return next();
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}${req.method}\x1b[0m ${req.originalUrl} ${status} ${ms}ms`);
  });
  next();
}

module.exports = { logger };
