require('dotenv').config();

const requiredEnvVars = ['BOT_TOKEN', 'DIGI_USERNAME', 'DIGI_API_KEY', 'OWNER_ID'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Environment variable "${envVar}" belum diatur!`);
    console.error(`   Silakan salin .env.example ke .env dan isi semua konfigurasi.`);
    process.exit(1);
  }
}

module.exports = {
  // Telegram
  botToken: process.env.BOT_TOKEN,
  ownerIds: process.env.OWNER_ID.split(',').map((id) => parseInt(id.trim(), 10)),

  // Digiflazz
  digiUsername: process.env.DIGI_USERNAME,
  digiApiKey: process.env.DIGI_API_KEY,
  digiTesting: process.env.DIGI_TESTING === 'true',

  // API
  digiBaseUrl: 'https://api.digiflazz.com/v1',

  // Cache TTL (30 menit)
  cacheTTL: 30 * 60 * 1000,
};
