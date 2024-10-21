import { SortingStrategy } from './sortingStrategy';
import { convertOutput } from './convertOutput';
import { arrayShuffle, getRandomInt } from '@trezor/utils';

export const randomSortingStrategy: SortingStrategy = ({ result, request, convertedInputs }) => {
    const nonChangeOutputPermutation: number[] = [];
    const changeOutputPermutation: number[] = [];

    const convertedOutputs = result.outputs.map((output, index) => {
        if (request.outputs[index]) {
            nonChangeOutputPermutation.push(index);

            return convertOutput(output, request.outputs[index]);
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
    const sortedOutputs = permutation.map(index => convertedOutputs[index]);

    return {
        /** Randomly shuffle inputs to make it harder to fingerprint the Trezor Suite. */
        inputs: arrayShuffle(convertedInputs, { randomInt: getRandomInt }),
        outputs: sortedOutputs,
        outputsPermutation: permutation,
    };
};
