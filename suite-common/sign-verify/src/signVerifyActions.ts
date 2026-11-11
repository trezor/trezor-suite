import { type Dispatch } from 'redux';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type NetworksDep } from '@suite-common/networks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type WalletSettingsRootState, selectAddressDisplayType } from '@suite-common/wallet-core';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import type {
    AddressRef,
    MessageSigning,
    MessageSigningError,
    SignFormat,
    SignedMessage,
} from '@trezor/network-module-suite-common-types';
import { type WithServices } from '@trezor/redux-utils';

import * as SIGN_VERIFY from './signVerifyConstants';

export type SignVerifyRootState = DeviceRootState & WalletSettingsRootState;

export type SignVerifyThunkExtra = WithServices<AnalyticsDep & NetworksDep>;

const CANCEL_ERROR_CODES: readonly MessageSigningError['code'][] = [
    'Method_Cancel',
    'Failure_ActionCancelled',
];

/**
 * What a verification attempt settled on.
 *
 * Rejecting the prompt on the device is not a verdict on the signature — the check never ran — so
 * it is reported apart from a signature that genuinely did not verify.
 */
export type VerifyMessageResult = 'verified' | 'failed' | 'cancelled';

export type SignVerifyAction =
    | { type: typeof SIGN_VERIFY.SIGN_SUCCESS; signSignature: string }
    | { type: typeof SIGN_VERIFY.VERIFY_SUCCESS };

type SignVerifyToast = 'sign-message-error' | 'verify-message-error' | 'verify-address-error';

const isCancelledError = ({ code }: MessageSigningError) => CANCEL_ERROR_CODES.includes(code);

const getFailureAttributes = (error: MessageSigningError) => ({
    status: isCancelledError(error) ? ('cancelled' as const) : ('error' as const),
    error: error.code,
});

const notifyError = (dispatch: Dispatch, type: SignVerifyToast, message: string) => {
    dispatch(notificationsActions.addToast({ type, error: message }));

    return false as const;
};

/** The message signing of the account's network, for that account's type. */
export const getAccountMessageSigning = (
    extra: SignVerifyThunkExtra,
    account: Account,
): MessageSigning | undefined =>
    extra.services.networks.getNetwork({
        symbol: account.symbol,
        accountType: account.accountType,
    })?.capabilities.messageSigning;

type DeviceParams = {
    readonly device: TrezorDevice;
    readonly isChunkified: boolean;
};

const getDeviceParams = (getState: () => SignVerifyRootState): DeviceParams | undefined => {
    const device = selectSelectedDevice(getState());

    return device?.connected && device.available
        ? {
              device,
              isChunkified: selectAddressDisplayType(getState()) === AddressDisplayOptions.CHUNKED,
          }
        : undefined;
};

const DEVICE_NOT_FOUND = 'Device not found';
const NOT_SUPPORTED = 'Message signing is not supported for this account';

export type ShowAddressThunkParams = {
    readonly account: Account;
    readonly address: string;
    readonly path: string;
};

type ShowAddressThunkState = SignVerifyRootState;

type ShowAddressThunkDeps = SignVerifyThunkExtra;

export const showAddressThunk =
    ({ account, address, path }: ShowAddressThunkParams) =>
    async (
        dispatch: Dispatch,
        getState: () => ShowAddressThunkState,
        extra: ShowAddressThunkDeps,
    ): Promise<AddressRef | false> => {
        const showAddress = getAccountMessageSigning(extra, account)?.showAddress;
        const deviceParams = getDeviceParams(getState);

        if (showAddress === undefined) {
            return notifyError(dispatch, 'verify-address-error', NOT_SUPPORTED);
        }

        if (deviceParams === undefined) {
            return notifyError(dispatch, 'verify-address-error', DEVICE_NOT_FOUND);
        }

        const result = await showAddress({ ...deviceParams, account, address, path });

        return result.success
            ? result.payload
            : notifyError(dispatch, 'verify-address-error', result.error.message);
    };

export type SignThunkParams = {
    readonly account: Account;
    readonly path: string;
    readonly message: string;
    readonly isHex: boolean;
    /** One of the options the account's message signing offered; omitted when it offered none. */
    readonly format?: SignFormat;
};

type SignThunkState = SignVerifyRootState;

type SignThunkDeps = SignVerifyThunkExtra;

export const signThunk =
    ({ account, path, message, isHex, format }: SignThunkParams) =>
    async (
        dispatch: Dispatch,
        getState: () => SignThunkState,
        extra: SignThunkDeps,
    ): Promise<SignedMessage | false> => {
        const { analytics } = extra.services;
        const messageSigning = getAccountMessageSigning(extra, account);
        // Accounts signing in a single format never offered the choice, so reporting one of its
        // values would invent an answer the user never gave.
        const formatAttributes =
            messageSigning?.getFormatChoice(account)?.kind === 'signature'
                ? {
                      signatureFormat:
                          format === 'electrum' ? ('electrum' as const) : ('trezor' as const),
                  }
                : {};
        const report = (payload: { status: 'success' | 'error' | 'cancelled'; error?: string }) =>
            analytics.report({
                type: events.coinSignMessageEvent.name,
                payload: { ...payload, symbol: account.symbol, hex: isHex, ...formatAttributes },
            });

        if (messageSigning === undefined) {
            report({ status: 'error', error: NOT_SUPPORTED });

            return notifyError(dispatch, 'sign-message-error', NOT_SUPPORTED);
        }

        const deviceParams = getDeviceParams(getState);

        if (deviceParams === undefined) {
            report({ status: 'error', error: DEVICE_NOT_FOUND });

            return notifyError(dispatch, 'sign-message-error', DEVICE_NOT_FOUND);
        }

        const result = await messageSigning.sign({
            device: deviceParams.device,
            account,
            path,
            message,
            isHex,
            format,
        });

        if (!result.success) {
            report(getFailureAttributes(result.error));

            return notifyError(dispatch, 'sign-message-error', result.error.message);
        }

        report({ status: 'success' });
        dispatch(notificationsActions.addToast({ type: 'sign-message-success' }));
        dispatch({ type: SIGN_VERIFY.SIGN_SUCCESS, signSignature: result.payload.signature });

        return result.payload;
    };

export type VerifyThunkParams = {
    readonly account: Account;
    readonly address: string;
    readonly message: string;
    readonly signature: string;
    readonly isHex: boolean;
};

type VerifyThunkState = SignVerifyRootState;

type VerifyThunkDeps = SignVerifyThunkExtra;

export const verifyThunk =
    ({ account, address, message, signature, isHex }: VerifyThunkParams) =>
    async (
        dispatch: Dispatch,
        getState: () => VerifyThunkState,
        extra: VerifyThunkDeps,
    ): Promise<VerifyMessageResult> => {
        const { analytics } = extra.services;
        const verify = getAccountMessageSigning(extra, account)?.verify;
        const report = (payload: { status: 'success' | 'error' | 'cancelled'; error?: string }) =>
            analytics.report({
                type: events.coinVerifyMessageEvent.name,
                payload: { ...payload, symbol: account.symbol, hex: isHex },
            });

        if (verify === undefined) {
            report({ status: 'error', error: NOT_SUPPORTED });
            notifyError(dispatch, 'verify-message-error', NOT_SUPPORTED);

            return 'failed';
        }

        const deviceParams = getDeviceParams(getState);

        if (deviceParams === undefined) {
            report({ status: 'error', error: DEVICE_NOT_FOUND });
            notifyError(dispatch, 'verify-message-error', DEVICE_NOT_FOUND);

            return 'failed';
        }

        const result = await verify({
            device: deviceParams.device,
            account,
            address,
            message,
            signature,
            isHex,
        });

        if (!result.success) {
            report(getFailureAttributes(result.error));

            if (isCancelledError(result.error)) {
                // The user backed out on the device, which says nothing about the signature.
                // Still say so: the prompt disappearing with the form untouched leaves no other
                // sign that the check was dropped rather than quietly failing.
                dispatch(notificationsActions.addToast({ type: 'verify-message-cancelled' }));

                return 'cancelled';
            }

            notifyError(dispatch, 'verify-message-error', result.error.message);

            return 'failed';
        }

        report({ status: 'success' });
        dispatch(notificationsActions.addToast({ type: 'verify-message-success' }));
        dispatch({ type: SIGN_VERIFY.VERIFY_SUCCESS });

        return 'verified';
    };
