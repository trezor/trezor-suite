var base58 = require('./crypto/base58');
const { addressType } = require('../src/crypto/utils');

module.exports = {
    isValidAddress (address) {
        try {
            const decoded = base58.decode(address);

            return decoded.length === 32;
        } catch (err) {
            return false;
        }
    },
    getAddressType (address, currency, networkType) {
        if (this.isValidAddress(address, currency, networkType)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};
