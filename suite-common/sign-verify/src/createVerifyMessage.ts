import { type Dispatch } from 'redux';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';
import { type ToastPayload, notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import { DeviceNotConnectedError } from '@trezor/device';
import {
    SignVerifyNotSupportedError,
    type VerifyError,
} from '@trezor/network-module-suite-common-types';
import { type Result, err, exhaustive } from '@trezor/type-utils';

import { getMessageSigner } from './getMessageSigner';
import { getErrorMessage, getFailureAttributes } from './signVerifyFailure';

export type VerifyMessageDeps = NetworkModuleRepositoryDep &
    AnalyticsDep & {
        dispatch: Dispatch;
    };

export type VerifyParams = {
    device: TrezorDeviceWithState;
    account: Account;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export type VerifyMessage = {
    /** A signature that does not verify is a `DeviceError`. */
    verify: (params: VerifyParams) => Promise<Result<void, VerifyError>>;
    isVerifySupported: (account: Account) => boolean;
};

const getVerifyErrorToast = (error: VerifyError): ToastPayload => {
    switch (error.type) {
        // Backing out on the device says nothing about the signature. Still say so: the prompt
        // disappearing with the form untouched leaves no other sign the check was dropped.
        case 'DeviceCancelled':
            return { type: 'verify-message-cancelled' };
        case 'DeviceError':
        case 'DeviceNotConnectedError':
        case 'SignVerifyNotSupported':
            return { type: 'verify-message-error', error: getErrorMessage(error) };
        default:
            return exhaustive(error);
    }
};

export const createVerifyMessage = (deps: VerifyMessageDeps): VerifyMessage => {
    const isVerifySupported = (account: Account) =>
        getMessageSigner(deps, account)?.verifyMessage !== undefined;

    const verifyOnDevice = async ({
        device,
        account,
        address,
        message,
        signature,
        hex,
    }: VerifyParams): Promise<Result<void, VerifyError>> => {
        if (!device.connected) {
            return err(DeviceNotConnectedError('Device not connected: verifyMessage'));
        }

        const verifyMessage = getMessageSigner(deps, account)?.verifyMessage;

        if (!verifyMessage) {
            return err(SignVerifyNotSupportedError());
        }

        return await verifyMessage({
            device,
            symbol: account.symbol,
            address,
            message,
            signature,
            hex,
        });
    };

    const verify: VerifyMessage['verify'] = async params => {
        const { account, hex } = params;
        const result = await verifyOnDevice(params);

        if (!result.success) {
            deps.analytics.report({
                type: events.coinVerifyMessageEvent.name,
                payload: { ...getFailureAttributes(result.error), symbol: account.symbol, hex },
            });
            deps.dispatch(notificationsActions.addToast(getVerifyErrorToast(result.error)));

            return result;
        }

        deps.analytics.report({
            type: events.coinVerifyMessageEvent.name,
            payload: { status: 'success', symbol: account.symbol, hex },
        });
        deps.dispatch(notificationsActions.addToast({ type: 'verify-message-success' }));

        return result;
    };

    return { verify, isVerifySupported };
};
