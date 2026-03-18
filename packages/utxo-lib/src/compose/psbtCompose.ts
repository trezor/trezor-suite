import { fromOutputScript, toOutputScript } from '../address';
import { p2data } from '../payments/embed';
import { Psbt } from '../psbt';
import { OPS, decompile } from '../script';
import {
    type ComposeChangeAddress,
    type ComposeFinalOutput,
    type ComposeInput,
    type ComposeOutput,
    type ComposeRequest,
    type ComposeResult,
    type ComposeResultFinal,
} from '../types';

type OutputDescriptor = {
    amount: string;
    scriptHex: string;
};

type PsbtComposeContext = {
    excludedPsbtOutputIndex?: number;
    psbtOutputDescriptors: OutputDescriptor[];
};

export type { PsbtComposeContext };

type RequestWithPsbt<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    Change extends ComposeChangeAddress,
> = ComposeRequest<Input, Output, Change>;

type FinalResultOutput<
    Output extends ComposeOutput,
    Change extends ComposeChangeAddress,
> = ComposeResultFinal<any, Output, Change>['outputs'][number];

function getPsbtOutputDescriptors(psbt: Psbt): OutputDescriptor[] {
    return psbt.unsignedTx.outs.map(output => ({
        amount: output.value,
        scriptHex: output.script.toString('hex'),
    }));
}

function getFinalOutputDescriptor<Change extends ComposeChangeAddress>(
    output: ComposeResultFinal<any, ComposeOutput, Change>['outputs'][number],
    request: Pick<ComposeRequest<any, ComposeOutput, Change>, 'network'>,
): OutputDescriptor {
    if (output.type === 'opreturn') {
        return {
            amount: '0',
            scriptHex: p2data({ data: [Buffer.from(output.dataHex, 'hex')] }).output!.toString(
                'hex',
            ),
        };
    }

    return {
        amount: output.amount,
        scriptHex: toOutputScript(output.address, request.network).toString('hex'),
    };
}

function matchesOutputDescriptor(expected: OutputDescriptor, actual: OutputDescriptor): boolean {
    return expected.scriptHex === actual.scriptHex && expected.amount === actual.amount;
}

function findMatchingIndex(
    expected: OutputDescriptor,
    actual: OutputDescriptor[],
    excludedIndexes: Set<number>,
) {
    for (let i = 0; i < actual.length; i++) {
        if (excludedIndexes.has(i)) {
            continue;
        }

        if (matchesOutputDescriptor(expected, actual[i])) {
            return i;
        }
    }

    return -1;
}

function getComposeOutputFromPsbtOutput(
    output: Psbt['unsignedTx']['outs'][number],
    request: Pick<RequestWithPsbt<any, ComposeOutput, ComposeChangeAddress>, 'network'>,
): ComposeFinalOutput {
    try {
        return {
            type: 'payment',
            address: fromOutputScript(output.script, request.network),
            amount: output.value,
        };
    } catch {
        const chunks = decompile(output.script);

        if (chunks.length === 1 && chunks[0] === OPS.OP_RETURN) {
            return {
                type: 'opreturn',
                dataHex: '',
            };
        }

        if (chunks.length === 2 && chunks[0] === OPS.OP_RETURN && Buffer.isBuffer(chunks[1])) {
            return {
                type: 'opreturn',
                dataHex: chunks[1].toString('hex'),
            };
        }
    }

    throw new Error('PSBT compose supports only address outputs and simple OP_RETURN outputs.');
}

function getPsbtComposeOutputs(
    psbt: Psbt,
    request: Pick<RequestWithPsbt<any, ComposeOutput, ComposeChangeAddress>, 'network'>,
) {
    return psbt.unsignedTx.outs.map(output => getComposeOutputFromPsbtOutput(output, request));
}

function getAccountOwnedAddresses(
    request: Pick<
        RequestWithPsbt<any, ComposeOutput, ComposeChangeAddress>,
        'changeAddress' | 'psbtData'
    >,
) {
    const addresses = new Set<string>([request.changeAddress.address]);

    if (!request.psbtData) {
        return addresses;
    }

    request.psbtData.addresses.forEach(({ address }) => addresses.add(address));

    return addresses;
}

function getExcludedPsbtOutputIndex<Change extends ComposeChangeAddress>(
    outputs: ComposeFinalOutput[],
    request: Pick<RequestWithPsbt<any, ComposeOutput, Change>, 'changeAddress' | 'psbtData'>,
) {
    let excludedPsbtOutputIndex: number | undefined;
    const accountOwnedAddresses = getAccountOwnedAddresses(request);

    outputs.forEach((output, index) => {
        if (output.type !== 'payment' || !accountOwnedAddresses.has(output.address)) {
            return;
        }

        if (excludedPsbtOutputIndex !== undefined) {
            throw new Error('Multiple PSBT change outputs are not supported.');
        }

        excludedPsbtOutputIndex = index;
    });

    return excludedPsbtOutputIndex;
}

export function preparePsbtComposeRequest<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    Change extends ComposeChangeAddress,
>(request: RequestWithPsbt<Input, Output, Change>) {
    if (!request.psbtData) {
        return { request } as const;
    }

    if (request.outputs.length > 0) {
        throw new Error('PSBT compose requires request.outputs to be empty.');
    }

    const psbt = Psbt.fromHex(request.psbtData.transactionData, { network: request.network });
    const psbtOutputDescriptors = getPsbtOutputDescriptors(psbt);
    const psbtComposeOutputs = getPsbtComposeOutputs(psbt, request);
    const excludedPsbtOutputIndex = getExcludedPsbtOutputIndex(psbtComposeOutputs, request);
    const outputs = psbtComposeOutputs.filter(
        (_, index) => index !== excludedPsbtOutputIndex,
    ) as Output[];

    return {
        context: {
            excludedPsbtOutputIndex,
            psbtOutputDescriptors,
        },
        request: {
            ...request,
            outputs,
        },
    } as const;
}

export function restorePsbtComposeResult<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    Change extends ComposeChangeAddress,
>(
    request: RequestWithPsbt<Input, Output, Change>,
    result: ComposeResult<Input, Output, Change>,
    context?: PsbtComposeContext,
): ComposeResult<Input, Output, Change> {
    if (!context || result.type !== 'final') {
        return result;
    }

    const composedOutputs: Array<FinalResultOutput<Output, Change>> = [];
    let composedChangeOutput: FinalResultOutput<Output, Change> | undefined;

    result.outputs.forEach(output => {
        if (output.type === 'change') {
            composedChangeOutput = output;

            return;
        }

        composedOutputs.push(output);
    });

    if (context.excludedPsbtOutputIndex !== undefined && !composedChangeOutput) {
        throw new Error('PSBT change output missing from compose result.');
    }

    if (context.excludedPsbtOutputIndex === undefined && composedChangeOutput) {
        throw new Error('PSBT compose produced an unexpected change output.');
    }

    const changeOutput = composedChangeOutput;

    const composedOutputDescriptors = composedOutputs.map(output =>
        getFinalOutputDescriptor(output, request),
    );
    const usedComposedOutputIndexes = new Set<number>();

    const outputs: ComposeResultFinal<Input, Output, Change>['outputs'] = [];
    const outputsPermutation: number[] = [];

    context.psbtOutputDescriptors.forEach((psbtOutputDescriptor, psbtOutputIndex) => {
        if (psbtOutputIndex === context.excludedPsbtOutputIndex) {
            if (!changeOutput) {
                throw new Error('PSBT change output missing from compose result.');
            }

            outputs.push(changeOutput);
            outputsPermutation.push(psbtOutputIndex);

            return;
        }

        const composedOutputIndex = findMatchingIndex(
            psbtOutputDescriptor,
            composedOutputDescriptors,
            usedComposedOutputIndexes,
        );
        if (composedOutputIndex === -1) {
            throw new Error('Unable to align composed outputs with PSBT outputs.');
        }

        usedComposedOutputIndexes.add(composedOutputIndex);
        outputs.push(composedOutputs[composedOutputIndex]);
        outputsPermutation.push(psbtOutputIndex);
    });

    return {
        ...result,
        outputs,
        outputsPermutation,
    };
}
