import { NetworkSymbol } from '@suite-common/wallet-config';
// @ts-expect-error
const deprecatedNetworks: NetworkSymbol[] = ['dash', 'btg', 'nmc', 'vtc', 'dgb'];

export const migrateDiscoveryDeprecateNetworks = (
    oldEnabledDiscoveryNetworkSymbols: NetworkSymbol[],
): NetworkSymbol[] =>
    oldEnabledDiscoveryNetworkSymbols.filter(
        networkSymbol => !deprecatedNetworks.includes(networkSymbol),
    );
