import { NetworkSymbol } from '@suite-common/wallet-config';

import {
    PrecomposedTransactionErrorContext,
    getPrecomposedTransactionErrorTranslation,
    isPrecomposedTransactionError,
} from '../precomposedTransactionErrorUtils';

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

    describe('getPrecomposedTransactionErrorTranslation', () => {
        const mockContext: PrecomposedTransactionErrorContext = {
            networkSymbol: 'btc' as NetworkSymbol,
        };

        it.each(['INVALID_ERROR', '', null, undefined])(
            'should return null for invalid error: %s',
            error => {
                expect(
                    getPrecomposedTransactionErrorTranslation(error as string, mockContext),
                ).toBeNull();
            },
        );

        it.each([
            {
                error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                expectedTxKeyPath:
                    'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee',
                expectedValues: { networkDisplaySymbol: 'BTC' },
            },
            {
                error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                expectedTxKeyPath:
                    'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFeeWithEthAmount',
                expectedValues: { networkDisplaySymbol: 'BTC' },
            },
            {
                error: 'AMOUNT_IS_LESS_THAN_RESERVE',
                expectedTxKeyPath:
                    'transactionManagement.precomposedTransaction.errors.amountIsLessThanReserve',
                expectedValues: {},
            },
            {
                error: 'REMAINING_BALANCE_LESS_THAN_RENT',
                expectedTxKeyPath:
                    'transactionManagement.precomposedTransaction.errors.remainingBalanceLessThanRent',
                expectedValues: {},
            },
            {
                error: 'AMOUNT_IS_NOT_ENOUGH',
                expectedTxKeyPath:
                    'transactionManagement.precomposedTransaction.errors.amountIsNotEnough',
                expectedValues: {},
            },
            {
                error: 'AMOUNT_IS_TOO_LOW',
                expectedTxKeyPath:
                    'transactionManagement.precomposedTransaction.errors.amountIsTooLow',
                expectedValues: {},
            },
            {
                error: 'TR_STAKE_NOT_ENOUGH_FUNDS',
                expectedTxKeyPath:
                    'transactionManagement.precomposedTransaction.errors.stakeNotEnoughFunds',
                expectedValues: {},
            },
        ])(
            'should return correct translation data for $error',
            ({ error, expectedTxKeyPath, expectedValues }) => {
                const result = getPrecomposedTransactionErrorTranslation(error, mockContext);

                expect(result).toEqual({
                    txKeyPath: expectedTxKeyPath,
                    values: expectedValues,
                });
            },
        );
    });
});
