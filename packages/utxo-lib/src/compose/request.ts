import { toOutputScript } from '../address';
import { p2data } from '../payments/embed';
import {
    INPUT_SCRIPT_LENGTH,
    OUTPUT_SCRIPT_LENGTH,
    inputWeight,
    outputWeight,
    getFeePolicy,
    bignumberOrNaN,
} from '../coinselect/coinselectUtils';
import type {
    ComposeInput,
    ComposeOutput,
    ComposeChangeAddress,
    ComposeRequest,
    ComposeResultError,
    CoinSelectPaymentType,
    CoinSelectRequest,
    CoinSelectInput,
    CoinSelectOutput,
} from '../types';
import type { Network } from '../networks';

type Request = ComposeRequest<ComposeInput, ComposeOutput, ComposeChangeAddress>;

function validateAndParseFeeRate(rate: unknown) {
    const feeRate = typeof rate === 'string' ? Number(rate) : rate;
    if (
        typeof feeRate !== 'number' ||
        Number.isNaN(feeRate) ||
        !Number.isFinite(feeRate) ||
        feeRate > Number.MAX_SAFE_INTEGER ||
        feeRate <= 0
    ) {
        return;
    }

    return feeRate;
}

function transformInput(
    i: number,
    utxo: ComposeInput,
    txType: CoinSelectPaymentType,
): CoinSelectInput {
    if (typeof utxo.coinbase !== 'boolean') {
        throw new Error('Missing coinbase');
    }
    if (typeof utxo.own !== 'boolean') {
        throw new Error('Missing own');
    }
    if (typeof utxo.confirmations !== 'number') {
        throw new Error('Missing confirmations');
    }

    const value = bignumberOrNaN(utxo.amount);
    if (!value) {
        throw new Error('Invalid amount');
    }

    return {
        ...utxo,
        type: txType,
        i,
        script: { length: INPUT_SCRIPT_LENGTH[txType] },
        value,
    };
}

function validateAndParseUtxos(
    txType: CoinSelectPaymentType,
    { utxos }: Request,
): ComposeResultError | CoinSelectInput[] {
    if (utxos.length === 0) {
        return { type: 'error', error: 'MISSING-UTXOS' };
    }

    const incorrectUtxoError = (index: number, message: string) =>
        ({
            type: 'error',
            error: 'INCORRECT-UTXO',
            message: `${message} at index ${index}`,
        }) as const;

    const result: CoinSelectInput[] = [];
    for (let i = 0; i < utxos.length; i++) {
        try {
            const csInput = transformInput(i, utxos[i], txType);
            csInput.weight = inputWeight(csInput);
            result.push(csInput);
        } catch (error) {
            return incorrectUtxoError(i, error.message);
        }
    }

    return result;
}

function transformOutput(
    output: ComposeOutput,
    txType: CoinSelectPaymentType,
    network: Network,
): CoinSelectOutput {
    const script = { length: OUTPUT_SCRIPT_LENGTH[txType] };
    if (output.type === 'payment') {
        const value = bignumberOrNaN(output.amount);
        if (!value) throw new Error('Invalid amount');

        return {
            value,
            script: toOutputScript(output.address, network),
        };
    }
    if (output.type === 'payment-noaddress') {
        const value = bignumberOrNaN(output.amount);
        if (!value) throw new Error('Invalid amount');

        return {
            value,
            script,
        };
    }
    if (output.type === 'opreturn') {
        return {
            value: bignumberOrNaN('0', true),
            script: p2data({ data: [Buffer.from(output.dataHex, 'hex')] }).output as Buffer,
        };
    }
    if (output.type === 'send-max') {
        return {
            script: toOutputScript(output.address, network),
        };
    }
    if (output.type === 'send-max-noaddress') {
        return {
            script,
        };
    }
    throw new Error('Unknown output type');
}

function validateAndParseOutputs(
    txType: CoinSelectPaymentType,
    { outputs, network }: Request,
):
    | {
          outputs: CoinSelectOutput[];
          sendMaxOutputIndex: number;
      }
    | ComposeResultError {
    if (outputs.length === 0) {
        return { type: 'error', error: 'MISSING-OUTPUTS' };
    }

    const incorrectOutputError = (index: number, message: string) =>
        ({
            type: 'error',
            error: 'INCORRECT-OUTPUT',
            message: `${message} at index ${index}`,
        }) as const;

    let sendMaxOutputIndex = -1;
    const result: CoinSelectOutput[] = [];
    for (let i = 0; i < outputs.length; i++) {
        const output = outputs[i];
        if (output.type === 'send-max-noaddress' || output.type === 'send-max') {
            if (sendMaxOutputIndex >= 0) {
                return incorrectOutputError(i, 'Multiple send-max');
            }
            sendMaxOutputIndex = i;
        }

        try {
            const csOutput = transformOutput(output, txType, network);
            csOutput.weight = outputWeight(csOutput);
            result.push(csOutput);
        } catch (error) {
            return incorrectOutputError(i, error.message);
        }
    }

    return {
        outputs: result,
        sendMaxOutputIndex,
    };
}

function validateAndParseChangeOutput(
    txType: CoinSelectPaymentType,
    { changeAddress, network }: Request,
): CoinSelectOutput | ComposeResultError {
    // NOTE: use "send-max" to create changeOutput. we don't know the final amount yet
    try {
        return transformOutput({ type: 'send-max', ...changeAddress }, txType, network);
    } catch (error) {
        return {
            type: 'error',
            error: 'INCORRECT-OUTPUT',
            message: error.message,
        };
    }
}

export function validateAndParseRequest(request: Request): CoinSelectRequest | ComposeResultError {
    const feeRate = validateAndParseFeeRate(request.feeRate);
    if (!feeRate) {
        return { type: 'error', error: 'INCORRECT-FEE-RATE' };
    }

    const longTermFeeRate = validateAndParseFeeRate(request.longTermFeeRate);
    if (request.longTermFeeRate != null && !longTermFeeRate) {
        return { type: 'error', error: 'INCORRECT-FEE-RATE' };
    }

    const txType = request.txType || 'p2pkh';

    const inputs = validateAndParseUtxos(txType, request);
    if ('error' in inputs) {
        return inputs;
    }

    const outputs = validateAndParseOutputs(txType, request);
    if ('error' in outputs) {
        return outputs;
    }

    const changeOutput = validateAndParseChangeOutput(txType, request);
    if ('error' in changeOutput) {
        return changeOutput;
    }

    const feePolicy = getFeePolicy(request.network);

    return {
        txType,
        inputs,
        ...outputs,
        changeOutput,
        feeRate,
        feePolicy,
        longTermFeeRate,
        dustThreshold: request.dustThreshold,
        baseFee: request.baseFee,
        floorBaseFee: request.floorBaseFee,
        skipPermutation: request.skipPermutation,
    };
}
