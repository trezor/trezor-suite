const { addressType } = require('./crypto/utils');
var cryptoUtils = require('./crypto/utils');

function decodeBase58Address(base58Sting) {
    if (typeof (base58Sting) !== 'string') {
        return false;
    }
    if (base58Sting.length <= 4) {
        return false;
    }

    try {
        var address = cryptoUtils.base58(base58Sting);
    } catch (e) {
        return false
    }

    /*if (base58Sting.length <= 4) {
        return false;
    }*/
    var len = address.length;
    var offset = len - 4;
    var checkSum = address.slice(offset);
    address = address.slice(0, offset);
    var hash0 = cryptoUtils.sha256(cryptoUtils.byteArray2hexStr(address));
    var hash1 = cryptoUtils.hexStr2byteArray(cryptoUtils.sha256(hash0));
    var checkSum1 = hash1.slice(0, 4);
    if (checkSum[0] === checkSum1[0] && checkSum[1] === checkSum1[1] && checkSum[2]
        === checkSum1[2] && checkSum[3] === checkSum1[3]
    ) {
        return address;
    }

    return false;
}

function getEnv(currency, networkType) {
    var evn = networkType || 'prod';

    if (evn !== 'prod' && evn !== 'testnet') evn = 'prod';

    return currency.addressTypes[evn][0]
}

module.exports = {
    /**
     * tron address validation
     */
    isValidAddress: function (mainAddress, currency, networkType) {
        var address = decodeBase58Address(mainAddress);

        if (!address) {
            return false;
        }

        if (address.length !== 21) {
            return false;
        }

        return getEnv(currency, networkType) === address[0];
    },

    getAddressType: function (address, currency, networkType) {
        if (this.isValidAddress(address, currency, networkType)) {
            return addressType.ADDRESS;
        }
        return undefined;
    },
};