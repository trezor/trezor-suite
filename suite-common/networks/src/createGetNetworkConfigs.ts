import { type Network as LegacyNetwork, networks } from '@suite-common/legacy-network-config';
import { typedObjectValues } from '@trezor/utils';

import { asNetworkSymbol } from './NetworkModules';
import type { GetNetworkConfigDep } from './createGetNetworkConfig';
import type { NetworkMetadata } from '../reduxState/NetworkMetadata';

export type GetNetworkConfigsDeps = GetNetworkConfigDep;

export type GetNetworkConfigs = () => readonly NetworkMetadata[];

export type GetNetworkConfigsDep = {
    getNetworkConfigs: GetNetworkConfigs;
};

export const createGetNetworkConfigs =
    (deps: GetNetworkConfigsDeps): GetNetworkConfigs =>
    () => {
        const legacyNetworks: readonly LegacyNetwork[] = typedObjectValues(networks);

        return legacyNetworks.map(network => {
            // The temporary registry uses strings to avoid depending on this package.
            const symbol = asNetworkSymbol(network.symbol);

            return {
                symbol,
                name: network.name,
                displaySymbol: network.displaySymbol,
                networkType: network.networkType,
                decimals: network.decimals,
                testnet: network.testnet,
                explorer: { ...network.explorer },
                ...deps.getNetworkConfig(symbol),
            };
        });
    };
