/**
 * header.js — 顶部导航栏初始化
 */
import { store }    from '../store.js';
import { navigate } from '../router.js';

export function initHeader() {
  const header  = document.getElementById('site-header');
  const btnMenu = document.getElementById('btn-menu');
  const nav     = document.querySelector('.main-nav');

  // 滚动阴影
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // 移动端菜单开关
  btnMenu.addEventListener('click', () => nav.classList.toggle('mobile-open'));

  // 关闭菜单当点击链接
  nav.addEventListener('click', e => {
    const link = e.target.closest('[href]');
    if (link) nav.classList.remove('mobile-open');
  });

  // 登录状态监听 → 显示/隐藏管理入口
  const adminLink = document.getElementById('admin-nav-link');
  function syncAdmin(isAdmin) {
    if (adminLink) adminLink.style.display = isAdmin ? '' : 'none';
  }
  syncAdmin(store.get('isAdmin'));
  store.on('isAdmin', syncAdmin);

  // 使用 data-link 实现 SPA 导航（<a href="/path" data-link="/path">）
  // 在 HTML 中所有内部链接加上 data-link 属性即可，router 会接管
}
