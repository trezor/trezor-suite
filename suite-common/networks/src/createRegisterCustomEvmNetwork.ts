import type { Dispatch } from '@reduxjs/toolkit';

import type {
    CreateCustomEvmNetworkModuleDep,
    CreateCustomEvmNetworkModuleParams,
} from './CreateCustomEvmNetworkModule';
import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { GetNetworkConfigsDep } from './createGetNetworkConfigs';
import { networksActions } from '../reduxState/networksReducer';

export type RegisterCustomEvmNetworkParams = CreateCustomEvmNetworkModuleParams;

export type RegisterCustomEvmNetworkDeps = NetworkModuleRepositoryDep &
    CreateCustomEvmNetworkModuleDep &
    GetNetworkConfigsDep & { dispatch: Dispatch };

export type RegisterCustomEvmNetwork = (params: RegisterCustomEvmNetworkParams) => void;

export type RegisterCustomEvmNetworkDep = { registerCustomEvmNetwork: RegisterCustomEvmNetwork };

export const createRegisterCustomEvmNetwork =
    (deps: RegisterCustomEvmNetworkDeps): RegisterCustomEvmNetwork =>
    params => {
        deps.networkModuleRepository.register(
            params.symbol,
            deps.createCustomEvmNetworkModule(params),
        );
        deps.dispatch(networksActions.setNetworks(deps.getNetworkConfigs()));
    };

export const injectRegisterCustomEvmNetwork = (services: any): RegisterCustomEvmNetworkDep => ({
    registerCustomEvmNetwork: services.networks.registerCustomEvmNetwork,
});
