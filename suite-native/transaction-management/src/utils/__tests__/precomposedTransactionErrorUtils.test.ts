import { isPrecomposedTransactionError } from '../precomposedTransactionErrorUtils';

describe('precomposedTransactionErrorUtils', () => {
    describe('isPrecomposedTransactionError', () => {
        it.each([
            'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
            'AMOUNT_IS_NOT_ENOUGH',
            'AMOUNT_IS_TOO_LOW',
            'AMOUNT_IS_LESS_THAN_RESERVE',
            'TR_STAKE_NOT_ENOUGH_FUNDS',
            'REMAINING_BALANCE_LESS_THAN_RENT',
            'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
        ])('should return true for valid precomposed transaction error: %s', error => {
            expect(isPrecomposedTransactionError(error)).toBe(true);
        });

        it.each(['INVALID_ERROR', 'UNKNOWN_ERROR', 'NETWORK_ERROR', '', null, undefined])(
            'should return false for invalid error: %s',
            error => {
                expect(isPrecomposedTransactionError(error as string)).toBe(false);
            },
        );
    });
});
