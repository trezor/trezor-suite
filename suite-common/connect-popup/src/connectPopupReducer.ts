import { type PayloadAction } from '@reduxjs/toolkit';

import { type ActionTypesDep, createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { connectPopupActions } from './connectPopupActions';
import { getPermissionDeferred } from './connectPopupPromiseManager';
import {
    type AppRememberedPermission,
    CALL_SOURCE_DEEPLINK,
    CALL_SOURCE_WALLETCONNECT,
    type ConnectPopupCall,
    type ConnectPopupCallWithState,
} from './connectPopupTypes';
import {
    type ConnectV9RefusalApp,
    getConnectV9RefusalApp,
    isSameConnectV9RefusalApp,
} from './connectV9Refusal';
import { canonicalizePermissionCoins } from './permissions';

export type ConnectPopupState = {
    activeCall?: ConnectPopupCall;
    permissions: AppRememberedPermission[];
    // Declined Connect 9 calls in this session (see refuseConnectV9Call), not persisted: the app
    // whose declined call was last put into the error modal, and the apps whose declined call has
    // been closed there. Later calls of those apps are declined without the modal. Declined deeplink
    // calls are not tracked here, each of them is shown.
    connectV9RefusalShownApp?: ConnectV9RefusalApp;
    connectV9RefusalDismissedApps?: ConnectV9RefusalApp[];
};

export type ConnectPopupStateRootState = {
    connectPopup: ConnectPopupState;
};

type StorageActionPayload = {
    connect?: {
        permissions?: AppRememberedPermission[] | null;
    };
};

export const connectPopupInitialState: ConnectPopupState = {
    activeCall: undefined,
    permissions: [],
};

// Canonicalize a persisted app's granted coins to their lowercase `CoinSymbol` (see storageLoad).
const normalizeRememberedCoins = (app: AppRememberedPermission): AppRememberedPermission => ({
    ...app,
    allowedPermissions: canonicalizePermissionCoins(app.allowedPermissions),
});

// The Connect 9 app whose declined call the error modal shows, if it shows one.
const getConnectV9RefusalShownApp = ({
    activeCall,
    connectV9RefusalShownApp,
}: ConnectPopupState): ConnectV9RefusalApp | undefined => {
    if (activeCall?.state !== 'call-error' || !connectV9RefusalShownApp) return undefined;

    const callApp = getConnectV9RefusalApp(activeCall.source);

    return isSameConnectV9RefusalApp(callApp, connectV9RefusalShownApp) ? callApp : undefined;
};

export type ConnectPopupReducerDeps = ActionTypesDep<'storageLoad'>;

export const prepareConnectPopupReducer = createReducerWithExtraDeps(
    connectPopupInitialState,
    (builder, extra: ConnectPopupReducerDeps) => {
        builder
            .addCase(
                extra.actionTypes.storageLoad,
                (state, { payload }: PayloadAction<StorageActionPayload>) => {
                    if (payload.connect) {
                        const permissions = Array.isArray(payload.connect.permissions)
                            ? payload.connect.permissions
                            : [];

                        state.permissions = permissions
                            .filter(
                                (permission): permission is AppRememberedPermission =>
                                    permission !== null &&
                                    typeof permission === 'object' &&
                                    'allowedPermissions' in permission &&
                                    Array.isArray(permission.allowedPermissions) &&
                                    // Drop entries that do not have the expected format.
                                    permission.allowedPermissions.every(
                                        (t: unknown) =>
                                            t !== null &&
                                            typeof t === 'object' &&
                                            'permission' in t,
                                    ),
                            )
                            // Grants persisted before coins were canonicalized at the
                            // source keep the mixed-case `coinInfo.shortcut` (e.g. `BTC`);
                            // lowercase them on load. This reducer is shared, so it covers
                            // both the web IDB store and native.
                            .map(normalizeRememberedCoins);
                    }
                },
            )
            .addCase(connectPopupActions.initiateCall, (state, { payload }) => {
                state.activeCall = {
                    ...payload,
                    state: 'ongoing',
                };
            })
            .addCase(connectPopupActions.refuseConnectV9Call, (state, { payload }) => {
                const declinedCall: ConnectPopupCallWithState<'call-error'> = {
                    ...payload,
                    state: 'call-error',
                    // The call is declined before Connect describes the method. The error modal
                    // does not show any of this.
                    methodInfo: { methodTitle: payload.method, permissionTypes: [], useUi: false },
                    isConnectV9Refusal: true,
                };

                // Suite mobile is opened by the app for every deeplink call, and the app gets the
                // answer when the error is closed (see deeplinkCallback), so every declined
                // deeplink call is shown.
                if (payload.source.type === CALL_SOURCE_DEEPLINK) {
                    state.activeCall = declinedCall;

                    return;
                }

                const app = getConnectV9RefusalApp(payload.source);
                const shownApp = getConnectV9RefusalShownApp(state);
                const isRefusalShown =
                    shownApp !== undefined && isSameConnectV9RefusalApp(shownApp, app);
                const wasRefusalDismissed = state.connectV9RefusalDismissedApps?.some(
                    dismissedApp => isSameConnectV9RefusalApp(dismissedApp, app),
                );
                // A declined call of an app is shown until the error modal has been closed once in
                // the session, so that an app which keeps calling does not keep bringing Suite to
                // the front. Its other calls are declined without the modal.
                if (isRefusalShown || wasRefusalDismissed) return;

                // A finished call is cleared shortly after it ends, which would remove this error
                // together with it. The next call of the app shows the error.
                if (state.activeCall?.state === 'finished') return;

                state.connectV9RefusalShownApp = app;
                // With the source of the declined call, so that the modal shows which app it was.
                state.activeCall = declinedCall;
            })
            .addCase(connectPopupActions.requestPermissions, state => {
                if (state.activeCall?.state === 'ongoing')
                    state.activeCall = {
                        ...state.activeCall,
                        state: 'permission-request',
                    };
            })
            .addCase(connectPopupActions.approvePermissions, state => {
                if (
                    state.activeCall?.state === 'permission-request' ||
                    state.activeCall?.state === 'tx-simulation'
                ) {
                    getPermissionDeferred()?.resolve();
                    state.activeCall = {
                        ...state.activeCall,
                        state: 'ongoing',
                    };
                }
            })
            .addCase(connectPopupActions.rejectPermissions, (state, { payload }) => {
                if (
                    state.activeCall?.state === 'permission-request' ||
                    state.activeCall?.state === 'tx-simulation'
                ) {
                    getPermissionDeferred()?.reject(payload);
                    state.activeCall = {
                        ...state.activeCall,
                        state: 'finished',
                    };
                }
            })
            .addCase(connectPopupActions.confirmAddresses, (state, { payload }) => {
                if (
                    state.activeCall?.state === 'ongoing' ||
                    state.activeCall?.state === 'address-confirmation' ||
                    state.activeCall?.state === 'deeplink-callback'
                ) {
                    state.activeCall = {
                        ...state.activeCall,
                        state: 'address-confirmation',
                        addresses: payload.addresses,
                        exported: payload.exported,
                    };
                }
            })
            .addCase(connectPopupActions.selectAccount, (state, { payload }) => {
                if (
                    state.activeCall?.state === 'ongoing' ||
                    state.activeCall?.state === 'select-account'
                ) {
                    state.activeCall = {
                        ...state.activeCall,
                        state: 'select-account',
                        ...payload,
                        // Clear the load state for a new selectAccount call. See #29662.
                        loadingKey: undefined,
                        loadEpoch: undefined,
                    };
                }
            })
            .addCase(connectPopupActions.updateSelectAccount, (state, { payload }) => {
                if (state.activeCall?.state === 'select-account') {
                    state.activeCall = {
                        ...state.activeCall,
                        ...payload,
                    };
                }
            })
            .addCase(connectPopupActions.setSelectedAccountKey, (state, { payload }) => {
                if (state.activeCall?.state === 'ongoing') {
                    state.activeCall = {
                        ...state.activeCall,
                        ...payload,
                    };
                }
            })
            .addCase(connectPopupActions.finishCall, state => {
                if (state.connectV9RefusalShownApp) {
                    // The error modal of a declined Connect 9 call is closed, mostly by the user,
                    // so later calls of that app are declined without it. A modal that a call of
                    // another app has replaced was not closed.
                    const shownApp = getConnectV9RefusalShownApp(state);
                    if (shownApp) {
                        state.connectV9RefusalDismissedApps = [
                            ...(state.connectV9RefusalDismissedApps ?? []),
                            shownApp,
                        ];
                    }
                    state.connectV9RefusalShownApp = undefined;
                }

                if (state.activeCall) state.activeCall.state = 'finished';
            })
            .addCase(connectPopupActions.clearCall, state => {
                if (
                    state.activeCall?.state === 'finished' ||
                    state.activeCall?.state === 'call-error' ||
                    state.activeCall?.state === 'error'
                ) {
                    state.activeCall = undefined;
                }
            })
            .addCase(connectPopupActions.deeplinkCallback, (state, { payload }) => {
                // A declined call stays on the screen with its reason, Suite mobile opens the
                // callback URL when the user closes it.
                if (
                    state.activeCall?.state === 'call-error' &&
                    state.activeCall.isConnectV9Refusal
                ) {
                    state.activeCall.callbackUrl = payload.callbackUrl;

                    return;
                }

                if (
                    state.activeCall?.state === 'finished' ||
                    state.activeCall?.state === 'address-confirmation'
                )
                    state.activeCall = {
                        ...state.activeCall,
                        state: 'deeplink-callback',
                        callbackUrl: payload.callbackUrl,
                    };
            })
            .addCase(connectPopupActions.setError, (state, { payload }) => {
                if (state.activeCall && state.activeCall.state !== 'error') {
                    state.activeCall = {
                        ...state.activeCall,
                        state: 'call-error',
                        error: payload,
                        // The previous call may be a declined call or a deeplink call whose app has
                        // been answered. This error is neither, and closing it answers no app.
                        isConnectV9Refusal: undefined,
                        callbackUrl: undefined,
                    };
                } else {
                    state.activeCall = {
                        state: 'error',
                        error: payload,
                    };
                }
            })
            .addCase(connectPopupActions.rememberAppPermissions, (state, { payload }) => {
                const existing = state.permissions.find(p => p.origin === payload.origin);
                if (!existing) {
                    state.permissions.push(payload);

                    return;
                }

                const newPermissions = payload.allowedPermissions.filter(
                    next =>
                        !existing.allowedPermissions.some(
                            prev => prev.permission === next.permission && prev.coin === next.coin,
                        ),
                );
                existing.allowedPermissions.push(...newPermissions);
                existing.silentMode = payload.silentMode;
            })
            .addCase(connectPopupActions.forgetAppPermissions, (state, { payload }) => {
                state.permissions = state.permissions.filter(p => p.origin !== payload.origin);
            })
            .addCase(connectPopupActions.forgetAppPermission, (state, { payload }) => {
                const app = state.permissions.find(p => p.origin === payload.origin);
                if (!app) {
                    return;
                }

                app.allowedPermissions = app.allowedPermissions.filter(
                    granted =>
                        !(
                            granted.permission === payload.permission.permission &&
                            granted.coin === payload.permission.coin
                        ),
                );

                // Drop the whole app entry once its last permission is removed.
                if (app.allowedPermissions.length === 0) {
                    state.permissions = state.permissions.filter(p => p.origin !== payload.origin);
                }
            })
            .addCase(connectPopupActions.setAppSilentMode, (state, { payload }) => {
                const permission = state.permissions.find(p => p.origin === payload.origin);
                if (permission) {
                    permission.silentMode = payload.silentMode;
                }
            })
            .addCase(connectPopupActions.txSimulation, (state, { payload }) => {
                if (state.activeCall?.state === 'ongoing') {
                    const newActiveCall = {
                        // Remove this casting once 'ongoing' state is typed accurately
                        ...(state.activeCall as unknown as ConnectPopupCallWithState<'tx-simulation'>),
                        state: 'tx-simulation',
                        ...payload,
                    } satisfies ConnectPopupCallWithState<'tx-simulation'>;

                    state.activeCall = newActiveCall;
                }
            })
            .addCase(connectPopupActions.setSelectedFee, (state, { payload }) => {
                if (
                    state.activeCall?.state === 'tx-simulation' ||
                    state.activeCall?.state === 'ongoing'
                ) {
                    state.activeCall = {
                        ...state.activeCall,
                        selectedFee: payload.selectedFee,
                    };
                }
            })
            .addCase(connectPopupActions.switchDevice, state => {
                if (state.activeCall && state.activeCall.state !== 'error') {
                    state.activeCall = {
                        ...state.activeCall,
                        state: 'switch-device',
                        timestamp: Date.now(),
                    };
                }
            });
    },
);

export const selectConnectPopupCall = (state: ConnectPopupStateRootState) =>
    state.connectPopup.activeCall;

export const selectConnectPopupCallWithState = <CallState extends ConnectPopupCall['state']>(
    state: ConnectPopupStateRootState,
    callState: CallState,
) =>
    state.connectPopup.activeCall?.state === callState
        ? (state.connectPopup.activeCall as ConnectPopupCallWithState<CallState>)
        : null;

export const selectConnectAppPermissions = (state: ConnectPopupStateRootState) =>
    state.connectPopup.permissions.filter(p => p.type !== CALL_SOURCE_WALLETCONNECT);

export const selectIsConnectAppSilentModeByOrigin = (
    state: ConnectPopupStateRootState,
    origin: string | undefined,
) =>
    !!origin &&
    state.connectPopup.permissions.some(p => p.origin === origin && p.silentMode === true);
