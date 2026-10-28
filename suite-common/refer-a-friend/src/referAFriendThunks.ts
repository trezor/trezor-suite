import { type Dispatch } from '@reduxjs/toolkit';

import { type DeviceRootState } from '@suite-common/device';
import { type WithServices, createThunk } from '@trezor/redux-utils';
import { type Result, err, ok } from '@trezor/type-utils';

import { type ReferAFriendDep } from './createReferAFriendCompositionRoot';
import {
    type ReferAFriendRootState,
    referAFriendActions,
    selectReferralDeviceRecord,
} from './referAFriendSlice';
import {
    type ReferralAccount,
    type ReferralError,
    type ReferralProgram,
    type ReferralVouchersResponse,
} from './referAFriendTypes';
import { type ReferralKey } from './referralKey';
import { selectReferralKeyDerivationDevice } from './selectReferralKeyDerivationDevice';

const REFER_A_FRIEND_MODULE = '@suite-common/refer-a-friend';

type ReferAFriendThunkDeps = WithServices<ReferAFriendDep>;

type ReferralActionThunkState = ReferAFriendRootState & DeviceRootState;

type DeviceIdParams = {
    deviceId: string;
};

type ReferralActionResult = Result<void, ReferralError>;

type ObtainReferralKeyParams = DeviceIdParams & {
    getState: () => DeviceRootState;
    referAFriend: ReferAFriendDep['referAFriend'];
};

// Uses the stored key when available, otherwise derives it on the standard wallet.
const obtainReferralKey = async ({
    deviceId,
    getState,
    referAFriend,
}: ObtainReferralKeyParams): Promise<Result<ReferralKey, ReferralError>> => {
    const storedReferralKey = await referAFriend.loadReferralKey({ deviceId });

    if (storedReferralKey !== null) {
        return ok(storedReferralKey);
    }

    const derivationDevice = selectReferralKeyDerivationDevice(getState(), deviceId);

    if (derivationDevice === null) {
        return err({ type: 'StandardWalletUnavailable' });
    }

    const result = await referAFriend.retrieveReferralKeyFromDevice({ device: derivationDevice });

    if (result.success) {
        await referAFriend.saveReferralKey({ deviceId, referralKey: result.payload });
    }

    return result;
};

type ReferralAccountRequestParams = DeviceIdParams & {
    referralKey: ReferralKey;
    dispatch: Dispatch;
    referAFriend: ReferAFriendDep['referAFriend'];
};

type ApplyReferralAccountParams = ReferralAccountRequestParams & {
    account: ReferralAccount;
};

/**
 * Reconciles the stored link with the account from the backend and loads its vouchers.
 * Helpers are plain functions rather than thunks so the key never appears in a Redux action.
 */
const applyReferralAccount = async ({
    deviceId,
    account,
    referralKey,
    dispatch,
    referAFriend,
}: ApplyReferralAccountParams): Promise<ReferralActionResult> => {
    switch (account.status) {
        case 'none':
            // The backend does not know the account, offer joining again with the same key.
            dispatch(referAFriendActions.setReferralLink({ deviceId, code: null, shareUrl: null }));
            dispatch(referAFriendActions.accountLoaded({ deviceId, account, vouchers: null }));

            return ok(undefined);
        case 'left':
            // Left on another device, forget everything including the key.
            referAFriend.removeReferralKeyFromSession(deviceId);
            dispatch(referAFriendActions.removeReferralDevice({ deviceId }));
            dispatch(referAFriendActions.accountLoaded({ deviceId, account, vouchers: null }));

            return ok(undefined);
        case 'active':
            break;
    }

    dispatch(
        referAFriendActions.setReferralLink({
            deviceId,
            code: account.code,
            shareUrl: account.shareUrl,
        }),
    );

    const vouchersResult = await referAFriend.referralApiFetch({
        method: 'GET',
        endpoint: 'v1/vouchers',
        referralKey,
    });

    if (!vouchersResult.success) {
        dispatch(referAFriendActions.accountFailed({ deviceId, error: vouchersResult.error }));

        return vouchersResult;
    }

    const { vouchers } = vouchersResult.payload as ReferralVouchersResponse;
    dispatch(referAFriendActions.accountLoaded({ deviceId, account, vouchers }));

    return ok(undefined);
};

const syncReferralAccount = async (
    params: ReferralAccountRequestParams,
): Promise<ReferralActionResult> => {
    const accountResult = await params.referAFriend.referralApiFetch({
        method: 'GET',
        endpoint: 'v1/account',
        referralKey: params.referralKey,
    });

    if (!accountResult.success) {
        params.dispatch(
            referAFriendActions.accountFailed({
                deviceId: params.deviceId,
                error: accountResult.error,
            }),
        );

        return accountResult;
    }

    return applyReferralAccount({ ...params, account: accountResult.payload as ReferralAccount });
};

const joinWithReferralKey = async (
    params: ReferralAccountRequestParams,
): Promise<ReferralActionResult> => {
    const accountResult = await params.referAFriend.referralApiFetch({
        method: 'GET',
        endpoint: 'v1/account',
        referralKey: params.referralKey,
    });

    if (!accountResult.success) {
        return accountResult;
    }

    const account = accountResult.payload as ReferralAccount;

    if (account.status === 'active') {
        return applyReferralAccount({ ...params, account });
    }

    const createResult = await params.referAFriend.referralApiFetch({
        method: 'POST',
        endpoint: 'v1/account',
        referralKey: params.referralKey,
    });

    if (!createResult.success) {
        return createResult;
    }

    return applyReferralAccount({ ...params, account: createResult.payload as ReferralAccount });
};

export type FetchReferralProgramThunkDeps = ReferAFriendThunkDeps;

export const fetchReferralProgramThunk = createThunk<
    void,
    void,
    { extra: FetchReferralProgramThunkDeps }
>(`${REFER_A_FRIEND_MODULE}/fetchReferralProgramThunk`, async (_, { dispatch, extra }) => {
    dispatch(referAFriendActions.programRequested());

    const result = await extra.services.referAFriend.referralApiFetch({
        method: 'GET',
        endpoint: 'v1/program',
    });

    if (!result.success) {
        dispatch(referAFriendActions.programFailed(result.error));

        return;
    }

    dispatch(referAFriendActions.programLoaded(result.payload as ReferralProgram));
});

export type FetchReferralAccountThunkState = ReferAFriendRootState;

export type FetchReferralAccountThunkDeps = ReferAFriendThunkDeps;

/**
 * Loads the account of a device with a stored link, without any device interaction. Without
 * a usable key, it only marks the key as missing, the user then derives it explicitly.
 */
export const fetchReferralAccountThunk = createThunk<
    void,
    DeviceIdParams,
    { state: FetchReferralAccountThunkState; extra: FetchReferralAccountThunkDeps }
>(
    `${REFER_A_FRIEND_MODULE}/fetchReferralAccountThunk`,
    async ({ deviceId }, { dispatch, getState, extra }) => {
        const { referAFriend } = extra.services;

        // Without a link, the page offers joining, there is no account to load.
        if (!selectReferralDeviceRecord(getState(), deviceId)?.shareUrl) {
            return;
        }

        dispatch(referAFriendActions.accountRequested({ deviceId }));

        const referralKey = await referAFriend.loadReferralKey({ deviceId });

        if (referralKey === null) {
            dispatch(referAFriendActions.accountKeyMissing({ deviceId }));

            return;
        }

        await syncReferralAccount({ deviceId, referralKey, dispatch, referAFriend });
    },
);

export type JoinReferralProgramThunkState = ReferralActionThunkState;

export type JoinReferralProgramThunkDeps = ReferAFriendThunkDeps;

/**
 * "Join program" click is the terms consent. An account created elsewhere (another computer,
 * reinstall) is only loaded, nothing is created again.
 */
export const joinReferralProgramThunk = createThunk<
    ReferralActionResult,
    DeviceIdParams,
    { state: JoinReferralProgramThunkState; extra: JoinReferralProgramThunkDeps }
>(
    `${REFER_A_FRIEND_MODULE}/joinReferralProgramThunk`,
    async ({ deviceId }, { dispatch, getState, extra }) => {
        const { referAFriend } = extra.services;

        dispatch(referAFriendActions.pendingActionStarted({ deviceId, pendingAction: 'join' }));

        const keyResult = await obtainReferralKey({ deviceId, getState, referAFriend });
        const result = keyResult.success
            ? await joinWithReferralKey({
                  deviceId,
                  referralKey: keyResult.payload,
                  dispatch,
                  referAFriend,
              })
            : keyResult;

        dispatch(referAFriendActions.pendingActionFinished({ deviceId }));

        return result;
    },
);

export type DeriveReferralKeyThunkState = ReferralActionThunkState;

export type DeriveReferralKeyThunkDeps = ReferAFriendThunkDeps;

/**
 * Derives the key again for an existing account (web, Linux without a keyring, deleted storage).
 */
export const deriveReferralKeyThunk = createThunk<
    ReferralActionResult,
    DeviceIdParams,
    { state: DeriveReferralKeyThunkState; extra: DeriveReferralKeyThunkDeps }
>(
    `${REFER_A_FRIEND_MODULE}/deriveReferralKeyThunk`,
    async ({ deviceId }, { dispatch, getState, extra }) => {
        const { referAFriend } = extra.services;

        dispatch(
            referAFriendActions.pendingActionStarted({ deviceId, pendingAction: 'deriveKey' }),
        );

        const keyResult = await obtainReferralKey({ deviceId, getState, referAFriend });
        const result = keyResult.success
            ? await syncReferralAccount({
                  deviceId,
                  referralKey: keyResult.payload,
                  dispatch,
                  referAFriend,
              })
            : keyResult;

        dispatch(referAFriendActions.pendingActionFinished({ deviceId }));

        return result;
    },
);

export type LeaveReferralProgramThunkState = ReferralActionThunkState;

export type LeaveReferralProgramThunkDeps = ReferAFriendThunkDeps;

/**
 * The code stops working at checkout, vouchers already issued stay on the backend.
 * Locally, the key and the link are forgotten, rejoining requires a new derivation.
 */
export const leaveReferralProgramThunk = createThunk<
    ReferralActionResult,
    DeviceIdParams,
    { state: LeaveReferralProgramThunkState; extra: LeaveReferralProgramThunkDeps }
>(
    `${REFER_A_FRIEND_MODULE}/leaveReferralProgramThunk`,
    async ({ deviceId }, { dispatch, getState, extra }) => {
        const { referAFriend } = extra.services;

        dispatch(referAFriendActions.pendingActionStarted({ deviceId, pendingAction: 'leave' }));

        const keyResult = await obtainReferralKey({ deviceId, getState, referAFriend });
        const leaveResult = keyResult.success
            ? await referAFriend.referralApiFetch({
                  method: 'POST',
                  endpoint: 'v1/account/leave',
                  referralKey: keyResult.payload,
              })
            : keyResult;

        dispatch(referAFriendActions.pendingActionFinished({ deviceId }));

        if (!leaveResult.success) {
            return leaveResult;
        }

        referAFriend.removeReferralKeyFromSession(deviceId);
        dispatch(referAFriendActions.removeReferralDevice({ deviceId }));

        return ok(undefined);
    },
);
