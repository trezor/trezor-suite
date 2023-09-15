const { addressType } = require('./crypto/utils');
var base58 = require('./crypto/base58')

const ALLOWED_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

var regexp = new RegExp('^(ak_)([' + ALLOWED_CHARS + ']+)$') // Begins with ak_ followed by

module.exports = {
  isValidAddress: function (address, currency, networkType) {
    let match = regexp.exec(address)
    if (match !== null) {
      return this.verifyChecksum(match[2])
    } else {
      return false
    }
  },

  verifyChecksum: function (address) {
    var decoded = base58.decode(address)
    decoded.splice(-4, 4) // remove last 4 elements. Why is base 58 adding them?
    return decoded.length === 32
  },

  getAddressType: function(address, currency, networkType) {
      if (this.isValidAddress(address, currency, networkType)) {
          return addressType.ADDRESS;
      }
      return undefined;
  },
}
