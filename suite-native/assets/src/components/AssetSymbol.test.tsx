import { createAssetId } from '@suite-common/asset-types';
import { getMockNetworkMetadata } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';

import { AssetSymbol } from './AssetSymbol';

describe('AssetSymbol', () => {
    it('reads the native ticker from network state using the asset identity', async () => {
        const networkSymbol = asNetworkSymbol('base');
        const networks = {
            [networkSymbol]: {
                ...getMockNetworkMetadata(networkSymbol),
                displaySymbol: 'STATE_ETH',
            },
        };

        await renderWithStoreProvider(<AssetSymbol assetId={createAssetId({ networkSymbol })} />, {
            preloadedState: { networks },
        });

        expect(screen.getByText('STATE_ETH')).toBeOnTheScreen();
    });
});
