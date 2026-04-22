import { Text } from 'react-native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
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
            expectedErrorMsg: 'Insufficient BTC to cover the transaction fee.',
        },
        {
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
            expectedErrorMsg: 'Insufficient BTC to cover the transaction fee.',
        },
        {
            error: 'NOT-ENOUGH-FUNDS',
            expectedErrorMsg: 'Insufficient BTC to cover the transaction fee.',
        },

        {
            error: 'AMOUNT_IS_LESS_THAN_RESERVE',
            expectedErrorMsg: 'Recipient account requires minimum reserve to activate.',
        },
        {
            error: 'REMAINING_BALANCE_LESS_THAN_RENT',
            expectedErrorMsg:
                'After sending this amount, your account will have SOL remaining lower than the rent.',
        },
        {
            error: 'AMOUNT_IS_NOT_ENOUGH',
            expectedErrorMsg: "You don't have enough funds.",
        },
        {
            error: 'AMOUNT_IS_TOO_LOW',
            expectedErrorMsg: 'Amount is too low.',
        },
        {
            error: 'TR_STAKE_NOT_ENOUGH_FUNDS',
            expectedErrorMsg: 'Insufficient funds for staking.',
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

        expect(getByText('Insufficient  to cover the transaction fee.')).toBeOnTheScreen();
    });

    it('should handle different network symbols', () => {
        const { getByText } = renderWithBasicProvider(
            <ErrorText error="AMOUNT_NOT_ENOUGH_CURRENCY_FEE" networkSymbol="eth" />,
        );

        expect(getByText('Insufficient ETH to cover the transaction fee.')).toBeOnTheScreen();
    });
});
