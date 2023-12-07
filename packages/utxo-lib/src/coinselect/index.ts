import { accumulative } from './inputs/accumulative';
import { bnb } from './inputs/bnb';
import { split } from './outputs/split';
import { sortByScore, anyOf } from './coinselectUtils';
import { tryConfirmed } from './tryconfirmed';
import { CoinSelectRequest } from '../types';

export function coinselect({ inputs, outputs, feeRate, ...options }: CoinSelectRequest) {
    if (options.sendMaxOutputIndex >= 0) {
        return split(inputs, outputs, feeRate, options);
    }

    const sortedInputs = options.skipPermutation ? inputs : inputs.sort(sortByScore(feeRate));
    const algorithm = tryConfirmed(anyOf([bnb, accumulative]), options);
    return algorithm(sortedInputs, outputs, feeRate, options);
}
