import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { PROTO } from '@trezor/connect';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { FormattedCryptoAmount } from './FormattedCryptoAmount';
import { mockInitialAppState } from '../../../mocks/mockInitialAppState';

const bitcoin = asNetworkSymbol('btc');

const renderAmount = (element: React.ReactElement, areSatsDisplayed = false) => {
    const root = createTestCompositionRoot({
        extra: { services: {} },
        preloadedState: areSatsDisplayed
            ? {
                  ...mockInitialAppState,
                  wallet: {
                      ...mockInitialAppState.wallet,
                      settings: {
                          ...mockInitialAppState.wallet.settings,
                          bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
                      },
                  },
              }
            : mockInitialAppState,
    });

    renderWithProviders(root, element);
};

describe('FormattedCryptoAmount', () => {
    describe('compact balance', () => {
        it.each([
            { value: '1.23456789', expected: '1.23' },
            { value: '1', expected: '1.00' },
            { value: '0.123456789', expected: '0.12345' },
            { value: '0.000009', expected: '<0.00001' },
            { value: '1234567.899', expected: '1.23M' },
        ])('formats $value as $expected', ({ value, expected }) => {
            renderAmount(
                <FormattedCryptoAmount
                    value={value}
                    symbol={bitcoin}
                    isCompact
                    data-testid="@amount"
                />,
            );

            expect(screen.getByTestId('@amount')).toHaveTextContent(expected);
        });

        it('applies the money rule wherever the token states 6 decimals', () => {
            renderAmount(
                <FormattedCryptoAmount
                    value="0.009"
                    symbol="USDC"
                    contractAddress="0xa0b8"
                    isCompact
                    tokenDecimals={6}
                    data-testid="@amount"
                />,
            );

            expect(screen.getByTestId('@amount')).toHaveTextContent('<0.01');
        });

        it('shows a stablecoin balance the way money is shown', () => {
            renderAmount(
                <FormattedCryptoAmount
                    value="1234.5678"
                    symbol="USDT"
                    isCompact
                    tokenDecimals={6}
                    data-testid="@amount"
                />,
            );

            expect(screen.getByTestId('@amount')).toHaveTextContent('1,234.56');
        });
    });

    describe('dust marker', () => {
        it('spells the threshold the way the compact rule does', () => {
            renderAmount(
                <FormattedCryptoAmount
                    value="0.000009"
                    symbol={bitcoin}
                    showApproximation
                    data-testid="@amount"
                />,
            );

            expect(screen.getByTestId('@amount')).toHaveTextContent('<0.00001');
        });

        it('expresses the threshold in the unit shown beside it', () => {
            renderAmount(
                <FormattedCryptoAmount
                    value="0.000009"
                    symbol={bitcoin}
                    showApproximation
                    data-testid="@amount"
                />,
                true,
            );

            // 0.00001 BTC is 1000 sat.
            expect(screen.getByTestId('@amount-with-symbol')).toHaveTextContent('<1,000 sat');
        });
    });

    describe('exact amount', () => {
        it('keeps every decimal the network has', () => {
            renderAmount(
                <FormattedCryptoAmount
                    value="0.001005309106970022"
                    symbol={asNetworkSymbol('eth')}
                    data-testid="@amount"
                />,
            );

            expect(screen.getByTestId('@amount')).toHaveTextContent('0.001005309106970022');
        });

        it('keeps every decimal of a token amount', () => {
            renderAmount(
                <FormattedCryptoAmount
                    value="1.234567891234"
                    symbol="DAI"
                    tokenDecimals={18}
                    data-testid="@amount"
                />,
            );

            expect(screen.getByTestId('@amount')).toHaveTextContent('1.234567891234');
        });

        it('caps a token amount at the decimals the token has', () => {
            renderAmount(
                <FormattedCryptoAmount
                    value="1.234567891234567"
                    symbol="WETH"
                    tokenDecimals={6}
                    data-testid="@amount"
                />,
            );

            expect(screen.getByTestId('@amount')).toHaveTextContent('1.234567…');
        });

        it('falls back to 18 decimals for a token that does not say', () => {
            renderAmount(
                <FormattedCryptoAmount
                    value="1.234567891234567"
                    symbol="WETH"
                    data-testid="@amount"
                />,
            );

            expect(screen.getByTestId('@amount')).toHaveTextContent('1.234567891234567');
        });

        it.each([
            { symbol: 'POL', note: 'ticker that collides with a network' },
            { symbol: 'ZZZZ', note: 'ticker that collides with nothing' },
        ])('caps a token at its own decimals for a $note', ({ symbol }) => {
            renderAmount(
                <FormattedCryptoAmount
                    value="1.2345678901234"
                    symbol={symbol}
                    contractAddress="0xdead"
                    tokenDecimals={6}
                    data-testid="@amount"
                />,
            );

            expect(screen.getByTestId('@amount')).toHaveTextContent('1.234567…');
        });

        it('marks an amount the network cannot represent as truncated', () => {
            renderAmount(
                <FormattedCryptoAmount
                    value="0.123456789"
                    symbol={bitcoin}
                    data-testid="@amount"
                />,
            );

            expect(screen.getByTestId('@amount')).toHaveTextContent('0.12345678…');
        });
    });
});
