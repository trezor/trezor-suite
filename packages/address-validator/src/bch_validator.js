const { addressType } = require('./crypto/utils');
var cryptoUtils = require('./crypto/utils');
var BTCValidator = require('./bitcoin_validator');

var GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values) {
    var chk = 1;
    for (var p = 0; p < values.length; ++p) {
        var top = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ values[p];
        for (var i = 0; i < 5; ++i) {
            if ((top >> i) & 1) {
                chk ^= GENERATOR[i];
            }
        }
    }
    return chk;
}

function hrpExpand(hrp) {
    var ret = [];
    var p;
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) >> 5);
    }
    ret.push(0);
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) & 31);
    }
    return ret;
}

function verifyChecksum(hrp, data) {
    return polymod(hrpExpand(hrp).concat(data)) === 1;
}

function validateAddress(address, currency, networkType) {
    var prefix = 'bitcoincash';
    var regexp = new RegExp(currency.regexp);
    var raw_address;

    var res = address.split(':');
    if (res.length > 2) {
        return false;
    }
    if (res.length === 1) {
        raw_address = address
    } else {
        if (res[0] !== 'bitcoincash') {
            return false;
        }
        raw_address = res[1];
    }

    if (!regexp.test(raw_address)) {
        return false;
    }

    if (raw_address.toLowerCase() != raw_address && raw_address.toUpperCase() != raw_address) {
        return false;
    }

    var decoded = cryptoUtils.base32.b32decode(raw_address);
    if (networkType === 'testnet') {
        prefix = 'bchtest';
    }

    try {
        if (verifyChecksum(prefix, decoded)) {
            return false;
        }
    } catch (e) {
        return false;
    }

    return true;
}

module.exports = {
    isValidAddress: function (address, currency, networkType) {
        return validateAddress(address, currency, networkType) ||
            (currency.symbol !== 'bch' && BTCValidator.isValidAddress(address, currency, networkType));
    },
    getAddressType: function(address, currency, networkType) {
        networkType = networkType || DEFAULT_NETWORK_TYPE;
        if (this.isValidAddress(address, currency, networkType)) {
            return addressType.ADDRESS;
        }
        return undefined;
    }
}