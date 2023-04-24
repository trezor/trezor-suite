import { getMax } from './request';
import { getResult } from './result';
import { convertFeeRate } from './utils';
import { coinselect } from './coinselect';
import {
    ComposeRequest,
    ComposeInput,
    ComposeOutput,
    ComposeChangeAddress,
    ComposeResult,
} from '../types';

export function composeTx<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    ChangeAddress extends ComposeChangeAddress,
>(
    request: ComposeRequest<Input, Output, ChangeAddress>,
): ComposeResult<Input, Output, ChangeAddress> {
    const {
        txType,
        utxos,
        outputs,
        feeRate,
        network,
        dustThreshold,
        baseFee,
        floorBaseFee,
        dustOutputFee,
        skipPermutation,
    } = request;

    if (outputs.length === 0) {
        return { type: 'error', error: 'EMPTY' };
    }

    if (utxos.length === 0) {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' };
    }

    const feeRateNumber = convertFeeRate(feeRate);
    if (!feeRateNumber) {
        return { type: 'error', error: 'INCORRECT-FEE-RATE' };
    }

    let countMax = { exists: false, id: 0 };
    try {
        countMax = getMax(outputs);
    } catch (e) {
        if (e instanceof Error) {
            return { type: 'error', error: e.message };
        }

        return { type: 'error', error: `${e}` };
    }

    let result: ReturnType<typeof coinselect> = { success: false };
    try {
        result = coinselect(
            txType || 'p2pkh',
            utxos,
            outputs,
            feeRateNumber,
            countMax.exists,
            countMax.id,
            dustThreshold,
            network,
            baseFee,
            floorBaseFee,
            dustOutputFee,
            skipPermutation,
        );
    } catch (e) {
        if (e instanceof Error) {
            return { type: 'error', error: e.message };
        }

        return { type: 'error', error: `${e}` };
    }

    if (!result.success) {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' };
    }

    return getResult(request, result);
}
