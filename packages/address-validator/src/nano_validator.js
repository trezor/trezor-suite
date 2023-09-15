const { addressType } = require('./crypto/utils');
var cryptoUtils = require('./crypto/utils');
var baseX = require('base-x');

var ALLOWED_CHARS = '13456789abcdefghijkmnopqrstuwxyz';

var codec = baseX(ALLOWED_CHARS);
// https://github.com/nanocurrency/raiblocks/wiki/Accounts,-Keys,-Seeds,-and-Wallet-Identifiers
var regexp = new RegExp('^(xrb|nano)_([' + ALLOWED_CHARS + ']{60})$');

module.exports = {
    isValidAddress: function (address) {
        if (regexp.test(address)) {
            return this.verifyChecksum(address);
        }

        return false;
    },

    verifyChecksum: function (address) {
        var bytes = codec.decode(regexp.exec(address)[2]).slice(-37);
        // https://github.com/nanocurrency/raiblocks/blob/master/rai/lib/numbers.cpp#L73
        var computedChecksum = cryptoUtils.blake2b(cryptoUtils.toHex(bytes.slice(0, -5)), 5);
        var checksum = cryptoUtils.toHex(bytes.slice(-5).reverse());

        return computedChecksum === checksum
    },

    getAddressType: function(address, currency, networkType) {
        if (this.isValidAddress(address, currency, networkType)) {
            return addressType.ADDRESS;
        }
        return undefined;
    },
};
