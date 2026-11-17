import type { Dispatch } from '@reduxjs/toolkit';

import { networks as legacyNetworks } from '@suite-common/legacy-network-config';
import { typedObjectEntries } from '@trezor/utils';

import type { CreateCustomEvmNetworkModuleDep } from './CreateCustomEvmNetworkModule';
import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import { asNetworkSymbol } from './NetworkModules';
import type { GetNetworkConfigsDep } from './createGetNetworkConfigs';
import { networksActions } from '../reduxState/networksReducer';

export type LoadNetworkModulesDeps = GetNetworkConfigsDep &
    NetworkModuleRepositoryDep &
    CreateCustomEvmNetworkModuleDep & { dispatch: Dispatch };

export type LoadNetworkModules = () => void;

export type LoadNetworkModulesDep = { loadNetworkModules: LoadNetworkModules };

export const createLoadNetworkModules =
    (deps: LoadNetworkModulesDeps): LoadNetworkModules =>
    () => {
        // Custom EVM networks are restored into the legacy registry while the storage is read,
        // before this repository is reachable; any registry entry without a module is one of them.
        typedObjectEntries(legacyNetworks).forEach(([symbol, config]) => {
            const networkSymbol = asNetworkSymbol(symbol);

            if (!deps.networkModuleRepository.isSupportedNetwork(networkSymbol)) {
                deps.networkModuleRepository.register(
                    networkSymbol,
                    deps.createCustomEvmNetworkModule({ symbol: networkSymbol, config }),
                );
            }
        });

        deps.dispatch(networksActions.setNetworks(deps.getNetworkConfigs()));
    };
