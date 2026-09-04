import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { ReceiveAddressInfo } from './ReceiveAddressInfo';

describe('ReceiveAddressInfo', () => {
    const ethSymbol = asNetworkSymbol('eth');
    const btcSymbol = asNetworkSymbol('btc');
    const solSymbol = asNetworkSymbol('sol');
    const adaSymbol = asNetworkSymbol('ada');

    it('shows the shared assets and tokens information for an Ethereum account', async () => {
        const { getByText } = await renderWithBasicProvider(
            <ReceiveAddressInfo networkSymbol={ethSymbol} isTokenAddress={false} />,
        );

        expect(
            getByText(
                getTranslation('moduleReceive.receiveAddressCard.alert.sharedAssetsAndTokens'),
            ),
        ).toBeOnTheScreen();
    });

    it('shows the shared assets and tokens information for an Ethereum token', async () => {
        const { getByText } = await renderWithBasicProvider(
            <ReceiveAddressInfo networkSymbol={ethSymbol} isTokenAddress />,
        );

        expect(
            getByText(
                getTranslation('moduleReceive.receiveAddressCard.alert.sharedAssetsAndTokens'),
            ),
        ).toBeOnTheScreen();
    });

    it('does not show the shared assets and tokens information for a Bitcoin account', async () => {
        const { queryByText } = await renderWithBasicProvider(
            <ReceiveAddressInfo networkSymbol={btcSymbol} isTokenAddress={false} />,
        );

        expect(
            queryByText(
                getTranslation('moduleReceive.receiveAddressCard.alert.sharedAssetsAndTokens'),
            ),
        ).not.toBeOnTheScreen();
    });

    it('keeps the network-address information for tokens on other networks', async () => {
        const { getByText } = await renderWithBasicProvider(
            <ReceiveAddressInfo networkSymbol={solSymbol} isTokenAddress />,
        );

        expect(
            getByText(
                getTranslation('moduleReceive.receiveAddressCard.alert.token', {
                    networkName: 'Solana',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('keeps the long-address information for Cardano', async () => {
        const { getByText } = await renderWithBasicProvider(
            <ReceiveAddressInfo networkSymbol={adaSymbol} isTokenAddress={false} />,
        );

        expect(
            getByText(getTranslation('moduleReceive.receiveAddressCard.alert.longCardanoAddress')),
        ).toBeOnTheScreen();
    });
});
