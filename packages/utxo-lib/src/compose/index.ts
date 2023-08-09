import { getMax } from './request';
import { getResult, getErrorResult } from './result';
import { convertFeeRate } from './composeUtils';
import { coinselect } from './coinselect';
import { ComposeRequest, ComposeInput, ComposeResult } from '../types';

export function composeTx<Input extends ComposeInput>(
    request: ComposeRequest<Input>,
): ComposeResult<Input> {
    const { utxos, outputs, feeRate, longTermFeeRate } = request;

    if (outputs.length === 0) {
        return { type: 'error', error: 'MISSING-OUTPUTS' };
    }

    if (utxos.length === 0) {
        return { type: 'error', error: 'MISSING-UTXOS' };
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
        countMax = getMax(outputs);
    } catch (error) {
        return getErrorResult(error);
    }

    let result: ReturnType<typeof coinselect> = { success: false };
    try {
        result = coinselect(
            request.txType || 'p2pkh',
            utxos,
            outputs,
            request.changeAddress,
            feeRateNumber,
            longTermFeeRateNumber,
            countMax.exists,
            countMax.id,
            request.dustThreshold,
            request.network,
            request.baseFee,
            request.floorBaseFee,
            request.skipPermutation,
        );
    } catch (error) {
        return getErrorResult(error);
    }

    if (!result.success) {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' };
    }

    return getResult(request, result);
}
