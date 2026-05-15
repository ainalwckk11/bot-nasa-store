const { Telegraf, Scenes, session } = require('telegraf');
const config = require('./config');
const { ownerOnly } = require('./bot/middleware');
const buyScene = require('./bot/scenes/buyScene');
const transactionPoller = require('./utils/transactionPoller');
const transactionStore = require('./utils/transactionStore');

// ======== Inisialisasi Bot ========
const bot = new Telegraf(config.botToken);

// ======== Session & Scenes ========
const stage = new Scenes.Stage([buyScene]);
bot.use(session());
bot.use(stage.middleware());

// ======== Middleware: Owner Only ========
bot.use(ownerOnly());

// ======== Register Commands ========
require('./bot/commands/start')(bot);
require('./bot/commands/balance')(bot);
require('./bot/commands/product')(bot);
require('./bot/commands/search')(bot);
require('./bot/commands/sku')(bot);
require('./bot/commands/buy')(bot);
require('./bot/commands/cektrx')(bot);

// ======== Transaction Poller ========
transactionPoller.setBotInstance(bot);

// ======== Handle pesan teks biasa ========
bot.on('text', async (ctx) => {
  // Jika sedang dalam scene, biarkan scene yang handle
  if (ctx.scene?.current) return;

  await ctx.reply(
    '🤖 Perintah tidak dikenali.\n\n' +
    'Gunakan /start untuk melihat menu.\n' +
    'Atau pilih perintah dari daftar berikut:\n\n' +
    '💳 /balance — Cek saldo\n' +
    '📦 /product — Daftar produk\n' +
    '🔍 /search <nama> — Cari produk\n' +
    '🏷️ /sku <kode> — Detail produk\n' +
    '🛒 /buy — Beli produk\n' +
    '🔍 /cektrx <ref_id> — Cek transaksi'
  );
});

// ======== Error Handling ========
bot.catch((err, ctx) => {
  console.error(`❌ Error untuk ${ctx.updateType}:`, err);

  try {
    ctx.reply('❌ Terjadi kesalahan internal. Silakan coba lagi nanti.');
  } catch (e) {
    console.error('Gagal mengirim pesan error:', e);
  }
});

// ======== Noop action (untuk tombol page indicator) ========
bot.action('noop', async (ctx) => {
  await ctx.answerCbQuery();
});

// ======== Graceful Stop ========
process.once('SIGINT', () => {
  console.log('\n🛑 Bot dihentikan (SIGINT)');
  transactionPoller.stopAll();
  transactionStore.destroy();
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('\n🛑 Bot dihentikan (SIGTERM)');
  transactionPoller.stopAll();
  transactionStore.destroy();
  bot.stop('SIGTERM');
});

// ======== Launch Bot ========
async function main() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 BOT NS STORE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Owner IDs: ${config.ownerIds.join(', ')}`);
    console.log(`🧪 Testing Mode: ${config.digiTesting ? 'AKTIF' : 'NONAKTIF'}`);
    console.log(`👤 Digiflazz User: ${config.digiUsername}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Set bot commands untuk menu Telegram
    await bot.telegram.setMyCommands([
      { command: 'start', description: '🏠 Menu utama' },
      { command: 'balance', description: '💳 Cek saldo Digiflazz' },
      { command: 'product', description: '📦 Daftar produk' },
      { command: 'search', description: '🔍 Cari produk' },
      { command: 'sku', description: '🏷️ Detail produk by SKU' },
      { command: 'buy', description: '🛒 Beli produk' },
      { command: 'cektrx', description: '🔍 Cek status transaksi' },
    ]);

    await bot.launch();
    console.log('✅ Bot berhasil dijalankan!');
    console.log('📡 Menunggu pesan...\n');
  } catch (error) {
    console.error('❌ Gagal menjalankan bot:', error);
    process.exit(1);
  }
}

main();
