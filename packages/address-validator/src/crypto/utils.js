var jsSHA = require('jssha/src/sha256');
var Blake256 = require('./blake256');
var keccak256 = require('./sha3')['keccak256'];
var Blake2B = require('./blake2b');
var base58 = require('./base58');
var base32 = require('./base32');
var BigNum = require('browserify-bignum');
var groestl = require('groestl-hash-js');

// Address types, compatible with Trezor
const addressType = {
    ADDRESS: 'address',
    P2PKH: 'p2pkh',
    P2WPKH: 'p2wpkh',
    P2WSH: 'p2wsh',
    P2SH: 'p2sh',
    P2TR: 'p2tr',
    WITNESS_UNKNOWN: 'p2w-unknown',
};

function numberToHex(number, sizeInBytes) {
    return Math.round(number).toString(16).padStart(sizeInBytes * 2, '0');
}

function isHexChar(c) {
    if ((c >= 'A' && c <= 'F') ||
        (c >= 'a' && c <= 'f') ||
        (c >= '0' && c <= '9')) {
        return 1;
    }
    return 0;
}

/* Convert a hex char to value */
function hexChar2byte(c) {
    var d = 0;
    if (c >= 'A' && c <= 'F') {
        d = c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    }
    else if (c >= 'a' && c <= 'f') {
        d = c.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
    }
    else if (c >= '0' && c <= '9') {
        d = c.charCodeAt(0) - '0'.charCodeAt(0);
    }
    return d;
}

/* Convert a byte to string */
function byte2hexStr(byte) {
    var hexByteMap = "0123456789ABCDEF";
    var str = "";
    str += hexByteMap.charAt(byte >> 4);
    str += hexByteMap.charAt(byte & 0x0f);
    return str;
}

function byteArray2hexStr(byteArray) {
    var str = "";
    for (var i = 0; i < (byteArray.length - 1); i++) {
        str += byte2hexStr(byteArray[i]);
    }
    str += byte2hexStr(byteArray[i]);
    return str;
}

function hexStr2byteArray(str) {
    var byteArray = Array();
    var d = 0;
    var i = 0;
    var j = 0;
    var k = 0;

     for (i = 0; i < str.length; i++) {
        var c = str.charAt(i);
        if (isHexChar(c)) {
            d <<= 4;
            d += hexChar2byte(c);
            j++;
            if (0 === (j % 2)) {
                byteArray[k++] = d;
                d = 0;
            }
        }
    }
    return byteArray;
}

module.exports = {
    numberToHex,
    toHex: function (arrayOfBytes) {
        var hex = '';
        for (var i = 0; i < arrayOfBytes.length; i++) {
            hex += numberToHex(arrayOfBytes[i], 1);
        }
        return hex;
    },
    sha256: function (payload, format = 'HEX') {
        var sha = new jsSHA('SHA-256', format);
        sha.update(payload);
        return sha.getHash(format);
    },
    sha256x2: function (buffer, format = 'HEX') {
        return this.sha256(this.sha256(buffer, format), format);
    },
    sha256Checksum: function (payload) {
        return this.sha256(this.sha256(payload)).substr(0, 8);
    },
    blake256: function (hexString) {
        return new Blake256().update(hexString, 'hex').digest('hex');
    },
    blake256Checksum: function (payload) {
        return this.blake256(this.blake256(payload)).substr(0, 8);
    },
    blake2b: function (hexString, outlen) {
        return new Blake2B(outlen).update(Buffer.from(hexString, 'hex')).digest('hex');
    },
    keccak256: function (hexString) {
        return keccak256(hexString);
    },
    keccak256Checksum: function (payload) {
        return keccak256(payload).toString().substr(0, 8);
    },
    blake2b256: function (hexString) {
        return new Blake2B(32).update(Buffer.from(hexString, 'hex'), 32).digest('hex');
    },
    groestl512x2: function (hexString) {
        let result = groestl.groestl_2(Buffer.from(hexString, 'hex'), 1, 0).substr(0, 8);
        return result;
    },
    base58: base58.decode,
    byteArray2hexStr: byteArray2hexStr,
    hexStr2byteArray: hexStr2byteArray,
    bigNumberToBuffer: function(bignumber, size){
        return new BigNum(bignumber).toBuffer({ size, endian: 'big' });
    },
    base32,
    addressType,
}
