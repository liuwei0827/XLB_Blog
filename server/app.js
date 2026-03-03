'use strict';

const express = require('express');
const session = require('express-session');
const path    = require('path');

const config             = require('./config');
const { logger }         = require('./middleware/logger');
const { errorHandler }   = require('./middleware/errorHandler');
const apiRoutes          = require('./routes');

const app = express();

// ── 基础中间件 ──────────────────────────────────────────────────────────────
app.use(logger);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Session ─────────────────────────────────────────────────────────────────
app.use(session({
  secret:            config.session.secret,
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   config.session.maxAge,
    httpOnly: true,
    // secure: config.server.env === 'production',  // HTTPS 时开启
  },
}));

// ── 静态资源 ─────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

// ── API 路由 ─────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── SPA fallback（所有非 API 请求返回前端入口） ───────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ── 全局错误处理（必须在所有路由之后） ────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
