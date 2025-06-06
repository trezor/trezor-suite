import { AsyncThunkAction } from '@reduxjs/toolkit';

import { EventType, analytics } from '@suite-common/analytics';
import { CustomThunkAPI, createThunk } from '@suite-common/redux-utils';
import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect, { CallMethodParams, CallMethodResponse } from '@trezor/connect';
import { TypedError, serializeError } from '@trezor/connect/src/constants/errors';
import { MethodPermission } from '@trezor/connect/src/core/AbstractMethod';
import { DEEPLINK_VERSION } from '@trezor/connect/src/data/version';
import { createDeferred } from '@trezor/utils';

import { connectPopupActions } from './connectPopupActions';
import { selectConnectAppPermissions, selectConnectPopupCall } from './connectPopupReducer';
import { ConnectCallSource } from './connectPopupTypes';
import { postCallHooks, preCallHooks } from './methodHooks';

const CONNECT_POPUP_MODULE = '@common/connect-popup';

type ConnectPopupCallThunkResponse<M extends keyof typeof TrezorConnect> = Promise<{
    success: boolean;
    payload: CallMethodResponse<M>;
}>;

type ConnectPopupCallThunkParams<M extends keyof typeof TrezorConnect> = {
    method: M;
    payload: Omit<CallMethodParams<M>, 'method'>;
    source: ConnectCallSource;
};

export const connectPopupCallThunkInner = createThunk<
    ConnectPopupCallThunkResponse<keyof typeof TrezorConnect>,
    ConnectPopupCallThunkParams<keyof typeof TrezorConnect>
>(
    `${CONNECT_POPUP_MODULE}/callThunk`,
    async ({ method, payload, source }, { dispatch, getState, extra }) => {
        try {
            // @ts-expect-error: method is dynamic
            const methodInfo = await TrezorConnect[method]({
                ...payload,
                __info: true,
            });
            if (!methodInfo.success) {
                throw methodInfo.payload;
            }
            if (
                methodInfo.payload.requiredPermissions.includes('management') ||
                (methodInfo.payload.requiredPermissions.includes('push_tx') &&
                    source.type === 'deeplink')
            ) {
                throw TypedError('Method_NotAllowed');
            }

            dispatch(
                connectPopupActions.initiateCall({
                    method,
                    methodInfo: {
                        methodTitle:
                            methodInfo.payload.confirmation?.label ?? methodInfo.payload.info,
                        confirmLabel: methodInfo.payload.confirmation?.customConfirmButton?.label,
                        permissionTypes: methodInfo.payload.requiredPermissions,
                        useUi: methodInfo.payload.useUi,
                    },
                    payload,
                    source,
                }),
            );

            // Check if permission remembered
            const rememberedApps = selectConnectAppPermissions(getState());
            const isRemembered = rememberedApps.some(
                app =>
                    app.origin === source.origin &&
                    app.process?.fullPath === source.process?.fullPath &&
                    methodInfo.payload.requiredPermissions.every((permission: MethodPermission) =>
                        app.types.includes(permission),
                    ),
            );

            if (!isRemembered) {
                const confirmation = createDeferred();
                dispatch(extra.actions.lockDevice(true));
                dispatch(
                    connectPopupActions.requestPermissions({
                        permissionDecision: confirmation,
                    }),
                );
                await confirmation.promise;
            }

            const device = selectSelectedDevice(getState());
            if (!device) {
                throw TypedError('Device_NotFound');
            }

            const txSigningPrecomposed: PrecomposedTransactionFinal | undefined =
                methodInfo.payload.precomposed;
            const modifiedPayload = await preCallHooks({
                method,
                payload,
                dispatch,
                getState,
                txSigningPrecomposed,
                source,
            });

            // @ts-expect-error: method is dynamic
            const response = await TrezorConnect[method]({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                },
                useEmptyPassphrase: device.useEmptyPassphrase,
                ...modifiedPayload,
            });
            response.id = undefined;

            // Note: for mobile this needs to be called explicitly, on desktop it's automatically handled by middleware
            dispatch(deviceActions.removeButtonRequests({ device }));

            const postCallOngoing = await postCallHooks({
                method,
                payload: modifiedPayload,
                originalPayload: payload,
                response,
                dispatch,
                getState,
                source,
            });
            if (!response.success) {
                throw response.payload;
            }
            if (!postCallOngoing) {
                dispatch(connectPopupActions.finishCall());
            }

            analytics.report({
                type: EventType.ConnectPopupCall,
                payload: {
                    method,
                    origin: source.origin,
                },
            });

            return response;
        } catch (error) {
            console.error('connectPopupCallThunk', error);
            if (error?.code === 'Method_Cancel') {
                dispatch(connectPopupActions.finishCall());
            } else {
                dispatch(connectPopupActions.setError(serializeError(error)));
            }

            analytics.report({
                type: EventType.ConnectPopupError,
                payload: {
                    method,
                    origin: source.origin,
                    error: error?.code,
                },
            });

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
                connectPopupActions.setError(serializeError(TypedError('Method_InvalidParameter'))),
            );

            return;
        }

        if (!version || parseInt(version) > DEEPLINK_VERSION) {
            dispatch(
                connectPopupActions.setError(
                    serializeError(TypedError('Deeplink_VersionMismatch')),
                ),
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
                connectPopupActions.setError(serializeError(TypedError('Method_InvalidParameter'))),
            );

            return;
        }

        const response = await dispatch(
            connectPopupCallThunk({
                source: {
                    type: 'deeplink',
                    origin: `${callbackUrl.protocol}//${callbackUrl.host}`,
                    manifest: {
                        appName: queryParams.appName,
                        appIcon: queryParams.appIcon,
                    },
                },
                method: method as keyof typeof TrezorConnect,
                payload,
            }),
        ).unwrap();
        callbackUrl.searchParams.set('response', JSON.stringify(response));
        dispatch(
            connectPopupActions.deeplinkCallback({
                callbackUrl: callbackUrl.toString(),
            }),
        );
    },
);

export const connectPopupVerifyAddressThunk = createThunk<void, { index: number }>(
    `${CONNECT_POPUP_MODULE}/verifyAddressThunk`,
    async ({ index }, { dispatch, getState, extra }) => {
        // Unlock device access from previous call
        dispatch(extra.actions.lockDevice(false));

        const device = selectSelectedDevice(getState());
        const call = selectConnectPopupCall(getState());
        if (!device || !call || call.state !== 'address-confirmation') return;

        // Update loading state of addresses
        dispatch(
            connectPopupActions.confirmAddresses({
                addresses: call.addresses?.map((address, i) => ({
                    ...address,
                    loading: i === index,
                })),
            }),
        );

        try {
            // @ts-expect-error: method is dynamic
            const res = await TrezorConnect[call.method]({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                },
                useEmptyPassphrase: device.useEmptyPassphrase,
                ...call.addresses[index].validatePayload,
                showOnTrezor: true,
                chunked: false,
            });
            const validatedStatus = res.success ? 'valid' : 'failed';
            dispatch(
                connectPopupActions.confirmAddresses({
                    addresses: call.addresses.map((address, i) => ({
                        ...address,
                        loading: false,
                        validated: i === index ? validatedStatus : address.validated,
                    })),
                }),
            );
        } catch (error) {
            console.error('connectPopupVerifyAddressThunk', error);
            dispatch(
                connectPopupActions.confirmAddresses({
                    addresses: call.addresses.map((address, i) => ({
                        ...address,
                        loading: false,
                        validated: i === index ? 'failed' : address.validated,
                    })),
                }),
            );
        }
    },
);

export const connectPopupCancelThunk = createThunk<void, { error?: string }>(
    `${CONNECT_POPUP_MODULE}/cancelThunk`,
    ({ error }, { dispatch }) => {
        TrezorConnect.cancel(error);
        dispatch(deviceActions.removeButtonRequests({}));
        dispatch(connectPopupActions.finishCall());
    },
);
