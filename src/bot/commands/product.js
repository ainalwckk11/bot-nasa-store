const { Markup } = require('telegraf');
const digiflazz = require('../../api/digiflazz');
const { formatCurrency } = require('../../utils/formatter');

const ITEMS_PER_PAGE = 8;

async function handleProduct(ctx) {
  try {
    const loadingMsg = await ctx.reply('⏳ Memuat daftar kategori produk...');
    const categories = await digiflazz.getCategories('prepaid');

    if (categories.length === 0) {
      return await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, '📦 Tidak ada produk.');
    }

    const buttons = [];
    for (let i = 0; i < categories.length; i += 2) {
      const row = [Markup.button.callback(`📂 ${categories[i]}`, `cat_${i}`)];
      if (categories[i + 1]) row.push(Markup.button.callback(`📂 ${categories[i + 1]}`, `cat_${i + 1}`));
      buttons.push(row);
    }
    buttons.push([Markup.button.callback('🏠 Menu Utama', 'cmd_start')]);

    await ctx.telegram.editMessageText(
      ctx.chat.id, loadingMsg.message_id, null,
      `📦 *Daftar Kategori Produk*\n━━━━━━━━━━━━━━━━━━━━\nPilih kategori:`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
  } catch (error) {
    console.error('Error daftar produk:', error);
    await ctx.reply(`❌ Gagal memuat produk.\n\n💬 ${error.message}`);
  }
}

module.exports = (bot) => {
  bot.command('product', handleProduct);

  bot.action(/^cat_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const idx = parseInt(ctx.match[1]);
      const categories = await digiflazz.getCategories('prepaid');
      const category = categories[idx];
      if (!category) return await ctx.answerCbQuery('❌ Kategori tidak ditemukan');

      const brands = await digiflazz.getBrandsByCategory(category, 'prepaid');
      const buttons = [];
      for (let i = 0; i < brands.length; i += 2) {
        const row = [Markup.button.callback(`🏢 ${brands[i]}`, `brd_${encodeURIComponent(brands[i])}_0`)];
        if (brands[i + 1]) row.push(Markup.button.callback(`🏢 ${brands[i + 1]}`, `brd_${encodeURIComponent(brands[i + 1])}_0`));
        buttons.push(row);
      }
      buttons.push([Markup.button.callback('◀️ Kembali', 'cmd_product')]);

      await ctx.editMessageText(`📂 Kategori: *${category}*\n━━━━━━━━━━━━━━━━━━━━\nPilih brand:`, {
        parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons)
      });
    } catch (error) {
      console.error('Error pilih kategori:', error);
      await ctx.reply(`❌ Gagal memuat brand.`);
    }
  });

  bot.action(/^brd_(.+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const brand = decodeURIComponent(ctx.match[1]);
      const page = parseInt(ctx.match[2]);
      const products = await digiflazz.getProductsByBrand(brand, 'prepaid');

      if (products.length === 0) return await ctx.editMessageText('📦 Tidak ada produk.');

      const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
      const start = page * ITEMS_PER_PAGE;
      const pageProducts = products.slice(start, start + ITEMS_PER_PAGE);

      let msg = `🏢 *${brand}*\n📊 ${products.length} produk | Hal. ${page + 1}/${totalPages}\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      for (const p of pageProducts) {
        const st = p.buyer_product_status && p.seller_product_status ? '🟢' : '🔴';
        msg += `${st} *${p.product_name}*\n    \`${p.buyer_sku_code}\` — ${formatCurrency(p.price)}\n\n`;
      }

      const navBtns = [];
      if (page > 0) navBtns.push(Markup.button.callback('◀️', `brd_${encodeURIComponent(brand)}_${page - 1}`));
      if (page < totalPages - 1) navBtns.push(Markup.button.callback('▶️', `brd_${encodeURIComponent(brand)}_${page + 1}`));

      const buttons = [];
      if (navBtns.length > 0) buttons.push(navBtns);
      buttons.push([Markup.button.callback('◀️ Kembali', 'cmd_product')]);
      buttons.push([Markup.button.callback('🏠 Menu', 'cmd_start')]);

      await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
    } catch (error) {
      console.error('Error pilih brand:', error);
      await ctx.reply(`❌ Gagal memuat produk.`);
    }
  });
};

module.exports.handleProduct = handleProduct;
