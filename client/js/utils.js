/**
 * utils.js — 纯工具函数，无副作用，无依赖
 */

/**
 * 格式化日期
 * @param {string} dateStr
 * @param {'medium'|'short'|'full'} style
 */
export function formatDate(dateStr, style = 'medium') {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (style === 'short') return `${d.getMonth() + 1}/${d.getDate()}`;
  if (style === 'full')  return d.toLocaleString('zh-CN');
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** 转义 HTML 特殊字符，防止 XSS */
export function escape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 显示 Toast 通知 */
export function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/** 文章卡片 HTML */
export function cardHTML(p, extra = '') {
  const cat  = p.category_color
    ? `<span class="card-cat" style="background:${p.category_color}">${p.category_icon || ''} ${p.category_name || ''}</span>`
    : '';
  const tags = (p.tags || []).slice(0, 3).map(t => `<span class="tag">#${t}</span>`).join('');
  const date = formatDate(p.created_at);
  const img  = p.cover
    ? `<img src="${p.cover}" alt="${escape(p.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<div style=height:100%;background:linear-gradient(135deg,#fdf4ef,#fee2e2);display:flex;align-items:center;justify-content:center;font-size:48px>🥟</div>'" />`
    : `<div style="height:100%;background:linear-gradient(135deg,#fdf4ef,#fee2e2);display:flex;align-items:center;justify-content:center;font-size:48px">🥟</div>`;

  return `
    <article class="post-card ${extra}" data-slug="${p.slug}">
      <div class="card-img">${img}${cat}</div>
      <div class="card-body">
        <h3 class="card-title">${escape(p.title)}</h3>
        <p class="card-summary">${escape(p.summary || '')}</p>
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        <div class="card-meta">
          <span class="card-meta-item">📅 ${date}</span>
          <span class="card-meta-item">👁 ${p.views || 0}</span>
          <span class="card-meta-item">❤️ ${p.likes || 0}</span>
        </div>
      </div>
    </article>`;
}

/** 为网格中的文章卡片绑定点击跳转事件 */
export function bindCardClicks(container, navigate) {
  container.querySelectorAll('.post-card').forEach(card => {
    card.addEventListener('click', () => navigate(`/post/${card.dataset.slug}`));
  });
}

/** 构建分页 HTML 并绑定事件 */
export function renderPagination(el, totalPages, current, onPageClick) {
  if (!el || totalPages <= 1) return;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }
  el.innerHTML = pages.map(p => `
    <button class="page-btn ${p === current ? 'active' : ''} ${p === '...' ? 'dots' : ''}"
      data-page="${p}">${p}</button>`).join('');
  el.querySelectorAll('.page-btn:not(.dots)').forEach(btn => {
    btn.addEventListener('click', () => onPageClick(parseInt(btn.dataset.page, 10)));
  });
}
