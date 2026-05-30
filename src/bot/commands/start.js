const { Markup } = require('telegraf');

module.exports = (bot) => {
  bot.command('start', async (ctx) => {
    try {
      const name = ctx.from.first_name || 'Boss';

      const welcomeMsg =
        `🤖 *Selamat Datang, ${name}\\!*\n\n` +
        `Ini adalah *Bot NS Store* — asisten pribadi untuk transaksi produk digital via Digiflazz\\.\n\n` +
        `🔹 Semua transaksi menggunakan saldo Digiflazz kamu langsung\\.\n` +
        `🔹 Bot ini hanya untuk penggunaan pribadi\\.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📋 *Menu Perintah:*\n\n` +
        `💳 /balance — Cek saldo\n` +
        `📦 /product — Daftar produk\n` +
        `🔍 /search \\<nama\\> — Cari produk\n` +
        `🏷️ /sku \\<kode\\> — Detail produk\n` +
        `🛒 /buy — Beli produk\n` +
        `🔍 /cektrx \\<ref\\_id\\> — Cek transaksi\n` +
        `━━━━━━━━━━━━━━━━━━━━`;

      await ctx.reply(welcomeMsg, {
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💳 Cek Saldo', 'cmd_balance')],
          [Markup.button.callback('📦 Daftar Produk', 'cmd_product')],
          [Markup.button.callback('🛒 Beli Produk', 'cmd_buy')],
          [Markup.button.callback('🔄 Refresh Cache', 'cmd_refresh')],
        ]),
      });
    } catch (error) {
      console.error('Error di /start:', error);
      await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.');
    }
  });

  // Handle tombol menu dari /start
  bot.action('cmd_balance', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene?.leave?.();
    // Trigger /balance handler
    return require('./balance').handleBalance(ctx);
  });

  bot.action('cmd_product', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene?.leave?.();
    return require('./product').handleProduct(ctx);
  });

  bot.action('cmd_buy', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      await ctx.scene.enter('buyScene');
    } catch (e) {
      await ctx.reply('🛒 Gunakan perintah /buy untuk memulai pembelian.');
    }
  });

  bot.action('cmd_refresh', async (ctx) => {
    await ctx.answerCbQuery('🔄 Memperbarui cache...');
    const cache = require('../../utils/cache');
    cache.clear();
    await ctx.reply('✅ Cache berhasil di-refresh! Data produk akan diambil ulang dari Digiflazz.');
  });

  bot.action('cmd_start', async (ctx) => {
    await ctx.answerCbQuery();
    const name = ctx.from.first_name || 'Boss';

    const welcomeMsg =
      `🤖 *Selamat Datang, ${name}\\!*\n\n` +
      `Ini adalah *Bot NS Store* — asisten pribadi untuk transaksi produk digital via Digiflazz\\.\n\n` +
      `🔹 Semua transaksi menggunakan saldo Digiflazz kamu langsung\\.\n` +
      `🔹 Bot ini hanya untuk penggunaan pribadi\\.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Menu Perintah:*\n\n` +
      `💳 /balance — Cek saldo\n` +
      `📦 /product — Daftar produk\n` +
      `🔍 /search \\<nama\\> — Cari produk\n` +
      `🏷️ /sku \\<kode\\> — Detail produk\n` +
      `🛒 /buy — Beli produk\n` +
      `🔍 /cektrx \\<ref\\_id\\> — Cek transaksi\n` +
      `━━━━━━━━━━━━━━━━━━━━`;

    await ctx.editMessageText(welcomeMsg, {
      parse_mode: 'MarkdownV2',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💳 Cek Saldo', 'cmd_balance')],
        [Markup.button.callback('📦 Daftar Produk', 'cmd_product')],
        [Markup.button.callback('🛒 Beli Produk', 'cmd_buy')],
        [Markup.button.callback('🔄 Refresh Cache', 'cmd_refresh')],
      ]),
    });
  });
};
