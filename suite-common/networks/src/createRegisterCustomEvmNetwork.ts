import type { Dispatch } from '@reduxjs/toolkit';

import {
    type CustomEvmNetworkConfigParams,
    buildCustomEvmNetworkConfig,
    createCustomEvmNetworkModule,
} from '@trezor/network-ethereum-suite-common';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';
import type { GetNetworkConfigsDep } from './createGetNetworkConfigs';
import { networksActions } from '../reduxState/networksReducer';

export type RegisterCustomEvmNetworkParams = CustomEvmNetworkConfigParams & {
    symbol: NetworkSymbol;
};

export type RegisterCustomEvmNetworkDeps = NetworkModuleRepositoryDep &
    GetNetworkConfigsDep & { dispatch: Dispatch };

export type RegisterCustomEvmNetwork = (params: RegisterCustomEvmNetworkParams) => void;

export type RegisterCustomEvmNetworkDep = { registerCustomEvmNetwork: RegisterCustomEvmNetwork };

export const createRegisterCustomEvmNetwork =
    (deps: RegisterCustomEvmNetworkDeps): RegisterCustomEvmNetwork =>
    params => {
        deps.networkModuleRepository.register(
            params.symbol,
            createCustomEvmNetworkModule({
                symbol: params.symbol,
                config: buildCustomEvmNetworkConfig(params),
            }),
        );
        deps.dispatch(networksActions.setNetworks(deps.getNetworkConfigs()));
    };

export const injectRegisterCustomEvmNetwork = (services: any): RegisterCustomEvmNetworkDep => ({
    registerCustomEvmNetwork: services.networks.registerCustomEvmNetwork,
});
