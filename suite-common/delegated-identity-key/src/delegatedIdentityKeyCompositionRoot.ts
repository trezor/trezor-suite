import { type Dispatch } from '@reduxjs/toolkit';

import { toGetter } from '@suite-common/dependency-injection';
import { type DeviceRootState, selectDeviceDelegatedIdentityKey } from '@suite-common/device';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';

import { createEnsureDelegatedIdentityKey } from './ensureDelegatedIdentityKey';
import { createLoadDelegatedIdentityKeyFromState } from './loadDelegatedIdentityKeyFromState';
import {
    type RetrieveDelegatedIdentityKeyFromDeviceDeps,
    createRetrieveDelegatedIdentityKeyFromDevice,
} from './retrieveDelegatedIdentityKeyFromDevice';
import { createSaveDelegatedIdentityKey } from './saveDelegatedIdentityKey';

type DelegatedIdentityKeyCompositionRootDeps = {
    dispatch: Dispatch;
    getState: () => DeviceRootState;
} & PlatformEncryptionDep &
    RetrieveDelegatedIdentityKeyFromDeviceDeps;

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
            getTrezorConnect: deps.getTrezorConnect,
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
