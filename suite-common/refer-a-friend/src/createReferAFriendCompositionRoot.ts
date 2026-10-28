import { type Dispatch } from '@reduxjs/toolkit';

import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { type GetTrezorConnectDep } from '@trezor/connect-common';
import { type FetchDep } from '@trezor/type-utils';

import { type ReferralApiFetch, createReferralApiFetch } from './api/createReferralApiFetch';
import { type LoadReferralKey, createLoadReferralKey } from './key/createLoadReferralKey';
import { createReferralKeySessionCache } from './key/createReferralKeySessionCache';
import {
    type RetrieveReferralKeyFromDevice,
    createRetrieveReferralKeyFromDevice,
} from './key/createRetrieveReferralKeyFromDevice';
import { type SaveReferralKey, createSaveReferralKey } from './key/createSaveReferralKey';
import { type ReferAFriendRootState, selectEncryptedReferralKey } from './referAFriendSlice';
import { selectReferAFriendApiUrl } from './referAFriendUrl';

export type ReferAFriend = {
    referralApiFetch: ReferralApiFetch;
    retrieveReferralKeyFromDevice: RetrieveReferralKeyFromDevice;
    loadReferralKey: LoadReferralKey;
    saveReferralKey: SaveReferralKey;
    removeReferralKeyFromSession: (deviceId: string) => void;
};

export type ReferAFriendDep = {
    referAFriend: ReferAFriend;
};

export type ReferAFriendCompositionRootDeps = {
    dispatch: Dispatch;
    getState: () => ReferAFriendRootState;
    getIsTorEnabled: () => boolean;
} & PlatformEncryptionDep &
    GetTrezorConnectDep<'cipherKeyValue'> &
    FetchDep;

export const createReferAFriendCompositionRoot = (
    deps: ReferAFriendCompositionRootDeps,
): ReferAFriend => {
    const referralKeySessionCache = createReferralKeySessionCache();

    return {
        referralApiFetch: createReferralApiFetch({
            fetch: deps.fetch,
            getReferAFriendApiUrl: () =>
                selectReferAFriendApiUrl(deps.getState(), deps.getIsTorEnabled()),
        }),
        retrieveReferralKeyFromDevice: createRetrieveReferralKeyFromDevice({
            getTrezorConnect: deps.getTrezorConnect,
        }),
        loadReferralKey: createLoadReferralKey({
            dispatch: deps.dispatch,
            getEncryptedReferralKey: deviceId =>
                selectEncryptedReferralKey(deps.getState(), deviceId),
            platformEncryption: deps.platformEncryption,
            referralKeySessionCache,
        }),
        saveReferralKey: createSaveReferralKey({
            dispatch: deps.dispatch,
            platformEncryption: deps.platformEncryption,
            referralKeySessionCache,
        }),
        removeReferralKeyFromSession: referralKeySessionCache.remove,
    };
};
