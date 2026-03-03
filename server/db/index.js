'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const SCHEMA = require('./schema');

const dbPath = path.resolve(config.db.path);

// 确保目录存在
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// 性能优化：WAL 模式 + 外键约束
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 初始化表结构
db.exec(SCHEMA);

module.exports = db;
