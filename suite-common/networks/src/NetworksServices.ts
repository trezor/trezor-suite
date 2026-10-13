import type { IsSupportedNetworkDep } from './IsSupportedNetwork';
import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { AddressValidatorDep } from './createAddressValidator';
import type { GetAccountSyncIntervalDep } from './createGetAccountSyncInterval';
import type { GetIconPathsDep } from './createGetIconPaths';
import type { GetNamedAddressSupportDep } from './createGetNamedAddressSupport';
import type { GetNetworkByCoingeckoIdDep } from './createGetNetworkByCoingeckoId';
import type { GetNetworkConfigDep } from './createGetNetworkConfig';
import type { IsWrappedNativeTokenDep } from './createIsWrappedNativeToken';
import type { LoadNetworkModulesDep } from './createLoadNetworkModules';
import type { NetworkIconDep } from './createNetworkIcon';

export type NetworksServices = NetworkIconDep &
    GetIconPathsDep &
    IsSupportedNetworkDep &
    IsWrappedNativeTokenDep &
    NetworkModuleRepositoryDep &
    AddressValidatorDep &
    GetAccountSyncIntervalDep &
    GetNamedAddressSupportDep &
    GetNetworkConfigDep &
    GetNetworkByCoingeckoIdDep &
    LoadNetworkModulesDep;

export type NetworksDep = { networks: NetworksServices };
