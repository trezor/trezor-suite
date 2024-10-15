import {
    ComposeRequest,
    CoinSelectSuccess,
    ComposeInput,
    ComposeChangeAddress,
    ComposeFinalOutput,
    ComposedTransaction,
    CoinSelectOutputFinal,
} from '../types';
import { arrayShuffle } from '@trezor/utils';
import { getRandomInt } from '../getRandomInt';

function convertOutput(
    selectedOutput: CoinSelectOutputFinal,
    composeOutput: ComposeFinalOutput | ({ type: 'change' } & ComposeChangeAddress),
) {
    if (composeOutput.type === 'change') {
        return {
            ...composeOutput,
            amount: selectedOutput.value.toString(),
        };
    }

    if (composeOutput.type === 'opreturn') {
        return composeOutput;
    }

    return {
        ...composeOutput,
        type: 'payment' as const,
        amount: selectedOutput.value.toString(),
    };
}

export function createTransaction<Input extends ComposeInput, Change extends ComposeChangeAddress>(
    request: ComposeRequest<Input, ComposeFinalOutput, Change>,
    result: CoinSelectSuccess,
): ComposedTransaction<Input, ComposeFinalOutput, Change> {
    const convertedInputs = result.inputs.map(input => request.utxos[input.i]);

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
    // Min (0) is inclusive, max (permutation.length + 1) is exclusive
    // Example: for array [0, 1, 2] the result can be: 0, 1, 2, 3
    const newPositionOfChange = getRandomInt(0, permutation.length + 1);
    permutation.splice(newPositionOfChange, 0, ...changeOutputPermutation);
    const sortedOutputs = permutation.map(index => convertedOutputs[index]);

    return {
        /**
         * Randomly shuffle inputs to make it harder to fingerprint the Trezor Suite.
         * If skipPermutation is set, do not shuffle the inputs (this is used for RBF,
         * where the original order must be preserved).
         */
        inputs: request.skipPermutation
            ? convertedInputs
            : arrayShuffle(convertedInputs, { randomInt: getRandomInt }),
        outputs: sortedOutputs,
        outputsPermutation: permutation,
    };
}
