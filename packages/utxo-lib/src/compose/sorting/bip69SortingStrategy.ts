import { convertOutput } from './convertOutput';
import { type SortingStrategy } from './sortingStrategy';
import { type CoinSelectOutputFinal, type ComposeInput } from '../../types';

function inputComparator(a: ComposeInput, b: ComposeInput) {
    return Buffer.from(a.txid, 'hex').compare(Buffer.from(b.txid, 'hex')) || a.vout - b.vout;
}

function outputComparator(a: CoinSelectOutputFinal, b: CoinSelectOutputFinal) {
    if (a.value < b.value) {
        return -1;
    } else if (a.value > b.value) {
        return 1;
    }

    return Buffer.isBuffer(a.script) && Buffer.isBuffer(b.script)
        ? a.script.compare(b.script)
        : a.script.length - b.script.length;
}

export const bip69SortingStrategy: SortingStrategy = ({ result, request, convertedInputs }) => {
    const defaultPermutation: number[] = [];
    const convertedOutputs = result.outputs.map((output, index) => {
        defaultPermutation.push(index);
        const { outputs } = request;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const reqOutput: (typeof outputs)[number] = outputs[index];
        if (reqOutput) {
            return convertOutput(output, reqOutput);
        }

        return convertOutput(output, { type: 'change', ...request.changeAddress });
    });

    const permutation = defaultPermutation.sort((a, b) => {
        const { outputs } = result;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const outA: CoinSelectOutputFinal = outputs[a];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const outB: CoinSelectOutputFinal = outputs[b];

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
