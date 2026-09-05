import type { AddressValidatorDep } from './createAddressValidator';
import type { FindNetworkSymbolForProtocolDep } from './createFindNetworkSymbolForProtocol';
import type { GetNamedAddressSupportDep } from './createGetNamedAddressSupport';
import type { GetNetworkConfigDep } from './createGetNetworkConfig';
import type { GetSupportedNetworksDep } from './createGetSupportedNetworks';
import type { IsTestnetDep } from './createIsTestnet';

export type NetworksServices = AddressValidatorDep &
    FindNetworkSymbolForProtocolDep &
    GetNamedAddressSupportDep &
    GetNetworkConfigDep &
    GetSupportedNetworksDep &
    IsTestnetDep;

export type NetworksServicesDep = {
    networks: NetworksServices;
};
