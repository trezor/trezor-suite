import { getNetwork, getSupportedNetworks, isTestnet } from './networksConfig';

import type * as WalletConfig from './index';

it('does not read network services until a compatibility function is called', () => {
    jest.isolateModules(() => {
        const config = jest.requireActual<typeof WalletConfig>('./index');

        expect(() => config.getNetwork('btc')).toThrow(
            'Network services have not been registered.',
        );
    });
});

describe(isTestnet.name, () => {
    it('preserves network object identity between compatibility calls', () => {
        expect(getNetwork('btc')).toBe(getNetwork('btc'));
    });

    it('preserves the supported-network list identity used by selectors', () => {
        expect(getSupportedNetworks()).toBe(getSupportedNetworks());
    });
    it('returns false for a mainnet', () => {
        expect(isTestnet('btc')).toBe(false);
    });

    it('returns true for a testnet', () => {
        expect(isTestnet('test')).toBe(true);
    });
});
