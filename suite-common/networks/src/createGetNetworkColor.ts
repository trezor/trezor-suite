import type { NetworkColor } from '@trezor/network-module-suite-common-types';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';

export type GetNetworkColor = (symbol: NetworkSymbol) => NetworkColor;

export type GetNetworkColorDeps = NetworkModuleRepositoryDep;

export type GetNetworkColorDep = {
    getNetworkColor: GetNetworkColor;
};

export const selectGetNetworkColorDep = (services: any): GetNetworkColorDep => ({
    getNetworkColor: services.getNetworkColor,
});

export const createGetNetworkColor =
    (deps: GetNetworkColorDeps): GetNetworkColor =>
    symbol =>
        deps.networkModuleRepository.get(symbol).getNetworkColor(symbol);
