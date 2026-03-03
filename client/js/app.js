/**
 * app.js — 前端应用入口
 * 初始化全局状态、组件和路由
 */

import { categories as catsApi, auth as authApi } from './api.js';
import { store }       from './store.js';
import { addRoute, initRouter, navigate } from './router.js';
import { initHeader }  from './components/header.js';
import { initSearch }  from './components/search.js';
import { initFooter }  from './components/footer.js';
import { renderHome }  from './pages/home.js';
import { renderPost }  from './pages/post.js';
import { renderArchive } from './pages/archive.js';
import { renderAbout } from './pages/about.js';
import { renderAdmin } from './pages/admin.js';

async function init() {
  // 1. 初始化布局组件（不依赖数据）
  initHeader();
  initSearch();
  initFooter();

  // 2. 并行获取全局数据（分类 + 登录状态）
  const [cats, authState] = await Promise.allSettled([
    catsApi.list(),
    authApi.check(),
  ]);

  if (cats.status === 'fulfilled')      store.set('categories', cats.value || []);
  if (authState.status === 'fulfilled') {
    store.set('isAdmin',  authState.value?.loggedIn  || false);
    store.set('username', authState.value?.username  || '');
  }

  // 3. 注册路由（顺序：精确匹配在前，通配在后）
  addRoute('/admin', ()        => renderAdmin());
  addRoute('/archive', ()      => renderArchive());
  addRoute('/about', ()        => renderAbout());
  addRoute('/post/:slug', renderPost);
  addRoute('/category/:cat', ({ cat }) => renderHome({ cat }));
  addRoute('/tag/:tag',       ({ tag }) => renderHome({ tag }));
  addRoute('/',               ()        => renderHome());

  // 4. 启动路由（解析当前 URL）
  initRouter();

  // 5. 暴露 navigate 到全局给内联 onclick 使用（仅用于极少数特殊场景）
  window.__navigate = navigate;
}

init().catch(err => {
  console.error('[App] 初始化失败:', err);
});
