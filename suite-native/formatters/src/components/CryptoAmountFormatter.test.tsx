import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
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
            <CryptoAmountFormatter value="1.239" symbol={ethSymbol} />,
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

    it('renders network amount when token contract is undefined and network symbol is provided', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CryptoAmountFormatter
                value="1.239"
                symbol={ethSymbol}
                formatStyle="compact-balance"
                tokenContract={undefined}
                tokenDecimals={undefined}
                tokenSymbol={undefined}
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('1.23 ETH');
    });

    it('renders compact token amount when token symbol is provided', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CryptoAmountFormatter
                value="0.000009"
                formatStyle="compact-balance"
                tokenSymbol={'USDC' as TokenSymbol}
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('<0.00001 USDC');
    });

    it('renders token amount when token symbol is null and network symbol is not provided', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CryptoAmountFormatter
                value="0.000009"
                formatStyle="compact-balance"
                tokenSymbol={null}
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('<0.00001');
    });

    it('renders exact token amount when token contract is provided', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CryptoAmountFormatter
                value="0.000000000000000001"
                symbol={ethSymbol}
                maxDisplayedDecimals={18}
                tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
                tokenSymbol="USDC"
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('0.000000000000000001 USDC');
    });

    it('renders phishing transaction with empty value as discreet text', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CryptoAmountFormatter
                value=""
                tokenSymbol={'USDC' as TokenSymbol}
                isPhishingTransaction
            />,
        );

        expect(getByTestId('discreet-text')).toHaveTextContent('0 USDC');
    });
});
