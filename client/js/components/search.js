/**
 * search.js — 搜索覆盖层组件
 */
import { posts }    from '../api.js';
import { escape }   from '../utils.js';
import { navigate } from '../router.js';

export function initSearch() {
  const overlay  = document.getElementById('search-overlay');
  const input    = document.getElementById('search-input');
  const results  = document.getElementById('search-results');
  const btnOpen  = document.getElementById('btn-search');
  const btnClose = document.getElementById('btn-search-close');

  let debounceTimer;

  const open  = () => { overlay.classList.add('open');    setTimeout(() => input.focus(), 100); };
  const close = () => { overlay.classList.remove('open'); input.value = ''; results.innerHTML = ''; };

  btnOpen.addEventListener('click', open);
  btnClose.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (!q) { results.innerHTML = ''; return; }

    debounceTimer = setTimeout(async () => {
      let data;
      try { data = await posts.list({ search: q, limit: 5 }); } catch { return; }

      if (!data?.posts?.length) {
        results.innerHTML = '<div class="search-result-item"><p>没有找到相关文章 🥟</p></div>';
        return;
      }

      results.innerHTML = data.posts.map(p => `
        <div class="search-result-item" data-slug="${p.slug}">
          <h4>${escape(p.title)}</h4>
          <p>${escape(p.summary || '')}</p>
        </div>`).join('');

      results.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          close();
          navigate(`/post/${item.dataset.slug}`);
        });
      });
    }, 300);
  });
}
