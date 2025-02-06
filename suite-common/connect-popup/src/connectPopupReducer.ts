import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { connectPopupActions } from './connectPopupActions';
import { ConnectPopupCall } from './connectPopupTypes';

export type ConnectPopupState = {
    activeCall?: ConnectPopupCall;
};

type ConnectPopupStateRootState = {
    wallet: { connectPopup: ConnectPopupState };
};

const connectPopupInitialState: ConnectPopupState = {
    activeCall: undefined,
};

export const prepareConnectPopupReducer = createReducerWithExtraDeps(
    connectPopupInitialState,
    (builder, _extra) => {
        builder
            .addCase(connectPopupActions.initiateCall, (state, { payload }) => {
                state.activeCall = payload;
            })
            .addCase(connectPopupActions.approveCall, state => {
                if (state.activeCall?.state === 'request') state.activeCall.confirmation.resolve();
                state.activeCall = undefined;
            })
            .addCase(connectPopupActions.rejectCall, (state, { payload }) => {
                if (state.activeCall?.state === 'request')
                    state.activeCall.confirmation.reject(payload);
                state.activeCall = undefined;
            });
    },
);

export const selectConnectPopupCall = (state: ConnectPopupStateRootState) =>
    state.wallet.connectPopup.activeCall;
