import type { CoinSelectSuccess, ComposedTransaction, ComposeResult } from '../types';

export const empty: ComposeResult = {
    type: 'error',
    error: 'EMPTY',
};

export function getNonfinalResult(result: CoinSelectSuccess): ComposeResult {
    const { max, fee, feePerByte, bytes, totalSpent } = result.payload;

    return {
        type: 'nonfinal',
        fee: fee.toString(),
        feePerByte: feePerByte.toString(),
        bytes,
        max,
        totalSpent,
    };
}

export function getFinalResult(
    result: CoinSelectSuccess,
    transaction: ComposedTransaction,
): ComposeResult {
    const { max, fee, feePerByte, bytes, totalSpent } = result.payload;

    return {
        type: 'final',
        fee: fee.toString(),
        feePerByte: feePerByte.toString(),
        bytes,
        transaction,
        max,
        totalSpent,
    };
}
