import * as utils from './utils';

export function score(feeRate) {
    return (a, b) => {
        const difference = utils.utxoScore(a, feeRate) - utils.utxoScore(b, feeRate);
        if (difference === 0) {
            return a.i - b.i;
        }
        return -difference;
    };
}
