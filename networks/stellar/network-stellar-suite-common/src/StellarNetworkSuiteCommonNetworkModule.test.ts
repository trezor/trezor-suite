import { asNetworkSymbol } from '@trezor/network-module/constants';

import { createStellarSuiteCommonNetworkModule } from './StellarNetworkSuiteCommonNetworkModule';

describe(createStellarSuiteCommonNetworkModule.name, () => {
    const networkModule = createStellarSuiteCommonNetworkModule();

    it('reports the networks it supports', () => {
        expect(networkModule.getSupportedNetworks()).toEqual(['xlm', 'txlm']);
        expect(networkModule.isSupportedNetwork(asNetworkSymbol('xlm'))).toBe(true);
        expect(networkModule.isSupportedNetwork(asNetworkSymbol('btc'))).toBe(false);
    });

    it('serves a symbol it supports', () => {
        expect(networkModule.getNetworkConfig(asNetworkSymbol('xlm')).networkType).toBe('stellar');
    });

    // The open symbol is narrowed at the module edge, so an unsupported one never reaches a
    // capability written against the closed Stellar symbol.
    it('rejects a symbol it does not support', () => {
        expect(() => networkModule.getNetworkConfig(asNetworkSymbol('btc'))).toThrow(
            'Unsupported network symbol: btc. Supported: xlm, txlm.',
        );
        expect(() =>
            networkModule.addressValidator.isAddressValid('addr', asNetworkSymbol('btc')),
        ).toThrow('Unsupported network symbol: btc');
    });
});
