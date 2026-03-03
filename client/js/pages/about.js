/**
 * pages/about.js — 关于页
 */
import { posts as postsApi, categories as catsApi } from '../api.js';

export async function renderAbout() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="page-hero">
      <div class="container">
        <h1>🍜 关于这里</h1>
        <p>十块钱，一只小笼包，一段温暖的故事</p>
      </div>
    </section>
    <section class="section">
      <div class="container narrow">
        <div class="about-content">
          <div class="about-avatar">🥟</div>
          <h2>你好，我是小笼包博主</h2>
          <p>一个热爱美食、热爱生活的普通人。这个博客记录的，是那些让我觉得"活着真好"的瞬间——</p>
          <p>可能是一只十块钱的小笼包，可能是某个雨天的一碗汤面，可能是藏在地下室的宝藏小店，也可能是学做一道菜失败了七次之后的顿悟。</p>
          <blockquote>"最好的东西不一定是最贵的，但一定是最用心的。"</blockquote>
          <p>欢迎来到这里，希望你也能找到属于自己的那个温暖瞬间。</p>
          <div class="about-stats">
            <div class="stat"><span class="stat-num" id="stat-posts">--</span><span>篇文章</span></div>
            <div class="stat"><span class="stat-num" id="stat-cats">--</span><span>个分类</span></div>
            <div class="stat"><span class="stat-num" id="stat-views">--</span><span>次阅读</span></div>
          </div>
        </div>
      </div>
    </section>`;

  // 异步加载统计
  try {
    const [listData, cats] = await Promise.all([
      postsApi.list({ limit: 1000 }),
      catsApi.list(),
    ]);
    if (listData) {
      document.getElementById('stat-posts').textContent = listData.total || 0;
      const totalViews = (listData.posts || []).reduce((s, p) => s + (p.views || 0), 0);
      document.getElementById('stat-views').textContent =
        totalViews > 9999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews;
    }
    if (cats) {
      document.getElementById('stat-cats').textContent = cats.length || 0;
    }
  } catch { /* 统计加载失败静默处理 */ }
}
