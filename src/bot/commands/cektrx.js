const { Markup } = require('telegraf');
const digiflazz = require('../../api/digiflazz');
const transactionStore = require('../../utils/transactionStore');
const { formatCurrency, escapeMarkdown } = require('../../utils/formatter');

async function handleCekTrx(ctx, refId) {
  if (!refId) {
    return await ctx.reply(
      '🔍 *CEK STATUS TRANSAKSI*\n━━━━━━━━━━━━━━━━━━━━\n\n' +
      'Cara penggunaan:\n`/cektrx <ref_id>`\n\n' +
      'Contoh:\n`/cektrx NSLU1A2B3C`\n\n' +
      '💡 Ref ID bisa dilihat dari riwayat transaksi di chat ini.',
      { parse_mode: 'Markdown' }
    );
  }

  try {
    const loadingMsg = await ctx.reply(`🔍 Mengecek transaksi: \`${refId}\`...`, { parse_mode: 'Markdown' });

    // Cek di transaction store lokal dulu
    const storedTx = transactionStore.get(refId);

    if (!storedTx) {
      return await ctx.telegram.editMessageText(
        ctx.chat.id,
        loadingMsg.message_id,
        null,
        `❌ *Transaksi Tidak Ditemukan*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Ref ID: \`${refId}\`\n\n` +
        `Transaksi tidak ditemukan di riwayat bot ini.\n` +
        `Pastikan ref_id benar dan transaksi dibuat pada sesi bot saat ini.\n\n` +
        `💡 Riwayat transaksi hanya tersimpan selama bot berjalan.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🏠 Menu Utama', 'cmd_start')],
          ]),
        }
      );
    }

    // Cek status ke Digiflazz API
    const result = await digiflazz.checkTransactionStatus(
      storedTx.sku,
      storedTx.customerNo,
      refId
    );

    // Update store dengan status terbaru
    if (result?.status) {
      transactionStore.update(refId, { lastStatus: result.status, result });
    }

    // Format pesan hasil
    let statusEmoji = '⏳';
    let statusText = 'Pending';
    const data = result?.data || result || {};

    if (data.status === 'Sukses') {
      statusEmoji = '✅';
      statusText = 'Sukses';
    } else if (data.status === 'Gagal') {
      statusEmoji = '❌';
      statusText = 'Gagal';
    }

    const sanitizeCode = (text) => text ? String(text).replace(/`/g, "'") : '-';

    let msg = `${statusEmoji} *CEK STATUS TRANSAKSI*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `📦 Produk: *${escapeMarkdown(data.product_name || storedTx.product?.product_name || '-')}*\n`;
    msg += `🏷️ SKU: \`${sanitizeCode(data.buyer_sku_code || storedTx.sku)}\`\n`;
    msg += `📱 Tujuan: \`${sanitizeCode(data.customer_no || storedTx.customerNo)}\`\n`;
    msg += `💰 Harga: *${formatCurrency(data.price || storedTx.product?.price)}*\n`;
    msg += `📊 Status: *${statusText}*\n`;
    msg += `🔖 Ref ID: \`${sanitizeCode(data.ref_id || refId)}\`\n`;

    if (data.sn) {
      msg += `\n🔑 *Serial Number (SN):*\n\`${sanitizeCode(data.sn)}\`\n`;
    }

    if (data.message) {
      msg += `\n💬 Pesan: ${escapeMarkdown(data.message)}\n`;
    }

    // Waktu transaksi
    const txTime = data.tgl
      ? new Date(data.tgl).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      : storedTx.createdAt
        ? new Date(storedTx.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        : '-';

    msg += `\n⏰ Waktu: ${txTime}`;

    await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Refresh Status', `refresh_trx_${refId}`)],
        [Markup.button.callback('🏠 Menu Utama', 'cmd_start')],
      ]),
    });
  } catch (error) {
    console.error('Error cek transaksi:', error);
    await ctx.reply(
      `❌ Gagal mengecek transaksi.\n\n💬 ${error.message}`,
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🏠 Menu Utama', 'cmd_start')],
        ]),
      }
    );
  }
}

module.exports = (bot) => {
  bot.command('cektrx', async (ctx) => {
    const refId = ctx.message.text.replace('/cektrx', '').trim();
    return handleCekTrx(ctx, refId);
  });

  // Handle refresh status button
  bot.action(/^refresh_trx_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery('🔄 Memperbarui status...');
    const refId = ctx.match[1];

    try {
      const storedTx = transactionStore.get(refId);

      if (!storedTx) {
        return await ctx.editMessageText(
          `❌ Transaksi \`${refId}\` tidak ditemukan di riwayat.`,
          { parse_mode: 'Markdown' }
        );
      }

      const result = await digiflazz.checkTransactionStatus(
        storedTx.sku,
        storedTx.customerNo,
        refId
      );

      if (result?.status) {
        transactionStore.update(refId, { lastStatus: result.status, result });
      }

      const data = result?.data || result || {};
      let statusEmoji = '⏳';
      let statusText = 'Pending';

      if (data.status === 'Sukses') {
        statusEmoji = '✅';
        statusText = 'Sukses';
      } else if (data.status === 'Gagal') {
        statusEmoji = '❌';
        statusText = 'Gagal';
      }

      const sanitizeCode = (text) => text ? String(text).replace(/`/g, "'") : '-';

      let msg = `${statusEmoji} *CEK STATUS TRANSAKSI*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      msg += `📦 Produk: *${escapeMarkdown(data.product_name || storedTx.product?.product_name || '-')}*\n`;
      msg += `🏷️ SKU: \`${sanitizeCode(data.buyer_sku_code || storedTx.sku)}\`\n`;
      msg += `📱 Tujuan: \`${sanitizeCode(data.customer_no || storedTx.customerNo)}\`\n`;
      msg += `💰 Harga: *${formatCurrency(data.price || storedTx.product?.price)}*\n`;
      msg += `📊 Status: *${statusText}*\n`;
      msg += `🔖 Ref ID: \`${sanitizeCode(data.ref_id || refId)}\`\n`;

      if (data.sn) {
        msg += `\n🔑 *Serial Number (SN):*\n\`${sanitizeCode(data.sn)}\`\n`;
      }

      if (data.message) {
        msg += `\n💬 Pesan: ${escapeMarkdown(data.message)}\n`;
      }

      const txTime = data.tgl
        ? new Date(data.tgl).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        : storedTx.createdAt
          ? new Date(storedTx.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
          : '-';

      msg += `\n⏰ Waktu: ${txTime}`;
      msg += `\n🔄 Terakhir dicek: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

      await ctx.editMessageText(msg, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Refresh Status', `refresh_trx_${refId}`)],
          [Markup.button.callback('🏠 Menu Utama', 'cmd_start')],
        ]),
      });
    } catch (error) {
      console.error('Error refresh transaksi:', error);
      await ctx.answerCbQuery('❌ Gagal memperbarui status');
    }
  });
};

module.exports.handleCekTrx = handleCekTrx;
