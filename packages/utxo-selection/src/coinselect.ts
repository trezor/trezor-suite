import { accumulative } from './accumulative/accumulative';
import { branchAndBound } from './bnbLegacy/branchAndBound';
import { anyOf, sortByScore } from './coinselectUtils';
import { split } from './split/split';
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
