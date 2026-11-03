import { type TokenSymbol } from '@suite-common/wallet-types';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import {
    CompactTokenAmountFormatter,
    type CompactTokenAmountFormatterProps,
} from './CompactTokenAmountFormatter';
import {
    ExactTokenAmountFormatter,
    type ExactTokenAmountFormatterProps,
} from './ExactTokenAmountFormatter';
import { asDecimalTokenAmount } from '../utils';

// Both formatters expect `value` in human-readable units; base-unit amounts must be converted
// by the caller.
describe('ExactTokenAmountFormatter', () => {
    const renderExactTokenAmountFormatter = (props: Partial<ExactTokenAmountFormatterProps>) =>
        renderWithStoreProvider(
            <ExactTokenAmountFormatter
                tokenSymbol={'USDC' as TokenSymbol}
                value={asDecimalTokenAmount('1234.56')}
                {...props}
            />,
        );

    it('should render formatted value', async () => {
        const { getByText } = await renderExactTokenAmountFormatter({});

        expect(getByText('1,234.56 USDC')).toBeVisible();
    });

    it('preserves the requested token precision', async () => {
        const { getByText } = await renderExactTokenAmountFormatter({
            value: asDecimalTokenAmount('0.000000000000000001'),
            maxDisplayedDecimals: 18,
        });

        expect(getByText('0.000000000000000001 USDC')).toBeVisible();
    });

    it('renders an empty token amount as zero without forcing privacy mode', async () => {
        const { getByText } = await renderExactTokenAmountFormatter({
            value: asDecimalTokenAmount(''),
        });

        expect(getByText('0 USDC')).toBeVisible();
    });
});

describe('CompactTokenAmountFormatter', () => {
    const renderCompactTokenAmountFormatter = (props: Partial<CompactTokenAmountFormatterProps>) =>
        renderWithStoreProvider(
            <CompactTokenAmountFormatter
                tokenSymbol={'USDC' as TokenSymbol}
                value={asDecimalTokenAmount('1234.56')}
                {...props}
            />,
        );

    it.each(['arb', 'eth', 'btc'])('keeps %s tokens in decimal token units', async symbol => {
        const { getByText } = await renderCompactTokenAmountFormatter({
            tokenSymbol: symbol as TokenSymbol,
            value: asDecimalTokenAmount('20'),
        });

        expect(getByText(`20.00 ${symbol}`)).toBeVisible();
    });

    it.each([
        ['positive', '+20.00 ARB'],
        ['negative', '-20.00 ARB'],
        [undefined, '20.00 ARB'],
    ] as const)('renders a token amount with %s direction', async (signValue, expected) => {
        const { getByText } = await renderCompactTokenAmountFormatter({
            tokenSymbol: 'ARB' as TokenSymbol,
            value: asDecimalTokenAmount('20'),
            signValue,
        });

        expect(getByText(expected)).toBeVisible();
    });

    it('renders a compact token dust threshold with its symbol', async () => {
        const { getByText } = await renderCompactTokenAmountFormatter({
            tokenDecimals: 6,
            value: asDecimalTokenAmount('0.009'),
        });

        expect(getByText('<0.01 USDC')).toBeVisible();
    });

    it('should format a 6-decimal token balance money-like (two decimals)', async () => {
        const { getByText } = await renderCompactTokenAmountFormatter({
            tokenDecimals: 6,
            value: asDecimalTokenAmount('23.910287'),
        });

        expect(getByText('23.91 USDC')).toBeVisible();
    });
});
