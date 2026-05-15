/**
 * Simple in-memory transaction store
 * Menyimpan riwayat transaksi selama bot berjalan
 * Auto-cleanup transaksi lebih dari 24 jam
 */
class TransactionStore {
  constructor() {
    this.transactions = new Map();

    // Cleanup setiap 1 jam
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  /**
   * Simpan data transaksi baru
   * @param {string} refId
   * @param {object} data - { sku, customerNo, product, chatId }
   */
  save(refId, data) {
    this.transactions.set(refId, {
      ...data,
      createdAt: new Date(),
      lastStatus: data.lastStatus || 'Pending',
      result: data.result || null,
    });
  }

  /**
   * Ambil data transaksi berdasarkan ref_id
   * @param {string} refId
   * @returns {object|null}
   */
  get(refId) {
    return this.transactions.get(refId) || null;
  }

  /**
   * Update data transaksi
   * @param {string} refId
   * @param {object} updates
   */
  update(refId, updates) {
    const existing = this.transactions.get(refId);
    if (existing) {
      this.transactions.set(refId, { ...existing, ...updates });
    }
  }

  /**
   * Hapus transaksi lebih dari 24 jam
   */
  cleanup() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let cleaned = 0;
    for (const [refId, data] of this.transactions) {
      if (data.createdAt.getTime() < oneDayAgo) {
        this.transactions.delete(refId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`🧹 Membersihkan ${cleaned} transaksi lama dari store`);
    }
  }

  /**
   * Hentikan cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

module.exports = new TransactionStore();
