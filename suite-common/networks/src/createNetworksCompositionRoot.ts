import type { Dispatch } from '@reduxjs/toolkit';

import type { NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';

import { createNetworkModuleRepository } from './NetworkModuleRepository';
import type { NetworksServices } from './NetworksServices';
import { createAddressValidator } from './createAddressValidator';
import { createGetAccountSyncInterval } from './createGetAccountSyncInterval';
import { createGetIconPaths } from './createGetIconPaths';
import { createGetNamedAddressSupport } from './createGetNamedAddressSupport';
import { type GetNetworkBackendDep, createGetNetwork } from './createGetNetwork';
import { createGetNetworkByCoingeckoId } from './createGetNetworkByCoingeckoId';
import { createGetNetworkConfig } from './createGetNetworkConfig';
import { createGetNetworkConfigs } from './createGetNetworkConfigs';
import { createIsWrappedNativeToken } from './createIsWrappedNativeToken';
import { createLoadNetworkModules } from './createLoadNetworkModules';
import { createNetworkFamiliesCompositionRoot } from './createNetworkFamiliesCompositionRoot';
import { createNetworkIcon } from './createNetworkIcon';
import { createNetworkModulesCompositionRoot } from './createNetworkModulesCompositionRoot';

export type NetworksCompositionRootDeps = NetworkSuiteCommonModuleApi &
    GetNetworkBackendDep & { dispatch: Dispatch };

export const createNetworksCompositionRoot = (
    deps: NetworksCompositionRootDeps,
): NetworksServices => {
    const networkModules = createNetworkModulesCompositionRoot(deps);
    const networkModuleRepository = createNetworkModuleRepository({ networkModules });
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
        getNetwork: createGetNetwork({
            networkFamilies: createNetworkFamiliesCompositionRoot(deps),
            getNetworkBackend: deps.getNetworkBackend,
        }),
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
