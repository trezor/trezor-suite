import { SortingStrategy } from './sortingStrategy';
import { CoinSelectOutputFinal, ComposeInput } from '../../types';
import { convertOutput } from './convertOutput';

function inputComparator(a: ComposeInput, b: ComposeInput) {
    return Buffer.from(a.txid, 'hex').compare(Buffer.from(b.txid, 'hex')) || a.vout - b.vout;
}

function outputComparator(a: CoinSelectOutputFinal, b: CoinSelectOutputFinal) {
    return (
        a.value.cmp(b.value) ||
        (Buffer.isBuffer(a.script) && Buffer.isBuffer(b.script)
            ? a.script.compare(b.script)
            : a.script.length - b.script.length)
    );
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
