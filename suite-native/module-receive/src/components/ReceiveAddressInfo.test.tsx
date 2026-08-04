import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { ReceiveAddressInfo } from './ReceiveAddressInfo';

describe('ReceiveAddressInfo', () => {
    it('shows the shared assets and tokens information for an Ethereum account', () => {
        const { getByText } = renderWithBasicProvider(
            <ReceiveAddressInfo networkSymbol="eth" isTokenAddress={false} />,
        );

        expect(
            getByText(
                getTranslation('moduleReceive.receiveAddressCard.alert.sharedAssetsAndTokens'),
            ),
        ).toBeOnTheScreen();
    });

    it('shows the shared assets and tokens information for an Ethereum token', () => {
        const { getByText } = renderWithBasicProvider(
            <ReceiveAddressInfo networkSymbol="eth" isTokenAddress />,
        );

        expect(
            getByText(
                getTranslation('moduleReceive.receiveAddressCard.alert.sharedAssetsAndTokens'),
            ),
        ).toBeOnTheScreen();
    });

    it('does not show the shared assets and tokens information for a Bitcoin account', () => {
        const { queryByText } = renderWithBasicProvider(
            <ReceiveAddressInfo networkSymbol="btc" isTokenAddress={false} />,
        );

        expect(
            queryByText(
                getTranslation('moduleReceive.receiveAddressCard.alert.sharedAssetsAndTokens'),
            ),
        ).not.toBeOnTheScreen();
    });

    it('keeps the network-address information for tokens on other networks', () => {
        const { getByText } = renderWithBasicProvider(
            <ReceiveAddressInfo networkSymbol="sol" isTokenAddress />,
        );

        expect(
            getByText(
                getTranslation('moduleReceive.receiveAddressCard.alert.token', {
                    networkName: 'Solana',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('keeps the long-address information for Cardano', () => {
        const { getByText } = renderWithBasicProvider(
            <ReceiveAddressInfo networkSymbol="ada" isTokenAddress={false} />,
        );

        expect(
            getByText(getTranslation('moduleReceive.receiveAddressCard.alert.longCardanoAddress')),
        ).toBeOnTheScreen();
    });
});
