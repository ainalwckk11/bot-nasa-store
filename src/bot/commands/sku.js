const { Markup } = require('telegraf');
const digiflazz = require('../../api/digiflazz');
const { formatProduct } = require('../../utils/formatter');

module.exports = (bot) => {
  bot.command('sku', async (ctx) => {
    const skuCode = ctx.message.text.replace('/sku', '').trim();

    if (!skuCode) {
      return await ctx.reply(
        '🏷️ *Cara Penggunaan:*\n\n`/sku <kode_sku>`\n\nContoh:\n`/sku tsel5`\n`/sku xld10`\n`/sku pln20`',
        { parse_mode: 'Markdown' }
      );
    }

    try {
      const loadingMsg = await ctx.reply(`🏷️ Mencari SKU: ${skuCode}...`);
      const product = await digiflazz.findProductBySku(skuCode, 'prepaid');

      if (!product) {
        return await ctx.telegram.editMessageText(
          ctx.chat.id, loadingMsg.message_id, null,
          `🏷️ SKU \`${skuCode}\` tidak ditemukan.\n\nPastikan kode SKU benar.\nGunakan /search untuk mencari produk.`,
          { parse_mode: 'Markdown' }
        );
      }

      const msg = formatProduct(product);
      const isActive = product.buyer_product_status && product.seller_product_status;

      const buttons = [];
      if (isActive) {
        buttons.push([Markup.button.callback(`🛒 Beli ${product.product_name}`, `quickbuy_${product.buyer_sku_code}`)]);
      }
      buttons.push([Markup.button.callback('🔍 Cari Lagi', 'prompt_search')]);
      buttons.push([Markup.button.callback('🏠 Menu Utama', 'cmd_start')]);

      await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, msg, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons),
      });
    } catch (error) {
      console.error('Error SKU:', error);
      await ctx.reply(`❌ Gagal memuat detail produk.\n\n💬 ${error.message}`);
    }
  });

  // Prompt search
  bot.action('prompt_search', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🔍 Ketik perintah pencarian:\n\n`/search <nama produk>`', { parse_mode: 'Markdown' });
  });

  // Quick buy dari detail SKU
  bot.action(/^quickbuy_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const sku = ctx.match[1];
    try {
      // Masuk ke scene buy dengan SKU sudah terisi
      ctx.scene.state.prefillSku = sku;
      await ctx.scene.enter('buyScene');
    } catch (e) {
      await ctx.reply(`🛒 Gunakan perintah /buy untuk membeli produk.\nSKU: \`${sku}\``, { parse_mode: 'Markdown' });
    }
  });
};
