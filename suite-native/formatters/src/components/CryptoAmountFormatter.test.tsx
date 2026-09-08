import { asNetworkSymbol } from '@suite-common/wallet-config';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { CryptoAmountFormatter } from './CryptoAmountFormatter';

jest.mock('@suite-common/discreet-mode', () => ({
    useDiscreetMode: () => ({
        isDiscreetMode: false,
    }),
}));

describe('CryptoAmountFormatter', () => {
    const ethSymbol = asNetworkSymbol('eth');

    it('renders compact network amount when token contract is not provided', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CryptoAmountFormatter
                value="1.239"
                symbol={ethSymbol}
                formatStyle="compact-balance"
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('1.23 ETH');
    });

    it('renders exact network amount when token contract is not provided', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CryptoAmountFormatter value="1.239" symbol={ethSymbol} formatStyle="exact" />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('1.239 ETH');
    });

    it('renders compact token amount when token contract is provided', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CryptoAmountFormatter
                value="23.910287"
                symbol={ethSymbol}
                formatStyle="compact-balance"
                tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
                tokenDecimals={6}
                tokenSymbol="USDC"
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('23.91 USDC');
    });

    it('renders exact token amount when token contract is provided', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CryptoAmountFormatter
                value="0.000000000000000001"
                symbol={ethSymbol}
                formatStyle="exact"
                maxDisplayedDecimals={18}
                tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
                tokenSymbol="USDC"
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('0.000000000000000001 USDC');
    });
});
