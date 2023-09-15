const { addressType } = require('./crypto/utils');
const { bech32 } = require('bech32');

const ALLOWED_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

var regexp = new RegExp('^(zil)1([' + ALLOWED_CHARS + ']+)$') // zil + bech32 separated by '1'

module.exports = {
  isValidAddress: function (address, currency, networkType) {
    let match = regexp.exec(address)
    if (!match) {
      return false;
    }
    const decoded = bech32.decode(address);
    return decoded && decoded.words.length === 32;
  },

  getAddressType: function (address, currency, networkType) {
      if (this.isValidAddress(address, currency, networkType)) {
          return addressType.ADDRESS;
      }
      return undefined;
  },
}

