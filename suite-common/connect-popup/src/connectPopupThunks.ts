import { type AsyncThunkAction } from '@reduxjs/toolkit';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type DeviceRootState, deviceActions, selectSelectedDevice } from '@suite-common/device';
import { type LockDeviceDep } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect, { type CallMethodPayload, type MethodInfo } from '@trezor/connect';
import { connectCallableMethods } from '@trezor/connect-common';
import { TypedError, serializeError } from '@trezor/connect-common/src/constants/errors';
import { DEEPLINK_VERSION } from '@trezor/connect-common/src/data/version';
import { createThunk } from '@trezor/redux-utils';
import { resolveAfter } from '@trezor/utils';

import { connectPopupActions } from './connectPopupActions';
import { getPermissionDeferred, getPopupCallDeferred } from './connectPopupPromiseManager';
import {
    type ConnectPopupStateRootState,
    selectConnectAppPermissions,
    selectConnectPopupCall,
} from './connectPopupReducer';
import {
    CALL_SOURCE_DEEPLINK,
    CALL_SOURCE_WALLETCONNECT,
    CONNECT_POPUP_MODULE,
    type ConnectCallSource,
} from './connectPopupTypes';
import { getMethodDefinition } from './methods';
import type { ConnectPopupMethodKey, MethodPayload } from './methods/types';
import {
    canRememberPermissions,
    deriveCardanoEnabledNetworks,
    isSameConnectApp,
    mergePermissions,
    permissionsAreCovered,
    sanitizeRequestedPermissions,
} from './permissions';

// After these errors the popup stays open so that the user can reconnect or switch the device and
// retry. The caller has not been answered yet.
export const isDeviceReconnectError = (code: string | undefined) =>
    code === 'Device_NotFound' ||
    code === 'Device_Disconnected' ||
    code === 'Device_UsedElsewhere' ||
    code === 'Device_InvalidState';

// Names only, values may hold confidential data. Deeplink payloads are arbitrary parsed JSON.
const getCallParamNames = (payload: unknown): string[] =>
    payload && typeof payload === 'object' && !Array.isArray(payload)
        ? Object.keys(payload).sort()
        : [];

type ConnectPopupCallThunkParams<M extends ConnectPopupMethodKey> = {
    method: M;
    payload: MethodPayload<M>;
    source: ConnectCallSource;
};

export type ConnectPopupCallInnerThunkState = DeviceRootState & ConnectPopupStateRootState;

export type ConnectPopupCallInnerThunkDeps = {
    services: AnalyticsDep & LockDeviceDep;
};

export type ConnectPopupCallThunkState = ConnectPopupCallInnerThunkState;

export type ConnectPopupCallThunkDeps = ConnectPopupCallInnerThunkDeps;

export const connectPopupCallInnerThunk = createThunk<
    void,
    ConnectPopupCallThunkParams<ConnectPopupMethodKey>,
    { state: ConnectPopupCallInnerThunkState; extra: ConnectPopupCallInnerThunkDeps }
>(
    `${CONNECT_POPUP_MODULE}/callThunk`,
    async ({ source, ...params }, { dispatch, getState, extra }) => {
        const cleanups: Array<() => void> = [];
        const onCleanup = (cleanup: () => void) => {
            cleanups.push(cleanup);
        };

        try {
            // A redirect is resolved once: the target method's own compatibility step is skipped.
            const { method, payload } =
                getMethodDefinition(params.method)?.compatibility?.({ ...params, source }) ??
                params;
            const definition = getMethodDefinition(method);

            if (!connectCallableMethods.includes(method)) throw TypedError('Method_Unsupported');

            const methodInfo = await TrezorConnect.call({
                ...payload,
                method,
                __info: true,
            } as CallMethodPayload);
            if (!methodInfo.success) {
                throw methodInfo.error;
            }
            const methodInfoPayload = methodInfo.payload as MethodInfo;
            const callPermissions = methodInfoPayload.requiredPermissions;
            const hasPermission = (name: string) =>
                callPermissions.some(p => p.permission === name);
            if (
                hasPermission('management') ||
                hasPermission('internal') ||
                (hasPermission('push_tx') && source.type === CALL_SOURCE_DEEPLINK)
            ) {
                throw TypedError('Method_NotAllowed');
            }

            // Permissions the host/dapp declared up front (ConnectSettings.requestedPermissions),
            // sanitized against the same rules as the hard block above. Merged with this call's own
            // required permissions so the first consent covers the whole declared set at once — a
            // single "Remember" then silences every later in-scope call.
            const declaredPermissions = sanitizeRequestedPermissions(
                source.requestedPermissions,
                source.type === CALL_SOURCE_DEEPLINK,
            );
            const consentPermissions = mergePermissions(callPermissions, declaredPermissions);

            dispatch(
                connectPopupActions.initiateCall({
                    method,
                    methodInfo: {
                        methodTitle: methodInfoPayload.info,
                        permissionTypes: consentPermissions,
                        useUi: methodInfoPayload.useUi,
                    },
                    payload,
                    source,
                }),
            );

            // Reject a call this host cannot fulfil (e.g. selectAccount for a coin Suite can't render)
            // before asking for permissions, so the user doesn't approve access only to hit an error.
            definition?.validate?.({ method, payload, source });

            // Check if permission remembered (permission, coin). Keyed on THIS call's required
            // permissions (not the declared superset) so a call is silent whenever its own needs are
            // already covered, even if the app declared more than it has been granted so far.
            const rememberedApps = selectConnectAppPermissions(getState());

            const isRemembered =
                canRememberPermissions(source) &&
                rememberedApps.some(
                    app =>
                        isSameConnectApp(app, source) &&
                        permissionsAreCovered(callPermissions, app.allowedPermissions),
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

            // Project the granted per-coin permissions into @trezor/connect's enabledNetworks
            // capability (today: Cardano `derive_cardano`) before any device session is created.
            // Lives in the shared call thunk — not a host-side middleware — so it runs on every
            // platform (desktop/web popup AND native deeplink) and for remembered apps too (which
            // skip the approve action a middleware would key off). updateConnectSettings returns
            // { success: false } rather than throwing on the thin transports; the result is ignored.
            const enabledNetworks = deriveCardanoEnabledNetworks(consentPermissions);
            if (enabledNetworks.length) {
                await TrezorConnect.updateConnectSettings({ enabledNetworks });
            }

            let device = selectSelectedDevice(getState());
            let attempt = 0;
            // more time needed on mobile deeplink, less on desktop
            // todo: be smarter about the timeout based on actual connection events
            const maxAttempts = source.type === CALL_SOURCE_DEEPLINK ? 10 : 5;
            // retry loop to wait for device to reconnect
            while (!device?.connected) {
                await resolveAfter(1000);
                device = selectSelectedDevice(getState());
                attempt++;
                if (attempt > maxAttempts) {
                    throw TypedError('Device_Disconnected');
                }
            }

            const txSigningPrecomposed: PrecomposedTransactionFinal | undefined =
                methodInfoPayload.precomposed;
            const modifiedPayload =
                (await definition?.preCall?.({
                    method,
                    payload,
                    dispatch,
                    getState,
                    txSigningPrecomposed,
                    source,
                    onCleanup,
                })) ?? payload;

            // refresh device state before call (could have changed during preCall)
            device = selectSelectedDevice(getState());
            if (!device) throw TypedError('Device_Disconnected');

            dispatch(connectPopupActions.setCallDevicePath(device.path));

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

            const postCallOngoing =
                (await definition?.postCall?.({
                    method,
                    payload: modifiedPayload,
                    originalPayload: payload,
                    response,
                    dispatch,
                    getState,
                    source,
                    onCleanup,
                })) ?? false;
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
                    method: params.method,
                    appName: source.manifest.appName,
                    appUrl: source.manifest.appUrl,
                    appEmail: source.manifest.email,
                    npmVersion: source.manifest.npmVersion,
                    connectionType: source.type,
                    origin: source.origin,
                    paramNames: getCallParamNames(params.payload),
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
                if (isDeviceReconnectError(error?.code)) return;
            }

            extra.services.analytics.report({
                type: events.connectPopupErrorEvent.name,
                payload: {
                    method: params.method,
                    origin: source.origin,
                    error: error?.code,
                    appName: source.manifest.appName,
                    appUrl: source.manifest.appUrl,
                    appEmail: source.manifest.email,
                    npmVersion: source.manifest.npmVersion,
                    connectionType: source.type,
                    paramNames: getCallParamNames(params.payload),
                },
            });

            getPopupCallDeferred().resolve({
                success: false,
                error: serializeError(error),
            });
        } finally {
            // Runs however the call ends, e.g. to remove placeholder accounts created in preCall.
            cleanups.forEach(cleanup => cleanup());
            extra.services.lockDevice(false);
        }
    },
);

// Typed thunk that takes the method as a generic parameter
// Original thunk is exposed as well for using .fulfilled, .rejected, etc.
export const connectPopupCallThunk = <M extends ConnectPopupMethodKey>(
    params: ConnectPopupCallThunkParams<M>,
): AsyncThunkAction<
    void,
    ConnectPopupCallThunkParams<M>,
    { state: ConnectPopupCallThunkState; extra: ConnectPopupCallThunkDeps }
> => connectPopupCallInnerThunk(params) as any;

type ConnectPopupDeeplinkThunkState = DeviceRootState & ConnectPopupStateRootState;

type ConnectPopupDeeplinkThunkDeps = {
    services: AnalyticsDep & LockDeviceDep;
};

export const connectPopupDeeplinkThunk = createThunk<
    void,
    { url: string },
    { state: ConnectPopupDeeplinkThunkState; extra: ConnectPopupDeeplinkThunkDeps }
>(`${CONNECT_POPUP_MODULE}/deeplinkThunk`, async ({ url }, { dispatch }) => {
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
    const version = path?.split('/').slice(-2, -1)[0];
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
            connectPopupActions.setError(serializeError(TypedError('Deeplink_VersionMismatch'))),
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
                type: CALL_SOURCE_DEEPLINK,
                origin: `${callbackUrl.protocol}//${callbackUrl.host}`,
                manifest: {
                    appName: queryParams.appName ?? '',
                    appIcon: queryParams.appIcon ?? '',
                },
            },
            method: method as ConnectPopupMethodKey,
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
});

type ConnectPopupCancelThunkState = ConnectPopupStateRootState;

export const connectPopupCancelThunk = createThunk<
    void,
    { error?: string; callId?: string },
    {
        state: ConnectPopupCancelThunkState;
    }
>(`${CONNECT_POPUP_MODULE}/cancelThunk`, ({ error, callId }, { dispatch, getState }) => {
    const activeCall = selectConnectPopupCall(getState());

    getPermissionDeferred().reject(TypedError('Method_Cancel'));
    TrezorConnect.cancel({ reason: error, callId });
    // Clear now instead of when the aborted call settles. No-op before the call reaches a device.
    dispatch(deviceActions.removeButtonRequests({ path: activeCall?.devicePath }));

    dispatch(connectPopupActions.finishCall());

    // Resolve the popup-call deferred directly so the cancel response
    // reaches the caller immediately.  Without this, the response
    // depends on TrezorConnect.cancel() propagating through the
    // internal core, interrupting the device, and eventually causing
    // the catch block in connectPopupCallInnerThunk to resolve the
    // deferred — which may not happen reliably (e.g. the device
    // interrupt doesn't complete, or the Suite popup tab closes
    // before RESPONSE_EVENT is sent).
    getPopupCallDeferred().resolve({
        success: false,
        error: serializeError(TypedError('Method_Interrupted')),
    });
});

export type ConnectPopupFinishCallThunkState = ConnectPopupStateRootState;

// Closing the popup of a call that ended with a device error answers its caller with that error.
// Otherwise the caller never gets a response and every popup call queued after it keeps waiting.
export const connectPopupFinishCallThunk = createThunk<
    void,
    void,
    { state: ConnectPopupFinishCallThunkState }
>(`${CONNECT_POPUP_MODULE}/finishCallThunk`, (_, { dispatch, getState }) => {
    const activeCall = selectConnectPopupCall(getState());

    if (activeCall?.state === 'call-error' && isDeviceReconnectError(activeCall.error.code)) {
        getPopupCallDeferred().resolve({ success: false, error: activeCall.error });
    }

    dispatch(connectPopupActions.finishCall());
});
