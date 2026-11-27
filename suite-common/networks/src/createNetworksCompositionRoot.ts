import type { Dispatch } from '@reduxjs/toolkit';

import type { CreateCustomEvmNetworkModuleDep } from './CreateCustomEvmNetworkModule';
import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworksServices } from './NetworksServices';
import { createAddressValidator } from './createAddressValidator';
import { createGetAccountSyncInterval } from './createGetAccountSyncInterval';
import { createGetIconPaths } from './createGetIconPaths';
import { createGetNamedAddressSupport } from './createGetNamedAddressSupport';
import { createGetNetworkByCoingeckoId } from './createGetNetworkByCoingeckoId';
import { createGetNetworkConfig } from './createGetNetworkConfig';
import { createGetNetworkConfigs } from './createGetNetworkConfigs';
import { createIsWrappedNativeToken } from './createIsWrappedNativeToken';
import { createLoadNetworkModules } from './createLoadNetworkModules';
import { createNetworkIcon } from './createNetworkIcon';
import { createRegisterCustomEvmNetwork } from './createRegisterCustomEvmNetwork';
import { createUnregisterCustomEvmNetwork } from './createUnregisterCustomEvmNetwork';

export type NetworksCompositionRootDeps = NetworkModuleRepositoryDep &
    CreateCustomEvmNetworkModuleDep & { dispatch: Dispatch };

export const createNetworksCompositionRoot = (
    deps: NetworksCompositionRootDeps,
): NetworksServices => {
    const { networkModuleRepository } = deps;
    const getNetworkConfig = createGetNetworkConfig({ networkModuleRepository });
    const getNetworkConfigs = createGetNetworkConfigs({
        getNetworkConfig,
        networkModuleRepository,
    });

    return {
        getIconPaths: createGetIconPaths({ networkModuleRepository }),
        isSupportedNetwork: networkModuleRepository.isSupportedNetwork,
        networkIcon: createNetworkIcon({ networkModuleRepository }),
        isWrappedNativeToken: createIsWrappedNativeToken({ networkModuleRepository }),
        getNetworkConfig,
        getAccountSyncInterval: createGetAccountSyncInterval({ networkModuleRepository }),
        getNetworkByCoingeckoId: createGetNetworkByCoingeckoId({
            getNetworkConfig,
            networkModuleRepository,
        }),
        addressValidator: createAddressValidator({ networkModuleRepository }),
        getNamedAddressSupport: createGetNamedAddressSupport({ networkModuleRepository }),
        loadNetworkModules: createLoadNetworkModules({
            dispatch: deps.dispatch,
            getNetworkConfigs,
            networkModuleRepository,
            createCustomEvmNetworkModule: deps.createCustomEvmNetworkModule,
        }),
        registerCustomEvmNetwork: createRegisterCustomEvmNetwork({
            dispatch: deps.dispatch,
            getNetworkConfigs,
            networkModuleRepository,
            createCustomEvmNetworkModule: deps.createCustomEvmNetworkModule,
        }),
        unregisterCustomEvmNetwork: createUnregisterCustomEvmNetwork({
            dispatch: deps.dispatch,
            getNetworkConfigs,
            networkModuleRepository,
        }),
    };
};
