const crypto = require('crypto');

/**
 * Computes an HMAC-SHA256 hash of an IP address using IP_HASH_SECRET
 * @param {string} ip
 * @returns {string} Hex-encoded hash
 */
function hashIp(ip) {
  const secret = process.env.IP_HASH_SECRET || 'franchisedunia_ip_hash_dev_secret_key_2026';
  return crypto.createHmac('sha256', secret).update(String(ip || '127.0.0.1')).digest('hex');
}

module.exports = {
  hashIp,
};
