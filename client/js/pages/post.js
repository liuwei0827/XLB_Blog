/**
 * pages/post.js — 文章详情页
 */
import { posts as postsApi, comments as commentsApi } from '../api.js';
import { formatDate, escape, showToast }              from '../utils.js';
import { navigate }                                   from '../router.js';

export async function renderPost({ slug }) {
  const app = document.getElementById('app');
  app.innerHTML = `<div style="padding-top:var(--header-h)"><div class="loading" style="min-height:60vh"></div></div>`;

  let post;
  try {
    post = await postsApi.show(slug);
  } catch (err) {
    if (err.status === 404) {
      app.innerHTML = notFoundHTML();
    } else {
      app.innerHTML = `<div style="text-align:center;padding:120px 24px;color:var(--text-muted)">加载失败，请稍后重试</div>`;
    }
    return;
  }

  // marked 通过 CDN 在 HTML 中加载，此处作为全局变量调用
  const html = typeof marked !== 'undefined'
    ? marked.parse(post.content || '')
    : escape(post.content || '').replace(/\n/g, '<br>');

  app.innerHTML = `
    <div class="post-page">
      <div class="post-hero">
        ${post.cover
          ? `<img class="post-hero-img" src="${post.cover}" alt="${escape(post.title)}" />`
          : `<div class="post-hero-img" style="background:linear-gradient(135deg,#fdf4ef,#fee2e2)"></div>`}
        <div class="post-hero-overlay"></div>
        <div class="post-hero-content">
          ${post.category_name
            ? `<div class="post-cat" style="background:${post.category_color}">${post.category_icon || ''} ${escape(post.category_name)}</div>`
            : ''}
          <h1>${escape(post.title)}</h1>
          <div class="post-hero-meta">
            <span>📅 ${formatDate(post.created_at)}</span>
            <span>👁 ${post.views} 次阅读</span>
            <span>❤️ <span id="like-count">${post.likes}</span> 点赞</span>
          </div>
        </div>
      </div>

      <div class="post-container">
        <main class="post-main">
          <div class="post-content" id="post-content">${html}</div>

          ${post.tags?.length
            ? `<div class="post-tags">${post.tags.map(t => `<span class="tag" data-tag="${escape(t)}">#${escape(t)}</span>`).join('')}</div>`
            : ''}

          <div class="post-actions">
            <button class="btn-like" id="btn-like" data-id="${post.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span id="like-label">${post.likes}</span> 喜欢
            </button>
            <button class="btn btn-ghost btn-sm" onclick="history.back()">← 返回</button>
          </div>

          ${commentsHTML(post.comments || [], post.id)}
        </main>

        <aside class="post-sidebar">
          ${authorWidget(post)}
          ${tocWidget(post.content)}
          ${relatedWidget(post.related || [])}
        </aside>
      </div>
    </div>`;

  // 点赞
  document.getElementById('btn-like')?.addEventListener('click', async () => {
    try {
      const data = await postsApi.like(post.id);
      document.getElementById('like-count').textContent  = data.likes;
      document.getElementById('like-label').textContent  = data.likes;
      document.getElementById('btn-like').classList.add('liked');
      showToast('感谢你的喜欢 ❤️', 'success');
    } catch { showToast('点赞失败，请重试', 'error'); }
  });

  // 标签跳转
  app.querySelectorAll('.post-tags .tag').forEach(tag => {
    tag.addEventListener('click', () => navigate(`/tag/${tag.dataset.tag}`));
  });

  // 相关文章跳转
  app.querySelectorAll('.related-item').forEach(item => {
    item.addEventListener('click', () => navigate(`/post/${item.dataset.slug}`));
  });

  // 评论表单
  document.getElementById('comment-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const comment = await commentsApi.create({
        post_id:      post.id,
        author_name:  fd.get('author_name'),
        author_email: fd.get('author_email'),
        content:      fd.get('content'),
      });
      post.comments = [comment, ...(post.comments || [])];
      document.getElementById('comment-list').insertAdjacentHTML('afterbegin', commentItemHTML(comment));
      e.target.reset();
      showToast('评论发送成功！', 'success');
    } catch (err) {
      showToast(err.message || '评论失败', 'error');
    }
  });

  setupTOC();
}

// ── 子组件 HTML ───────────────────────────────────────────────────────────────

function commentsHTML(list, postId) {
  return `
    <section class="comments-section">
      <h3>💬 评论 (${list.length})</h3>
      <div class="comment-form">
        <h4>留下你的想法</h4>
        <form id="comment-form">
          <input type="hidden" name="post_id" value="${postId}" />
          <div class="form-row">
            <div class="form-group">
              <label>昵称 *</label>
              <input name="author_name" required placeholder="你的名字" />
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input name="author_email" type="email" placeholder="可选，不会公开" />
            </div>
          </div>
          <div class="form-group" style="margin-bottom:16px">
            <label>内容 *</label>
            <textarea name="content" required placeholder="说点什么吧..." rows="4"></textarea>
          </div>
          <button type="submit" class="btn btn-primary">发送评论</button>
        </form>
      </div>
      <div class="comment-list" id="comment-list">
        ${list.length
          ? list.map(commentItemHTML).join('')
          : '<p style="color:var(--text-muted);text-align:center;padding:24px">还没有评论，来说第一句话吧 🥟</p>'}
      </div>
    </section>`;
}

function commentItemHTML(c) {
  return `
    <div class="comment-item">
      <div class="comment-header">
        <div class="comment-avatar">${(c.author_name?.[0] || '?').toUpperCase()}</div>
        <div class="comment-meta">
          <h5>${escape(c.author_name)}</h5>
          <span>${formatDate(c.created_at, 'full')}</span>
        </div>
      </div>
      <div class="comment-body"><p>${escape(c.content)}</p></div>
    </div>`;
}

function authorWidget(post) {
  return `
    <div class="sidebar-widget author-card">
      <div class="author-avatar">🥟</div>
      <h4>${escape(post.author_name || 'admin')}</h4>
      <p>${escape(post.author_bio || '一个热爱美食与生活的人。')}</p>
    </div>`;
}

function tocWidget(content) {
  const headings = [];
  const regex = /^(#{1,3})\s+(.+)$/gm;
  let m;
  while ((m = regex.exec(content || '')) !== null) {
    const level = m[1].length;
    const text  = m[2].replace(/[*_`]/g, '');
    const id    = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    headings.push({ level, text, id });
  }
  if (!headings.length) return '';
  return `
    <div class="sidebar-widget">
      <h3>目录</h3>
      <ul class="toc-list">
        ${headings.map(h => `
          <li style="padding-left:${(h.level - 1) * 12}px">
            <a href="#${h.id}" data-toc="${h.id}">${escape(h.text)}</a>
          </li>`).join('')}
      </ul>
    </div>`;
}

function relatedWidget(related) {
  if (!related.length) return '';
  return `
    <div class="sidebar-widget">
      <h3>相关文章</h3>
      <div class="related-list">
        ${related.map(r => `
          <div class="related-item" data-slug="${r.slug}">
            ${r.cover
              ? `<img class="related-thumb" src="${r.cover}" alt="${escape(r.title)}" loading="lazy" />`
              : `<div class="related-thumb" style="background:linear-gradient(135deg,#fdf4ef,#fee2e2);display:flex;align-items:center;justify-content:center">🥟</div>`}
            <div class="related-info">
              <h5>${escape(r.title)}</h5>
              <span>${formatDate(r.created_at)}</span>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function notFoundHTML() {
  return `
    <div style="text-align:center;padding:120px 24px;padding-top:calc(var(--header-h) + 80px)">
      <div style="font-size:80px;margin-bottom:24px">🥟</div>
      <h2>文章不见了...</h2>
      <p style="color:var(--text-muted);margin:12px 0 24px">可能被吃掉了</p>
      <button class="btn btn-primary" onclick="import('/js/router.js').then(m=>m.navigate('/'))">回首页</button>
    </div>`;
}

function setupTOC() {
  setTimeout(() => {
    const content = document.getElementById('post-content');
    if (!content) return;

    // 给正文标题加 id
    content.querySelectorAll('h1,h2,h3').forEach(h => {
      h.id = h.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    });

    // IntersectionObserver 高亮目录
    const tocLinks = document.querySelectorAll('[data-toc]');
    if (!tocLinks.length) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          tocLinks.forEach(l => l.classList.remove('active'));
          document.querySelector(`[data-toc="${entry.target.id}"]`)?.classList.add('active');
        }
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    content.querySelectorAll('h1,h2,h3').forEach(h => observer.observe(h));
  }, 200);
}
