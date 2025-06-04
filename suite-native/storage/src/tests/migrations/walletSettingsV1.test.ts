import { NetworkSymbol } from '@suite-common/wallet-config';

import { migrateDiscoveryConfigToWalletSettings } from '../../migrations/walletSettings/v1';

describe(migrateDiscoveryConfigToWalletSettings.name, () => {
    it('should migrate enabled network symbols by changing bnb to bsc and removing deprecated coins', () => {
        const oldEnabledDiscoveryNetworkSymbols = [
            'btc',
            'eth',
            'nmc',
            'bnb',
            'test',
            'dash',
        ] as NetworkSymbol[];

        const migratedAccounts = migrateDiscoveryConfigToWalletSettings(
            oldEnabledDiscoveryNetworkSymbols,
        );

        expect(migratedAccounts).toEqual(['btc', 'eth', 'bsc', 'test']);
    });
});
