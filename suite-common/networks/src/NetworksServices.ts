import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { AddressValidatorDep } from './createAddressValidator';
import type { GetAccountSyncIntervalDep } from './createGetAccountSyncInterval';
import type { GetNamedAddressSupportDep } from './createGetNamedAddressSupport';
import type { GetNetworkConfigDep } from './createGetNetworkConfig';
import type { LoadNetworkModulesDep } from './createLoadNetworkModules';

export type NetworksServices = NetworkModuleRepositoryDep &
    AddressValidatorDep &
    GetAccountSyncIntervalDep &
    GetNamedAddressSupportDep &
    GetNetworkConfigDep &
    LoadNetworkModulesDep;

export type NetworksDep = { networks: NetworksServices };
