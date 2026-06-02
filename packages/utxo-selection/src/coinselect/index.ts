import { accumulative } from './algorithms/accumulative';
import { branchAndBound } from './algorithms/branchAndBound';
import { split } from './algorithms/split';
import { anyOf, sortByScore } from './coinselectUtils';
import { tryConfirmed } from './tryConfirmed';
import { type CoinSelectRequest } from './types';

export function coinselect({ inputs, outputs, feeRate, ...options }: CoinSelectRequest) {
    if (options.sendMaxOutputIndex >= 0) {
        return split(inputs, outputs, feeRate, options);
    }

    const sortedInputs =
        options.sortingStrategy === 'none' ? inputs : inputs.sort(sortByScore(feeRate));

    const algorithm = tryConfirmed(anyOf([branchAndBound, accumulative]), options);

    return algorithm(sortedInputs, outputs, feeRate, options);
}
