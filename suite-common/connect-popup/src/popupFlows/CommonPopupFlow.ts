import { type Dispatch } from '@reduxjs/toolkit';

import { selectSelectedDevice } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect, {
    type CallMethodAnyResponse,
    type CallMethodKeys,
    type CallMethodParams,
    type CallMethodPayload,
    type CallMethodResponse,
    type MethodInfo,
    type PermissionRequest,
} from '@trezor/connect';
import { connectCallableMethods } from '@trezor/connect-common';
import { type SerializedError, TypedError } from '@trezor/connect-common/src/constants/errors';
import { type Err, type Ok } from '@trezor/type-utils';
import { resolveAfter } from '@trezor/utils';

import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import { selectConnectAppPermissions } from '../connectPopupReducer';
import {
    CALL_SOURCE_DEEPLINK,
    CALL_SOURCE_WALLETCONNECT,
    type ConnectCallSource,
} from '../connectPopupTypes';
import {
    canRememberPermissions,
    deriveCardanoEnabledNetworks,
    isSameConnectApp,
    mergePermissions,
    permissionsAreCovered,
    sanitizeRequestedPermissions,
} from '../permissions';

type DistributiveOmit<T, K extends keyof T> = T extends T ? Omit<T, K> : never;

export type PopupFlowPayload<M extends CallMethodKeys> = DistributiveOmit<
    CallMethodParams<M>,
    'method'
>;

export type PopupFlowParams<M extends CallMethodKeys> = {
    method: M;
    payload: PopupFlowPayload<M>;
    source: ConnectCallSource;
};

export type PopupFlowThunkApi = {
    dispatch: Dispatch;
    getState: () => any;
};

export type PopupFlowResponse<M extends CallMethodKeys> =
    Ok<CallMethodResponse<M>> | Err<SerializedError>;

// Any Connect response, in the form the caller is answered with.
export type PopupFlowAnswer = Awaited<CallMethodAnyResponse>;

export type MaybePromise<T> = T | Promise<T>;

export type PopupFlow = {
    run(): Promise<PopupFlowAnswer>;
    cleanup(): void;
};

/**
 * A Connect call made through the popup. `run()` asks for permissions, waits for the device and
 * calls the method. Used as it is for methods the popup does not adjust, subclasses named after
 * a method adjust its steps by overriding the hooks below.
 */
export class CommonPopupFlow<M extends CallMethodKeys = CallMethodKeys> implements PopupFlow {
    protected readonly method: M;
    protected readonly payload: PopupFlowPayload<M>;
    protected readonly source: ConnectCallSource;
    protected readonly dispatch: Dispatch;
    protected readonly getState: () => any;

    constructor(
        { method, payload, source }: PopupFlowParams<M>,
        { dispatch, getState }: PopupFlowThunkApi,
    ) {
        this.method = method;
        this.payload = payload;
        this.source = source;
        this.dispatch = dispatch;
        this.getState = getState;
    }

    /**
     * Describes the call: its title and required permissions. Asks the Connect method by default,
     * a flow not backed by one describes the call itself.
     */
    protected async getMethodInfo(): Promise<MethodInfo> {
        const { method, payload } = this;

        if (!connectCallableMethods.includes(method)) throw TypedError('Method_Unsupported');

        const methodInfo = await TrezorConnect.call({
            ...payload,
            method,
            __info: true,
        } as CallMethodPayload);
        if (!methodInfo.success) {
            throw methodInfo.error;
        }

        return methodInfo.payload as MethodInfo;
    }

    /** Rejects a call this host cannot fulfil, before the user is asked for permissions. */
    protected validate(): void {}

    /** Prepares the popup for the call and returns the payload the call is made with. */
    protected preCall(
        _txSigningPrecomposed?: PrecomposedTransactionFinal,
    ): MaybePromise<PopupFlowPayload<M>> {
        return this.payload;
    }

    protected getSelectedDevice() {
        const device = selectSelectedDevice(this.getState());
        if (!device) throw TypedError('Device_Disconnected');

        const { path, instance, state, useEmptyPassphrase } = device;

        return { path, instance, state, useEmptyPassphrase };
    }

    /**
     * Makes the call. Calls the Connect method on the selected device by default, a flow not
     * backed by one makes the call itself.
     */
    protected async callMethod(payload: PopupFlowPayload<M>): Promise<PopupFlowAnswer> {
        // refresh device state before call (could have changed during preCall)
        const device = this.getSelectedDevice();

        this.dispatch(connectPopupActions.setCallDevicePath(device.path));

        const response = await TrezorConnect.call({
            device,
            ...payload,
            method: this.method,
        } as CallMethodPayload);
        response.id = undefined;

        return response;
    }

    /** Handles the response before it is returned. Resolves to true to keep the popup open. */
    protected postCall(_response: PopupFlowResponse<M>): MaybePromise<boolean> {
        return false;
    }

    /** To be called after every run, however it ended. */
    cleanup(): void {}

    /** Resolves to the successful response, a failure is thrown. */
    async run() {
        const methodInfo = await this.getMethodInfo();
        this.assertCallAllowed(methodInfo);
        const consentPermissions = this.initiateCall(methodInfo);

        this.validate();
        await this.requestPermissions(methodInfo.requiredPermissions);
        await this.enableNetworks(consentPermissions);
        await this.waitForDevice();

        const { response, isPostCallOngoing } = await this.process(methodInfo.precomposed);

        if (!response.success) {
            throw response.error;
        }
        if (!isPostCallOngoing) {
            this.finishCall();
        }

        return response;
    }

    /** Prepares, makes and handles the call, also on behalf of a flow which delegates its call. */
    async process(txSigningPrecomposed?: PrecomposedTransactionFinal) {
        const payload = await this.preCall(txSigningPrecomposed);
        const response = await this.callMethod(payload);
        const isPostCallOngoing = await this.postCall(response as PopupFlowResponse<M>);

        return { response, isPostCallOngoing };
    }

    // Applies to every flow, however it describes its call.
    private assertCallAllowed({ requiredPermissions }: MethodInfo) {
        const hasPermission = (name: string) =>
            requiredPermissions.some(p => p.permission === name);
        if (
            hasPermission('management') ||
            hasPermission('internal') ||
            (hasPermission('push_tx') && this.source.type === CALL_SOURCE_DEEPLINK)
        ) {
            throw TypedError('Method_NotAllowed');
        }
    }

    // Returns the permissions the user is asked to consent to.
    private initiateCall({ info, requiredPermissions, useUi }: MethodInfo) {
        const { method, payload, source } = this;

        // Permissions the host/dapp declared up front (ConnectSettings.requestedPermissions),
        // sanitized against the same rules as the hard block in assertCallAllowed. Merged with this
        // call's own required permissions so the first consent covers the whole declared set at
        // once — a single "Remember" then silences every later in-scope call.
        const declaredPermissions = sanitizeRequestedPermissions(
            source.requestedPermissions,
            source.type === CALL_SOURCE_DEEPLINK,
        );
        const consentPermissions = mergePermissions(requiredPermissions, declaredPermissions);

        this.dispatch(
            connectPopupActions.initiateCall({
                method,
                methodInfo: {
                    methodTitle: info,
                    permissionTypes: consentPermissions,
                    useUi,
                },
                payload,
                source,
            }),
        );

        return consentPermissions;
    }

    private async requestPermissions(callPermissions: PermissionRequest[]) {
        const { source } = this;

        // Check if permission remembered (permission, coin). Keyed on THIS call's required
        // permissions (not the declared superset) so a call is silent whenever its own needs are
        // already covered, even if the app declared more than it has been granted so far.
        const rememberedApps = selectConnectAppPermissions(this.getState());

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
            this.dispatch(connectPopupActions.requestPermissions());
            await permissionDeferred.promise;
        }
    }

    // Project the granted per-coin permissions into @trezor/connect's enabledNetworks
    // capability (today: Cardano `derive_cardano`) before any device session is created.
    // Lives in the shared call flow — not a host-side middleware — so it runs on every
    // platform (desktop/web popup AND native deeplink) and for remembered apps too (which
    // skip the approve action a middleware would key off). updateConnectSettings returns
    // { success: false } rather than throwing on the thin transports; the result is ignored.
    private async enableNetworks(consentPermissions: PermissionRequest[]) {
        const enabledNetworks = deriveCardanoEnabledNetworks(consentPermissions);
        if (enabledNetworks.length) {
            await TrezorConnect.updateConnectSettings({ enabledNetworks });
        }
    }

    private async waitForDevice() {
        let device = selectSelectedDevice(this.getState());
        let attempt = 0;
        // more time needed on mobile deeplink, less on desktop
        // todo: be smarter about the timeout based on actual connection events
        const maxAttempts = this.source.type === CALL_SOURCE_DEEPLINK ? 10 : 5;
        // retry loop to wait for device to reconnect
        while (!device?.connected) {
            await resolveAfter(1000);
            device = selectSelectedDevice(this.getState());
            attempt++;
            if (attempt > maxAttempts) {
                throw TypedError('Device_Disconnected');
            }
        }
    }

    private finishCall() {
        this.dispatch(connectPopupActions.finishCall());
        this.dispatch(
            notificationsActions.addToast({
                type: 'connect-popup-success',
                // The toast has no origin to fall back to, so an empty name is replaced here.
                appName: this.source.manifest.appName || this.source.origin,
            }),
        );
    }
}
