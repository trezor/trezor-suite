const { bech32 } = require('bech32');

const { addressType } = require('./crypto/utils');

const ALLOWED_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

var regexp = new RegExp('^(cosmos)1([' + ALLOWED_CHARS + ']+)$'); // cosmos + bech32 separated by '1'

module.exports = {
    isValidAddress (address, currency, networkType) {
        return regexp.exec(address) !== null;
    },

    verifyChecksum (address) {
        const decoded = bech32.decode(address);

        return decoded && decoded.words.length === 32;
    },

    getAddressType (address, currency, networkType) {
        if (this.isValidAddress(address)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};
