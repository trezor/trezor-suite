import { type Dispatch } from '@reduxjs/toolkit';

import { toGetter } from '@suite-common/dependency-injection';
import { selectDeviceDelegatedIdentityKey } from '@suite-common/device';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';

import { createEnsureDelegatedIdentityKey } from './ensureDelegatedIdentityKey';
import { createLoadDelegatedIdentityKeyFromState } from './loadDelegatedIdentityKeyFromState';
import {
    type RetrieveDelegatedIdentityKeyFromDeviceDeps,
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
            getDeviceDelegatedIdentityKey: toGetter(
                deps.getState,
                selectDeviceDelegatedIdentityKey,
            ),
        }),
        retrieveDelegatedIdentityKeyFromDevice: createRetrieveDelegatedIdentityKeyFromDevice({
            trezorConnect: deps.trezorConnect,
        }),
        saveDelegatedIdentityKey: createSaveDelegatedIdentityKey({
            dispatch: deps.dispatch,
            platformEncryption: deps.platformEncryption,
        }),
    });

    return {
        ensureDelegatedIdentityKey,
    };
};
