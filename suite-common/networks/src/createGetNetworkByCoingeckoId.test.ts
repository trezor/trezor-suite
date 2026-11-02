import { createMockDeps } from '@trezor/dependency-injection';

import { asNetworkSymbol } from './NetworkModules';
import {
    type GetNetworkByCoingeckoIdDeps,
    createGetNetworkByCoingeckoId,
} from './createGetNetworkByCoingeckoId';
import { mockNetworkMetadata } from '../mocks/mockNetworkMetadata';
import type { NetworkMetadata } from '../reduxState/NetworkMetadata';

it('indexes registered networks by CoinGecko ID and skips networks without one', () => {
    const ethereum = mockNetworkMetadata.eth;
    const bitcoin: NetworkMetadata = {
        ...mockNetworkMetadata.btc,
        coingeckoId: 'coingecko-bitcoin-id',
    };
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

    expect(getNetworkByCoingeckoId('coingecko-ethereum-id')).toEqual(ethereum);
    expect(getNetworkByCoingeckoId('coingecko-bitcoin-id')).toEqual(bitcoin);
    expect(getNetworkByCoingeckoId('eth')).toBeUndefined();
    expect(getNetworkByCoingeckoId('unknown-platform')).toBeUndefined();
});
