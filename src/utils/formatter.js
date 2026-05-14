/**
 * Format angka ke format Rupiah
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return 'Rp 0';
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

/**
 * Format detail produk untuk tampilan Telegram
 * @param {object} product
 * @returns {string}
 */
function formatProduct(product) {
  const status = product.buyer_product_status && product.seller_product_status ? '🟢 Aktif' : '🔴 Nonaktif';

  let msg = '';
  msg += `📦 *${escapeMarkdown(product.product_name)}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🏷️ SKU: \`${product.buyer_sku_code}\`\n`;
  msg += `💰 Harga: *${formatCurrency(product.price)}*\n`;
  msg += `🏢 Brand: ${escapeMarkdown(product.brand)}\n`;
  msg += `📂 Kategori: ${escapeMarkdown(product.category)}\n`;
  msg += `📋 Tipe: ${escapeMarkdown(product.type || '-')}\n`;
  msg += `📊 Status: ${status}\n`;

  if (product.desc) {
    msg += `📝 Deskripsi: ${escapeMarkdown(product.desc)}\n`;
  }

  return msg;
}

/**
 * Format ringkas produk untuk list
 * @param {object} product
 * @param {number} index
 * @returns {string}
 */
function formatProductShort(product, index) {
  const status = product.buyer_product_status && product.seller_product_status ? '🟢' : '🔴';
  return `${status} \`${product.buyer_sku_code}\` — ${escapeMarkdown(product.product_name)}\n    💰 ${formatCurrency(product.price)}`;
}

/**
 * Format hasil transaksi
 * @param {object} result
 * @returns {string}
 */
function formatTransaction(result) {
  const data = result.data || result;
  let statusEmoji = '⏳';
  let statusText = 'Pending';

  if (data.status === 'Sukses') {
    statusEmoji = '✅';
    statusText = 'Sukses';
  } else if (data.status === 'Gagal') {
    statusEmoji = '❌';
    statusText = 'Gagal';
  } else if (data.status === 'Pending') {
    statusEmoji = '⏳';
    statusText = 'Pending';
  }

  let msg = '';
  msg += `${statusEmoji} *HASIL TRANSAKSI*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📦 Produk: ${escapeMarkdown(data.product_name || '-')}\n`;
  msg += `🏷️ SKU: \`${data.buyer_sku_code || '-'}\`\n`;
  msg += `📱 Tujuan: \`${data.customer_no || '-'}\`\n`;
  msg += `💰 Harga: *${formatCurrency(data.price)}*\n`;
  msg += `📊 Status: *${statusText}*\n`;
  msg += `🔖 Ref ID: \`${data.ref_id || '-'}\`\n`;

  if (data.sn) {
    msg += `\n🔑 *Serial Number (SN):*\n\`${data.sn}\`\n`;
  }

  if (data.message) {
    msg += `\n💬 Pesan: ${escapeMarkdown(data.message)}\n`;
  }

  msg += `\n⏰ Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

  return msg;
}

/**
 * Format saldo
 * @param {object} data
 * @returns {string}
 */
function formatBalance(data) {
  let msg = '';
  msg += `💳 *SALDO DIGIFLAZZ*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 Saldo: *${formatCurrency(data.deposit)}*\n`;
  msg += `\n⏰ Dicek: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
  return msg;
}

/**
 * Escape karakter khusus Markdown V1
 * @param {string} text
 * @returns {string}
 */
function escapeMarkdown(text) {
  if (!text) return '-';
  return String(text)
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/`/g, '\\`');
}

/**
 * Generate ref_id unik untuk transaksi
 * @returns {string}
 */
function generateRefId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `NS${timestamp}${random}`.toUpperCase();
}

module.exports = {
  formatCurrency,
  formatProduct,
  formatProductShort,
  formatTransaction,
  formatBalance,
  escapeMarkdown,
  generateRefId,
};
