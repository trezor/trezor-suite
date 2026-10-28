import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type EncryptedHex } from '@suite-common/platform-encryption';

import {
    type ReferralAccount,
    type ReferralError,
    type ReferralProgram,
    type ReferralRequestError,
    type ReferralVoucher,
} from './referAFriendTypes';
import { type ReferralKey } from './referralKey';

/**
 * Persisted per device (`device.id`): the seed is the referral identity and all wallets of one
 * device share it. A wiped device gets a new id, so the record can never leak to another seed.
 */
export type ReferralDeviceRecord = {
    // Null when the platform encryption is unavailable, the key then lives only in memory.
    encryptedKey: EncryptedHex<ReferralKey> | null;
    // Account identifiers kept for offline display. The share link is the flag that the account exists.
    code: string | null;
    shareUrl: string | null;
};

export type ReferralRequestStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type ReferralProgramState = {
    status: ReferralRequestStatus;
    data: ReferralProgram | null;
    error: ReferralRequestError | null;
};

export type ReferralAccountLoadStatus = ReferralRequestStatus | 'keyMissing';

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
    devices: Record<string, ReferralDeviceRecord>;
    program: ReferralProgramState;
    accounts: Record<string, ReferralAccountState>;
};

export type ReferAFriendRootState = {
    referAFriend: ReferAFriendState;
};

export const referAFriendPersistedKeys = ['settings', 'devices'] as const satisfies Array<
    keyof ReferAFriendState
>;

export const referAFriendInitialState: ReferAFriendState = {
    settings: {
        baseUrl: null,
    },
    devices: {},
    program: {
        status: 'idle',
        data: null,
        error: null,
    },
    accounts: {},
};

const initialAccountState: ReferralAccountState = {
    status: 'idle',
    account: null,
    vouchers: null,
    error: null,
    pendingAction: null,
};

const emptyDeviceRecord: ReferralDeviceRecord = {
    encryptedKey: null,
    code: null,
    shareUrl: null,
};

type DeviceIdPayload = {
    deviceId: string;
};

type SetEncryptedKeyPayload = DeviceIdPayload & {
    encryptedKey: EncryptedHex<ReferralKey> | null;
};

type SetReferralLinkPayload = DeviceIdPayload & {
    code: string | null;
    shareUrl: string | null;
};

type AccountLoadedPayload = DeviceIdPayload & {
    account: ReferralAccount;
    vouchers: ReferralVoucher[] | null;
};

type AccountFailedPayload = DeviceIdPayload & {
    error: ReferralError;
};

type PendingActionStartedPayload = DeviceIdPayload & {
    pendingAction: ReferralPendingAction;
};

const getAccountState = (state: ReferAFriendState, deviceId: string) => {
    state.accounts[deviceId] ??= { ...initialAccountState };

    return state.accounts[deviceId];
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
            // Data of another backend are not valid anymore.
            state.program = referAFriendInitialState.program;
            state.accounts = {};
        },
        setEncryptedReferralKey(
            state: ReferAFriendState,
            action: PayloadAction<SetEncryptedKeyPayload>,
        ) {
            const { deviceId, encryptedKey } = action.payload;
            state.devices[deviceId] = {
                ...emptyDeviceRecord,
                ...state.devices[deviceId],
                encryptedKey,
            };
        },
        setReferralLink(state: ReferAFriendState, action: PayloadAction<SetReferralLinkPayload>) {
            const { deviceId, code, shareUrl } = action.payload;
            state.devices[deviceId] = {
                ...emptyDeviceRecord,
                ...state.devices[deviceId],
                code,
                shareUrl,
            };
        },
        removeReferralDevice(state: ReferAFriendState, action: PayloadAction<DeviceIdPayload>) {
            delete state.devices[action.payload.deviceId];
            delete state.accounts[action.payload.deviceId];
        },
        programRequested(state: ReferAFriendState) {
            state.program.status = 'loading';
            state.program.error = null;
        },
        programLoaded(state: ReferAFriendState, action: PayloadAction<ReferralProgram>) {
            state.program = { status: 'loaded', data: action.payload, error: null };
        },
        programFailed(state: ReferAFriendState, action: PayloadAction<ReferralRequestError>) {
            state.program.status = 'error';
            state.program.error = action.payload;
        },
        accountRequested(state: ReferAFriendState, action: PayloadAction<DeviceIdPayload>) {
            const accountState = getAccountState(state, action.payload.deviceId);
            accountState.status = 'loading';
            accountState.error = null;
        },
        accountLoaded(state: ReferAFriendState, action: PayloadAction<AccountLoadedPayload>) {
            const accountState = getAccountState(state, action.payload.deviceId);
            accountState.status = 'loaded';
            accountState.account = action.payload.account;
            accountState.vouchers = action.payload.vouchers;
            accountState.error = null;
        },
        accountKeyMissing(state: ReferAFriendState, action: PayloadAction<DeviceIdPayload>) {
            const accountState = getAccountState(state, action.payload.deviceId);
            accountState.status = 'keyMissing';
            accountState.error = null;
        },
        accountFailed(state: ReferAFriendState, action: PayloadAction<AccountFailedPayload>) {
            const accountState = getAccountState(state, action.payload.deviceId);
            accountState.status = 'error';
            accountState.error = action.payload.error;
        },
        pendingActionStarted(
            state: ReferAFriendState,
            action: PayloadAction<PendingActionStartedPayload>,
        ) {
            const accountState = getAccountState(state, action.payload.deviceId);
            accountState.pendingAction = action.payload.pendingAction;
            accountState.error = null;
        },
        pendingActionFinished(state: ReferAFriendState, action: PayloadAction<DeviceIdPayload>) {
            getAccountState(state, action.payload.deviceId).pendingAction = null;
        },
    },
});

export const referAFriendActions = referAFriendSlice.actions;
export const referAFriendReducer = referAFriendSlice.reducer;

export const selectReferAFriendSettings = (state: ReferAFriendRootState) =>
    state.referAFriend.settings;

export const selectReferAFriendDevices = (state: ReferAFriendRootState) =>
    state.referAFriend.devices;

export const selectReferralDeviceRecord = (
    state: ReferAFriendRootState,
    deviceId: string | undefined,
): ReferralDeviceRecord | null =>
    deviceId === undefined ? null : (state.referAFriend.devices[deviceId] ?? null);

export const selectEncryptedReferralKey = (state: ReferAFriendRootState, deviceId: string) =>
    state.referAFriend.devices[deviceId]?.encryptedKey ?? null;

export const selectReferralProgram = (state: ReferAFriendRootState) => state.referAFriend.program;

export const selectReferralAccountState = (
    state: ReferAFriendRootState,
    deviceId: string | undefined,
): ReferralAccountState =>
    (deviceId === undefined ? undefined : state.referAFriend.accounts[deviceId]) ??
    initialAccountState;
