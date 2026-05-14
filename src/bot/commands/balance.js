const { Markup } = require('telegraf');
const digiflazz = require('../../api/digiflazz');
const { formatBalance } = require('../../utils/formatter');

async function handleBalance(ctx) {
  try {
    const loadingMsg = await ctx.reply('⏳ Mengecek saldo Digiflazz...');

    const data = await digiflazz.checkBalance();
    const message = formatBalance(data);

    await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Refresh Saldo', 'refresh_balance')],
        [Markup.button.callback('🏠 Menu Utama', 'cmd_start')],
      ]),
    });
  } catch (error) {
    console.error('Error cek saldo:', error);
    await ctx.reply(`❌ Gagal mengecek saldo.\n\n💬 ${error.message}`);
  }
}

module.exports = (bot) => {
  bot.command('balance', handleBalance);

  bot.action('refresh_balance', async (ctx) => {
    await ctx.answerCbQuery('🔄 Memperbarui saldo...');
    try {
      const data = await digiflazz.checkBalance();
      const message = formatBalance(data);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Refresh Saldo', 'refresh_balance')],
          [Markup.button.callback('🏠 Menu Utama', 'cmd_start')],
        ]),
      });
    } catch (error) {
      console.error('Error refresh saldo:', error);
      await ctx.answerCbQuery('❌ Gagal memperbarui saldo');
    }
  });
};

module.exports.handleBalance = handleBalance;
