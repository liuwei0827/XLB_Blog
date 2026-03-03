/**
 * pages/archive.js — 文章归档页
 */
import { posts as postsApi } from '../api.js';
import { formatDate, escape } from '../utils.js';
import { navigate }           from '../router.js';

export async function renderArchive() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="page-hero">
      <div class="container">
        <h1>📚 文章归档</h1>
        <p>所有文章按时间排列</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="archive-list" id="archive-list">
          <div class="loading"></div>
        </div>
      </div>
    </section>`;

  let data;
  try {
    data = await postsApi.list({ limit: 100 });
  } catch {
    document.getElementById('archive-list').innerHTML = '<p style="color:var(--text-muted)">加载失败</p>';
    return;
  }

  const list = document.getElementById('archive-list');
  if (!data?.posts?.length) {
    list.innerHTML = '<p style="color:var(--text-muted)">暂无文章</p>';
    return;
  }

  // 按年份分组
  const grouped = {};
  data.posts.forEach(p => {
    const year = new Date(p.created_at).getFullYear();
    (grouped[year] = grouped[year] || []).push(p);
  });

  list.innerHTML = Object.keys(grouped).sort((a, b) => b - a).map(year => `
    <div class="archive-year">
      <div class="archive-year-label">${year}</div>
      ${grouped[year].map(p => `
        <div class="archive-item" data-slug="${p.slug}">
          <span class="archive-date">${formatDate(p.created_at, 'short')}</span>
          <span class="archive-title">${escape(p.title)}</span>
          ${p.category_name
            ? `<span class="archive-cat" style="background:${p.category_color || '#e8673c'}">${p.category_icon || ''} ${escape(p.category_name)}</span>`
            : ''}
        </div>`).join('')}
    </div>`).join('');

  list.querySelectorAll('.archive-item').forEach(item => {
    item.addEventListener('click', () => navigate(`/post/${item.dataset.slug}`));
  });
}
