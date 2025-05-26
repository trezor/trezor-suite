import { pipe } from '@mobily/ts-belt';

import { NetworkSymbol } from '@suite-common/wallet-config';

type NetworkSymbolOld = Exclude<NetworkSymbol, 'bsc'> | 'bnb';

const migrateEnabledDiscoveryNetworkSymbols = (
    oldEnabledDiscoveryNetworkSymbols: NetworkSymbol[],
): NetworkSymbol[] =>
    (oldEnabledDiscoveryNetworkSymbols as NetworkSymbolOld[]).map(networkSymbol =>
        networkSymbol === 'bnb' ? 'bsc' : networkSymbol,
    );

// @ts-expect-error
const deprecatedNetworks: NetworkSymbol[] = ['dash', 'btg', 'nmc', 'vtc', 'dgb'];

const migrateDiscoveryDeprecateNetworks = (
    oldEnabledDiscoveryNetworkSymbols: NetworkSymbol[],
): NetworkSymbol[] =>
    oldEnabledDiscoveryNetworkSymbols.filter(
        networkSymbol => !deprecatedNetworks.includes(networkSymbol),
    );

/**
 * Migration of discoveryConfig slice, which was declared locally in suite-native,
 * to the walletSettings reducer shared in suite-common.
 * All migrations that were done on discoveryConfig are moved here
 */
export const migrateDiscoveryConfigToWalletSettings = (
    oldEnabledDiscoveryNetworkSymbols: NetworkSymbol[],
): NetworkSymbol[] =>
    pipe(
        oldEnabledDiscoveryNetworkSymbols,
        migrateEnabledDiscoveryNetworkSymbols,
        migrateDiscoveryDeprecateNetworks,
    );
