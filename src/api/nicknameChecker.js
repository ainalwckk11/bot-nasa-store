/**
 * Nickname Checker - Validasi nickname game sebelum transaksi
 * Menggunakan API pihak ketiga (gratis/open)
 * Fitur fallback dan robust error handling
 */
const axios = require('axios');

const API_TIMEOUT = 10000; // 10 detik

// Helper function untuk mengeksekusi request dengan fallback url
async function fetchWithFallback(endpoints, id, zone = '') {
  for (const endpoint of endpoints) {
    try {
      const params = endpoint.params(id, zone);
      const { data } = await axios.get(endpoint.url, {
        params,
        timeout: API_TIMEOUT,
      });

      // Temporary debugging
      console.log(`[DEBUG] Response dari ${endpoint.url}:`, JSON.stringify(data));

      // Parsing nickname dari berbagai kemungkinan field
      const nickname = 
        data?.name || 
        data?.nickname || 
        data?.username || 
        data?.player_name || 
        data?.data?.name || 
        data?.data?.userName || 
        data?.result?.name || 
        data?.result?.nickname || 
        null;

      if (nickname) {
        return nickname;
      }
      
      // Jika request berhasil tapi tidak ada nickname, mungkin ID salah
      // Kita lanjutkan ke endpoint berikutnya untuk memastikan
    } catch (error) {
      console.log(`[DEBUG] Error dari ${endpoint.url}:`, error.message);
      // Lanjut ke endpoint berikutnya jika gagal/timeout
    }
  }
  return null;
}

const GAME_VALIDATORS = {
  ml: {
    name: 'Mobile Legends',
    async validate(inputs) {
      const endpoints = [
        { url: 'https://api.isan.eu.org/nickname/ml', params: (id, zone) => ({ id, server: zone }) },
        { url: 'https://api.willyapi.my.id/api/cekid/ml', params: (id, zone) => ({ id, zone }) },
        { url: 'https://api.sandropedia.my.id/api/checkid/mlbb', params: (id, zone) => ({ id, zone }) },
        { url: 'https://api.ownrealm.net/api/v1/check-game/ml', params: (id, zone) => ({ userId: id, zoneId: zone }) },
      ];
      return fetchWithFallback(endpoints, inputs.userId, inputs.zoneId);
    },
  },

  ff: {
    name: 'Free Fire',
    async validate(inputs) {
      const endpoints = [
        { url: 'https://api.isan.eu.org/nickname/ff', params: (id) => ({ id }) },
        { url: 'https://api.willyapi.my.id/api/cekid/ff', params: (id) => ({ id }) },
        { url: 'https://api.sandropedia.my.id/api/checkid/ff', params: (id) => ({ id }) },
        { url: 'https://api.ownrealm.net/api/v1/check-game/ff', params: (id) => ({ userId: id }) },
      ];
      return fetchWithFallback(endpoints, inputs.userId);
    },
  },

  pubg: {
    name: 'PUBG Mobile',
    async validate(inputs) {
      const endpoints = [
        { url: 'https://api.isan.eu.org/nickname/pubg', params: (id) => ({ id }) },
        { url: 'https://api.willyapi.my.id/api/cekid/pubg', params: (id) => ({ id }) },
      ];
      return fetchWithFallback(endpoints, inputs.userId);
    },
  },

  genshin: {
    name: 'Genshin Impact',
    async validate(inputs) {
      const endpoints = [
        { url: 'https://api.ownrealm.net/api/v1/check-game/genshin', params: (id, zone) => ({ userId: id, server: zone }) },
      ];
      return fetchWithFallback(endpoints, inputs.userId, inputs.serverId);
    },
  },

  honkai_sr: {
    name: 'Honkai Star Rail',
    async validate(inputs) {
      const endpoints = [
        { url: 'https://api.ownrealm.net/api/v1/check-game/hsr', params: (id, zone) => ({ userId: id, server: zone }) },
      ];
      return fetchWithFallback(endpoints, inputs.userId, inputs.serverId);
    },
  },
};

/**
 * Validasi nickname berdasarkan game ID
 * @param {string} gameId - ID game dari PRODUCT_INPUT_CONFIG (ml, ff, genshin, dll)
 * @param {object} inputs - Data input yang sudah dikumpulkan (userId, zoneId, dll)
 * @returns {Promise<{success: boolean, nickname: string|null, gameName: string}>}
 */
async function validateNickname(gameId, inputs) {
  const validator = GAME_VALIDATORS[gameId];

  if (!validator) {
    return { success: false, nickname: null, gameName: null, supported: false };
  }

  try {
    console.log(`🔍 Validasi nickname ${validator.name}: ${JSON.stringify(inputs)}`);
    const nickname = await validator.validate(inputs);

    if (nickname) {
      console.log(`✅ Nickname ditemukan: ${nickname}`);
      return { success: true, nickname, gameName: validator.name, supported: true };
    }

    console.log(`⚠️ Nickname tidak ditemukan untuk ${validator.name}`);
    return { success: false, nickname: null, gameName: validator.name, supported: true };
  } catch (error) {
    console.error(`❌ Error validasi nickname ${validator.name}:`, error.message);
    return { success: false, nickname: null, gameName: validator.name, supported: true };
  }
}

/**
 * Cek apakah game mendukung validasi nickname
 * @param {string} gameId
 * @returns {boolean}
 */
function isNicknameSupported(gameId) {
  return !!GAME_VALIDATORS[gameId];
}

module.exports = {
  validateNickname,
  isNicknameSupported,
};
