import * as request from './request';
import * as result from './result';
import * as transaction from './transaction';
import { convertFeeRate } from './composeUtils';
import { coinselect } from './coinselect';
import { ComposeRequest, ComposeInput, ComposeResult } from '../types';

export function composeTx<Input extends ComposeInput>({
    txType,
    utxos,
    outputs,
    feeRate,
    longTermFeeRate,
    basePath,
    network,
    changeId,
    changeAddress,
    dustThreshold,
    baseFee,
    floorBaseFee,
    skipPermutation,
}: ComposeRequest<Input>): ComposeResult<Input> {
    if (outputs.length === 0) {
        return result.empty;
    }

    if (utxos.length === 0) {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' };
    }

    const feeRateNumber = convertFeeRate(feeRate);
    if (!feeRateNumber) {
        return { type: 'error', error: 'INCORRECT-FEE-RATE' };
    }

    let longTermFeeRateNumber;
    if (longTermFeeRate) {
        longTermFeeRateNumber = convertFeeRate(longTermFeeRate);
        if (!longTermFeeRateNumber) {
            return { type: 'error', error: 'INCORRECT-FEE-RATE' };
        }
    }

    let countMax = { exists: false, id: 0 };
    try {
        countMax = request.getMax(outputs);
    } catch (e) {
        if (e instanceof Error) {
            return { type: 'error', error: e.message };
        }

        return { type: 'error', error: `${e}` };
    }

    const splitOutputs = request.splitByCompleteness(outputs);

    let csResult: ReturnType<typeof coinselect> = { success: false };
    try {
        csResult = coinselect(
            txType || 'p2pkh',
            utxos,
            outputs,
            changeAddress,
            feeRateNumber,
            longTermFeeRateNumber,
            countMax.exists,
            countMax.id,
            dustThreshold,
            network,
            baseFee,
            floorBaseFee,
            skipPermutation,
        );
    } catch (e) {
        if (e instanceof Error) {
            return { type: 'error', error: e.message };
        }

        return { type: 'error', error: `${e}` };
    }

    if (!csResult.success) {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' };
    }

    if (splitOutputs.incomplete.length > 0) {
        return result.getNonfinalResult(csResult);
    }

    const resTransaction = transaction.createTransaction(
        utxos,
        csResult.payload.inputs,
        splitOutputs.complete,
        csResult.payload.outputs,
        basePath,
        changeId,
        skipPermutation,
    );

    return result.getFinalResult(csResult, resTransaction);
}
