const config = require('../config');

/**
 * Middleware: Hanya owner yang bisa menggunakan bot
 */
function ownerOnly() {
  return (ctx, next) => {
    const userId = ctx.from?.id;

    if (!userId || !config.ownerIds.includes(userId)) {
      console.log(`⛔ Akses ditolak untuk user ID: ${userId} (${ctx.from?.first_name || 'Unknown'})`);

      return ctx.reply(
        `⛔ *Akses Ditolak*\n\n` +
          `Maaf, bot ini hanya untuk pemilik\\.\n` +
          `ID kamu: \`${userId}\`\n\n` +
          `Hubungi admin jika kamu merasa ini adalah kesalahan\\.`,
        { parse_mode: 'MarkdownV2' }
      );
    }

    return next();
  };
}

module.exports = { ownerOnly };
