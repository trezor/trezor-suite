import { toTokenAddress } from '@suite-common/wallet-types';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type TokenMetadata, TokenMetadataProvider } from '@suite-native/tokens';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    CompactTokenAmountFormatter,
    type CompactTokenAmountFormatterProps,
} from './CompactTokenAmountFormatter';
import {
    ExactTokenAmountFormatter,
    type ExactTokenAmountFormatterProps,
} from './ExactTokenAmountFormatter';
import { asDecimalTokenAmount } from '../utils';

const networkSymbol = asNetworkSymbol('eth');
const contractAddress = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const token: TokenMetadata = { contract: contractAddress, symbol: 'USDC', decimals: 18 };

// Both formatters expect `value` in human-readable units; base-unit amounts must be converted
// by the caller.
describe('ExactTokenAmountFormatter', () => {
    const renderExactTokenAmountFormatter = (
        props: Partial<ExactTokenAmountFormatterProps>,
        metadata: TokenMetadata = token,
    ) =>
        renderWithStoreProvider(
            <TokenMetadataProvider networkSymbol={networkSymbol} tokens={[metadata]}>
                <ExactTokenAmountFormatter
                    networkSymbol={networkSymbol}
                    contractAddress={contractAddress}
                    value={asDecimalTokenAmount('1234.56')}
                    {...props}
                />
            </TokenMetadataProvider>,
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
    const renderCompactTokenAmountFormatter = (
        props: Partial<CompactTokenAmountFormatterProps>,
        metadata: TokenMetadata = token,
    ) =>
        renderWithStoreProvider(
            <TokenMetadataProvider networkSymbol={networkSymbol} tokens={[metadata]}>
                <CompactTokenAmountFormatter
                    networkSymbol={networkSymbol}
                    contractAddress={contractAddress}
                    value={asDecimalTokenAmount('1234.56')}
                    {...props}
                />
            </TokenMetadataProvider>,
        );

    it.each(['arb', 'eth', 'btc'])('keeps %s tokens in decimal token units', async symbol => {
        const { getByText } = await renderCompactTokenAmountFormatter(
            {
                value: asDecimalTokenAmount('20'),
            },
            { ...token, symbol },
        );

        expect(getByText(`20.00 ${symbol}`)).toBeVisible();
    });

    it.each([
        ['positive', '+20.00 ARB'],
        ['negative', '-20.00 ARB'],
        [undefined, '20.00 ARB'],
    ] as const)('renders a token amount with %s direction', async (signValue, expected) => {
        const { getByText } = await renderCompactTokenAmountFormatter(
            {
                value: asDecimalTokenAmount('20'),
                signValue,
            },
            { ...token, symbol: 'ARB' },
        );

        expect(getByText(expected)).toBeVisible();
    });

    it('renders a compact token dust threshold with its symbol', async () => {
        const { getByText } = await renderCompactTokenAmountFormatter(
            {
                value: asDecimalTokenAmount('0.009'),
            },
            { ...token, decimals: 6 },
        );

        expect(getByText('<0.01 USDC')).toBeVisible();
    });

    it('should format a 6-decimal token balance money-like (two decimals)', async () => {
        const { getByText } = await renderCompactTokenAmountFormatter(
            {
                value: asDecimalTokenAmount('23.910287'),
            },
            { ...token, decimals: 6 },
        );

        expect(getByText('23.91 USDC')).toBeVisible();
    });
});
