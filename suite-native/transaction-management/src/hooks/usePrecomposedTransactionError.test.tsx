import { Text } from 'react-native';

import { mockNetworksState } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import {
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import {
    type UsePrecomposedTransactionErrorProps,
    usePrecomposedTransactionError,
} from './usePrecomposedTransactionError';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const preloadedState = { networks: mockNetworksState([btcSymbol, ethSymbol]) };

const ErrorText = (props: UsePrecomposedTransactionErrorProps) => {
    const msg = usePrecomposedTransactionError(props);

    return <Text>{msg}</Text>;
};

describe('usePrecomposedTransactionError', () => {
    const networkSymbol = btcSymbol;
    const networkDisplaySymbol = 'BTC';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([[null], [undefined], ['INVALID_ERROR'], ['']])(
        'should return null when error is %s',
        async error => {
            const { result } = await renderHookWithStoreProvider(
                () => usePrecomposedTransactionError({ error, networkSymbol }),
                { preloadedState },
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
    ])('should return correct translation data for $error', async ({ error, expectedErrorMsg }) => {
        const { getByText } = await renderWithStoreProvider(
            <ErrorText error={error} networkSymbol={networkSymbol} />,
            { preloadedState },
        );

        expect(getByText(expectedErrorMsg)).toBeOnTheScreen();
    });

    it('should handle context without network symbol', async () => {
        const { getByText } = await renderWithStoreProvider(
            <ErrorText error="AMOUNT_NOT_ENOUGH_CURRENCY_FEE" />,
            { preloadedState },
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

    it('should handle different network symbols', async () => {
        const { getByText } = await renderWithStoreProvider(
            <ErrorText error="AMOUNT_NOT_ENOUGH_CURRENCY_FEE" networkSymbol={ethSymbol} />,
            { preloadedState },
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
