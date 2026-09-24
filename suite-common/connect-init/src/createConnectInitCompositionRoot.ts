import { type LockDeviceDep } from '@suite-common/suite-types';

import { type ConnectInitDeps, createConnectInit } from './createConnectInit';
import { createWrapTrezorConnect } from './createWrapTrezorConnect';

export type ConnectInitCompositionRootDeps = Omit<ConnectInitDeps, 'wrapTrezorConnect'> &
    LockDeviceDep;

export const createConnectInitCompositionRoot = (deps: ConnectInitCompositionRootDeps) => {
    const wrapTrezorConnect = createWrapTrezorConnect({
        dispatch: deps.dispatch,
        getState: deps.getState,
        lockDevice: deps.lockDevice,
    });

    return {
        connectInit: createConnectInit({ ...deps, wrapTrezorConnect }),
    };
};
