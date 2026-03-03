/**
 * api.js — 统一的 API 請求层
 * 所有后端调用都经过这里，业务代码不直接 fetch
 */

/**
 * 基础 fetch 封装
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<any|null>}
 */
async function request(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error = new Error(err.error || `HTTP ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return await res.json();
  } catch (err) {
    console.error(`[API] ${options.method || 'GET'} ${url}:`, err.message);
    throw err;   // 让调用方决定如何处理
  }
}

// ── Posts ────────────────────────────────────────────────────────────────────
export const posts = {
  /**
   * @param {{ page?, limit?, category?, search?, tag? }} params
   */
  list: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)),
    ).toString();
    return request(`/api/posts${q ? `?${q}` : ''}`);
  },
  featured: ()         => request('/api/posts/featured'),
  show:     (slug)     => request(`/api/posts/${slug}`),
  create:   (data)     => request('/api/posts',       { method: 'POST',   body: JSON.stringify(data) }),
  update:   (id, data) => request(`/api/posts/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
  remove:   (id)       => request(`/api/posts/${id}`, { method: 'DELETE' }),
  like:     (id)       => request(`/api/posts/${id}/like`, { method: 'POST' }),
};

// ── Categories ───────────────────────────────────────────────────────────────
export const categories = {
  list:   ()       => request('/api/categories'),
  create: (data)   => request('/api/categories',       { method: 'POST',   body: JSON.stringify(data) }),
  remove: (id)     => request(`/api/categories/${id}`, { method: 'DELETE' }),
};

// ── Comments ─────────────────────────────────────────────────────────────────
export const comments = {
  listByPost: (postId) => request(`/api/comments/${postId}`),
  create:     (data)   => request('/api/comments', { method: 'POST', body: JSON.stringify(data) }),
  remove:     (id)     => request(`/api/comments/${id}`, { method: 'DELETE' }),
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  login:  (data) => request('/api/auth/login',  { method: 'POST', body: JSON.stringify(data) }),
  logout: ()     => request('/api/auth/logout', { method: 'POST' }),
  check:  ()     => request('/api/auth/check'),
};
