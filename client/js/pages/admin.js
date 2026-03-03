/**
 * pages/admin.js — 管理后台
 */
import { posts as postsApi, categories as catsApi, auth as authApi } from '../api.js';
import { escape, showToast } from '../utils.js';
import { store }             from '../store.js';
import { navigate }          from '../router.js';

// ── 入口 ─────────────────────────────────────────────────────────────────────

export async function renderAdmin() {
  if (!store.get('isAdmin')) {
    renderLogin();
    return;
  }

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="admin-page">
      <aside class="admin-sidebar">
        <div class="admin-logo">🥟 管理后台</div>
        <nav class="admin-nav">
          <button class="admin-nav-item active" data-panel="posts">📝 文章管理</button>
          <button class="admin-nav-item" data-panel="categories">🏷️ 分类管理</button>
          <button class="admin-nav-item admin-logout" id="admin-logout">🚪 退出登录</button>
        </nav>
      </aside>
      <div class="admin-content" id="admin-content">
        <div class="loading"></div>
      </div>
    </div>`;

  // 侧边栏切换面板
  app.querySelectorAll('.admin-nav-item[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      app.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPanel(btn.dataset.panel);
    });
  });

  // 退出
  document.getElementById('admin-logout').addEventListener('click', async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    store.set('isAdmin', false);
    store.set('username', '');
    showToast('已退出登录', 'success');
    navigate('/');
  });

  renderPanel('posts');
}

// ── 面板路由 ──────────────────────────────────────────────────────────────────

async function renderPanel(panel) {
  const content = document.getElementById('admin-content');
  if (!content) return;
  content.innerHTML = '<div class="loading"></div>';

  if (panel === 'posts')      await renderPostsPanel(content);
  else if (panel === 'categories') await renderCategoriesPanel(content);
}

// ── 文章面板 ──────────────────────────────────────────────────────────────────

async function renderPostsPanel(content) {
  let data;
  try { data = await postsApi.list({ limit: 50 }); } catch {
    content.innerHTML = '<p style="color:var(--text-muted)">加载失败</p>'; return;
  }
  const ps = data?.posts || [];

  content.innerHTML = `
    <div class="admin-panel-header">
      <h2>📝 文章管理</h2>
      <button class="btn btn-primary btn-sm" id="btn-new-post">+ 新建文章</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>标题</th><th>分类</th><th>浏览</th><th>点赞</th><th>日期</th><th>操作</th></tr></thead>
      <tbody>
        ${ps.map(p => `
          <tr>
            <td><strong>${escape(p.title)}</strong></td>
            <td>${p.category_name ? `<span style="color:${p.category_color}">${p.category_icon || ''} ${escape(p.category_name)}</span>` : '—'}</td>
            <td>${p.views}</td>
            <td>${p.likes}</td>
            <td>${new Date(p.created_at).toLocaleDateString('zh-CN')}</td>
            <td style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" data-delete-id="${p.id}" data-delete-title="${escape(p.title)}">删除</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;

  document.getElementById('btn-new-post')?.addEventListener('click', () => showPostModal());
  content.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(`确定要删除《${btn.dataset.deleteTitle}》吗？`)) return;
      try {
        await postsApi.remove(btn.dataset.deleteId);
        showToast('删除成功', 'success');
        renderPanel('posts');
      } catch (err) { showToast(err.message, 'error'); }
    });
  });
}

// ── 分类面板 ──────────────────────────────────────────────────────────────────

async function renderCategoriesPanel(content) {
  let cats;
  try { cats = await catsApi.list(); } catch {
    content.innerHTML = '<p style="color:var(--text-muted)">加载失败</p>'; return;
  }

  content.innerHTML = `
    <div class="admin-panel-header">
      <h2>🏷️ 分类管理</h2>
      <button class="btn btn-primary btn-sm" id="btn-new-cat">+ 新建分类</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>图标</th><th>名称</th><th>Slug</th><th>颜色</th><th>文章数</th><th>操作</th></tr></thead>
      <tbody>
        ${cats.map(c => `
          <tr>
            <td style="font-size:20px">${c.icon || ''}</td>
            <td><strong>${escape(c.name)}</strong></td>
            <td><code>${c.slug}</code></td>
            <td><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${c.color}"></span></td>
            <td>${c.post_count || 0}</td>
            <td>
              <button class="btn btn-danger btn-sm" data-delete-cat="${c.id}" data-cat-name="${escape(c.name)}">删除</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;

  document.getElementById('btn-new-cat')?.addEventListener('click', () => showCategoryModal());
  content.querySelectorAll('[data-delete-cat]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(`确定删除分类「${btn.dataset.catName}」吗？`)) return;
      try {
        await catsApi.remove(btn.dataset.deleteCat);
        showToast('删除成功', 'success');
        // 刷新全局分类缓存
        const updated = await catsApi.list();
        store.set('categories', updated);
        renderPanel('categories');
      } catch (err) { showToast(err.message, 'error'); }
    });
  });
}

// ── 登录页 ────────────────────────────────────────────────────────────────────

function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <span class="logo-icon" style="font-size:56px;display:block;margin-bottom:16px">🥟</span>
        <h2>管理后台</h2>
        <p style="color:var(--text-muted);margin-bottom:32px;font-size:14px">请输入管理员账号密码</p>
        <form class="login-form" id="login-form">
          <div class="form-group"><label>用户名</label><input name="username" required placeholder="admin" /></div>
          <div class="form-group" style="margin-top:12px"><label>密码</label><input name="password" type="password" required placeholder="••••••••" /></div>
          <button type="submit" class="btn btn-primary" style="margin-top:20px;width:100%;justify-content:center">登录</button>
        </form>
        <p style="font-size:12px;color:var(--text-muted);margin-top:16px">默认账号：admin / admin123</p>
      </div>
    </div>`;

  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await authApi.login({ username: fd.get('username'), password: fd.get('password') });
      store.set('isAdmin', true);
      store.set('username', res.username);
      showToast(`欢迎回来，${res.username}！`, 'success');
      renderAdmin();
    } catch (err) {
      showToast(err.message || '登录失败', 'error');
    }
  });
}

// ── 模态框：新建文章 ──────────────────────────────────────────────────────────

function showPostModal() {
  const cats = store.get('categories') || [];
  const modal = createModal('新建文章', `
    <form id="post-form">
      <div class="form-group" style="margin-bottom:16px">
        <label>标题 *</label>
        <input name="title" required placeholder="文章标题" />
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label>Slug（URL 标识，留空自动生成）</label>
        <input name="slug" placeholder="my-post-slug" />
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label>摘要</label>
        <textarea name="summary" rows="2" placeholder="一句话介绍..."></textarea>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label>封面图片 URL</label>
        <input name="cover" placeholder="https://..." />
      </div>
      <div class="form-row" style="margin-bottom:16px">
        <div class="form-group">
          <label>分类</label>
          <select name="category_id">
            <option value="">选择分类</option>
            ${cats.map(c => `<option value="${c.id}">${c.icon || ''} ${escape(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>标签（逗号分隔）</label>
          <input name="tags" placeholder="上海,小笼包,美食" />
        </div>
      </div>
      <div class="form-group">
        <label>内容（支持 Markdown）*</label>
        <textarea name="content" rows="12" required placeholder="# 标题&#10;&#10;正文..."></textarea>
      </div>
    </form>
  `, async () => {
    const form = document.getElementById('post-form');
    const fd   = new FormData(form);
    const tags = fd.get('tags').split(',').map(t => t.trim()).filter(Boolean);
    try {
      await postsApi.create({
        title:       fd.get('title'),
        slug:        fd.get('slug') || '',
        summary:     fd.get('summary'),
        content:     fd.get('content'),
        cover:       fd.get('cover'),
        category_id: fd.get('category_id') ? parseInt(fd.get('category_id'), 10) : null,
        tags,
      });
      showToast('文章发布成功！', 'success');
      closeModal(modal);
      renderPanel('posts');
    } catch (err) { showToast(err.message, 'error'); }
  });
}

// ── 模态框：新建分类 ──────────────────────────────────────────────────────────

function showCategoryModal() {
  const colors = ['#e8673c', '#f0a500', '#4caf7d', '#7c6af7', '#e91e8c', '#2196f3'];
  const modal  = createModal('新建分类', `
    <form id="cat-form">
      <div class="form-row">
        <div class="form-group"><label>名称 *</label><input name="name" required placeholder="上海味道" /></div>
        <div class="form-group"><label>Slug *</label><input name="slug" required placeholder="shanghai" /></div>
      </div>
      <div class="form-row" style="margin-top:16px">
        <div class="form-group"><label>图标 (emoji)</label><input name="icon" placeholder="🍜" maxlength="2" /></div>
        <div class="form-group">
          <label>颜色</label>
          <select name="color">
            ${colors.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
      </div>
    </form>
  `, async () => {
    const form = document.getElementById('cat-form');
    const fd   = new FormData(form);
    try {
      await catsApi.create({ name: fd.get('name'), slug: fd.get('slug'), icon: fd.get('icon'), color: fd.get('color') });
      const updated = await catsApi.list();
      store.set('categories', updated);
      showToast('分类创建成功！', 'success');
      closeModal(modal);
      renderPanel('categories');
    } catch (err) { showToast(err.message, 'error'); }
  });
}

// ── 通用模态框工厂 ────────────────────────────────────────────────────────────

function createModal(title, bodyHTML, onSubmit) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${escape(title)}</h3>
        <button class="btn btn-ghost btn-sm" data-close>✕</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      <div class="modal-footer">
        <button class="btn btn-ghost" data-close>取消</button>
        <button class="btn btn-primary" id="modal-submit">确认</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(modal)));
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
  document.getElementById('modal-submit').addEventListener('click', onSubmit);
  return modal;
}

function closeModal(modal) {
  modal.remove();
}
