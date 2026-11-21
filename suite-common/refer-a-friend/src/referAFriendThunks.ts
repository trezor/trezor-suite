import { type Dispatch } from '@reduxjs/toolkit';

import {
    type DeviceRootState,
    selectStandardWalletByDeviceId,
    selectStandardWalletDescriptorByDeviceId,
} from '@suite-common/device';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type WalletDescriptor } from '@trezor/device-utils';
import { type WithServices, createThunk } from '@trezor/redux-utils';
import { type Result, err, ok } from '@trezor/type-utils';
import { hasProp, isWhitelistedHost } from '@trezor/utils';

import { type ReferAFriendDep } from './createReferAFriendCompositionRoot';
import { selectDoesReferralRecordExistForWalletDescriptor } from './referAFriendSelectors';
import { type ReferAFriendRootState, referAFriendActions } from './referAFriendSlice';
import {
    type ReferralAccount,
    type ReferralError,
    type ReferralProgram,
    type ReferralVouchersResponse,
} from './referAFriendTypes';
import { type ReferralKey } from './referralKey';

const REFER_A_FRIEND_MODULE = '@suite-common/refer-a-friend';

type ReferAFriendThunkDeps = WithServices<ReferAFriendDep>;

type ReferralActionThunkState = DeviceRootState;

type DeviceIdParams = {
    deviceId: string;
};

type WalletDescriptorParams = {
    walletDescriptor: WalletDescriptor;
};

type ReferralActionResult = Result<void, ReferralError>;

// The page is blocked without a standard wallet, so the actions should never get here without it.
const standardWalletUnavailableError: ReferralError = { message: 'Standard wallet unavailable' };

type ReferralStandardWallet = WalletDescriptorParams & {
    device: TrezorDeviceWithState;
};

// Both resolve from the same standard wallet instance, so they are null together.
const selectReferralStandardWallet = (
    state: DeviceRootState,
    deviceId: string,
): ReferralStandardWallet | null => {
    const device = selectStandardWalletByDeviceId(state, deviceId);
    const walletDescriptor = selectStandardWalletDescriptorByDeviceId(state, deviceId);

    return device === null || walletDescriptor === null ? null : { device, walletDescriptor };
};

type ObtainReferralKeyParams = {
    standardWallet: ReferralStandardWallet;
    referAFriend: ReferAFriendDep['referAFriend'];
};

// Uses the stored key when available, otherwise derives it on the standard wallet.
const obtainReferralKey = async ({
    standardWallet: { device, walletDescriptor },
    referAFriend,
}: ObtainReferralKeyParams): Promise<Result<ReferralKey, ReferralError>> => {
    const storedReferralKey = await referAFriend.loadReferralKey({ walletDescriptor });

    if (storedReferralKey !== null) {
        return ok(storedReferralKey);
    }

    const result = await referAFriend.retrieveReferralKeyFromDevice({ device });

    if (result.success) {
        await referAFriend.saveReferralKey({ walletDescriptor, referralKey: result.payload });
    }

    return result;
};

type ReferralAccountRequestParams = WalletDescriptorParams & {
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
    walletDescriptor,
    account,
    referralKey,
    dispatch,
    referAFriend,
}: ApplyReferralAccountParams): Promise<ReferralActionResult> => {
    switch (account.status) {
        case 'none':
            // The backend does not know the account, offer joining again with the same key.
            dispatch(
                referAFriendActions.setReferralLink({
                    walletDescriptor,
                    code: null,
                    shareUrl: null,
                }),
            );
            dispatch(
                referAFriendActions.accountLoaded({ walletDescriptor, account, vouchers: null }),
            );

            return ok(undefined);
        case 'left':
            // Left on another device, forget everything including the key.
            referAFriend.removeReferralKeyFromSession(walletDescriptor);
            dispatch(referAFriendActions.removeReferralWallet({ walletDescriptor }));
            dispatch(
                referAFriendActions.accountLoaded({ walletDescriptor, account, vouchers: null }),
            );

            return ok(undefined);
        case 'active':
            break;
    }

    dispatch(
        referAFriendActions.setReferralLink({
            walletDescriptor,
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
        dispatch(
            referAFriendActions.accountFailed({ walletDescriptor, error: vouchersResult.error }),
        );

        return vouchersResult;
    }

    const { vouchers } = vouchersResult.payload as ReferralVouchersResponse;
    dispatch(
        referAFriendActions.accountLoaded({
            walletDescriptor,
            account,
            vouchers: vouchers.map(voucher => ({ ...voucher, amount: Number(voucher.amount) })),
        }),
    );

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
                walletDescriptor: params.walletDescriptor,
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

// The API sends uppercase ISO codes, while the supported base currencies are keyed in lowercase.
const hasSupportedFiatCurrency = (program: unknown) =>
    hasProp(program, 'fiatCurrency') &&
    typeof program.fiatCurrency === 'string' &&
    isFiatBaseCurrencyCode(program.fiatCurrency.toLowerCase());

const REFER_A_FRIEND_ALLOWED_HOSTS = ['localhost', 'trezor.io', 'sldev.cz'];

const hasTrezorTermsUrl = (program: unknown) => {
    if (!hasProp(program, 'termsUrl') || typeof program.termsUrl !== 'string') return false;

    try {
        const { protocol, hostname } = new URL(program.termsUrl);

        return protocol === 'https:' && isWhitelistedHost(hostname, REFER_A_FRIEND_ALLOWED_HOSTS);
    } catch {
        return false;
    }
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

    if (!hasSupportedFiatCurrency(result.payload)) {
        dispatch(referAFriendActions.programFailed({ message: 'Unsupported fiat currency' }));

        return;
    }

    if (!hasTrezorTermsUrl(result.payload)) {
        dispatch(referAFriendActions.programFailed({ message: 'Invalid terms URL' }));

        return;
    }

    dispatch(referAFriendActions.programLoaded(result.payload as ReferralProgram));
});

export type FetchReferralAccountThunkState = ReferAFriendRootState & DeviceRootState;

export type FetchReferralAccountThunkDeps = ReferAFriendThunkDeps;

/**
 * Loads the account of the device's standard wallet with a stored link, without any device
 * interaction. Without a usable key, it only marks the key as missing, the user then derives it
 * explicitly.
 */
export const fetchReferralAccountThunk = createThunk<
    void,
    DeviceIdParams,
    { state: FetchReferralAccountThunkState; extra: FetchReferralAccountThunkDeps }
>(
    `${REFER_A_FRIEND_MODULE}/fetchReferralAccountThunk`,
    async ({ deviceId }, { dispatch, getState, extra }) => {
        const { referAFriend } = extra.services;
        const walletDescriptor = selectStandardWalletDescriptorByDeviceId(getState(), deviceId);

        // Without a standard wallet the page is blocked, without a link it offers joining.
        if (
            walletDescriptor === null ||
            !selectDoesReferralRecordExistForWalletDescriptor(getState(), walletDescriptor)
        ) {
            return;
        }

        dispatch(referAFriendActions.accountRequested({ walletDescriptor }));

        const referralKey = await referAFriend.loadReferralKey({ walletDescriptor });

        if (referralKey === null) {
            dispatch(referAFriendActions.accountKeyMissing({ walletDescriptor }));

            return;
        }

        await syncReferralAccount({ walletDescriptor, referralKey, dispatch, referAFriend });
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
        const standardWallet = selectReferralStandardWallet(getState(), deviceId);

        if (standardWallet === null) {
            return err(standardWalletUnavailableError);
        }

        const { walletDescriptor } = standardWallet;

        dispatch(
            referAFriendActions.pendingActionStarted({ walletDescriptor, pendingAction: 'join' }),
        );

        const keyResult = await obtainReferralKey({ standardWallet, referAFriend });
        const result = keyResult.success
            ? await joinWithReferralKey({
                  walletDescriptor,
                  referralKey: keyResult.payload,
                  dispatch,
                  referAFriend,
              })
            : keyResult;

        dispatch(referAFriendActions.pendingActionFinished({ walletDescriptor }));

        return result;
    },
);

export type DeriveReferralKeyThunkState = ReferralActionThunkState;

export type DeriveReferralKeyThunkDeps = ReferAFriendThunkDeps;

/**
 * Derives the key again for an existing account (web, Linux without a keyring, deleted storage).
 * Very analogical to joinReferralProgramThunk – TODO create a suitable abstraction for both?
 */
export const deriveReferralKeyThunk = createThunk<
    ReferralActionResult,
    DeviceIdParams,
    { state: DeriveReferralKeyThunkState; extra: DeriveReferralKeyThunkDeps }
>(
    `${REFER_A_FRIEND_MODULE}/deriveReferralKeyThunk`,
    async ({ deviceId }, { dispatch, getState, extra }) => {
        const { referAFriend } = extra.services;
        const standardWallet = selectReferralStandardWallet(getState(), deviceId);

        if (standardWallet === null) {
            return err(standardWalletUnavailableError);
        }

        const { walletDescriptor } = standardWallet;

        dispatch(
            referAFriendActions.pendingActionStarted({
                walletDescriptor,
                pendingAction: 'deriveKey',
            }),
        );

        const keyResult = await obtainReferralKey({ standardWallet, referAFriend });
        const result = keyResult.success
            ? await syncReferralAccount({
                  walletDescriptor,
                  referralKey: keyResult.payload,
                  dispatch,
                  referAFriend,
              })
            : keyResult;

        dispatch(referAFriendActions.pendingActionFinished({ walletDescriptor }));

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
        const standardWallet = selectReferralStandardWallet(getState(), deviceId);

        if (standardWallet === null) {
            return err(standardWalletUnavailableError);
        }

        const { walletDescriptor } = standardWallet;

        dispatch(
            referAFriendActions.pendingActionStarted({ walletDescriptor, pendingAction: 'leave' }),
        );

        const keyResult = await obtainReferralKey({ standardWallet, referAFriend });
        const leaveResult = keyResult.success
            ? await referAFriend.referralApiFetch({
                  method: 'POST',
                  endpoint: 'v1/account/leave',
                  referralKey: keyResult.payload,
              })
            : keyResult;

        dispatch(referAFriendActions.pendingActionFinished({ walletDescriptor }));

        if (!leaveResult.success) {
            return leaveResult;
        }

        referAFriend.removeReferralKeyFromSession(walletDescriptor);
        dispatch(referAFriendActions.removeReferralWallet({ walletDescriptor }));

        return ok(undefined);
    },
);
