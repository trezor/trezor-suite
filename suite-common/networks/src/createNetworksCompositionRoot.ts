import type { Dispatch } from '@reduxjs/toolkit';

import type { NetworkSuiteCommonModuleApi } from '@trezor/network-module-suite-common-types';

import { createNetworkModuleRepository } from './NetworkModuleRepository';
import type { NetworksServices } from './NetworksServices';
import { createAddressValidator } from './createAddressValidator';
import { createGetAccountSyncInterval } from './createGetAccountSyncInterval';
import { createGetNamedAddressSupport } from './createGetNamedAddressSupport';
import { createGetNetworkConfig } from './createGetNetworkConfig';
import { createGetNetworkConfigs } from './createGetNetworkConfigs';
import { createLoadNetworkModules } from './createLoadNetworkModules';
import { createNetworkIcon } from './createNetworkIcon';
import { createNetworkModulesCompositionRoot } from './createNetworkModulesCompositionRoot';

export type NetworksCompositionRootDeps = NetworkSuiteCommonModuleApi & { dispatch: Dispatch };

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
        networkIcon: createNetworkIcon({ networkModuleRepository }),
        networkModuleRepository,
        getNetworkConfig,
        getAccountSyncInterval: createGetAccountSyncInterval({ networkModuleRepository }),
        addressValidator: createAddressValidator({ networkModuleRepository }),
        getNamedAddressSupport: createGetNamedAddressSupport({ networkModuleRepository }),
        loadNetworkModules: createLoadNetworkModules({
            dispatch: deps.dispatch,
            getNetworkConfigs,
        }),
    };
};
