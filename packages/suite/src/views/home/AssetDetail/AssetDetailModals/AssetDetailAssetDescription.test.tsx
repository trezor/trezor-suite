import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { selectWalletAssetKey } from '@suite-common/assets';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetDetailAssetDescription } from './AssetDetailAssetDescription';
import { ETH, getEthAssetState } from '../assetDetailTestState';

const OP = asNetworkSymbol('op');
const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

const getInitialState = (): AppState => {
    const state = getEthAssetState({
        accounts: [
            mockWalletAccount({
                symbol: ETH,
                formattedBalance: '2',
                tokens: [
                    mockAccountToken({
                        name: 'USD Coin',
                        symbol: 'USDC',
                        contract: USDC_ON_ETH,
                        balance: '10',
                    }),
                ],
            }),
            mockWalletAccount({ symbol: OP, formattedBalance: '1' }),
        ],
    });

    return {
        ...state,
        networks: mockNetworksState([ETH, OP]),
        wallet: {
            ...state.wallet,
            settings: { ...state.wallet.settings, enabledNetworks: [ETH, OP] },
        },
    };
};

const renderDescription = (symbol: NetworkSymbol, contractAddress?: TokenAddress) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: getInitialState(),
    });
    const assetKey = selectWalletAssetKey(services.store.getState(), symbol, contractAddress);

    if (assetKey === undefined) {
        throw new Error('The asset is not in the wallet.');
    }

    const { container } = renderWithProviders(
        services,
        <AssetDetailAssetDescription assetKey={assetKey} />,
    );

    return container;
};

describe('AssetDetailAssetDescription', () => {
    it('names a token together with its network', () => {
        renderDescription(ETH, USDC_ON_ETH);

        expect(screen.getByText('USD Coin on Ethereum')).toBeInTheDocument();
    });

    it('names only the network of a coin, even where the coin is ether', () => {
        expect(renderDescription(OP)).toHaveTextContent(/^Optimism$/);
    });
});
