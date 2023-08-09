import {
    CoinSelectSuccess,
    ComposedTransaction,
    ComposeInput,
    ComposeResultError,
    ComposeResultNonFinal,
    ComposeResultFinal,
    COMPOSE_ERROR_TYPES,
} from '../types';

export function getErrorResult(error: unknown): ComposeResultError {
    const message = error instanceof Error ? error.message : `${error}`;
    const known = COMPOSE_ERROR_TYPES.find(e => e === message);
    if (known) {
        return { type: 'error', error: known };
    }
    return { type: 'error', error: 'COINSELECT', message };
}

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
