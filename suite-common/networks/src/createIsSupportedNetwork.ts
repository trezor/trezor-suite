import { isArrayMember } from '@trezor/utils';

import type { NetworkSymbol } from './NetworkModules';
import type { GetSupportedNetworksDep } from './createGetSupportedNetworks';

export type IsSupportedNetworkDeps = GetSupportedNetworksDep;

export type IsSupportedNetwork = (symbol: string) => symbol is NetworkSymbol;

export type IsSupportedNetworkDep = {
    isSupportedNetwork: IsSupportedNetwork;
};

export const selectIsSupportedNetworkDep = (services: any): IsSupportedNetworkDep => ({
    isSupportedNetwork: services.networks.isSupportedNetwork,
});

export const createIsSupportedNetwork =
    (deps: IsSupportedNetworkDeps): IsSupportedNetwork =>
    (symbol): symbol is NetworkSymbol =>
        isArrayMember(symbol, deps.getSupportedNetworks());
