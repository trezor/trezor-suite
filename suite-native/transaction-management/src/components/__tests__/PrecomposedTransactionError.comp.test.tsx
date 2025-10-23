import { Text } from '@suite-native/atoms';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { PrecomposedTransactionError } from '../PrecomposedTransactionError';

describe('PrecomposedTransactionError', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([[null], [undefined], ['INVALID_ERROR'], ['']])(
        'should return null when error is %s',
        error => {
            const { toJSON } = renderWithBasicProvider(
                <PrecomposedTransactionError error={error as string} networkSymbol="btc" />,
            );

            expect(toJSON()).toBeNull();
        },
    );

    it.each([
        {
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
            expectedValue: 'Insufficient BTC to cover the transaction fee',
        },
        {
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
            expectedValue: 'Insufficient BTC to cover the transaction fee.',
        },
        {
            error: 'AMOUNT_IS_LESS_THAN_RESERVE',
            expectedValue: 'Recipient account requires minimum reserve to activate',
        },
        {
            error: 'REMAINING_BALANCE_LESS_THAN_RENT',
            expectedValue:
                'After sending this amount, your account will have SOL remaining lower than the rent.',
        },
        {
            error: 'AMOUNT_IS_NOT_ENOUGH',
            expectedValue: "You don't have enough funds.",
        },
        {
            error: 'AMOUNT_IS_TOO_LOW',
            expectedValue: 'Amount is too low',
        },
        {
            error: 'TR_STAKE_NOT_ENOUGH_FUNDS',
            expectedValue: 'Insufficient funds for staking',
        },
    ])('should render correct translation for $error', ({ error, expectedValue }) => {
        const { getByText, debug } = renderWithBasicProvider(
            <Text>
                <PrecomposedTransactionError error={error as string} networkSymbol="btc" />
            </Text>,
        );

        debug();
        expect(getByText(expectedValue)).toBeTruthy();
    });

    it('should handle context without network symbol', () => {
        const { getByText } = renderWithBasicProvider(
            <Text>
                <PrecomposedTransactionError
                    error="AMOUNT_NOT_ENOUGH_CURRENCY_FEE"
                    networkSymbol={undefined}
                />
            </Text>,
        );

        expect(getByText('Insufficient  to cover the transaction fee')).toBeTruthy();
    });

    it('should handle different network symbols', () => {
        const { getByText } = renderWithBasicProvider(
            <Text>
                <PrecomposedTransactionError
                    error="AMOUNT_NOT_ENOUGH_CURRENCY_FEE"
                    networkSymbol="eth"
                />
            </Text>,
        );

        expect(getByText('Insufficient ETH to cover the transaction fee')).toBeTruthy();
    });
});
