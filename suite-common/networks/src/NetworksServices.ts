import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { AddressValidatorDep } from './createAddressValidator';
import type { GetNamedAddressSupportDep } from './createGetNamedAddressSupport';
import type { GetNetworkConfigDep } from './createGetNetworkConfig';
import type { GetNetworkConfigsDep } from './createGetNetworkConfigs';
import type { LoadNetworkModulesDep } from './createLoadNetworkModules';

export type NetworksServices = NetworkModuleRepositoryDep &
    AddressValidatorDep &
    GetNamedAddressSupportDep &
    GetNetworkConfigDep &
    GetNetworkConfigsDep &
    LoadNetworkModulesDep;

export type NetworksDep = { networks: NetworksServices };
