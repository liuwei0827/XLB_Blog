/**
 * router.js — 客户端 SPA 路由
 * 基于 History API，支持动态参数
 */

/** @type {Array<{pattern: RegExp, keys: string[], handler: Function}>} */
const routes = [];

/**
 * 注册路由
 * @param {string} path  支持 :param 参数，如 '/post/:slug'
 * @param {Function} handler  (params) => void
 */
export function addRoute(path, handler) {
  const keys = [];
  const pattern = new RegExp(
    `^${path.replace(/:([^/]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`,
  );
  routes.push({ pattern, keys, handler });
}

/** 导航到新路径 */
export function navigate(path) {
  window.history.pushState({}, '', path);
  dispatch(path);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** 解析当前路径并执行匹配的路由处理器 */
export function dispatch(path = window.location.pathname) {
  // 高亮对应 nav 链接
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === path || (path === '/' && l.getAttribute('href') === '/'));
  });

  for (const { pattern, keys, handler } of routes) {
    const match = path.match(pattern);
    if (match) {
      const params = {};
      keys.forEach((k, i) => { params[k] = decodeURIComponent(match[i + 1]); });
      handler(params);
      return;
    }
  }

  // 404 fallback
  document.getElementById('app').innerHTML = `
    <div style="text-align:center;padding:120px 24px">
      <div style="font-size:80px;margin-bottom:24px">🥟</div>
      <h2>找不到这个页面</h2>
      <p style="color:var(--text-muted);margin:12px 0 24px">可能被吃掉了</p>
      <button class="btn btn-primary" onclick="import('/js/router.js').then(m=>m.navigate('/'))">回首页</button>
    </div>`;
}

/** 初始化 — 监听浏览器前进/后退 */
export function initRouter() {
  window.addEventListener('popstate', () => dispatch());

  // 全局拦截 data-link 属性的点击
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-link]');
    if (el) {
      e.preventDefault();
      navigate(el.dataset.link);
    }
  });

  // 首次加载
  dispatch();
}
