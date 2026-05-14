const { Scenes, Markup } = require('telegraf');
const digiflazz = require('../../api/digiflazz');
const { formatCurrency, formatTransaction, formatProduct, generateRefId } = require('../../utils/formatter');

// ============================================================
// Konfigurasi input per game/produk
// Setiap entry mendefinisikan:
//   - match: keyword untuk mencocokkan brand/product_name/category/sku
//   - fields: array input yang dibutuhkan
//     - key: nama field internal
//     - label: label yang ditampilkan ke user
//     - emoji: emoji untuk pesan
//   - separator: karakter pemisah antara field (untuk customer_no gabungan)
//   - formatTarget: function untuk menggabungkan input jadi customer_no
// ============================================================

const PRODUCT_INPUT_CONFIG = [
  {
    id: 'ml',
    name: 'Mobile Legends',
    match: ['mobile legend', 'mlbb'],
    fields: [
      { key: 'userId', label: 'User ID', emoji: '👤' },
      { key: 'zoneId', label: 'Zone ID (Server ID)', emoji: '🌐' },
    ],
    formatTarget: (inputs) => `${inputs.userId}${inputs.zoneId}`,
  },
  {
    id: 'ff',
    name: 'Free Fire',
    match: ['free fire', 'freefire', 'garena free fire'],
    fields: [
      { key: 'userId', label: 'User ID Free Fire', emoji: '👤' },
    ],
    formatTarget: (inputs) => inputs.userId,
  },
  {
    id: 'pubg',
    name: 'PUBG Mobile',
    match: ['pubg'],
    fields: [
      { key: 'userId', label: 'User ID PUBG', emoji: '👤' },
    ],
    formatTarget: (inputs) => inputs.userId,
  },
  {
    id: 'genshin',
    name: 'Genshin Impact',
    match: ['genshin'],
    fields: [
      { key: 'userId', label: 'UID Genshin Impact', emoji: '👤' },
      { key: 'serverId', label: 'Server (os_asia, os_euro, dll)', emoji: '🌐' },
    ],
    formatTarget: (inputs) => `${inputs.userId}${inputs.serverId}`,
  },
  {
    id: 'hok',
    name: 'Honor of Kings',
    match: ['honor of kings', 'hok'],
    fields: [
      { key: 'userId', label: 'Open ID / User ID', emoji: '👤' },
    ],
    formatTarget: (inputs) => inputs.userId,
  },
  {
    id: 'valorant',
    name: 'Valorant',
    match: ['valorant'],
    fields: [
      { key: 'userId', label: 'Riot ID (Nama#Tag)', emoji: '👤' },
    ],
    formatTarget: (inputs) => inputs.userId,
  },
  {
    id: 'aov',
    name: 'Arena of Valor',
    match: ['arena of valor', 'aov'],
    fields: [
      { key: 'userId', label: 'User ID AOV', emoji: '👤' },
    ],
    formatTarget: (inputs) => inputs.userId,
  },
  {
    id: 'ragnarok',
    name: 'Ragnarok',
    match: ['ragnarok'],
    fields: [
      { key: 'userId', label: 'User ID Ragnarok', emoji: '👤' },
    ],
    formatTarget: (inputs) => inputs.userId,
  },
  {
    id: 'pointblank',
    name: 'Point Blank',
    match: ['point blank', 'pb '],
    fields: [
      { key: 'userId', label: 'User ID Point Blank', emoji: '👤' },
    ],
    formatTarget: (inputs) => inputs.userId,
  },
  {
    id: 'honkai_sr',
    name: 'Honkai Star Rail',
    match: ['honkai star rail', 'honkai: star rail', 'star rail'],
    fields: [
      { key: 'userId', label: 'UID Honkai Star Rail', emoji: '👤' },
      { key: 'serverId', label: 'Server (os_asia, os_euro, dll)', emoji: '🌐' },
    ],
    formatTarget: (inputs) => `${inputs.userId}${inputs.serverId}`,
  },
  {
    id: 'honkai',
    name: 'Honkai Impact 3',
    match: ['honkai impact', 'honkai 3'],
    fields: [
      { key: 'userId', label: 'User ID Honkai Impact', emoji: '👤' },
    ],
    formatTarget: (inputs) => inputs.userId,
  },
  {
    id: 'cod',
    name: 'Call of Duty Mobile',
    match: ['call of duty', 'cod mobile', 'codm'],
    fields: [
      { key: 'userId', label: 'Player ID CODM', emoji: '👤' },
    ],
    formatTarget: (inputs) => inputs.userId,
  },
  {
    id: 'stumble',
    name: 'Stumble Guys',
    match: ['stumble guys', 'stumble'],
    fields: [
      { key: 'userId', label: 'User ID Stumble Guys', emoji: '👤' },
    ],
    formatTarget: (inputs) => inputs.userId,
  },
  {
    id: 'super_sus',
    name: 'Super Sus',
    match: ['super sus'],
    fields: [
      { key: 'userId', label: 'User ID Super Sus', emoji: '👤' },
    ],
    formatTarget: (inputs) => inputs.userId,
  },
];

/**
 * Deteksi konfigurasi input berdasarkan data produk
 * Mencocokkan brand, product_name, category, dan sku
 *
 * @param {object} product - produk dari Digiflazz price list
 * @returns {object|null} konfigurasi input atau null jika bukan game
 */
function detectInputConfig(product) {
  const searchFields = [
    (product.brand || '').toLowerCase(),
    (product.product_name || '').toLowerCase(),
    (product.category || '').toLowerCase(),
    (product.buyer_sku_code || '').toLowerCase(),
  ].join(' ');

  for (const config of PRODUCT_INPUT_CONFIG) {
    const matched = config.match.some((keyword) => searchFields.includes(keyword.toLowerCase()));
    if (matched) return config;
  }

  return null;
}

/**
 * Buat pesan input yang sesuai berdasarkan tipe produk
 */
function buildInputPrompt(product, inputConfig, currentFieldIndex) {
  const field = inputConfig.fields[currentFieldIndex];
  const totalFields = inputConfig.fields.length;

  let msg = '';
  if (currentFieldIndex === 0) {
    msg += `📦 *${product.product_name}*\n`;
    msg += `💰 Harga: *${formatCurrency(product.price)}*\n`;
    msg += `🎮 Game: *${inputConfig.name}*\n`;
    if (totalFields > 1) {
      msg += `📋 Input: ${totalFields} data diperlukan\n`;
    }
    msg += `\n`;
  }

  msg += `${field.emoji} Masukkan *${field.label}*:`;

  return msg;
}

// ============================================================
// DEFAULT CONFIG untuk produk non-game (pulsa, data, PLN, dll)
// ============================================================
const DEFAULT_INPUT_CONFIG = {
  id: 'default',
  name: 'Umum',
  fields: [
    { key: 'customerNo', label: 'Nomor Tujuan / Customer ID', emoji: '📱' },
  ],
  formatTarget: (inputs) => inputs.customerNo,
};

// ============================================================
// Buy Scene Wizard
// ============================================================

const buyScene = new Scenes.WizardScene(
  'buyScene',

  // ======== STEP 0: Minta SKU ========
  async (ctx) => {
    const prefillSku = ctx.scene.state.prefillSku;

    if (prefillSku) {
      ctx.wizard.state.sku = prefillSku;
      const product = await digiflazz.findProductBySku(prefillSku);

      if (!product) {
        await ctx.reply(`❌ SKU \`${prefillSku}\` tidak ditemukan.`, { parse_mode: 'Markdown' });
        return ctx.scene.leave();
      }

      ctx.wizard.state.product = product;

      // Deteksi input config berdasarkan produk
      const inputConfig = detectInputConfig(product) || DEFAULT_INPUT_CONFIG;
      ctx.wizard.state.inputConfig = inputConfig;
      ctx.wizard.state.currentFieldIndex = 0;
      ctx.wizard.state.collectedInputs = {};

      const prompt = buildInputPrompt(product, inputConfig, 0);

      await ctx.reply(prompt, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel_buy')]]),
      });

      return ctx.wizard.selectStep(2); // Langsung ke step input
    }

    await ctx.reply(
      `🛒 *PROSES PEMBELIAN*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Masukkan *kode SKU* produk yang ingin dibeli:\n\n` +
      `💡 Gunakan /search atau /product untuk mencari SKU\n` +
      `Contoh: \`tsel5\`, \`xld10\`, \`pln20\``,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel_buy')]]) }
    );

    return ctx.wizard.next();
  },

  // ======== STEP 1: Validasi SKU ========
  async (ctx) => {
    if (!ctx.message?.text) {
      return await ctx.reply('⚠️ Masukkan kode SKU dalam bentuk teks.');
    }

    const sku = ctx.message.text.trim();

    if (sku.startsWith('/')) {
      await ctx.reply('⚠️ Pembelian dibatalkan.');
      return ctx.scene.leave();
    }

    try {
      const loadingMsg = await ctx.reply(`🔍 Mencari SKU: ${sku}...`);
      const product = await digiflazz.findProductBySku(sku);

      if (!product) {
        await ctx.telegram.editMessageText(
          ctx.chat.id, loadingMsg.message_id, null,
          `❌ SKU \`${sku}\` tidak ditemukan.\n\nMasukkan SKU yang benar atau ketik /buy untuk ulang.`,
          { parse_mode: 'Markdown' }
        );
        return ctx.scene.leave();
      }

      if (!product.buyer_product_status || !product.seller_product_status) {
        await ctx.telegram.editMessageText(
          ctx.chat.id, loadingMsg.message_id, null,
          `🔴 Produk *${product.product_name}* sedang *nonaktif*.\nSilakan pilih produk lain.`,
          { parse_mode: 'Markdown' }
        );
        return ctx.scene.leave();
      }

      ctx.wizard.state.sku = sku;
      ctx.wizard.state.product = product;

      // Deteksi konfigurasi input
      const inputConfig = detectInputConfig(product) || DEFAULT_INPUT_CONFIG;
      ctx.wizard.state.inputConfig = inputConfig;
      ctx.wizard.state.currentFieldIndex = 0;
      ctx.wizard.state.collectedInputs = {};

      const isGame = inputConfig.id !== 'default';
      let infoLine = '';
      if (isGame) {
        const fieldNames = inputConfig.fields.map((f) => f.label).join(', ');
        infoLine = `\n🎮 Terdeteksi: *${inputConfig.name}*\n📋 Data yang diperlukan: ${fieldNames}\n`;
      }

      const prompt = buildInputPrompt(product, inputConfig, 0);

      await ctx.telegram.editMessageText(
        ctx.chat.id, loadingMsg.message_id, null,
        `✅ Produk ditemukan!\n\n` + formatProduct(product) + infoLine + `\n` + prompt,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel_buy')]]) }
      );

      return ctx.wizard.next();
    } catch (error) {
      console.error('Error validasi SKU:', error);
      await ctx.reply(`❌ Error: ${error.message}`);
      return ctx.scene.leave();
    }
  },

  // ======== STEP 2: Input fields (dynamic, multi-step) ========
  async (ctx) => {
    if (!ctx.message?.text) {
      return await ctx.reply('⚠️ Masukkan data dalam bentuk teks.');
    }

    const input = ctx.message.text.trim();

    if (input.startsWith('/')) {
      await ctx.reply('⚠️ Pembelian dibatalkan.');
      return ctx.scene.leave();
    }

    const { inputConfig, currentFieldIndex, product } = ctx.wizard.state;
    const currentField = inputConfig.fields[currentFieldIndex];

    // Simpan input untuk field saat ini
    ctx.wizard.state.collectedInputs[currentField.key] = input;

    const nextIndex = currentFieldIndex + 1;

    // Masih ada field selanjutnya?
    if (nextIndex < inputConfig.fields.length) {
      ctx.wizard.state.currentFieldIndex = nextIndex;

      // Tampilkan ringkasan input sebelumnya + minta field berikutnya
      let summary = '📝 *Data yang sudah diisi:*\n';
      for (let i = 0; i <= currentFieldIndex; i++) {
        const f = inputConfig.fields[i];
        summary += `  ${f.emoji} ${f.label}: \`${ctx.wizard.state.collectedInputs[f.key]}\`\n`;
      }

      const nextField = inputConfig.fields[nextIndex];
      summary += `\n${nextField.emoji} Masukkan *${nextField.label}*:`;

      await ctx.reply(summary, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel_buy')]]),
      });

      // Tetap di step yang sama (step 2) untuk mengumpulkan field berikutnya
      return;
    }

    // Semua field sudah terkumpul → format customer_no
    const customerNo = inputConfig.formatTarget(ctx.wizard.state.collectedInputs);
    ctx.wizard.state.customerNo = customerNo;

    // Tampilkan konfirmasi
    return showConfirmation(ctx);
  }
);

// ======== Konfirmasi Pembelian ========
async function showConfirmation(ctx) {
  const { product, customerNo, sku, inputConfig, collectedInputs } = ctx.wizard.state;

  let msg = `🛒 *KONFIRMASI PEMBELIAN*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `📦 Produk: *${product.product_name}*\n`;
  msg += `🏷️ SKU: \`${sku}\`\n`;

  // Tampilkan setiap field input yang sudah dikumpulkan
  if (inputConfig && inputConfig.fields.length > 1) {
    for (const field of inputConfig.fields) {
      msg += `${field.emoji} ${field.label}: \`${collectedInputs[field.key]}\`\n`;
    }
  } else {
    msg += `📱 Tujuan: \`${customerNo}\`\n`;
  }

  msg += `💰 Harga: *${formatCurrency(product.price)}*\n\n`;
  msg += `⚠️ *Saldo Digiflazz akan langsung terpotong!*\n`;
  msg += `Lanjutkan pembelian?`;

  await ctx.reply(msg, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Ya, Beli!', 'confirm_buy'),
        Markup.button.callback('❌ Batal', 'cancel_buy'),
      ],
    ]),
  });

  return ctx.wizard.next();
}

// ======== Handle Konfirmasi ========
buyScene.action('confirm_buy', async (ctx) => {
  await ctx.answerCbQuery('⏳ Memproses transaksi...');

  const { sku, customerNo, product } = ctx.wizard.state;
  const refId = generateRefId();

  try {
    await ctx.editMessageText(
      `⏳ *Memproses transaksi...*\n\n📦 ${product.product_name}\n📱 Tujuan: \`${customerNo}\`\n🔖 Ref: \`${refId}\``,
      { parse_mode: 'Markdown' }
    );

    const result = await digiflazz.createTransaction(sku, customerNo, refId);
    const msg = formatTransaction(result);

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💳 Cek Saldo', 'cmd_balance')],
        [Markup.button.callback('🛒 Beli Lagi', 'cmd_buy')],
        [Markup.button.callback('🏠 Menu Utama', 'cmd_start')],
      ]),
    });
  } catch (error) {
    console.error('Error transaksi:', error);
    await ctx.reply(
      `❌ *Transaksi Gagal*\n\n` +
      `📦 ${product.product_name}\n📱 ${customerNo}\n🔖 Ref: \`${refId}\`\n\n` +
      `💬 Error: ${error.message}`,
      { parse_mode: 'Markdown' }
    );
  }

  return ctx.scene.leave();
});

// ======== Handle Batal ========
buyScene.action('cancel_buy', async (ctx) => {
  await ctx.answerCbQuery('❌ Dibatalkan');
  await ctx.editMessageText('❌ Pembelian dibatalkan.', {
    ...Markup.inlineKeyboard([[Markup.button.callback('🏠 Menu Utama', 'cmd_start')]]),
  });
  return ctx.scene.leave();
});

module.exports = buyScene;
