import { toTokenSymbol } from '@suite-common/wallet-types';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TokenAmountFormatter } from './TokenAmountFormatter';
import { asDecimalTokenAmount } from '../utils';

jest.mock('@suite-common/discreet-mode', () => ({
    useDiscreetMode: () => ({
        isDiscreetMode: false,
    }),
}));

describe('TokenAmountFormatter', () => {
    const usdcSymbol = toTokenSymbol('USDC');

    it('renders exact token amount by default', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <TokenAmountFormatter
                value={asDecimalTokenAmount('0.000000000000000001')}
                maxDisplayedDecimals={18}
                symbol={usdcSymbol}
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('0.000000000000000001 USDC');
    });

    it('renders compact token amount', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <TokenAmountFormatter
                value={asDecimalTokenAmount('0.000009')}
                formatStyle="compact-balance"
                symbol={usdcSymbol}
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('<0.00001 USDC');
    });

    it('formats a six-decimal token balance as money', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <TokenAmountFormatter
                value={asDecimalTokenAmount('23.910287')}
                formatStyle="compact-balance"
                decimals={6}
                symbol={usdcSymbol}
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('23.91 USDC');
    });

    it('applies the money dust threshold to a six-decimal token', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <TokenAmountFormatter
                value={asDecimalTokenAmount('0.009')}
                formatStyle="compact-balance"
                decimals={6}
                symbol={usdcSymbol}
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('<0.01 USDC');
    });

    it('does not apply money formatting to a token with another decimal precision', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <TokenAmountFormatter
                value={asDecimalTokenAmount('0.009')}
                formatStyle="compact-balance"
                decimals={18}
                symbol={usdcSymbol}
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('0.009 USDC');
    });

    it('renders a token without a known symbol', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <TokenAmountFormatter
                value={asDecimalTokenAmount('0.000009')}
                formatStyle="compact-balance"
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('<0.00001');
    });

    it('applies loading and sign presentation to token amounts', async () => {
        const { getByTestId, rerender } = await renderWithBasicProvider(
            <TokenAmountFormatter value={asDecimalTokenAmount('1')} symbol={usdcSymbol} sign="+" />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('+1 USDC');

        await rerender(
            <TokenAmountFormatter
                value={asDecimalTokenAmount('1')}
                symbol={usdcSymbol}
                isLoading
            />,
        );

        expect(getByTestId('BoxSkeleton')).toBeOnTheScreen();
    });

    it('renders phishing transaction with empty value as discreet text', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <TokenAmountFormatter
                value={asDecimalTokenAmount('')}
                symbol={usdcSymbol}
                isPhishingTransaction
            />,
        );

        expect(getByTestId('discreet-text')).toHaveTextContent('0 USDC');
    });
});
