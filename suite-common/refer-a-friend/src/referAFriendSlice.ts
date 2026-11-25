import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type EncryptedHex } from '@suite-common/platform-encryption';
import { type WalletDescriptor } from '@trezor/device-utils';

import {
    type ReferralAccount,
    type ReferralAccountLoadStatus,
    type ReferralError,
    type ReferralProgram,
    type ReferralRequestStatus,
    type ReferralVoucher,
} from './referAFriendTypes';
import { type ReferralKey } from './referralKey';

/**
 * Persisted per standard wallet descriptor: referral identity is scoped to the wallet **seed**,
 * so that standard and passphrase wallets shared the same referral account and its vouchers.
 * Since the identity comes from HD wallet, it follows the user across devices that share the same seed.
 * If a passphrase wallet is selected, the standard one must be available (discovered) in order to access the referral.
 *
 * Edge case: With `passphrase_always_on_device`, all wallets look like passhprase; Suite cannot find the standard one.
 * This case is intentionally handled same as if there was no standard wallet available.
 */
export type ReferralWalletRecord = {
    // Null when the platform encryption is unavailable, the key then lives only in memory.
    encryptedKey: EncryptedHex<ReferralKey> | null;
    // Account identifiers kept for offline display. If the share link exists, it indicates that the account exists.
    code: string | null;
    shareUrl: string | null;
};

export type ReferralProgramState = {
    status: ReferralRequestStatus;
    data: ReferralProgram | null;
    error: ReferralError | null;
};

export type ReferralPendingAction = 'join' | 'deriveKey' | 'leave';

/**
 * Data from the backend, kept in memory only. Voucher codes have value and must not be persisted.
 */
export type ReferralAccountState = {
    status: ReferralAccountLoadStatus;
    account: ReferralAccount | null;
    vouchers: ReferralVoucher[] | null;
    error: ReferralError | null;
    pendingAction: ReferralPendingAction | null;
};

export type ReferAFriendState = {
    settings: {
        baseUrl: string | null;
    };
    wallets: Record<WalletDescriptor, ReferralWalletRecord>;
    program: ReferralProgramState;
    accounts: Record<WalletDescriptor, ReferralAccountState>;
};

export type ReferAFriendRootState = {
    referAFriend: ReferAFriendState;
};

export const referAFriendPersistedKeys = ['settings', 'wallets'] as const satisfies Array<
    keyof ReferAFriendState
>;

export const referAFriendInitialState: ReferAFriendState = {
    settings: {
        baseUrl: null,
    },
    wallets: {},
    program: {
        status: 'idle',
        data: null,
        error: null,
    },
    accounts: {},
};

export const initialAccountState: ReferralAccountState = {
    status: 'idle',
    account: null,
    vouchers: null,
    error: null,
    pendingAction: null,
};

const emptyWalletRecord: ReferralWalletRecord = {
    encryptedKey: null,
    code: null,
    shareUrl: null,
};

type WalletDescriptorPayload = {
    walletDescriptor: WalletDescriptor;
};

type SetEncryptedKeyPayload = WalletDescriptorPayload & {
    encryptedKey: EncryptedHex<ReferralKey> | null;
};

type SetReferralLinkPayload = WalletDescriptorPayload & {
    code: string | null;
    shareUrl: string | null;
};

type AccountLoadedPayload = WalletDescriptorPayload & {
    account: ReferralAccount;
    vouchers: ReferralVoucher[] | null;
};

type AccountFailedPayload = WalletDescriptorPayload & {
    error: ReferralError;
};

type PendingActionStartedPayload = WalletDescriptorPayload & {
    pendingAction: ReferralPendingAction;
};

const getAccountState = (state: ReferAFriendState, walletDescriptor: WalletDescriptor) => {
    state.accounts[walletDescriptor] ??= { ...initialAccountState };

    return state.accounts[walletDescriptor];
};

const referAFriendSlice = createSlice({
    name: 'referAFriend',
    initialState: referAFriendInitialState,
    reducers: {
        setReferAFriendApiBaseUrl(
            state: ReferAFriendState,
            action: PayloadAction<{ baseUrl: string | null }>,
        ) {
            state.settings.baseUrl = action.payload.baseUrl;
            // When you switch backend, data from the previous one are no longer valid, so clear them.
            state.program = referAFriendInitialState.program;
            state.accounts = {};
        },
        setEncryptedReferralKey(
            state: ReferAFriendState,
            action: PayloadAction<SetEncryptedKeyPayload>,
        ) {
            const { walletDescriptor, encryptedKey } = action.payload;
            state.wallets[walletDescriptor] = {
                ...emptyWalletRecord,
                ...state.wallets[walletDescriptor],
                encryptedKey,
            };
        },
        setReferralLink(state: ReferAFriendState, action: PayloadAction<SetReferralLinkPayload>) {
            const { walletDescriptor, code, shareUrl } = action.payload;
            state.wallets[walletDescriptor] = {
                ...emptyWalletRecord,
                ...state.wallets[walletDescriptor],
                code,
                shareUrl,
            };
        },
        removeReferralWallet(
            state: ReferAFriendState,
            action: PayloadAction<WalletDescriptorPayload>,
        ) {
            delete state.wallets[action.payload.walletDescriptor];
            delete state.accounts[action.payload.walletDescriptor];
        },
        programRequested(state: ReferAFriendState) {
            state.program.status = 'loading';
            state.program.error = null;
        },
        programLoaded(state: ReferAFriendState, action: PayloadAction<ReferralProgram>) {
            state.program = { status: 'loaded', data: action.payload, error: null };
        },
        programFailed(state: ReferAFriendState, action: PayloadAction<ReferralError>) {
            state.program.status = 'error';
            state.program.error = action.payload;
        },
        accountRequested(state: ReferAFriendState, action: PayloadAction<WalletDescriptorPayload>) {
            const accountState = getAccountState(state, action.payload.walletDescriptor);
            accountState.status = 'loading';
            accountState.error = null;
        },
        accountLoaded(state: ReferAFriendState, action: PayloadAction<AccountLoadedPayload>) {
            const accountState = getAccountState(state, action.payload.walletDescriptor);
            accountState.status = 'loaded';
            accountState.account = action.payload.account;
            accountState.vouchers = action.payload.vouchers;
            accountState.error = null;
        },
        accountKeyMissing(
            state: ReferAFriendState,
            action: PayloadAction<WalletDescriptorPayload>,
        ) {
            const accountState = getAccountState(state, action.payload.walletDescriptor);
            accountState.status = 'keyMissing';
            accountState.error = null;
        },
        accountFailed(state: ReferAFriendState, action: PayloadAction<AccountFailedPayload>) {
            const accountState = getAccountState(state, action.payload.walletDescriptor);
            accountState.status = 'error';
            accountState.error = action.payload.error;
        },
        pendingActionStarted(
            state: ReferAFriendState,
            action: PayloadAction<PendingActionStartedPayload>,
        ) {
            const accountState = getAccountState(state, action.payload.walletDescriptor);
            accountState.pendingAction = action.payload.pendingAction;
            accountState.error = null;
        },
        pendingActionFinished(
            state: ReferAFriendState,
            action: PayloadAction<WalletDescriptorPayload>,
        ) {
            getAccountState(state, action.payload.walletDescriptor).pendingAction = null;
        },
    },
});

export const referAFriendActions = referAFriendSlice.actions;
export const referAFriendReducer = referAFriendSlice.reducer;
