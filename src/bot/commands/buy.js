module.exports = (bot) => {
  bot.command('buy', async (ctx) => {
    try {
      await ctx.scene.enter('buyScene');
    } catch (error) {
      console.error('Error masuk scene buy:', error);
      await ctx.reply('❌ Gagal memulai proses pembelian. Silakan coba lagi.');
    }
  });
};
