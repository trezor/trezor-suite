import type { Dispatch } from '@reduxjs/toolkit';

import type { GetNetworkConfigsDep } from './createGetNetworkConfigs';
import { networksActions } from '../reduxState/networksReducer';

export type LoadNetworkModulesDeps = GetNetworkConfigsDep & { dispatch: Dispatch };

export type LoadNetworkModules = () => void;

export type LoadNetworkModulesDep = { loadNetworkModules: LoadNetworkModules };

export const createLoadNetworkModules =
    (deps: LoadNetworkModulesDeps): LoadNetworkModules =>
    () => {
        deps.dispatch(networksActions.setNetworks(deps.getNetworkConfigs()));
    };
