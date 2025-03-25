import { PayloadAction } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { connectPopupActions } from './connectPopupActions';
import { AppRememberedPermission, ConnectPopupCall } from './connectPopupTypes';

export type ConnectPopupState = {
    activeCall?: ConnectPopupCall;
    permissions: AppRememberedPermission[];
};

type ConnectPopupStateRootState = {
    wallet: { connectPopup: ConnectPopupState };
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
                state.activeCall = payload;
            })
            .addCase(connectPopupActions.finishCall, state => {
                state.activeCall = { state: 'finished' };
            })
            .addCase(connectPopupActions.approveCall, state => {
                if (state.activeCall?.state === 'request') state.activeCall.confirmation.resolve();
                state.activeCall = undefined;
            })
            .addCase(connectPopupActions.rejectCall, (state, { payload }) => {
                if (state.activeCall?.state === 'request')
                    state.activeCall.confirmation.reject(payload);
                state.activeCall = undefined;
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
    state.wallet.connectPopup.activeCall;

export const selectConnectAppPermissions = (state: ConnectPopupStateRootState) =>
    state.wallet.connectPopup.permissions;
