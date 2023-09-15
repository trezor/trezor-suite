const { addressType } = require('./crypto/utils');
function isValidEOSAddress (address, currency, networkType) {
  var regex = /^[a-z0-9]+$/g // Must be numbers and lowercase letters only
  if (address.search(regex) !== -1 && address.length === 12) {
    return true
  } else {
    return false
  }
}

module.exports = {
  isValidAddress: function (address, currency, networkType) {
    return isValidEOSAddress(address, currency, networkType)
  },

  getAddressType: function(address, currency, networkType) {
      if (this.isValidAddress(address, currency, networkType)) {
          return addressType.ADDRESS;
      }
      return undefined;
  },
}
