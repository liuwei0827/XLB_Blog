'use strict';

/**
 * 路由聚合入口 — 在这里统一注册所有路由模块
 * 新增路由时只需在此添加一行，不需要修改 app.js
 */
const { Router } = require('express');

const router = Router();

router.use('/posts',      require('./posts'));
router.use('/categories', require('./categories'));
router.use('/comments',   require('./comments'));
router.use('/auth',       require('./auth'));

module.exports = router;
