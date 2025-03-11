import { AsyncThunkAction } from '@reduxjs/toolkit';

import { CustomThunkAPI, createThunk } from '@suite-common/redux-utils';
import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect, { CallMethodParams, CallMethodResponse, ERRORS } from '@trezor/connect';
import { TypedError, serializeError } from '@trezor/connect/src/constants/errors';
import { MethodPermission } from '@trezor/connect/src/core/AbstractMethod';
import { DEEPLINK_VERSION } from '@trezor/connect/src/data/version';
import { createDeferred } from '@trezor/utils';

import { connectPopupActions } from './connectPopupActions';
import { selectConnectAppPermissions } from './connectPopupReducer';

const CONNECT_POPUP_MODULE = '@common/connect-popup';

type ConnectPopupCallThunkResponse<M extends keyof typeof TrezorConnect> = Promise<{
    success: boolean;
    payload: CallMethodResponse<M>;
}>;

type ConnectPopupCallThunkParams<M extends keyof typeof TrezorConnect> = {
    processName?: string;
    origin?: string;
    method: M;
    payload: Omit<CallMethodParams<M>, 'method'>;
};

export const connectPopupCallThunkInner = createThunk<
    ConnectPopupCallThunkResponse<keyof typeof TrezorConnect>,
    ConnectPopupCallThunkParams<keyof typeof TrezorConnect>
>(
    `${CONNECT_POPUP_MODULE}/callThunk`,
    async ({ method, payload, processName, origin }, { dispatch, getState, extra }) => {
        try {
            // @ts-expect-error: method is dynamic
            const methodInfo = await TrezorConnect[method]({
                ...payload,
                __info: true,
            });
            if (!methodInfo.success) {
                dispatch(
                    connectPopupActions.initiateCall({
                        state: 'call-error',
                        callError: ERRORS.TypedError(methodInfo.payload.code),
                    }),
                );
                throw methodInfo;
            }
            if (
                methodInfo.payload.requiredPermissions.includes('management') ||
                methodInfo.payload.requiredPermissions.includes('push_tx')
            ) {
                dispatch(
                    connectPopupActions.initiateCall({
                        state: 'call-error',
                        callError: ERRORS.TypedError('Method_NotAllowed'),
                    }),
                );

                return;
            }

            // Check if permission remembered
            const rememberedApps = selectConnectAppPermissions(getState());
            const isRemembered = rememberedApps.some(
                app =>
                    app.origin === origin &&
                    app.processName === processName &&
                    methodInfo.payload.requiredPermissions.every((permission: MethodPermission) =>
                        app.types.includes(permission),
                    ),
            );

            if (!isRemembered) {
                const confirmation = createDeferred();
                dispatch(extra.actions.lockDevice(true));
                dispatch(
                    connectPopupActions.initiateCall({
                        state: 'request',
                        method,
                        methodTitle:
                            methodInfo.payload.confirmation?.label ?? methodInfo.payload.info,
                        confirmLabel: methodInfo.payload.confirmation?.customConfirmButton?.label,
                        processName,
                        origin,
                        confirmation,
                        permissionTypes: methodInfo.payload.requiredPermissions,
                    }),
                );
                await confirmation.promise;
            }

            const device = selectSelectedDevice(getState());
            if (!device) {
                throw ERRORS.TypedError('Device_NotFound');
            }

            // @ts-expect-error: method is dynamic
            const response = await TrezorConnect[method]({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                },
                useEmptyPassphrase: device.useEmptyPassphrase,
                ...payload,
            });
            response.id = undefined;

            // Note: for mobile this needs to be called explicitly, on desktop it's automatically handled by middleware
            dispatch(deviceActions.removeButtonRequests({ device }));

            dispatch(connectPopupActions.finishCall());

            return response;
        } catch (error) {
            console.error('connectPopupCallThunk', error);

            return {
                success: false,
                payload: serializeError(error),
            };
        } finally {
            dispatch(extra.actions.lockDevice(false));
        }
    },
);

// Typed thunk that takes the method as a generic parameter
// Original thunk is exposed as well for using .fulfilled, .rejected, etc.
export const connectPopupCallThunk = <M extends keyof typeof TrezorConnect>(
    params: ConnectPopupCallThunkParams<M>,
): AsyncThunkAction<
    ConnectPopupCallThunkResponse<M>,
    ConnectPopupCallThunkParams<M>,
    CustomThunkAPI
> => connectPopupCallThunkInner(params) as any;

export const connectPopupDeeplinkThunk = createThunk<void, { url: string }>(
    `${CONNECT_POPUP_MODULE}/deeplinkThunk`,
    async ({ url }, { dispatch }) => {
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (error) {
            console.warn('Invalid deeplink URL', { error, url });

            return;
        }

        const path = parsedUrl.pathname;
        const queryParams = Object.fromEntries(parsedUrl.searchParams.entries());

        // Validate params
        const version = path && path.split('/').slice(-2, -1)[0];
        if (
            !queryParams?.method ||
            !queryParams?.params ||
            !queryParams?.callback ||
            typeof queryParams?.params !== 'string' ||
            typeof queryParams?.method !== 'string' ||
            typeof queryParams?.callback !== 'string' ||
            !Object.prototype.hasOwnProperty.call(TrezorConnect, queryParams?.method)
        ) {
            dispatch(
                connectPopupActions.initiateCall({
                    state: 'call-error',
                    callError: TypedError('Method_InvalidParameter'),
                }),
            );

            return;
        }

        if (!version || parseInt(version) > DEEPLINK_VERSION) {
            dispatch(
                connectPopupActions.initiateCall({
                    state: 'call-error',
                    callError: TypedError('Deeplink_VersionMismatch'),
                }),
            );

            return;
        }

        const { method, callback } = queryParams;
        let payload, callbackUrl;
        try {
            payload = JSON.parse(queryParams.params);
            callbackUrl = new URL(callback);
        } catch {
            dispatch(
                connectPopupActions.initiateCall({
                    state: 'call-error',
                    callError: TypedError('Method_InvalidParameter'),
                }),
            );

            return;
        }

        const response = await dispatch(
            connectPopupCallThunk({
                processName: 'deeplink',
                origin: `${callbackUrl.protocol}//${callbackUrl.host}`,
                // @ts-expect-error: method is dynamic
                method,
                payload,
            }),
        ).unwrap();
        callbackUrl.searchParams.set('response', JSON.stringify(response));
        dispatch(
            connectPopupActions.initiateCall({
                state: 'deeplink-callback',
                callbackUrl: callbackUrl.toString(),
            }),
        );
    },
);
