import { Dispatch } from '@reduxjs/toolkit';

import { PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { selectThp } from '@suite-common/thp/src/thpSelectors';
import { selectDeviceDelegatedIdentityKey } from '@suite-common/wallet-core';

import { createEnsureDelegatedIdentityKey } from './ensureDelegatedIdentityKey';
import { createLoadDelegatedIdentityKeyFromState } from './loadDelegatedIdentityKeyFromState';
import {
    RetrieveDelegatedIdentityKeyFromDeviceDeps,
    createRetrieveDelegatedIdentityKeyFromDevice,
} from './retrieveDelegatedIdentityKeyFromDevice';
import { createSaveDelegatedIdentityKey } from './saveDelegatedIdentityKey';

export type DelegatedIdentityKeyCompositionRootDeps = {
    dispatch: Dispatch;
    getState: () => any;
    trezorConnect: RetrieveDelegatedIdentityKeyFromDeviceDeps['trezorConnect'];
} & PlatformEncryptionDep;

export const delegatedIdentityKeyCompositionRoot = (
    deps: DelegatedIdentityKeyCompositionRootDeps,
) => {
    const ensureDelegatedIdentityKey = createEnsureDelegatedIdentityKey({
        loadDelegatedIdentityKeyFromState: createLoadDelegatedIdentityKeyFromState({
            dispatch: deps.dispatch,
            platformEncryption: deps.platformEncryption,
            getDeviceDelegatedIdentityKey: deviceId =>
                selectDeviceDelegatedIdentityKey(deps.getState(), deviceId),
        }),
        retrieveDelegatedIdentityKeyFromDevice: createRetrieveDelegatedIdentityKeyFromDevice({
            trezorConnect: deps.trezorConnect,
        }),
        saveDelegatedIdentityKey: createSaveDelegatedIdentityKey({
            dispatch: deps.dispatch,
            platformEncryption: deps.platformEncryption,
        }),
        getThpStaticKey: () => selectThp(deps.getState()).staticKey,
    });

    return {
        ensureDelegatedIdentityKey,
    };
};
