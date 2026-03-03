/**
 * store.js — 轻量级全局状态管理
 * 使用发布/订阅模式，避免全局变量污染
 */

class Store {
  constructor() {
    this._state = {
      categories: [],
      isAdmin:    false,
      username:   '',
    };
    this._listeners = {};
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    const prev = this._state[key];
    this._state[key] = value;
    if (prev !== value) {
      this._emit(key, value, prev);
    }
  }

  /** 订阅状态变化 */
  on(key, fn) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(fn);
    return () => this.off(key, fn);  // 返回取消订阅函数
  }

  off(key, fn) {
    this._listeners[key] = (this._listeners[key] || []).filter(f => f !== fn);
  }

  _emit(key, value, prev) {
    (this._listeners[key] || []).forEach(fn => fn(value, prev));
  }
}

// 单例 export
export const store = new Store();
