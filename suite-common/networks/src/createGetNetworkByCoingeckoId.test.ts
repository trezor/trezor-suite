import { createMockDeps } from '@trezor/dependency-injection';

import { asNetworkSymbol } from './NetworkModules';
import {
    type GetNetworkByCoingeckoIdDeps,
    createGetNetworkByCoingeckoId,
} from './createGetNetworkByCoingeckoId';
import { mockNetworkMetadata } from '../mocks/mockNetworkMetadata';
import type { NetworkMetadata } from '../reduxState/NetworkMetadata';

it('indexes registered networks by CoinGecko ID and skips networks without one', () => {
    const ethereum: NetworkMetadata = { ...mockNetworkMetadata.eth, coingeckoId: 'ethereum' };
    const bitcoin: NetworkMetadata = { ...mockNetworkMetadata.btc, coingeckoId: 'bitcoin' };
    const deps = createMockDeps<GetNetworkByCoingeckoIdDeps>({
        networkModuleRepository: {
            getSupportedNetworks: () => [
                asNetworkSymbol('eth'),
                asNetworkSymbol('btc'),
                asNetworkSymbol('test'),
            ],
            get: null,
            isSupportedNetwork: null,
        },
        getNetworkConfig: symbol => {
            if (symbol === ethereum.symbol) return ethereum;
            if (symbol === bitcoin.symbol) return bitcoin;

            return mockNetworkMetadata.test;
        },
    });

    const getNetworkByCoingeckoId = createGetNetworkByCoingeckoId(deps);

    expect(getNetworkByCoingeckoId('ethereum')).toEqual(ethereum);
    expect(getNetworkByCoingeckoId('bitcoin')).toEqual(bitcoin);
    expect(getNetworkByCoingeckoId('unknown-platform')).toBeUndefined();
});
