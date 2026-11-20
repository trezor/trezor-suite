import { type DeviceRootState, selectStandardWalletDescriptor } from '@suite-common/device';
import { type WalletDescriptor } from '@trezor/device-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';
import { isNotNull } from '@trezor/utils';

import {
    type ReferAFriendRootState,
    type ReferAFriendState,
    type ReferralAccountState,
    type ReferralWalletRecord,
    initialAccountState,
} from './referAFriendSlice';
import { getReferAFriendApiDefaultUrl } from './referAFriendUrl';

const createMemoizedSelector = createWeakMapSelector.withTypes<ReferAFriendRootState>();

const createMemoizedSelectorWithDevice = createWeakMapSelector.withTypes<
    ReferAFriendRootState & DeviceRootState
>();

export const selectReferAFriendSettings = (state: ReferAFriendRootState) =>
    state.referAFriend.settings;

export const selectReferAFriendWallets = (state: ReferAFriendRootState) =>
    state.referAFriend.wallets;

export const selectReferralProgram = (state: ReferAFriendRootState) => state.referAFriend.program;

const selectReferAFriendAccounts = (state: ReferAFriendRootState) => state.referAFriend.accounts;

const getWalletRecord = (
    wallets: ReferAFriendState['wallets'],
    walletDescriptor: WalletDescriptor | null,
): ReferralWalletRecord | null =>
    walletDescriptor === null ? null : (wallets[walletDescriptor] ?? null);

const getAccountState = (
    accounts: ReferAFriendState['accounts'],
    walletDescriptor: WalletDescriptor | null,
): ReferralAccountState =>
    (walletDescriptor === null ? undefined : accounts[walletDescriptor]) ?? initialAccountState;

export const selectReferralWalletRecordByWalletDescriptor = createMemoizedSelector(
    [
        selectReferAFriendWallets,
        (_state, walletDescriptor: WalletDescriptor | null) => walletDescriptor,
    ],
    getWalletRecord,
);
export const selectReferralWalletRecord = createMemoizedSelectorWithDevice(
    [selectReferAFriendWallets, selectStandardWalletDescriptor],
    getWalletRecord,
);

// The share link is stored only once the account exists on the backend (it is an indicater that the account exists).
export const selectDoesReferralRecordExistForWalletDescriptor = createMemoizedSelector(
    [selectReferralWalletRecordByWalletDescriptor],
    walletRecord => !!walletRecord?.shareUrl,
);

export const selectEncryptedReferralKeyByWalletDescriptor = createMemoizedSelector(
    [selectReferralWalletRecordByWalletDescriptor],
    walletRecord => walletRecord?.encryptedKey ?? null,
);

export const selectReferralAccountStateByWalletDescriptor = createMemoizedSelector(
    [
        selectReferAFriendAccounts,
        (_state, walletDescriptor: WalletDescriptor | null) => walletDescriptor,
    ],
    getAccountState,
);
export const selectReferralAccountState = createMemoizedSelectorWithDevice(
    [selectReferAFriendAccounts, selectStandardWalletDescriptor],
    getAccountState,
);

export const selectReferAFriendApiCustomUrl = (state: ReferAFriendRootState) => {
    const { baseUrl } = state.referAFriend.settings;

    return isNotNull(baseUrl) && baseUrl.trim() !== '' ? baseUrl : null;
};

export const selectReferAFriendApiUrl = (state: ReferAFriendRootState, isTorEnabled: boolean) =>
    selectReferAFriendApiCustomUrl(state) ?? getReferAFriendApiDefaultUrl({ isTorEnabled });

// This could be in suite-common/device, but the selector name and location intentionally carries semantics for Refer a Friend.
export const selectIsReferralWalletDescriptorAvailable = (state: DeviceRootState): boolean =>
    selectStandardWalletDescriptor(state) !== null;
