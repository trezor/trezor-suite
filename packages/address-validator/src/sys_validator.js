const { addressType } = require('./crypto/utils');
const BTCValidator = require('./bitcoin_validator');
var regexp = new RegExp('^sys1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{39}$')

module.exports = {
  isValidAddress: function (address, currency, networkType) {
    return regexp.test(address) || BTCValidator.isValidAddress(address, currency, networkType)
  },

  getAddressType: function (address, currency, networkType) {
      if (this.isValidAddress(address, currency, networkType)) {
          return addressType.ADDRESS;
      }
      return undefined;
  },
}

