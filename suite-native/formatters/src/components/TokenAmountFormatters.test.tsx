import { type TokenSymbol } from '@suite-common/wallet-types';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import {
    CompactTokenAmountFormatter,
    type CompactTokenAmountFormatterProps,
} from './CompactTokenAmountFormatter';
import {
    ExactTokenAmountFormatter,
    type ExactTokenAmountFormatterProps,
} from './ExactTokenAmountFormatter';
import { asDecimalTokenAmount } from '../utils';

jest.mock('@suite-common/discreet-mode', () => ({
    useDiscreetMode: () => ({
        isDiscreetMode: false,
    }),
}));

// Both formatters expect `value` in human-readable units; base-unit amounts must be converted
// by the caller.
describe('ExactTokenAmountFormatter', () => {
    const renderExactTokenAmountFormatter = async (
        props: Partial<ExactTokenAmountFormatterProps>,
    ) =>
        await renderWithBasicProvider(
            <ExactTokenAmountFormatter
                tokenSymbol={'USDC' as TokenSymbol}
                value={asDecimalTokenAmount('1234.56')}
                {...props}
            />,
        );

    it('should render formatted value', async () => {
        const { getByTestId } = await renderExactTokenAmountFormatter({});

        expect(getByTestId('plain-text')).toHaveTextContent('1,234.56 USDC');
    });

    it('should cap displayed decimals to the token precision', async () => {
        const { getByTestId } = await renderExactTokenAmountFormatter({
            value: asDecimalTokenAmount('0.000000000000000001'),
            maxDisplayedDecimals: 18,
        });

        expect(getByTestId('plain-text')).toHaveTextContent('0.000000000000000001 USDC');
    });

    it('should render phishing transaction with empty value as discreet text', async () => {
        const { getByTestId } = await renderExactTokenAmountFormatter({
            value: asDecimalTokenAmount(''),
            isPhishingTransaction: true,
        });

        expect(getByTestId('discreet-text')).toHaveTextContent('0 USDC');
    });
});

describe('CompactTokenAmountFormatter', () => {
    const renderCompactTokenAmountFormatter = async (
        props: Partial<CompactTokenAmountFormatterProps>,
    ) =>
        await renderWithBasicProvider(
            <CompactTokenAmountFormatter
                tokenSymbol={'USDC' as TokenSymbol}
                value={asDecimalTokenAmount('1234.56')}
                {...props}
            />,
        );

    it('should render compact formatted value', async () => {
        const { getByTestId } = await renderCompactTokenAmountFormatter({});

        expect(getByTestId('plain-text')).toHaveTextContent('1,234.56 USDC');
    });

    it('should render compact formatted dust value', async () => {
        const { getByTestId } = await renderCompactTokenAmountFormatter({
            value: asDecimalTokenAmount('0.000009'),
        });

        expect(getByTestId('plain-text')).toHaveTextContent('<0.00001 USDC');
    });

    it('should format a 6-decimal token balance money-like (two decimals)', async () => {
        const { getByTestId } = await renderCompactTokenAmountFormatter({
            tokenDecimals: 6,
            value: asDecimalTokenAmount('23.910287'),
        });

        expect(getByTestId('plain-text')).toHaveTextContent('23.91 USDC');
    });

    it('should apply the money dust threshold for 6-decimal tokens', async () => {
        const { getByTestId } = await renderCompactTokenAmountFormatter({
            tokenDecimals: 6,
            value: asDecimalTokenAmount('0.009'),
        });

        expect(getByTestId('plain-text')).toHaveTextContent('<0.01 USDC');
    });

    it('should not apply money formatting to non-6-decimal tokens', async () => {
        const { getByTestId } = await renderCompactTokenAmountFormatter({
            tokenDecimals: 18,
            value: asDecimalTokenAmount('0.009'),
        });

        expect(getByTestId('plain-text')).toHaveTextContent('0.009 USDC');
    });
});
