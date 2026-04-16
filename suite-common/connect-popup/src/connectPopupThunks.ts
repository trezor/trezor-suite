import { type AsyncThunkAction } from '@reduxjs/toolkit';

import { events } from '@suite-common/analytics';
import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { type CustomThunkAPI, createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect, {
    type CallMethodKeys,
    type CallMethodParams,
    type CallMethodPayload,
} from '@trezor/connect';
import { type MethodInfo, type MethodPermission } from '@trezor/connect/src/core/AbstractMethod';
import { connectCallableMethods } from '@trezor/connect-common';
import { TypedError, serializeError } from '@trezor/connect-common/src/constants/errors';
import { DEEPLINK_VERSION } from '@trezor/connect-common/src/data/version';
import { resolveAfter } from '@trezor/utils';

import { connectPopupActions } from './connectPopupActions';
import { getPermissionDeferred, getPopupCallDeferred } from './connectPopupPromiseManager';
import { selectConnectAppPermissions, selectConnectPopupCall } from './connectPopupReducer';
import {
    CALL_SOURCE_DEEPLINK,
    CALL_SOURCE_WALLETCONNECT,
    type ConnectCallSource,
} from './connectPopupTypes';
import { postCallHooks, preCallHooks } from './methodHooks';

const CONNECT_POPUP_MODULE = '@common/connect-popup';

type ConnectPopupCallThunkParams<M extends CallMethodKeys> = {
    method: M;
    payload: Omit<CallMethodParams<M>, 'method'>;
    source: ConnectCallSource;
};

export const connectPopupCallThunkInner = createThunk<
    void,
    ConnectPopupCallThunkParams<CallMethodKeys>
>(
    `${CONNECT_POPUP_MODULE}/callThunk`,
    async ({ method, payload, source }, { dispatch, getState, extra }) => {
        try {
            if (!connectCallableMethods.includes(method as any))
                throw TypedError('Method_Unsupported');

            const methodInfo = await TrezorConnect.call({
                ...payload,
                method,
                __info: true,
                __precomposed: true,
            } as CallMethodPayload);
            if (!methodInfo.success) {
                throw methodInfo.error;
            }
            const methodInfoPayload = methodInfo.payload as MethodInfo;
            if (
                methodInfoPayload.requiredPermissions.includes('management') ||
                (methodInfoPayload.requiredPermissions.includes('push_tx') &&
                    source.type === 'deeplink')
            ) {
                throw TypedError('Method_NotAllowed');
            }

            dispatch(
                connectPopupActions.initiateCall({
                    method,
                    methodInfo: {
                        methodTitle:
                            methodInfoPayload.confirmation?.label ?? methodInfoPayload.info,
                        confirmLabel: methodInfoPayload.confirmation?.customConfirmButton?.label,
                        permissionTypes: methodInfoPayload.requiredPermissions,
                        useUi: methodInfoPayload.useUi,
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
                    methodInfoPayload.requiredPermissions.every((permission: MethodPermission) =>
                        app.types.includes(permission),
                    ),
            );

            if (!isRemembered && source.type !== CALL_SOURCE_WALLETCONNECT) {
                // Create the deferred BEFORE dispatching requestPermissions.
                // Otherwise the modal can render and the user can click "confirm"
                // (dispatching approvePermissions) before the deferred exists,
                // causing the thunk to hang forever on a second, unresolved deferred.
                const permissionDeferred = getPermissionDeferred(true);
                dispatch(connectPopupActions.requestPermissions());
                await permissionDeferred.promise;
            }

            let device = selectSelectedDevice(getState());
            let attempt = 0;
            // more time needed on mobile deeplink, less on desktop
            // todo: be smarter about the timeout based on actual connection events
            const maxAttempts = source.type === CALL_SOURCE_DEEPLINK ? 10 : 5;
            // retry loop to wait for device to reconnect
            while (!device || !device.connected) {
                await resolveAfter(1000);
                device = selectSelectedDevice(getState());
                attempt++;
                if (attempt > maxAttempts) {
                    throw TypedError('Device_Disconnected');
                }
            }

            const txSigningPrecomposed: PrecomposedTransactionFinal | undefined =
                methodInfoPayload.precomposed;
            const modifiedPayload = await preCallHooks({
                method,
                payload,
                dispatch,
                getState,
                txSigningPrecomposed,
                source,
            });

            // refresh device state before call (could have changed during preCallHooks)
            device = selectSelectedDevice(getState());
            if (!device) throw TypedError('Device_Disconnected');

            const response = await TrezorConnect.call({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                },
                ...modifiedPayload,
                method,
            } as CallMethodPayload);
            response.id = undefined;

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
                throw response.error;
            }
            if (!postCallOngoing) {
                dispatch(connectPopupActions.finishCall());
                dispatch(
                    notificationsActions.addToast({
                        type: 'connect-popup-success',
                        appName: source.manifest.appName,
                    }),
                );
            }

            extra.services.analytics.report({
                type: events.connectPopupCallEvent.name,
                payload: {
                    method,
                    appName: source.manifest.appName,
                    appUrl: source.manifest.appUrl,
                    appEmail: source.manifest.email,
                    npmVersion: source.manifest.npmVersion,
                    connectionType: source.type,
                    origin: source.origin,
                },
            });

            getPopupCallDeferred().resolve(response);
        } catch (error) {
            console.error('connectPopupCallThunk', error);
            if (error?.error === 'switching-device') {
                // Do nothing, call will be restarted after device switch
                return;
            } else if (
                error?.code === 'Method_Cancel' ||
                error?.code === 'Method_Unsupported' // handled by fallback mechanism in connect-web
            ) {
                dispatch(connectPopupActions.finishCall());
            } else {
                dispatch(connectPopupActions.setError(serializeError(error)));

                // don't return error, allow user to reconnect device
                if (
                    error?.code === 'Device_NotFound' ||
                    error?.code === 'Device_Disconnected' ||
                    error?.code === 'Device_UsedElsewhere' ||
                    error?.code === 'Device_InvalidState'
                )
                    return;
            }

            extra.services.analytics.report({
                type: events.connectPopupErrorEvent.name,
                payload: {
                    method,
                    origin: source.origin,
                    error: error?.code,
                    appName: source.manifest.appName,
                    appUrl: source.manifest.appUrl,
                    appEmail: source.manifest.email,
                    npmVersion: source.manifest.npmVersion,
                    connectionType: source.type,
                },
            });

            getPopupCallDeferred().resolve({
                success: false,
                error: serializeError(error),
            });
        } finally {
            dispatch(extra.actions.lockDevice(false));
        }
    },
);

// Typed thunk that takes the method as a generic parameter
// Original thunk is exposed as well for using .fulfilled, .rejected, etc.
export const connectPopupCallThunk = <M extends CallMethodKeys>(
    params: ConnectPopupCallThunkParams<M>,
): AsyncThunkAction<void, ConnectPopupCallThunkParams<M>, CustomThunkAPI> =>
    connectPopupCallThunkInner(params) as any;

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

        dispatch(
            connectPopupCallThunk({
                source: {
                    type: 'deeplink',
                    origin: `${callbackUrl.protocol}//${callbackUrl.host}`,
                    manifest: {
                        appName: queryParams.appName ?? '',
                        appIcon: queryParams.appIcon ?? '',
                    },
                },
                method: method as CallMethodKeys,
                payload,
            }),
        );
        const response = await getPopupCallDeferred(true).promise;
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
                exported: call.exported,
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
                    useEmptyPassphrase: device.useEmptyPassphrase,
                },
                ...call.addresses?.[index]?.validatePayload,
                showOnTrezor: true,
                chunked: false,
            });
            const validatedStatus = res.success ? 'valid' : 'failed';
            dispatch(
                connectPopupActions.confirmAddresses({
                    exported: call.exported,
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
                    exported: call.exported,
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
        getPermissionDeferred().reject(TypedError('Method_Cancel'));
        TrezorConnect.cancel(error);
        // todo: probably not needed to call explicitly anymore
        dispatch(deviceActions.removeButtonRequests({}));

        const cancelError = TypedError('Method_Interrupted');
        // Show the cancellation error modal immediately so the user sees
        // feedback in the Suite popup ("Request was canceled by the user").
        dispatch(connectPopupActions.setError(serializeError(cancelError)));

        // Resolve the popup-call deferred directly so the cancel response
        // reaches the caller immediately.  Without this, the response
        // depends on TrezorConnect.cancel() propagating through the
        // internal core, interrupting the device, and eventually causing
        // the catch block in connectPopupCallThunkInner to resolve the
        // deferred — which may not happen reliably (e.g. the device
        // interrupt doesn't complete, or the Suite popup tab closes
        // before RESPONSE_EVENT is sent).
        getPopupCallDeferred().resolve({
            success: false,
            error: serializeError(cancelError),
        });
    },
);
