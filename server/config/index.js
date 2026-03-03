// 统一配置管理 — 所有配置从这里读取，优先使用环境变量
'use strict';

require('dotenv').config();

module.exports = {
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'xlb-blog-dev-secret-change-in-prod',
    maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) || 24 * 60 * 60 * 1000, // 1 day
  },
  db: {
    path: process.env.DB_PATH || 'data/blog.db',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSizeMb: parseInt(process.env.UPLOAD_MAX_SIZE_MB, 10) || 5,
  },
  pagination: {
    defaultLimit: 6,
    maxLimit: 100,
  },
};
