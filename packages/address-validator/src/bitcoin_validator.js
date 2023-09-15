var bech32 = require('./crypto/bech32');
var base58 = require('./crypto/base58');
var cryptoUtils = require('./crypto/utils');
const { addressType } = require('./crypto/utils');

var DEFAULT_NETWORK_TYPE = 'prod';

function getDecoded(address) {
    try {
        return base58.decode(address);
    } catch (e) {
        // if decoding fails, assume invalid address
        return null;
    }
}

function getChecksum(hashFunction, payload) {
    // Each currency may implement different hashing algorithm
    switch (hashFunction) {
        // blake then keccak hash chain
        case 'blake256keccak256':
            var blake = cryptoUtils.blake2b256(payload);
            return cryptoUtils.keccak256Checksum(Buffer.from(blake, 'hex'));
        case 'blake256':
            return cryptoUtils.blake256Checksum(payload);
        case 'keccak256':
            return cryptoUtils.keccak256Checksum(payload);
        case 'groestl512x2':
            return cryptoUtils.groestl512x2(payload);
        case 'sha256':
        default:
            return cryptoUtils.sha256Checksum(payload);
    }
}

function getAddressType(address, currency) {
    currency = currency || {};
    // should be 25 bytes per btc address spec and 26 decred
    var expectedLength = currency.expectedLength || 25;
    var hashFunction = currency.hashFunction || 'sha256';
    var decoded = getDecoded(address);

    if (decoded) {
        var length = decoded.length;

        if (length !== expectedLength) {
            return null;
        }

        if(currency.regex) {
            if(!currency.regex.test(address)) {
                return null;
            }
        }

        var checksum = cryptoUtils.toHex(decoded.slice(length - 4, length)),
            body = cryptoUtils.toHex(decoded.slice(0, length - 4)),
            goodChecksum = getChecksum(hashFunction, body);

        return checksum === goodChecksum ? cryptoUtils.toHex(decoded.slice(0, expectedLength - 24)) : null;
    }

    return null;
}

function getOutputIndex(address, currency, networkType) {
    const addressType = getAddressType(address, currency);
    if (addressType) {
        const correctAddressTypes =
            currency.addressTypes[networkType] ||
            Object.keys(currency.addressTypes).reduce((all, key) => {
                return all.concat(currency.addressTypes[key]);
            }, []);
        return correctAddressTypes.indexOf(addressType);
    }
    return null;
}

function isValidPayToPublicKeyHashAddress(address, currency, networkType) {
    return getOutputIndex(address, currency, networkType) === 0;
}

function isValidPayToScriptHashAddress(address, currency, networkType) {
    return getOutputIndex(address, currency, networkType) > 0;
}

function isValidPayToWitnessScriptHashAddress(address, currency, networkType) {
    try {
        const hrp = currency.segwitHrp[networkType];
        const decoded = bech32.decode(hrp, address);
        return decoded && decoded.version === 0 && decoded.program.length === 32;
    } catch (err) {
        return null;
    }
}

function isValidPayToWitnessPublicKeyHashAddress(address, currency, networkType) {
    try {
        const hrp = currency.segwitHrp[networkType];
        const decoded = bech32.decode(hrp, address);
        return decoded && decoded.version === 0 && decoded.program.length === 20;
    } catch (err) {
        return null;
    }
}

function isValidPayToTaprootAddress(address, currency, networkType) {
    try {
        const hrp = currency.segwitHrp[networkType];
        decoded = bech32.decode(hrp, address, true);
        return decoded && decoded.version === 1 && decoded.program.length === 32;
    } catch (err) {}
    return null;
}

function isValidSegwitAddress(address, currency, networkType) {
    if (!currency.segwitHrp) {
        return false;
    }
    var hrp = currency.segwitHrp[networkType];
    if (!hrp) {
        return false;
    }
    // try bech32 first
    let ret = bech32.decode(hrp, address, false);
    if (ret) {
        if (ret.version === 0 || ret.program.length === 20 || ret.program.length === 32) {
            return false;
        } else {
            return address.toLowerCase() === bech32.encode(hrp, ret.version, ret.program, false);
        }
    }
    // then try bech32m
    ret = bech32.decode(hrp, address, true);
    if (ret) {
        if (ret.version > 1 || ret.program.length !== 32) {
            return address.toLowerCase() === bech32.encode(hrp, ret.version, ret.program, true);
        }
    }
    return false;
}

module.exports = {
    isValidAddress: function (address, currency, networkType) {        
        networkType = networkType || DEFAULT_NETWORK_TYPE;
        const addrType = this.getAddressType(address, currency, networkType);
        // Though WITNESS_UNKNOWN is a valid address, it's not spendable - so we mark it as invalid
        return addrType !== undefined && addrType !== addressType.WITNESS_UNKNOWN;
    },
    getAddressType: function(address, currency, networkType) {
        networkType = networkType || DEFAULT_NETWORK_TYPE;
        if (isValidPayToPublicKeyHashAddress(address, currency, networkType)) {
            return addressType.P2PKH;
        }
        if (isValidPayToScriptHashAddress(address, currency, networkType)) {
            return addressType.P2SH;
        }
        if (isValidPayToWitnessScriptHashAddress(address, currency, networkType)) {
            return addressType.P2WSH;
        }
        if (isValidPayToWitnessPublicKeyHashAddress(address, currency, networkType)) {
            return addressType.P2WPKH;
        }
        if (isValidPayToTaprootAddress(address, currency, networkType)) {
            return addressType.P2TR;
        }
        if (isValidSegwitAddress(address, currency, networkType)) {
            return addressType.WITNESS_UNKNOWN;
        }
        return undefined;
    },
};
