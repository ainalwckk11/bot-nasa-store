const { Markup } = require('telegraf');
const digiflazz = require('../../api/digiflazz');
const { formatCurrency } = require('../../utils/formatter');

module.exports = (bot) => {
  bot.command('search', async (ctx) => {
    const keyword = ctx.message.text.replace('/search', '').trim();

    if (!keyword) {
      return await ctx.reply(
        '🔍 *Cara Penggunaan:*\n\n`/search <nama produk>`\n\nContoh:\n`/search telkomsel`\n`/search mobile legend`\n`/search PLN`',
        { parse_mode: 'Markdown' }
      );
    }

    try {
      const loadingMsg = await ctx.reply(`🔍 Mencari "${keyword}"...`);
      const results = await digiflazz.searchProducts(keyword, 'prepaid');

      if (results.length === 0) {
        return await ctx.telegram.editMessageText(
          ctx.chat.id, loadingMsg.message_id, null,
          `🔍 Tidak ditemukan produk untuk "${keyword}".\n\nCoba kata kunci lain.`
        );
      }

      // Batasi hasil tampil max 20
      const shown = results.slice(0, 20);

      let msg = `🔍 *Hasil Pencarian:* "${keyword}"\n`;
      msg += `📊 Ditemukan: ${results.length} produk`;
      if (results.length > 20) msg += ` (menampilkan 20 pertama)`;
      msg += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;

      for (const p of shown) {
        const st = p.buyer_product_status && p.seller_product_status ? '🟢' : '🔴';
        msg += `${st} *${p.product_name}*\n`;
        msg += `    \`${p.buyer_sku_code}\` — ${formatCurrency(p.price)}\n\n`;
      }

      msg += `\n💡 Gunakan \`/sku <kode>\` untuk detail produk`;

      await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, msg, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🏠 Menu Utama', 'cmd_start')],
        ]),
      });
    } catch (error) {
      console.error('Error search:', error);
      await ctx.reply(`❌ Gagal mencari produk.\n\n💬 ${error.message}`);
    }
  });
};
