import { type PayloadAction } from '@reduxjs/toolkit';

import { type ActionTypesDep, createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { connectPopupActions } from './connectPopupActions';
import { getPermissionDeferred } from './connectPopupPromiseManager';
import {
    type AppRememberedPermission,
    CALL_SOURCE_WALLETCONNECT,
    type ConnectPopupCall,
    type ConnectPopupCallWithState,
} from './connectPopupTypes';
import { canonicalizePermissionCoins } from './permissions';

export type ConnectPopupState = {
    activeCall?: ConnectPopupCall;
    permissions: AppRememberedPermission[];
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

type ConnectPopupReducerDeps = ActionTypesDep<'storageLoad'>;

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
            })
            .addCase(connectPopupActions.setCallDevicePath, (state, { payload }) => {
                if (state.activeCall) {
                    state.activeCall.devicePath = payload;
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
