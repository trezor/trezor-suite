const { addressType } = require('./crypto/utils');
var cbor = require('cbor-js');
var CRC = require('crc');
var base58 = require('./crypto/base58');
var { bech32 } = require('bech32');

var DEFAULT_NETWORK_TYPE = 'prod';

function getDecoded(address) {
    try {
        var decoded = base58.decode(address);
        return cbor.decode(new Uint8Array(decoded).buffer);
    } catch (e) {
        // if decoding fails, assume invalid address
        return null;
    }
}

function isValidLegacyAddress(address) {
    var decoded = getDecoded(address);

    if (!decoded || (!Array.isArray(decoded) && decoded.length != 2)) {
        return false;
    }

    var tagged = decoded[0];
    var validCrc = decoded[1];
    if (typeof (validCrc) != 'number') {
        return false;
    }

    // get crc of the payload
    var crc = CRC.crc32(tagged);

    return crc == validCrc;
}

// it is not possible to use bitcoin ./crypto/segwit_addr library, the cardano address is too long for that
function isValidBech32Address(address, currency, networkType) {
    if (!currency.segwitHrp) {
        return false;
    }
    var hrp = currency.segwitHrp[networkType];
    if (!hrp) {
        return false;
    }

    try {
        var dec = bech32.decode(address, networkType === 'prod' ? 103 : 108);
    } catch (err) {
        return false;
    }

    if (dec === null || dec.prefix !== hrp || dec.words.length < 1 || dec.words[0] > 16) {
        return false;
    }

    return true;
}

module.exports = {
    isValidAddress: function (address, currency, networkType) {
        networkType = networkType || DEFAULT_NETWORK_TYPE;
        return isValidLegacyAddress(address)
            || isValidBech32Address(address, currency, networkType);
    },
    getAddressType: function(address, currency, networkType) {
        if (this.isValidAddress(address, currency, networkType)) {
            return addressType.ADDRESS;
        }
        return undefined;
    },
};
