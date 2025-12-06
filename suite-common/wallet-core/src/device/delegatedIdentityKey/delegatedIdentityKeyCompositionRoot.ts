// Circular issue, see: https://github.com/trezor/trezor-suite/issues/21553
import { Dispatch } from '@reduxjs/toolkit';

import { SecureStorageDep } from '@suite-common/secure-storage';
import { selectThp } from '@suite-common/thp/src/thpSelectors';

import { createEnsureDelegatedIdentityKey } from './ensureDelegatedIdentityKey';
import { createLoadDelegatedIdentityKeyFromState } from './loadDelegatedIdentityKeyFromState';
import { selectDeviceDelegatedIdentityKey } from '../deviceSelectors';
import {
    RetrieveDelegatedIdentityKeyFromDeviceDeps,
    createRetrieveDelegatedIdentityKeyFromDevice,
} from './retrieveDelegatedIdentityKeyFromDevice';
import { createSaveDelegatedIdentityKey } from './saveDelegatedIdentityKey';

export type Deps = {
    dispatch: Dispatch;
    getState: () => any;
    trezorConnect: RetrieveDelegatedIdentityKeyFromDeviceDeps['trezorConnect'];
} & SecureStorageDep;

export const delegatedIdentityKeyCompositionRoot = (deps: Deps) => {
    const ensureDelegatedIdentityKey = createEnsureDelegatedIdentityKey({
        loadDelegatedIdentityKeyFromState: createLoadDelegatedIdentityKeyFromState({
            dispatch: deps.dispatch,
            secureStorage: deps.secureStorage,
            getDeviceDelegatedIdentityKey: deviceId =>
                selectDeviceDelegatedIdentityKey(deps.getState(), deviceId),
        }),
        retrieveDelegatedIdentityKeyFromDevice: createRetrieveDelegatedIdentityKeyFromDevice({
            trezorConnect: deps.trezorConnect,
        }),
        saveDelegatedIdentityKey: createSaveDelegatedIdentityKey({
            dispatch: deps.dispatch,
            secureStorage: deps.secureStorage,
        }),
        getThpStaticKey: () => selectThp(deps.getState()).staticKey,
    });

    return {
        ensureDelegatedIdentityKey,
    };
};
