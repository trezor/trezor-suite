import { Text } from 'react-native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import { renderHookWithBasicProvider, renderWithBasicProvider } from '@suite-native/test-utils';

import {
    type UsePrecomposedTransactionErrorProps,
    usePrecomposedTransactionError,
} from '../usePrecomposedTransactionError';

const ErrorText = (props: UsePrecomposedTransactionErrorProps) => {
    const msg = usePrecomposedTransactionError(props);

    return <Text>{msg}</Text>;
};

describe('usePrecomposedTransactionError', () => {
    const networkSymbol = 'btc' as NetworkSymbol;
    const networkDisplaySymbol = 'BTC';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([[null], [undefined], ['INVALID_ERROR'], ['']])(
        'should return null when error is %s',
        error => {
            const { result } = renderHookWithBasicProvider(() =>
                usePrecomposedTransactionError({ error, networkSymbol }),
            );

            expect(result.current).toBeNull();
        },
    );

    it.each([
        {
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
            expectedErrorMsg: getTranslation(
                'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee',
                { networkDisplaySymbol },
            ),
        },
        {
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
            expectedErrorMsg: getTranslation(
                'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee',
                { networkDisplaySymbol },
            ),
        },
        {
            error: 'NOT-ENOUGH-FUNDS',
            expectedErrorMsg: getTranslation(
                'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee',
                { networkDisplaySymbol },
            ),
        },
        {
            error: 'AMOUNT_IS_LESS_THAN_RESERVE',
            expectedErrorMsg: getTranslation(
                'transactionManagement.precomposedTransaction.errors.amountIsLessThanReserve',
            ),
        },
        {
            error: 'REMAINING_BALANCE_LESS_THAN_RENT',
            expectedErrorMsg: getTranslation(
                'transactionManagement.precomposedTransaction.errors.remainingBalanceLessThanRent',
            ),
        },
        {
            error: 'AMOUNT_IS_NOT_ENOUGH',
            expectedErrorMsg: getTranslation(
                'transactionManagement.precomposedTransaction.errors.amountIsNotEnough',
            ),
        },
        {
            error: 'AMOUNT_IS_TOO_LOW',
            expectedErrorMsg: getTranslation(
                'transactionManagement.precomposedTransaction.errors.amountIsTooLow',
            ),
        },
        {
            error: 'TR_STAKE_NOT_ENOUGH_FUNDS',
            expectedErrorMsg: getTranslation(
                'transactionManagement.precomposedTransaction.errors.stakeNotEnoughFunds',
            ),
        },
    ])('should return correct translation data for $error', ({ error, expectedErrorMsg }) => {
        const { getByText } = renderWithBasicProvider(
            <ErrorText error={error} networkSymbol={networkSymbol} />,
        );

        expect(getByText(expectedErrorMsg)).toBeOnTheScreen();
    });

    it('should handle context without network symbol', () => {
        const { getByText } = renderWithBasicProvider(
            <ErrorText error="AMOUNT_NOT_ENOUGH_CURRENCY_FEE" />,
        );

        expect(
            getByText(
                getTranslation(
                    'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee',
                    { networkDisplaySymbol: '' },
                ),
            ),
        ).toBeOnTheScreen();
    });

    it('should handle different network symbols', () => {
        const { getByText } = renderWithBasicProvider(
            <ErrorText error="AMOUNT_NOT_ENOUGH_CURRENCY_FEE" networkSymbol="eth" />,
        );

        expect(
            getByText(
                getTranslation(
                    'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee',
                    { networkDisplaySymbol: 'ETH' },
                ),
            ),
        ).toBeOnTheScreen();
    });
});
