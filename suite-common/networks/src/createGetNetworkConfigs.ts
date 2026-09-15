import { type LegacyNetworkSymbol, networkDisplayOrder } from '@suite-common/legacy-network-config';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';
import type { GetNetworkConfigDep } from './createGetNetworkConfig';
import type { NetworkMetadata } from '../reduxState/NetworkMetadata';

export type GetNetworkConfigsDeps = GetNetworkConfigDep & NetworkModuleRepositoryDep;

export type GetNetworkConfigs = () => readonly NetworkMetadata[];

export type GetNetworkConfigsDep = { getNetworkConfigs: GetNetworkConfigs };

// Keyed by the legacy display-order list; the open symbol is narrowed at the lookup.
// TODO: refactor this legacy ordering away with the rest of the legacy network config.
// See https://github.com/trezor/trezor-suite/issues/32060
// and https://github.com/trezor/trezor-suite/pull/32469
const displayOrderBySymbol = new Map<LegacyNetworkSymbol, number>(
    networkDisplayOrder.map((symbol, index) => [symbol, index]),
);

const getDisplayOrder = (symbol: NetworkSymbol) =>
    displayOrderBySymbol.get(symbol as LegacyNetworkSymbol) ?? Number.MAX_SAFE_INTEGER;

export const createGetNetworkConfigs =
    (deps: GetNetworkConfigsDeps): GetNetworkConfigs =>
    () =>
        deps.networkModuleRepository
            .getSupportedNetworks()
            .map(symbol => ({ ...deps.getNetworkConfig(symbol), symbol }))
            // Hermes does not support toSorted; map creates a new array that is safe to sort.
            .sort((a, b) => getDisplayOrder(a.symbol) - getDisplayOrder(b.symbol));
