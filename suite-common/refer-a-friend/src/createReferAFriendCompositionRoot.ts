import { type Dispatch } from '@reduxjs/toolkit';

import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { type GetTrezorConnectDep } from '@trezor/connect-common';
import { type WalletDescriptor } from '@trezor/device-utils';
import { type FetchDep } from '@trezor/type-utils';

import { type ReferralApiFetch, createReferralApiFetch } from './api/createReferralApiFetch';
import { type LoadReferralKey, createLoadReferralKey } from './key/createLoadReferralKey';
import { createReferralKeySessionCache } from './key/createReferralKeySessionCache';
import {
    type RetrieveReferralKeyFromDevice,
    createRetrieveReferralKeyFromDevice,
} from './key/createRetrieveReferralKeyFromDevice';
import { type SaveReferralKey, createSaveReferralKey } from './key/createSaveReferralKey';
import {
    selectEncryptedReferralKeyByWalletDescriptor,
    selectReferAFriendApiUrl,
} from './referAFriendSelectors';
import { type ReferAFriendRootState } from './referAFriendSlice';

export type ReferAFriend = {
    referralApiFetch: ReferralApiFetch;
    retrieveReferralKeyFromDevice: RetrieveReferralKeyFromDevice;
    loadReferralKey: LoadReferralKey;
    saveReferralKey: SaveReferralKey;
    removeReferralKeyFromSession: (walletDescriptor: WalletDescriptor) => void;
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
            getEncryptedReferralKey: walletDescriptor =>
                selectEncryptedReferralKeyByWalletDescriptor(deps.getState(), walletDescriptor),
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
