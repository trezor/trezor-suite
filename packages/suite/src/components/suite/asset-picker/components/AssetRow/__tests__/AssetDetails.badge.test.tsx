import { render } from '@testing-library/react';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';

import { ThemeProvider } from 'src/support/suite/ThemeProvider';

import { AssetDetails } from '../AssetDetails';

const renderAD = (ui: React.ReactElement) =>
    render(<ThemeProvider themeVariant="light">{ui}</ThemeProvider>);

describe('AssetDetails network chip', () => {
    it('native base shows "Base" network chip', () => {
        const { queryByText } = renderAD(
            <AssetDetails
                name={getNetworkDisplaySymbolName('base')}
                displaySymbol="ETH"
                networkSymbol="base"
            />,
        );
        expect(queryByText('Base')).toBeTruthy();
    });

    it('native eth shows "Ethereum" chip too (token-network, uniform rule)', () => {
        const { getAllByText } = renderAD(
            <AssetDetails
                name={getNetworkDisplaySymbolName('eth')}
                displaySymbol="ETH"
                networkSymbol="eth"
            />,
        );
        // "Ethereum" appears twice: as the name and as the network chip
        expect(getAllByText('Ethereum')).toHaveLength(2);
    });

    it('token USDC on eth shows "Ethereum" chip', () => {
        const { queryByText } = renderAD(
            <AssetDetails name="USDC" displaySymbol="USDC" networkSymbol="eth" />,
        );
        expect(queryByText('Ethereum')).toBeTruthy();
    });

    it('native btc (single-asset) shows no network chip', () => {
        const { queryByText } = renderAD(
            <AssetDetails
                name={getNetworkDisplaySymbolName('btc')}
                displaySymbol="BTC"
                networkSymbol="btc"
            />,
        );
        // Only the name "Bitcoin" is rendered, no network chip
        expect(queryByText('Bitcoin')).toBeTruthy();
    });
});
