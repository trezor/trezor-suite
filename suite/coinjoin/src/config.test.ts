import { asNetworkSymbol } from '@suite-common/wallet-config';

import { COINJOIN_NETWORKS, getCoinjoinConfig } from './config';

const btcSymbol = asNetworkSymbol('btc');
const testSymbol = asNetworkSymbol('test');
const regtestSymbol = asNetworkSymbol('regtest');

describe('getCoinjoinConfig', () => {
    it('falls back to the default environment of the network for a removed one', () => {
        // the fallback warns in dev builds, keep the test output clean
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        // 'staging' may still be stored in persisted debug settings
        expect(getCoinjoinConfig(testSymbol, 'staging' as never)).toEqual(
            COINJOIN_NETWORKS.test?.public,
        );

        warnSpy.mockRestore();
    });

    it('btc and test have no coordinator, regtest has a local one', () => {
        expect(getCoinjoinConfig(btcSymbol).coordinatorUrl).toBeUndefined();
        expect(getCoinjoinConfig(btcSymbol).wabisabiBackendUrl).toBeUndefined();
        expect(getCoinjoinConfig(testSymbol).coordinatorUrl).toBeUndefined();
        expect(getCoinjoinConfig(testSymbol).wabisabiBackendUrl).toBeUndefined();
        expect(getCoinjoinConfig(regtestSymbol).coordinatorUrl).toBeDefined();
    });
});
