import type { Dispatch } from '@reduxjs/toolkit';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';
import type { GetNetworkConfigsDep } from './createGetNetworkConfigs';
import { networksActions } from '../reduxState/networksReducer';

export type UnregisterCustomEvmNetworkDeps = NetworkModuleRepositoryDep &
    GetNetworkConfigsDep & { dispatch: Dispatch };

export type UnregisterCustomEvmNetwork = (symbol: NetworkSymbol) => void;

export type UnregisterCustomEvmNetworkDep = {
    unregisterCustomEvmNetwork: UnregisterCustomEvmNetwork;
};

export const createUnregisterCustomEvmNetwork =
    (deps: UnregisterCustomEvmNetworkDeps): UnregisterCustomEvmNetwork =>
    symbol => {
        deps.networkModuleRepository.unregister(symbol);
        deps.dispatch(networksActions.setNetworks(deps.getNetworkConfigs()));
    };

export const injectUnregisterCustomEvmNetwork = (services: any): UnregisterCustomEvmNetworkDep => ({
    unregisterCustomEvmNetwork: services.networks.unregisterCustomEvmNetwork,
});
