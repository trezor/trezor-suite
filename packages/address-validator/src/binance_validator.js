const { addressType } = require('./crypto/utils');
module.exports = {
  isValidAddress: function (address) {
      var binanceAddress = address.slice(address.indexOf('bnb'));
      if (binanceAddress.length !== 42) {
          return false;
      }
      return true;
  },

  getAddressType: function(address, currency, networkType) {
      if (this.isValidAddress(address, currency, networkType)) {
          return addressType.ADDRESS;
      }
      return undefined;
  },
};
