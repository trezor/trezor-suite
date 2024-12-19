import { NetworkSymbol } from '@suite-common/wallet-config';

import { migrateEnabledDiscoveryNetworkSymbols } from '../../migrations/discovery/v2';

describe('migrateEnabledDiscoveryNetworkSymbols', () => {
    it('should migrate old enabled discovery network symbols - change bnb to bsc', () => {
        const oldEnabledDiscoveryNetworkSymbols = ['btc', 'eth', 'bnb', 'test'] as NetworkSymbol[];

        const migratedAccounts = migrateEnabledDiscoveryNetworkSymbols(
            oldEnabledDiscoveryNetworkSymbols,
        );

        expect(migratedAccounts).toEqual(['btc', 'eth', 'bsc', 'test']);
    });
});
