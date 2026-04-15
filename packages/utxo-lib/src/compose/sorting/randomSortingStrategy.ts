import { arrayShuffle, getRandomInt } from '@trezor/utils';

import { convertOutput } from './convertOutput';
import { type SortingStrategy } from './sortingStrategy';

export const randomSortingStrategy: SortingStrategy = ({ result, request, convertedInputs }) => {
    const nonChangeOutputPermutation: number[] = [];
    const changeOutputPermutation: number[] = [];

    const convertedOutputs = result.outputs.map((output, index) => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const reqOutput: (typeof request.outputs)[number] = request.outputs[index];
        if (reqOutput) {
            nonChangeOutputPermutation.push(index);

            return convertOutput(output, reqOutput);
        }

        changeOutputPermutation.push(index);

        return convertOutput(output, { type: 'change', ...request.changeAddress });
    });

    /**
     * The goal here is to randomly insert change outputs into the outputs array.,
     * so you cannot tell what is the change just by the order of the transaction.
     */
    const permutation = [...nonChangeOutputPermutation];
    const newPositionOfChange = getRandomInt(0, permutation.length + 1);

    permutation.splice(newPositionOfChange, 0, ...changeOutputPermutation);
    const sortedOutputs = permutation.map(index => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const out: (typeof convertedOutputs)[number] = convertedOutputs[index];

        return out;
    });

    return {
        /** Randomly shuffle inputs to make it harder to fingerprint the Trezor Suite. */
        inputs: arrayShuffle(convertedInputs, { randomInt: getRandomInt }),
        outputs: sortedOutputs,
        outputsPermutation: permutation,
    };
};
