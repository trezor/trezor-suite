const { addressType } = require('./crypto/utils');
var cryptoUtils = require('./crypto/utils');

var regexp = new RegExp('^[0-9]{1,20}L$');

module.exports = {
    isValidAddress: function(address) {
        return this.getAddressType(address) === addressType.ADDRESS;
    },

    getAddressType: function(address) {
        if (!regexp.test(address)) {
            return undefined;
        }
        if(this.verifyAddress(address)) {
            return addressType.ADDRESS;
        }
    },

    verifyAddress: function(address) {
        var BUFFER_SIZE = 8;
        var bigNumber = address.substring(0, address.length - 1);
        var addressBuffer = cryptoUtils.bigNumberToBuffer(bigNumber);
        return Buffer.from(addressBuffer).slice(0, BUFFER_SIZE).equals(addressBuffer);
    }
};