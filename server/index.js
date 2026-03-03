'use strict';

/**
 * 服务器启动入口
 * 职责单一：仅负责监听端口。业务逻辑全部在 app.js 中。
 */
const app    = require('./app');
const config = require('./config');

const { port } = config.server;

app.listen(port, () => {
  console.log(`\n🥟 十块钱小笼包博客已启动！`);
  console.log(`   本地访问: http://localhost:${port}`);
  console.log(`   管理后台: http://localhost:${port}/admin\n`);
});
