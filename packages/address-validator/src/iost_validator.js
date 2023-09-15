const { addressType } = require('./crypto/utils');
const iostRegex = new RegExp('^[a-z0-9_]{5,11}$')

module.exports = {
  isValidAddress: function (address, currency, networkType) {
    return iostRegex.test(address)
  },

  getAddressType: function(address, currency, networkType) {
      if (this.isValidAddress(address, currency, networkType)) {
          return addressType.ADDRESS;
      }
      return undefined;
  },
}

