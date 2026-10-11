import { asNetworkSymbol, getNetworks } from '@suite-common/wallet-config';

import { getNativeAssetIconSymbol, isCryptoIconSymbol } from './iconUtils';

describe(getNativeAssetIconSymbol.name, () => {
    it.each(Object.keys(getNetworks()))('resolves a bundled coin icon for %s', symbol => {
        expect(isCryptoIconSymbol(getNativeAssetIconSymbol(asNetworkSymbol(symbol)))).toBe(true);
    });

    it('shows the settlement layer coin for a layer 2', () => {
        expect(getNativeAssetIconSymbol(asNetworkSymbol('arb'))).toBe('eth');
    });

    it('shows the network coin when the native asset is a stablecoin', () => {
        expect(getNativeAssetIconSymbol(asNetworkSymbol('arc'))).toBe('arc');
    });
});
