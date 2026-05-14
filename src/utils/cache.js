/**
 * Simple in-memory cache with TTL support
 */
class Cache {
  constructor() {
    this.store = new Map();
  }

  /**
   * Get cached value by key
   * @param {string} key
   * @returns {*|null} cached value or null if expired/not found
   */
  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Set cache value with TTL
   * @param {string} key
   * @param {*} value
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl) {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear all cached data
   */
  clear() {
    this.store.clear();
  }

  /**
   * Delete specific key
   * @param {string} key
   */
  delete(key) {
    this.store.delete(key);
  }
}

module.exports = new Cache();
