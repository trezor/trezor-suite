const { addressType } = require('../src/crypto/utils');
var base58 = require('./crypto/base58');

module.exports = {
    isValidAddress: function (address) {
        try {
            const decoded = base58.decode(address);
            return decoded.length === 32;
        } catch (err) {
            return false;
        }
    },
    getAddressType: function (address, currency, networkType) {
        if (this.isValidAddress(address, currency, networkType)) {
            return addressType.ADDRESS;
        }
        return undefined;
    },
};
