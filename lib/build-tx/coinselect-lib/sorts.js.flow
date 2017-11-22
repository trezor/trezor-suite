const utils = require('./utils');

function score(feeRate) {
    return function (a, b) {
        const difference = utils.utxoScore(a, feeRate) - utils.utxoScore(b, feeRate);
        if (difference === 0) {
            return a.i - b.i;
        }
        return -difference;
    };
}

module.exports = {
    score: score,
};
