/**
 * footer.js — 页脚分类列表渲染
 */
import { store }    from '../store.js';
import { navigate } from '../router.js';

export function initFooter() {
  function renderCats(cats) {
    const el = document.getElementById('footer-categories');
    if (!el) return;
    el.innerHTML = (cats || []).map(c => `
      <span class="footer-cat-link" data-cat="${c.slug}">${c.icon || ''} ${c.name}</span>
    `).join('');
    el.querySelectorAll('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => navigate(`/category/${btn.dataset.cat}`));
    });
  }

  // 初始渲染 + 监听后续更新
  renderCats(store.get('categories'));
  store.on('categories', renderCats);
}
