/**
 * pages/home.js — 首页（文章列表 + 精选 + 分类筛选）
 */
import { posts as postsApi, categories as catsApi } from '../api.js';
import { cardHTML, bindCardClicks, renderPagination, showToast } from '../utils.js';
import { store }    from '../store.js';
import { navigate } from '../router.js';

export async function renderHome({ cat = '', tag = '', page = 1 } = {}) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">🥟 美食与生活</div>
        <h1>十块钱小笼包</h1>
        <p>记录平凡生活里的温暖味道，探寻城市角落里的感动瞬间</p>
        <div class="hero-actions">
          <a href="#posts" class="btn btn-primary">开始阅读</a>
          <a href="/about" data-link="/about" class="btn btn-ghost">了解更多</a>
        </div>
      </div>
      <div class="hero-deco">
        <div class="deco-circle c1"></div>
        <div class="deco-circle c2"></div>
        <div class="deco-circle c3"></div>
        <div class="hero-emoji">🥟</div>
      </div>
    </section>

    <section class="section featured-section" id="featured">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">精选</span>
          <h2 class="section-title">热门文章</h2>
        </div>
        <div class="featured-grid" id="featured-grid">
          ${skeletons(3)}
        </div>
      </div>
    </section>

    <section class="section" id="posts">
      <div class="container">
        <div class="posts-header">
          <div class="section-header">
            <span class="section-tag">${tag ? '标签' : '全部'}</span>
            <h2 class="section-title">${tag ? `#${tag}` : '最新文章'}</h2>
          </div>
          <div class="category-pills" id="category-pills"></div>
        </div>
        <div class="posts-grid" id="posts-grid">${skeletons(6)}</div>
        <div class="pagination" id="pagination"></div>
      </div>
    </section>`;

  // 分类 pills
  const cats = store.get('categories') || [];
  const pillsEl = document.getElementById('category-pills');
  pillsEl.innerHTML = [{ slug: '', name: '全部', icon: '✨' }, ...cats].map(c => `
    <button class="pill ${c.slug === cat ? 'active' : ''}" data-cat="${c.slug}">
      ${c.icon || ''} ${c.name}
    </button>`).join('');
  pillsEl.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.cat ? `/category/${btn.dataset.cat}` : '/'));
  });

  // 并行请求精选 + 列表
  const [featuredPosts, listData] = await Promise.allSettled([
    postsApi.featured().catch(() => []),
    postsApi.list({ page, limit: 6, category: cat, tag }).catch(() => null),
  ]);

  // 精选
  const featuredGrid = document.getElementById('featured-grid');
  const fp = featuredPosts.value || [];
  if (fp.length) {
    featuredGrid.innerHTML = fp.map((p, i) => cardHTML(p, i === 0 ? 'featured-hero' : '')).join('');
    bindCardClicks(featuredGrid, navigate);
  } else {
    featuredGrid.innerHTML = '<p style="color:var(--text-muted)">暂无精选文章</p>';
  }

  // 列表
  const grid  = document.getElementById('posts-grid');
  const data  = listData.value;
  if (data?.posts?.length) {
    grid.innerHTML = data.posts.map(p => cardHTML(p)).join('');
    bindCardClicks(grid, navigate);
    renderPagination(
      document.getElementById('pagination'),
      data.totalPages, page,
      p => {
        const path = cat ? `/category/${cat}` : tag ? `/tag/${tag}` : '/';
        navigate(p === 1 ? path : `${path}?page=${p}`);
      },
    );
  } else {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted)">暂无相关文章 🥟</div>';
  }
}

function skeletons(n) {
  return Array(n).fill('<div class="skeleton-card"></div>').join('');
}
