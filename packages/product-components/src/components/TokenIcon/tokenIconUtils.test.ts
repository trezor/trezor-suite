import { type NetworkConfig, asNetworkSymbol } from '@trezor/network-module-types';

import { hasForeignNativeAsset } from './tokenIconUtils';

describe('hasForeignNativeAsset', () => {
    it.each<[string, NetworkConfig, boolean]>([
        [
            'a network settling in a foreign coin',
            { name: 'Arc', tradeCryptoId: 'arc', nativeAssetCryptoId: 'usd-coin' },
            true,
        ],
        [
            'a network settling in its own coin',
            { name: 'Ethereum', tradeCryptoId: 'ethereum', nativeAssetCryptoId: 'ethereum' },
            false,
        ],
        [
            'a layer two settling in the coin of its settlement layer',
            {
                name: 'Optimism',
                settlementLayer: asNetworkSymbol('eth'),
                tradeCryptoId: 'optimism',
                nativeAssetCryptoId: 'ethereum',
            },
            false,
        ],
        [
            'a network without a native asset id',
            { name: 'Bitcoin', tradeCryptoId: 'bitcoin' },
            false,
        ],
    ])('%s', (_, network, expected) => {
        expect(hasForeignNativeAsset(network)).toBe(expected);
    });
});
