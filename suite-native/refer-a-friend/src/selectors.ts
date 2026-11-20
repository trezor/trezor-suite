import { type DeviceRootState } from '@suite-common/device';
import {
    type ReferAFriendRootState,
    selectReferAFriendStandardWallet,
    selectReferralAccountState,
    selectReferralWalletRecord,
} from '@suite-common/refer-a-friend';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<
    ReferAFriendRootState & DeviceRootState
>();

export const selectReferralStandardWalletDescriptor = createMemoizedSelector(
    [selectReferAFriendStandardWallet],
    referAFriendWallet => referAFriendWallet?.walletDescriptor,
);

export const selectIsReferAFriendStandardWallet = createMemoizedSelector(
    [selectReferralStandardWalletDescriptor],
    walletDescriptor => !!walletDescriptor,
);

export const selectIsReferAFriendProgramActive = createMemoizedSelector(
    [
        (state: ReferAFriendRootState & DeviceRootState) =>
            selectReferralWalletRecord(state, selectReferralStandardWalletDescriptor(state)),
    ],
    walletRecord => !!walletRecord?.shareUrl,
);

export const selectReferAFriendAccount = (state: ReferAFriendRootState & DeviceRootState) =>
    selectReferralAccountState(state, selectReferralStandardWalletDescriptor(state));

export const selectReferAFriendVouchers = createMemoizedSelector(
    [selectReferAFriendAccount],
    referralAccount => returnStableArrayIfEmpty(referralAccount.vouchers ?? []),
);
