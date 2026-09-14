import type { GetNetworkConfigDep } from './createGetNetworkConfig';
import type { GetNetworkConfigsDep } from './createGetNetworkConfigs';

export type NetworkConfigDeps = GetNetworkConfigDep & GetNetworkConfigsDep;

export const selectNetworkConfigDeps = (services: {
    networks: NetworkConfigDeps;
}): NetworkConfigDeps => ({
    getNetworkConfig: services.networks.getNetworkConfig,
    getNetworkConfigs: services.networks.getNetworkConfigs,
});
