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

  // ======== Step 1: Pilih kategori → tampilkan brands ========
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
        const row = [Markup.button.callback(`🏢 ${brands[i]}`, `brnd_${idx}_${i}`)];
        if (brands[i + 1]) row.push(Markup.button.callback(`🏢 ${brands[i + 1]}`, `brnd_${idx}_${i + 1}`));
        buttons.push(row);
      }
      buttons.push([Markup.button.callback('◀️ Kembali ke Kategori', 'back_categories')]);

      await ctx.editMessageText(`📂 Kategori: *${category}*\n━━━━━━━━━━━━━━━━━━━━\nPilih brand/game:`, {
        parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons)
      });
    } catch (error) {
      console.error('Error pilih kategori:', error);
      await ctx.reply(`❌ Gagal memuat brand.`);
    }
  });

  // ======== Step 2: Pilih brand → tampilkan tipe/sub-kategori ========
  bot.action(/^brnd_(\d+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const catIdx = parseInt(ctx.match[1]);
      const brdIdx = parseInt(ctx.match[2]);

      const categories = await digiflazz.getCategories('prepaid');
      const category = categories[catIdx];
      if (!category) return;

      const brands = await digiflazz.getBrandsByCategory(category, 'prepaid');
      const brand = brands[brdIdx];
      if (!brand) return;

      // Ambil tipe/sub-kategori untuk brand ini
      const types = await digiflazz.getTypesByBrand(brand, 'prepaid');

      // Jika hanya 1 tipe, langsung tampilkan produk
      if (types.length <= 1) {
        return showProductsByBrandAndType(ctx, catIdx, brdIdx, 0, 0, categories, brands, types);
      }

      // Tampilkan daftar tipe
      const buttons = [];
      for (let i = 0; i < types.length; i += 2) {
        const row = [Markup.button.callback(`📋 ${types[i]}`, `type_${catIdx}_${brdIdx}_${i}_0`)];
        if (types[i + 1]) row.push(Markup.button.callback(`📋 ${types[i + 1]}`, `type_${catIdx}_${brdIdx}_${i + 1}_0`));
        buttons.push(row);
      }
      buttons.push([Markup.button.callback('◀️ Kembali ke Brand', `cat_${catIdx}`)]);
      buttons.push([Markup.button.callback('🏠 Menu', 'cmd_start')]);

      await ctx.editMessageText(
        `🏢 *${brand}*\n📂 Kategori: ${category}\n━━━━━━━━━━━━━━━━━━━━\n📋 Pilih tipe produk:`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
      );
    } catch (error) {
      console.error('Error pilih brand:', error);
      await ctx.reply(`❌ Gagal memuat tipe produk.`);
    }
  });

  // ======== Step 3: Pilih tipe → tampilkan produk dengan paginasi ========
  bot.action(/^type_(\d+)_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const catIdx = parseInt(ctx.match[1]);
      const brdIdx = parseInt(ctx.match[2]);
      const typIdx = parseInt(ctx.match[3]);
      const page = parseInt(ctx.match[4]);

      const categories = await digiflazz.getCategories('prepaid');
      const brands = await digiflazz.getBrandsByCategory(categories[catIdx], 'prepaid');
      const types = await digiflazz.getTypesByBrand(brands[brdIdx], 'prepaid');

      await showProductsByBrandAndType(ctx, catIdx, brdIdx, typIdx, page, categories, brands, types);
    } catch (error) {
      console.error('Error pilih tipe:', error);
      await ctx.reply(`❌ Gagal memuat produk.`);
    }
  });

  // ======== Tombol kembali ke kategori ========
  bot.action('back_categories', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const categories = await digiflazz.getCategories('prepaid');
      if (categories.length === 0) {
        return await ctx.editMessageText('📦 Tidak ada produk.');
      }

      const buttons = [];
      for (let i = 0; i < categories.length; i += 2) {
        const row = [Markup.button.callback(`📂 ${categories[i]}`, `cat_${i}`)];
        if (categories[i + 1]) row.push(Markup.button.callback(`📂 ${categories[i + 1]}`, `cat_${i + 1}`));
        buttons.push(row);
      }
      buttons.push([Markup.button.callback('🏠 Menu Utama', 'cmd_start')]);

      await ctx.editMessageText(
        `📦 *Daftar Kategori Produk*\n━━━━━━━━━━━━━━━━━━━━\nPilih kategori:`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
      );
    } catch (error) {
      console.error('Error kembali ke kategori:', error);
    }
  });
};

/**
 * Helper: Tampilkan produk berdasarkan brand + type dengan paginasi
 */
async function showProductsByBrandAndType(ctx, catIdx, brdIdx, typIdx, page, categories, brands, types) {
  const brand = brands[brdIdx];
  const type = types[typIdx] || types[0] || 'Umum';

  const products = await digiflazz.getProductsByBrandAndType(brand, type, 'prepaid');

  if (products.length === 0) {
    return await ctx.editMessageText(
      `📦 Tidak ada produk aktif untuk *${brand}* — ${type}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('◀️ Kembali', `brnd_${catIdx}_${brdIdx}`)],
          [Markup.button.callback('🏠 Menu', 'cmd_start')],
        ]),
      }
    );
  }

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const start = page * ITEMS_PER_PAGE;
  const pageProducts = products.slice(start, start + ITEMS_PER_PAGE);

  let msg = `🏢 *${brand}*\n📋 Tipe: *${type}*\n`;
  msg += `📊 ${products.length} produk | Hal. ${page + 1}/${totalPages}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  for (const p of pageProducts) {
    msg += `🟢 *${p.product_name}*\n    \`${p.buyer_sku_code}\` — ${formatCurrency(p.price)}\n\n`;
  }

  // Tombol navigasi
  const navBtns = [];
  if (page > 0) navBtns.push(Markup.button.callback('◀️', `type_${catIdx}_${brdIdx}_${typIdx}_${page - 1}`));
  navBtns.push(Markup.button.callback(`${page + 1}/${totalPages}`, 'noop'));
  if (page < totalPages - 1) navBtns.push(Markup.button.callback('▶️', `type_${catIdx}_${brdIdx}_${typIdx}_${page + 1}`));

  const buttons = [];
  if (navBtns.length > 1) buttons.push(navBtns);

  // Tombol kembali: ke tipe jika ada banyak tipe, ke brand jika hanya 1 tipe
  if (types.length > 1) {
    buttons.push([Markup.button.callback('◀️ Kembali ke Tipe', `brnd_${catIdx}_${brdIdx}`)]);
  } else {
    buttons.push([Markup.button.callback('◀️ Kembali ke Brand', `cat_${catIdx}`)]);
  }
  buttons.push([Markup.button.callback('🏠 Menu', 'cmd_start')]);

  await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
}

module.exports.handleProduct = handleProduct;
