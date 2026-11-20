import { type Dispatch } from 'redux';

import { type AnalyticsDep, type EventInstance, events } from '@suite-common/analytics';
import { isTrezorDeviceWithState } from '@suite-common/device';
import { type TrezorDevice, type TrezorDeviceWithState } from '@suite-common/suite-types';
import { type ToastPayload, notificationsActions } from '@suite-common/toast-notifications';
import { DeviceNotConnectedError } from '@trezor/device';
import { type SignError, type VerifyError } from '@trezor/network-module-suite-common-types';
import { type Result, err, exhaustive } from '@trezor/type-utils';

import { getErrorMessage, getFailureAttributes } from './signVerifyFailure';

export type SignVerifyReporterDeps = AnalyticsDep & {
    dispatch: Dispatch;
};

type SignMessageEventPayload = EventInstance<typeof events.coinSignMessageEvent>['payload'];

export type SignAndReportParams = Pick<SignMessageEventPayload, 'symbol' | 'hex'> & {
    device: TrezorDevice | undefined;
    /** Reported only where the user picked the format, which only Bitcoin offers. */
    signatureFormat?: SignMessageEventPayload['signatureFormat'];
};

export type VerifyAndReportParams = Pick<SignMessageEventPayload, 'symbol' | 'hex'> & {
    device: TrezorDevice | undefined;
};

export type SignVerifyReporter = {
    signAndReport: <TSignedMessage>(
        params: SignAndReportParams,
        signOnDevice: (device: TrezorDeviceWithState) => Promise<Result<TSignedMessage, SignError>>,
    ) => Promise<Result<TSignedMessage, SignError>>;
    verifyAndReport: (
        params: VerifyAndReportParams,
        verifyOnDevice: (device: TrezorDeviceWithState) => Promise<Result<void, VerifyError>>,
    ) => Promise<Result<void, VerifyError>>;
};

export type SignVerifyReporterDep = {
    signVerifyReporter: SignVerifyReporter;
};

const isReadyDevice = (device: TrezorDevice | undefined): device is TrezorDeviceWithState =>
    isTrezorDeviceWithState(device) && device.connected && device.available;

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

export const createSignVerifyReporter = (deps: SignVerifyReporterDeps): SignVerifyReporter => ({
    signAndReport: async ({ device, symbol, hex, signatureFormat }, signOnDevice) => {
        const formatAttributes = signatureFormat ? { signatureFormat } : {};
        const result = isReadyDevice(device)
            ? await signOnDevice(device)
            : err(DeviceNotConnectedError('Device not connected: signMessage'));

        if (!result.success) {
            deps.analytics.report({
                type: events.coinSignMessageEvent.name,
                payload: {
                    ...getFailureAttributes(result.error),
                    symbol,
                    hex,
                    ...formatAttributes,
                },
            });
            deps.dispatch(
                notificationsActions.addToast({
                    type: 'sign-message-error',
                    error: getErrorMessage(result.error),
                }),
            );

            return result;
        }

        deps.analytics.report({
            type: events.coinSignMessageEvent.name,
            payload: { status: 'success', symbol, hex, ...formatAttributes },
        });
        deps.dispatch(notificationsActions.addToast({ type: 'sign-message-success' }));

        return result;
    },

    verifyAndReport: async ({ device, symbol, hex }, verifyOnDevice) => {
        const result = isReadyDevice(device)
            ? await verifyOnDevice(device)
            : err(DeviceNotConnectedError('Device not connected: verifyMessage'));

        if (!result.success) {
            deps.analytics.report({
                type: events.coinVerifyMessageEvent.name,
                payload: { ...getFailureAttributes(result.error), symbol, hex },
            });
            deps.dispatch(notificationsActions.addToast(getVerifyErrorToast(result.error)));

            return result;
        }

        deps.analytics.report({
            type: events.coinVerifyMessageEvent.name,
            payload: { status: 'success', symbol, hex },
        });
        deps.dispatch(notificationsActions.addToast({ type: 'verify-message-success' }));

        return result;
    },
});
