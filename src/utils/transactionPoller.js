/**
 * Auto-polling untuk transaksi pending
 * Mengecek status transaksi secara berkala dan mengirim update ke Telegram
 */
const { Markup } = require('telegraf');
const digiflazz = require('../api/digiflazz');
const transactionStore = require('./transactionStore');
const { formatTransaction } = require('./formatter');

const POLL_INTERVAL = 10000; // 10 detik (Digiflazz menyarankan min 1 menit, 10 detik sebagai kompromi)
const MAX_POLL_DURATION = 5 * 60 * 1000; // 5 menit maksimal polling

class TransactionPoller {
  constructor() {
    this.bot = null;
    this.activePolls = new Map();
  }

  /**
   * Set bot instance untuk mengirim pesan
   * @param {object} bot - Telegraf bot instance
   */
  setBotInstance(bot) {
    this.bot = bot;
  }

  /**
   * Mulai polling untuk transaksi pending
   * @param {string} refId
   * @param {object} pollData - { sku, customerNo, chatId, messageId }
   */
  startPolling(refId, pollData) {
    if (!this.bot) {
      console.error('❌ Bot instance belum di-set untuk TransactionPoller');
      return;
    }

    // Jangan double-poll
    if (this.activePolls.has(refId)) {
      return;
    }

    const { sku, customerNo, chatId } = pollData;
    const startTime = Date.now();

    console.log(`🔄 Mulai polling transaksi: ${refId}`);

    const intervalId = setInterval(async () => {
      try {
        // Cek apakah sudah melebihi durasi maksimal
        if (Date.now() - startTime > MAX_POLL_DURATION) {
          this.stopPolling(refId);
          console.log(`⏰ Polling timeout untuk: ${refId}`);

          await this.bot.telegram.sendMessage(
            chatId,
            `⏰ *STATUS TIMEOUT*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Transaksi \`${refId}\` belum selesai setelah 5 menit\\.\n\n` +
            `Gunakan perintah berikut untuk cek manual:\n` +
            `\`/cektrx ${refId}\``,
            { parse_mode: 'Markdown' }
          );
          return;
        }

        // Cek status transaksi
        const result = await digiflazz.checkTransactionStatus(sku, customerNo, refId);
        const status = result?.status;

        if (status === 'Sukses') {
          this.stopPolling(refId);
          transactionStore.update(refId, { lastStatus: 'Sukses', result });
          console.log(`✅ Transaksi sukses: ${refId}`);

          const msg = formatTransaction(result);
          await this.bot.telegram.sendMessage(chatId, msg, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('💳 Cek Saldo', 'cmd_balance')],
              [Markup.button.callback('🛒 Beli Lagi', 'cmd_buy')],
              [Markup.button.callback('🏠 Menu Utama', 'cmd_start')],
            ]),
          });
        } else if (status === 'Gagal') {
          this.stopPolling(refId);
          transactionStore.update(refId, { lastStatus: 'Gagal', result });
          console.log(`❌ Transaksi gagal: ${refId}`);

          const msg = formatTransaction(result);
          await this.bot.telegram.sendMessage(chatId, msg, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🛒 Beli Lagi', 'cmd_buy')],
              [Markup.button.callback('🏠 Menu Utama', 'cmd_start')],
            ]),
          });
        }
        // Jika masih Pending, lanjutkan polling
      } catch (error) {
        console.error(`❌ Error polling transaksi ${refId}:`, error.message);
      }
    }, POLL_INTERVAL);

    this.activePolls.set(refId, intervalId);
  }

  /**
   * Hentikan polling untuk satu transaksi
   * @param {string} refId
   */
  stopPolling(refId) {
    const intervalId = this.activePolls.get(refId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activePolls.delete(refId);
      console.log(`🛑 Polling dihentikan untuk: ${refId}`);
    }
  }

  /**
   * Hentikan semua polling (untuk graceful shutdown)
   */
  stopAll() {
    for (const [refId, intervalId] of this.activePolls) {
      clearInterval(intervalId);
    }
    const count = this.activePolls.size;
    this.activePolls.clear();
    if (count > 0) {
      console.log(`🛑 Menghentikan ${count} polling aktif`);
    }
  }
}

module.exports = new TransactionPoller();
