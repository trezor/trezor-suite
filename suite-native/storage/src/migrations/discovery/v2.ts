import { NetworkSymbol } from '@suite-common/wallet-config';

type NetworkSymbolOld = Exclude<NetworkSymbol, 'bsc'> | 'bnb';

export const migrateEnabledDiscoveryNetworkSymbols = (
    oldEnabledDiscoveryNetworkSymbols: NetworkSymbol[],
): NetworkSymbol[] =>
    (oldEnabledDiscoveryNetworkSymbols as NetworkSymbolOld[]).map(networkSymbol =>
        networkSymbol === 'bnb' ? 'bsc' : networkSymbol,
    );
