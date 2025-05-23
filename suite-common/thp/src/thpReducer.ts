import { AnyAction } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { ThpSuiteCredentials } from '@suite-common/suite-types';
import { DEVICE, DeviceThpCredentialsChanged, UI } from '@trezor/connect';

import { thpActions } from './thpActions';

export const THP_BUTTON_REQUESTS_NAMES = [
    'thp_pairing_request',
    'thp_connection_request',
    'thp_autoconnect_credential_request',
] as const;

export type THPButtonRequestName = (typeof THP_BUTTON_REQUESTS_NAMES)[number];

export type ThpStep =
    | 'CodeEntry'
    | 'Pairing'
    | 'Connection'
    | 'CodeInvalid'
    | 'AutoconnectInfo'
    | 'Autoconnect'
    | null;

export type ThpState = {
    step: ThpStep;
    lastThpCode?: string;
    credentials: ThpSuiteCredentials[];
};

const initialState: ThpState = {
    step: null,
    lastThpCode: undefined,
    credentials: [] as ThpSuiteCredentials[],
};

export const prepareThpReducer = createReducerWithExtraDeps<ThpState>(
    initialState,
    (builder, extra) =>
        builder
            .addCase(thpActions.resetThpFlow, state => {
                state.step = null;
            })
            .addCase(thpActions.invalidCode, state => {
                state.step = 'CodeInvalid';
            })
            .addCase(thpActions.setLastThpCode, (state, { payload }) => {
                state.lastThpCode = payload.code;
            })
            .addCase(thpActions.showAutoconnectInfo, (state, { payload }) => {
                const credentialToUpdate = state.credentials.find(
                    it => it.credential == payload.credential.credential,
                );

                if (credentialToUpdate !== undefined) {
                    credentialToUpdate.wasUserAskedToAutoconnect = true;
                }

                state.step = 'AutoconnectInfo';
            })
            .addCase(thpActions.incrementCredentialConnectionCounter, (state, { payload }) => {
                const credentialToUpdate = state.credentials.find(
                    it => it.credential == payload.credential.credential,
                );

                if (credentialToUpdate !== undefined) {
                    credentialToUpdate.connectionCounter = credentialToUpdate.connectionCounter + 1;
                }
            })
            .addMatcher(
                action => action.type === UI.REQUEST_THP_PAIRING,
                state => {
                    state.step = 'CodeEntry';
                },
            )
            .addMatcher(
                action => action.type === DEVICE.THP_CREDENTIALS_CHANGED,
                (state, action: DeviceThpCredentialsChanged) => {
                    const { credentials } = action.payload;

                    state.credentials.push({
                        ...credentials,
                        connectionCounter: 0,
                        wasUserAskedToAutoconnect: false,
                    });
                },
            )
            .addMatcher(
                action => action.type === UI.REQUEST_BUTTON,
                (state, action: AnyAction) => {
                    const actionName: THPButtonRequestName = action.payload.name;
                    switch (actionName) {
                        case 'thp_pairing_request':
                            state.step = 'Pairing';
                            break;
                        case 'thp_autoconnect_credential_request':
                            state.step = 'Autoconnect';
                            break;
                        case 'thp_connection_request':
                            state.step = 'Connection';
                            break;

                        // intentionally, not exhaustive, non-THP button requests not-handled here
                    }
                },
            )
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                (state, action: AnyAction) => {
                    state.credentials = action.payload.thp?.credentials ?? [];
                },
            ),
);
