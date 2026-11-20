import type { Dispatch } from '@reduxjs/toolkit';

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

export type NetworksCompositionRootDeps = NetworkModuleRepositoryDep & { dispatch: Dispatch };

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
        }),
    };
};
