import { type Dispatch } from 'redux';

import { type AnalyticsDep, type EventInstance, events } from '@suite-common/analytics';
import { type ToastPayload, notificationsActions } from '@suite-common/toast-notifications';
import { type SignError, type VerifyError } from '@trezor/network-module-suite-common-types';
import { type Result, exhaustive } from '@trezor/type-utils';

import { getErrorMessage, getFailureAttributes } from './signVerifyFailure';

export type SignVerifyReporterDeps = AnalyticsDep & {
    dispatch: Dispatch;
};

export type SignReportParams = Pick<
    EventInstance<typeof events.coinSignMessageEvent>['payload'],
    'symbol' | 'hex' | 'signatureFormat'
>;

export type VerifyReportParams = Pick<
    EventInstance<typeof events.coinVerifyMessageEvent>['payload'],
    'symbol' | 'hex'
>;

export type SignVerifyReporter = {
    reportSign: (params: SignReportParams, result: Result<unknown, SignError>) => void;
    reportVerify: (params: VerifyReportParams, result: Result<void, VerifyError>) => void;
};

export type SignVerifyReporterDep = {
    signVerifyReporter: SignVerifyReporter;
};

const getVerifyErrorToast = (error: VerifyError): ToastPayload => {
    switch (error.type) {
        // Backing out on the device says nothing about the signature. Still say so: the prompt
        // disappearing with the form untouched leaves no other sign the check was dropped.
        case 'DeviceCancelled':
            return { type: 'verify-message-cancelled' };
        case 'DeviceError':
        case 'DeviceNotConnectedError':
            return { type: 'verify-message-error', error: getErrorMessage(error) };
        default:
            return exhaustive(error);
    }
};

export const createSignVerifyReporter = (deps: SignVerifyReporterDeps): SignVerifyReporter => ({
    reportSign: ({ symbol, hex, signatureFormat }, result) => {
        const formatAttributes = signatureFormat ? { signatureFormat } : {};

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

            return;
        }

        deps.analytics.report({
            type: events.coinSignMessageEvent.name,
            payload: { status: 'success', symbol, hex, ...formatAttributes },
        });
        deps.dispatch(notificationsActions.addToast({ type: 'sign-message-success' }));
    },

    reportVerify: ({ symbol, hex }, result) => {
        if (!result.success) {
            deps.analytics.report({
                type: events.coinVerifyMessageEvent.name,
                payload: { ...getFailureAttributes(result.error), symbol, hex },
            });
            deps.dispatch(notificationsActions.addToast(getVerifyErrorToast(result.error)));

            return;
        }

        deps.analytics.report({
            type: events.coinVerifyMessageEvent.name,
            payload: { status: 'success', symbol, hex },
        });
        deps.dispatch(notificationsActions.addToast({ type: 'verify-message-success' }));
    },
});
