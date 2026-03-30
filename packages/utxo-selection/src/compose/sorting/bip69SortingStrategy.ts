import { convertOutput } from './convertOutput';
import { type SortingStrategy } from './sortingStrategy';
import { type CoinSelectOutputFinal } from '../../types';
import { type ComposeInput } from '../types';

function inputComparator(a: ComposeInput, b: ComposeInput) {
    return Buffer.from(a.txid, 'hex').compare(Buffer.from(b.txid, 'hex')) || a.vout - b.vout;
}

function outputComparator(a: CoinSelectOutputFinal, b: CoinSelectOutputFinal) {
    let valueDiff = 0;
    if (a.value < b.value) {
        valueDiff = -1;
    } else if (a.value > b.value) {
        valueDiff = 1;
    }

    if (valueDiff !== 0) return valueDiff;

    if (Buffer.isBuffer(a.script) && Buffer.isBuffer(b.script)) {
        return a.script.compare(b.script);
    }

    return a.script.length - b.script.length;
}

export const bip69SortingStrategy: SortingStrategy = ({ result, request, convertedInputs }) => {
    const defaultPermutation: number[] = [];
    const convertedOutputs = result.outputs.map((output, index) => {
        defaultPermutation.push(index);
        if (request.outputs[index]) {
            return convertOutput(output, request.outputs[index]);
        }

        return convertOutput(output, { type: 'change', ...request.changeAddress });
    });

    const permutation = defaultPermutation.sort((a, b) =>
        outputComparator(result.outputs[a], result.outputs[b]),
    );
    const sortedOutputs = permutation.map(index => convertedOutputs[index]);

    return {
        inputs: convertedInputs.sort(inputComparator),
        outputs: sortedOutputs,
        outputsPermutation: permutation,
    };
};
