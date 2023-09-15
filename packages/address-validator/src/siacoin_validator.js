const { addressType } = require('./crypto/utils');
var cryptoUtils = require('./crypto/utils')
var isEqual = require('lodash/isEqual')

module.exports = {
  isValidAddress: function(address) {
    if (address.length !== 76) {
      // Check if it has the basic requirements of an address
      return false;
    }

    // Otherwise check each case
    return this.verifyChecksum(address);
  },
  verifyChecksum: function(address) {
    var checksumBytes = address.slice(0, 32*2)
    var check = address.slice(32*2, 38*2)
    var blakeHash = cryptoUtils.blake2b(checksumBytes, 32).slice(0, 6*2)
    return isEqual(blakeHash, check);
  },

  getAddressType: function (address, currency, networkType) {
      if (this.isValidAddress(address)) {
          return addressType.ADDRESS;
      }
      return undefined;
  },
}
