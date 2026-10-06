import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { GetNetworkConfigDep } from './createGetNetworkConfig';
import type { NetworkMetadata } from '../reduxState/NetworkMetadata';

export type GetNetworkConfigsDeps = GetNetworkConfigDep & NetworkModuleRepositoryDep;

export type GetNetworkConfigs = () => readonly NetworkMetadata[];

export type GetNetworkConfigsDep = { getNetworkConfigs: GetNetworkConfigs };

// Byte-wise, not locale-aware, as fractional-indexing keys require.
const compareStrings = (a: string, b: string) => {
    if (a < b) {
        return -1;
    }

    if (a > b) {
        return 1;
    }

    return 0;
};

const compareDisplayOrder = (a: NetworkMetadata, b: NetworkMetadata) =>
    compareStrings(a.displayOrder, b.displayOrder) || compareStrings(a.symbol, b.symbol);

export const createGetNetworkConfigs =
    (deps: GetNetworkConfigsDeps): GetNetworkConfigs =>
    () =>
        deps.networkModuleRepository
            .getSupportedNetworks()
            .map(symbol => ({ ...deps.getNetworkConfig(symbol), symbol }))
            // Hermes does not support toSorted; map creates a new array that is safe to sort.
            .sort(compareDisplayOrder);
