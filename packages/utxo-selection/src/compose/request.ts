import type {
    ComposeChangeAddress,
    ComposeInput,
    ComposeOutput,
    ComposeRequest,
    ComposeResultError,
} from './types';
import {
    INPUT_SCRIPT_LENGTH,
    OUTPUT_SCRIPT_LENGTH,
    inputWeight,
    outputWeight,
    parseBigInt,
} from '../coinselect/coinselectUtils';
import type {
    CoinSelectInput,
    CoinSelectOutput,
    CoinSelectPaymentType,
    CoinSelectRequest,
} from '../coinselect/types';

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

    const value = parseBigInt(utxo.amount);
    if (value === undefined) {
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
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const utxo: ComposeInput = utxos[i];
            const csInput = transformInput(i, utxo, txType);
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
    request: Request,
): CoinSelectOutput {
    const script = { length: OUTPUT_SCRIPT_LENGTH[txType] };
    if (output.type === 'payment') {
        const value = parseBigInt(output.amount);
        if (value === undefined) {
            throw new Error('Invalid amount');
        }

        return {
            value,
            script: request.toOutputScript(output.address),
        };
    }
    if (output.type === 'payment-noaddress') {
        const value = parseBigInt(output.amount);
        if (value === undefined) {
            throw new Error('Invalid amount');
        }

        return {
            value,
            script,
        };
    }
    if (output.type === 'opreturn') {
        return {
            value: parseBigInt('0', true),
            script: request.toOpReturnScript(output.dataHex),
        };
    }
    if (output.type === 'send-max') {
        return {
            script: request.toOutputScript(output.address),
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
    request: Request,
):
    | {
          outputs: CoinSelectOutput[];
          sendMaxOutputIndex: number;
      }
    | ComposeResultError {
    const { outputs } = request;
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
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const output: ComposeOutput = outputs[i];
        if (output.type === 'send-max-noaddress' || output.type === 'send-max') {
            if (sendMaxOutputIndex >= 0) {
                return incorrectOutputError(i, 'Multiple send-max');
            }
            sendMaxOutputIndex = i;
        }

        try {
            const csOutput = transformOutput(output, txType, request);
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
    request: Request,
): CoinSelectOutput | ComposeResultError {
    // NOTE: use "send-max" to create changeOutput. we don't know the final amount yet
    try {
        return transformOutput({ type: 'send-max', ...request.changeAddress }, txType, request);
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

    const feePolicy = request.feePolicy || 'bitcoin';

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
        sortingStrategy: request.sortingStrategy,
    };
}
