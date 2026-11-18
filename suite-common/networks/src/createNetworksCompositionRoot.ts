import type { Dispatch } from '@reduxjs/toolkit';

import { createNetworkModuleRepository } from './NetworkModuleRepository';
import type { StaticNetworkModulesDep } from './NetworkModules';
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

export type NetworksCompositionRootDeps = StaticNetworkModulesDep & { dispatch: Dispatch };

export const createNetworksCompositionRoot = (
    deps: NetworksCompositionRootDeps,
): NetworksServices => {
    const networkModuleRepository = createNetworkModuleRepository({
        networkModules: deps.networkModules,
    });
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
        networkModuleRepository,
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
