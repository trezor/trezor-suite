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

export const selectReferralAnnualRewardLimit = createMemoizedSelector(
    [selectReferralProgram],
    (program): number | null => {
        if (program.data === null) return null;

        const limit = program.data.rewardAmount * program.data.redemptionLimit;

        return Number.isNaN(limit) ? null : limit;
    },
);

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

// The share link is stored only once the account exists on the backend (it is an indicator that the account exists).
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

/**
 * Whether a referral account is confirmed to exist for a different wallet descriptor (i.e. another wallet backup,
 * typically another Trezor), but not for the standard wallet of the selected device.
 * False when the standard wallet descriptor is not available, since the comparison is not possible.
 */
export const selectDoesReferralExistOnlyForOtherWallets = createMemoizedSelectorWithDevice(
    [selectReferAFriendWallets, selectStandardWalletDescriptor],
    (wallets, standardWalletDescriptor) =>
        standardWalletDescriptor !== null &&
        !wallets[standardWalletDescriptor]?.shareUrl &&
        Object.entries(wallets).some(
            ([walletDescriptor, walletRecord]) =>
                walletDescriptor !== standardWalletDescriptor && !!walletRecord.shareUrl,
        ),
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
