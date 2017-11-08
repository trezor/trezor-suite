'use strict';

var utils = require('./utils');

function score(feeRate) {
    return function (a, b) {
        var difference = utils.utxoScore(a, feeRate) - utils.utxoScore(b, feeRate);
        if (difference === 0) {
            return a.i - b.i;
        }
        return -difference;
    };
}

module.exports = {
    score: score
};