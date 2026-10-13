import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { GetNetworkConfigDep } from './createGetNetworkConfig';
import type { NetworkMetadata } from '../reduxState/NetworkMetadata';

export type GetNetworkByCoingeckoIdDeps = GetNetworkConfigDep & NetworkModuleRepositoryDep;

export type GetNetworkByCoingeckoId = (coingeckoId: string) => NetworkMetadata | undefined;

export type GetNetworkByCoingeckoIdDep = { getNetworkByCoingeckoId: GetNetworkByCoingeckoId };

export const createGetNetworkByCoingeckoId = (
    deps: GetNetworkByCoingeckoIdDeps,
): GetNetworkByCoingeckoId => {
    const networksByCoingeckoId = new Map<string, NetworkMetadata>();

    deps.networkModuleRepository.getSupportedNetworks().forEach(symbol => {
        const network = deps.getNetworkConfig(symbol);

        if (network.coingeckoId) {
            networksByCoingeckoId.set(network.coingeckoId, { ...network, symbol });
        }
    });

    return coingeckoId => networksByCoingeckoId.get(coingeckoId);
};
