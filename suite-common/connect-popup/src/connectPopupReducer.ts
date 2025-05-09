import { PayloadAction } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { connectPopupActions } from './connectPopupActions';
import {
    AppRememberedPermission,
    CALL_SOURCE_WALLETCONNECT,
    ConnectPopupCall,
} from './connectPopupTypes';

export type ConnectPopupState = {
    activeCall?: ConnectPopupCall;
    permissions: AppRememberedPermission[];
};

type ConnectPopupStateRootState = {
    connectPopup: ConnectPopupState;
};

type StorageActionPayload = {
    connect: {
        permissions: AppRememberedPermission[];
    };
};

const connectPopupInitialState: ConnectPopupState = {
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
            .addCase(connectPopupActions.requestPermissions, (state, { payload }) => {
                if (state.activeCall?.state === 'ongoing')
                    state.activeCall = {
                        ...state.activeCall,
                        state: 'permission-request',
                        ...payload,
                    };
            })
            .addCase(connectPopupActions.approvePermissions, state => {
                if (state.activeCall?.state === 'permission-request') {
                    state.activeCall.permissionDecision?.resolve();
                    state.activeCall = {
                        ...state.activeCall,
                        permissionDecision: undefined,
                        state: 'ongoing',
                    };
                }
            })
            .addCase(connectPopupActions.rejectPermissions, (state, { payload }) => {
                if (state.activeCall?.state === 'permission-request') {
                    state.activeCall.permissionDecision?.reject(payload);
                    state.activeCall = {
                        ...state.activeCall,
                        permissionDecision: undefined,
                        state: 'finished',
                    };
                }
            })
            .addCase(connectPopupActions.confirmAddresses, (state, { payload }) => {
                if (
                    state.activeCall?.state === 'ongoing' ||
                    state.activeCall?.state === 'address-confirmation'
                ) {
                    state.activeCall = {
                        ...state.activeCall,
                        state: 'address-confirmation',
                        addresses: payload.addresses,
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
                if (state.activeCall?.state === 'finished')
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
            });
    },
);

export const selectConnectPopupCall = (state: ConnectPopupStateRootState) =>
    state.connectPopup.activeCall;

export const selectConnectAppPermissions = (state: ConnectPopupStateRootState) =>
    state.connectPopup.permissions.filter(p => p.type !== CALL_SOURCE_WALLETCONNECT);

export const selectWalletConnectAppPermissions = (state: ConnectPopupStateRootState) =>
    state.connectPopup.permissions.filter(p => p.type === CALL_SOURCE_WALLETCONNECT);
