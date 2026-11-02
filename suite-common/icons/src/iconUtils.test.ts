import { asNetworkSymbol, getNetworks, isNetworkSymbol } from '@suite-common/wallet-config';

import { getNativeAssetIconSymbol } from './iconUtils';

describe(getNativeAssetIconSymbol.name, () => {
    it.each(Object.keys(getNetworks()))('resolves a known network symbol for %s', symbol => {
        expect(isNetworkSymbol(getNativeAssetIconSymbol(asNetworkSymbol(symbol)))).toBe(true);
    });

    it('shows the settlement layer coin for a layer 2', () => {
        expect(getNativeAssetIconSymbol(asNetworkSymbol('arb'))).toBe('eth');
    });

    it('shows the network coin when the native asset is a stablecoin', () => {
        expect(getNativeAssetIconSymbol(asNetworkSymbol('arc'))).toBe('arc');
    });
});
