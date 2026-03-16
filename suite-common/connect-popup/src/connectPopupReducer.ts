import { type PayloadAction } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { connectPopupActions } from './connectPopupActions';
import { getPermissionDeferred } from './connectPopupPromiseManager';
import {
    type AppRememberedPermission,
    CALL_SOURCE_WALLETCONNECT,
    type ConnectPopupCall,
    type ConnectPopupCallWithState,
} from './connectPopupTypes';

export type ConnectPopupState = {
    activeCall?: ConnectPopupCall;
    permissions: AppRememberedPermission[];
};

export type ConnectPopupStateRootState = {
    connectPopup: ConnectPopupState;
};

type StorageActionPayload = {
    connect: {
        permissions: AppRememberedPermission[];
    };
};

export const connectPopupInitialState: ConnectPopupState = {
    activeCall: undefined,
    permissions: [],
};

export const prepareConnectPopupReducer = createReducerWithExtraDeps(
    connectPopupInitialState,
    (builder, extra) => {
        builder
            .addCase(
                extra.actionTypes.storageLoad,
                (state, { payload }: PayloadAction<StorageActionPayload>) => {
                    if (payload.connect) state.permissions = payload.connect.permissions;
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
                state.permissions = state.permissions.filter(p => p.origin !== payload.origin);
                state.permissions.push(payload);
            })
            .addCase(connectPopupActions.forgetAppPermissions, (state, { payload }) => {
                state.permissions = state.permissions.filter(p => p.origin !== payload.origin);
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

export const selectWalletConnectAppPermissions = (state: ConnectPopupStateRootState) =>
    state.connectPopup.permissions.filter(p => p.type === CALL_SOURCE_WALLETCONNECT);
