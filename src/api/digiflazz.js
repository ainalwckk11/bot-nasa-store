const axios = require('axios');
const md5 = require('md5');
const config = require('../config');
const cache = require('../utils/cache');

const api = axios.create({
  baseURL: config.digiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

/**
 * Cek saldo Digiflazz
 * @returns {Promise<object>} data saldo
 */
async function checkBalance() {
  try {
    const sign = md5(config.digiUsername + config.digiApiKey + 'depifit');

    const response = await api.post('/cek-saldo', {
      cmd: 'deposit',
      username: config.digiUsername,
      sign,
    });

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Format response tidak valid');
  } catch (error) {
    if (error.response) {
      throw new Error(`Digiflazz Error: ${error.response.data?.data?.message || error.response.statusText}`);
    }
    throw error;
  }
}

/**
 * Ambil daftar harga produk
 * @param {string} cmd - "prepaid" atau "pasca"
 * @returns {Promise<Array>} array produk
 */
async function getPriceList(cmd = 'prepaid') {
  const cacheKey = `pricelist_${cmd}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log(`📦 Menggunakan cache daftar harga (${cmd})`);
    return cached;
  }

  try {
    const sign = md5(config.digiUsername + config.digiApiKey + 'pricelist');

    const response = await api.post('/price-list', {
      cmd,
      username: config.digiUsername,
      sign,
    });

    let products = [];
    if (response.data && response.data.data) {
      products = response.data.data;
    }

    // Simpan ke cache
    cache.set(cacheKey, products, config.cacheTTL);
    console.log(`✅ Daftar harga (${cmd}) di-cache: ${products.length} produk`);

    return products;
  } catch (error) {
    if (error.response) {
      throw new Error(`Digiflazz Error: ${error.response.data?.data?.message || error.response.statusText}`);
    }
    throw error;
  }
}

/**
 * Buat transaksi pembelian
 * @param {string} buyerSkuCode - kode SKU produk
 * @param {string} customerNo - nomor tujuan
 * @param {string} refId - ID referensi unik
 * @returns {Promise<object>} hasil transaksi
 */
async function createTransaction(buyerSkuCode, customerNo, refId) {
  try {
    const sign = md5(config.digiUsername + config.digiApiKey + refId);

    const payload = {
      username: config.digiUsername,
      buyer_sku_code: buyerSkuCode,
      customer_no: customerNo,
      ref_id: refId,
      sign,
    };

    // Tambahkan testing flag jika diaktifkan
    if (config.digiTesting) {
      payload.testing = true;
    }

    const response = await api.post('/transaction', payload);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Format response tidak valid');
  } catch (error) {
    if (error.response && error.response.data) {
      // Digiflazz mengembalikan error dalam data
      const errData = error.response.data.data;
      if (errData) {
        return errData; // Return data untuk ditampilkan sebagai hasil transaksi
      }
      throw new Error(`Digiflazz Error: ${error.response.statusText}`);
    }
    throw error;
  }
}

/**
 * Cari produk berdasarkan keyword
 * @param {string} keyword
 * @param {string} cmd - "prepaid" atau "pasca"
 * @returns {Promise<Array>} produk yang cocok
 */
async function searchProducts(keyword, cmd = 'prepaid') {
  const products = await getPriceList(cmd);
  const lowerKeyword = keyword.toLowerCase();

  return products.filter((p) => {
    return (
      p.product_name?.toLowerCase().includes(lowerKeyword) ||
      p.buyer_sku_code?.toLowerCase().includes(lowerKeyword) ||
      p.brand?.toLowerCase().includes(lowerKeyword) ||
      p.category?.toLowerCase().includes(lowerKeyword)
    );
  });
}

/**
 * Cari produk berdasarkan SKU code
 * @param {string} skuCode
 * @param {string} cmd - "prepaid" atau "pasca"
 * @returns {Promise<object|null>} produk atau null
 */
async function findProductBySku(skuCode, cmd = 'prepaid') {
  const products = await getPriceList(cmd);
  return products.find((p) => p.buyer_sku_code?.toLowerCase() === skuCode.toLowerCase()) || null;
}

/**
 * Ambil daftar kategori unik
 * @param {string} cmd
 * @returns {Promise<Array<string>>}
 */
async function getCategories(cmd = 'prepaid') {
  const products = await getPriceList(cmd);
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  return categories.sort();
}

/**
 * Ambil daftar brand unik berdasarkan kategori
 * @param {string} category
 * @param {string} cmd
 * @returns {Promise<Array<string>>}
 */
async function getBrandsByCategory(category, cmd = 'prepaid') {
  const products = await getPriceList(cmd);
  const brands = [
    ...new Set(products.filter((p) => p.category === category).map((p) => p.brand).filter(Boolean)),
  ];
  return brands.sort();
}

/**
 * Ambil produk berdasarkan brand
 * @param {string} brand
 * @param {string} cmd
 * @returns {Promise<Array>}
 */
async function getProductsByBrand(brand, cmd = 'prepaid') {
  const products = await getPriceList(cmd);
  return products.filter((p) => p.brand === brand);
}

module.exports = {
  checkBalance,
  getPriceList,
  createTransaction,
  searchProducts,
  findProductBySku,
  getCategories,
  getBrandsByCategory,
  getProductsByBrand,
};
