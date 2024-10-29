import { accumulative } from './inputs/accumulative';
import { branchAndBound } from './inputs/branchAndBound';
import { split } from './outputs/split';
import { sortByScore, anyOf } from './coinselectUtils';
import { tryConfirmed } from './tryconfirmed';
import { CoinSelectRequest } from '../types';

export function coinselect({ inputs, outputs, feeRate, ...options }: CoinSelectRequest) {
    if (options.sendMaxOutputIndex >= 0) {
        return split(inputs, outputs, feeRate, options);
    }

    const sortedInputs =
        options.sortingStrategy === 'none' ? inputs : inputs.sort(sortByScore(feeRate));

    const algorithm = tryConfirmed(anyOf([branchAndBound, accumulative]), options);

    return algorithm(sortedInputs, outputs, feeRate, options);
}
