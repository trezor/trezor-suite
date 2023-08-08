import {
    CoinSelectSuccess,
    ComposedTransaction,
    ComposeInput,
    ComposeResultError,
    ComposeResultNonFinal,
    ComposeResultFinal,
} from '../types';

export const empty: ComposeResultError = {
    type: 'error',
    error: 'EMPTY',
};

export function getNonfinalResult(result: CoinSelectSuccess): ComposeResultNonFinal {
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

export function getFinalResult<Input extends ComposeInput>(
    result: CoinSelectSuccess,
    transaction: ComposedTransaction<Input>,
): ComposeResultFinal<Input> {
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
