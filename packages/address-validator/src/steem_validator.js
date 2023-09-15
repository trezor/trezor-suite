const { addressType } = require('./crypto/utils');
const accountRegex = new RegExp('^[a-z0-9-.]{3,}$')
const segmentRegex = new RegExp('^[a-z][a-z0-9-]+[a-z0-9]$')
const doubleDashRegex = new RegExp('--')

module.exports = {
  isValidAddress: function (address, currency, networkType) {
    if (!accountRegex.test(address)) {
      return false;
    }
    let segments = address.split('.')
    for (let i = 0; i < segments.length; i++) {
      let segment = segments[i]
      if (segment.length < 3) {
        return false;
      }
      if (!segmentRegex.test(segment)) {
        return false;
      }
      if (doubleDashRegex.test(segment)) {
        return false;
      }
    }
    return true;
  },

  getAddressType: function (address, currency, networkType) {
      if (this.isValidAddress(address, currency, networkType)) {
          return addressType.ADDRESS;
      }
      return undefined;
  },
}

