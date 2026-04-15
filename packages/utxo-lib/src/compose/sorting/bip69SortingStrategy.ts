import { convertOutput } from './convertOutput';
import { type SortingStrategy } from './sortingStrategy';
import { type CoinSelectOutputFinal, type ComposeInput } from '../../types';

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
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const reqOutput: (typeof request.outputs)[number] = request.outputs[index];
        if (reqOutput) {
            return convertOutput(output, reqOutput);
        }

        return convertOutput(output, { type: 'change', ...request.changeAddress });
    });

    const permutation = defaultPermutation.sort((a, b) => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const outA: CoinSelectOutputFinal = result.outputs[a];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const outB: CoinSelectOutputFinal = result.outputs[b];

        return outputComparator(outA, outB);
    });
    const sortedOutputs = permutation.map(index => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const out: (typeof convertedOutputs)[number] = convertedOutputs[index];

        return out;
    });

    return {
        inputs: convertedInputs.sort(inputComparator),
        outputs: sortedOutputs,
        outputsPermutation: permutation,
    };
};
