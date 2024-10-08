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

    const sortedInputs = inputs.sort(sortByScore(feeRate));
    const algorithm = tryConfirmed(anyOf([bnb, accumulative]), options);
    const result = algorithm(sortedInputs, outputs, feeRate, options);

    if (result.inputs === undefined) {
        return { fee: result.fee };
    }

    return {
        fee: result.fee,
        inputs: result.inputs.sort((a, b) => {
            const originalA = inputs.findIndex(({ i }) => i === a.i);
            const originalB = inputs.findIndex(({ i }) => i === b.i);

            if (originalA === -1 || originalB === -1) {
                throw new Error(
                    `Input not found in original inputs (originalA: ${originalA}, originalB: ${originalB})`,
                );
            }

            return originalA - originalB;
        }),
        outputs: result.outputs,
    };
}
