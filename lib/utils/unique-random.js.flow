'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.uniqueRandom = uniqueRandom;

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function uniqueRandom(maxNonInclusive) {
    var version = typeof navigator === 'undefined' ? process == null ? 'weird' : process.version : navigator.userAgent;
    var offset = new Date().getTimezoneOffset();
    var languages = typeof navigator === 'undefined' ? 'node' : navigator.languages == null ? navigator.language : navigator.languages.toString();
    var allString = version + offset + languages;

    var hash = _crypto2.default.createHash('md5').update(allString).digest();
    var r = 0;
    for (var i = 0; i < hash.length; i++) {
        r = r + hash[i];
        r = r % maxNonInclusive;
    }

    return r;
}

// Simple pseudo-randomness that's based on a simple fingerprinting
// Used so the order of backends is always the same on a computer