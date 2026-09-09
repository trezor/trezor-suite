import type { NetworkSymbol } from './NetworkModules';
import { createIsSupportedNetwork } from './createIsSupportedNetwork';

describe('isSupportedNetwork', () => {
    it('recognizes only symbols returned by the injected service', () => {
        const supportedNetworks: readonly NetworkSymbol[] = ['btc', 'test'];
        const isSupportedNetwork = createIsSupportedNetwork({
            getSupportedNetworks: () => supportedNetworks,
        });

        expect(isSupportedNetwork('btc')).toBe(true);
        expect(isSupportedNetwork('test')).toBe(true);
        expect(isSupportedNetwork('eth')).toBe(false);
        expect(isSupportedNetwork('unknown')).toBe(false);
    });
});
